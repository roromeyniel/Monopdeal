import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, runTransaction, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db } from './config.js';
import { ALL_CARDS, shuffleDeck } from '../data/cards.js';
import { generateRoomCode } from '../utils/gameLogic.js';

// Create a new game room
export async function createRoom(hostId, hostNickname) {
  const code = generateRoomCode();
  const roomRef = doc(db, 'rooms', code);

  const roomData = {
    code,
    hostId,
    status: 'lobby', // lobby | playing | finished
    players: {
      [hostId]: {
        id: hostId,
        nickname: hostNickname,
        hand: [],
        bank: [],
        properties: {},
        connected: true,
        joinedAt: Date.now()
      }
    },
    playerOrder: [hostId],
    turnIndex: 0,
    deck: [],
    discard: [],
    pendingAction: null, // { type, actingPlayer, targetPlayer, ... }
    winner: null,
    actionsThisTurn: 0,
    doubleRentActive: false,
    createdAt: serverTimestamp()
  };

  await setDoc(roomRef, roomData);
  return code;
}

// Join an existing room
export async function joinRoom(code, playerId, nickname) {
  const roomRef = doc(db, 'rooms', code.toUpperCase());
  const snap = await getDoc(roomRef);

  if (!snap.exists()) throw new Error('Room not found');
  const room = snap.data();
  if (room.status !== 'lobby') throw new Error('Game already started');
  if (Object.keys(room.players).length >= 5) throw new Error('Room is full');

  await updateDoc(roomRef, {
    [`players.${playerId}`]: {
      id: playerId,
      nickname,
      hand: [],
      bank: [],
      properties: {},
      connected: true,
      joinedAt: Date.now()
    },
    playerOrder: arrayUnion(playerId)
  });

  return room;
}

// Mark player as connected/disconnected
export async function setPlayerConnected(code, playerId, connected) {
  const roomRef = doc(db, 'rooms', code);
  await updateDoc(roomRef, { [`players.${playerId}.connected`]: connected });
}

// Start the game - deal cards, set turn order
export async function startGame(code, hostId) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();

    if (room.hostId !== hostId) throw new Error('Only host can start');
    if (Object.keys(room.players).length < 2) throw new Error('Need at least 2 players');

    // Shuffle deck
    let deck = shuffleDeck(ALL_CARDS);

    // Shuffle player order
    const order = [...room.playerOrder];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    // Deal 5 cards to each player
    const players = { ...room.players };
    for (const pid of order) {
      players[pid] = { ...players[pid], hand: deck.splice(0, 5), bank: [], properties: {} };
    }

    tx.update(roomRef, {
      status: 'playing',
      players,
      playerOrder: order,
      turnIndex: 0,
      deck,
      discard: [],
      actionsThisTurn: 0,
      doubleRentActive: false,
      pendingAction: null,
      winner: null
    });
  });
}

// Draw 2 cards at start of turn
export async function drawCards(code, playerId) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();

    const currentPid = room.playerOrder[room.turnIndex];
    if (currentPid !== playerId) throw new Error('Not your turn');

    let deck = [...room.deck];
    let discard = [...room.discard];

    // Reshuffle if needed
    if (deck.length < 2) {
      deck = shuffleDeck(discard);
      discard = [];
    }

    const drawn = deck.splice(0, 2);
    const hand = [...room.players[playerId].hand, ...drawn];

    tx.update(roomRef, {
      deck,
      discard,
      [`players.${playerId}.hand`]: hand,
      actionsThisTurn: 0,
      turnPhase: 'action'
    });
  });
}

// Play a card from hand (generic - specific logic per card type)
export async function playCard(code, playerId, cardId, targetData = {}) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();

    const currentPid = room.playerOrder[room.turnIndex];
    if (currentPid !== playerId) throw new Error('Not your turn');
    if (room.actionsThisTurn >= 3) throw new Error('No actions left');

    const player = room.players[playerId];
    const card = player.hand.find(c => c.id === cardId);
    if (!card) throw new Error('Card not in hand');

    const updates = {};
    const newHand = player.hand.filter(c => c.id !== cardId);

    if (card.type === 'money') {
      // Put money in bank
      updates[`players.${playerId}.hand`] = newHand;
      updates[`players.${playerId}.bank`] = [...player.bank, card];
      updates['actionsThisTurn'] = room.actionsThisTurn + 1;

    } else if (card.type === 'property') {
      // Place property
      const color = targetData.color || card.color;
      const existing = room.players[playerId].properties[color] || [];
      updates[`players.${playerId}.hand`] = newHand;
      updates[`players.${playerId}.properties.${color}`] = [...existing, card];
      updates['actionsThisTurn'] = room.actionsThisTurn + 1;

    } else if (card.type === 'wildcard') {
      const color = targetData.color || card.colors[0];
      const existing = room.players[playerId].properties[color] || [];
      updates[`players.${playerId}.hand`] = newHand;
      updates[`players.${playerId}.properties.${color}`] = [...existing, { ...card, color }];
      updates['actionsThisTurn'] = room.actionsThisTurn + 1;

    } else if (card.type === 'action') {
      updates[`players.${playerId}.hand`] = newHand;
      updates['actionsThisTurn'] = room.actionsThisTurn + 1;

      if (card.action === 'double_rent') {
        updates['doubleRentActive'] = true;
        updates['discard'] = [...room.discard, card];

      } else if (card.action === 'house') {
        const color = targetData.color;
        const existing = room.players[playerId].properties[color] || [];
        updates[`players.${playerId}.properties.${color}`] = [...existing, card];

      } else if (card.action === 'hotel') {
        const color = targetData.color;
        const existing = room.players[playerId].properties[color] || [];
        updates[`players.${playerId}.properties.${color}`] = [...existing, card];

      } else {
        // All other action cards create a pending action
        updates['pendingAction'] = {
          cardId: card.id,
          card,
          actingPlayer: playerId,
          targetPlayer: targetData.targetPlayer || null,
          targetColor: targetData.targetColor || null,
          targetCardId: targetData.targetCardId || null,
          myCardId: targetData.myCardId || null,
          doubled: room.doubleRentActive || false,
          status: 'pending',
          jsn_stack: [] // just say no counter stack
        };
        if (room.doubleRentActive) {
          updates['doubleRentActive'] = false;
        }
        // Don't discard yet - discard after resolution
        return; // skip end-action discard below
      }

      // Reset doubleRent if we used a non-rent card
      if (card.action !== 'double_rent') {
        updates['doubleRentActive'] = false;
      }
    }

    tx.update(roomRef, updates);
  });
}

// Respond to pending action (pay, just_say_no, accept)
export async function respondToAction(code, playerId, response, data = {}) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();
    const pending = room.pendingAction;

    if (!pending) throw new Error('No pending action');

    const updates = {};

    if (response === 'just_say_no') {
      // Push JSN onto stack - flip who needs to respond
      const newStack = [...(pending.jsn_stack || []), { playerId, cardId: data.cardId }];

      // Remove JSN card from hand
      const newHand = room.players[playerId].hand.filter(c => c.id !== data.cardId);
      updates[`players.${playerId}.hand`] = newHand;
      updates['discard'] = [...room.discard, room.players[playerId].hand.find(c => c.id === data.cardId)];

      updates['pendingAction'] = {
        ...pending,
        jsn_stack: newStack,
        // Now the other player must decide: accept or counter-JSN
        awaitingResponse: newStack.length % 2 === 0 ? pending.actingPlayer : pending.targetPlayer
      };

    } else if (response === 'accept_jsn') {
      // Resolve the JSN - action is cancelled
      updates['pendingAction'] = null;
      updates['discard'] = [...room.discard, pending.card];

    } else if (response === 'pay') {
      // Player pays with selected cards
      const payCards = data.payCards || []; // array of card objects to pay with
      const payer = room.players[playerId];

      let newBank = payer.bank.filter(c => !payCards.find(p => p.id === c.id));
      let newProps = {};
      for (const [color, cards] of Object.entries(payer.properties || {})) {
        const filtered = cards.filter(c => !payCards.find(p => p.id === c.id));
        if (filtered.length > 0) newProps[color] = filtered;
      }

      // Give payment to acting player's bank
      const actingPlayer = room.players[pending.actingPlayer];
      const newActingBank = [...actingPlayer.bank, ...payCards];

      updates[`players.${playerId}.bank`] = newBank;
      updates[`players.${playerId}.properties`] = newProps;
      updates[`players.${pending.actingPlayer}.bank`] = newActingBank;
      updates['pendingAction'] = null;
      updates['discard'] = [...room.discard, pending.card];

    } else if (response === 'give_property') {
      // For sly deal / deal breaker / forced deal
      const card = pending.card;

      if (card.action === 'sly_deal') {
        const fromColor = data.fromColor;
        const stealCardId = data.cardId;
        const victim = room.players[pending.targetPlayer];
        const stolenCard = victim.properties[fromColor]?.find(c => c.id === stealCardId);

        if (!stolenCard) throw new Error('Card not found');

        const newVictimProps = { ...victim.properties };
        newVictimProps[fromColor] = victim.properties[fromColor].filter(c => c.id !== stealCardId);
        if (newVictimProps[fromColor].length === 0) delete newVictimProps[fromColor];

        const actingPlayer = room.players[pending.actingPlayer];
        const targetColor = data.toColor || stolenCard.color || stolenCard.colors?.[0];
        const newActingProps = { ...actingPlayer.properties };
        newActingProps[targetColor] = [...(newActingProps[targetColor] || []), stolenCard];

        updates[`players.${pending.targetPlayer}.properties`] = newVictimProps;
        updates[`players.${pending.actingPlayer}.properties`] = newActingProps;
        updates['pendingAction'] = null;
        updates['discard'] = [...room.discard, card];

      } else if (card.action === 'deal_breaker') {
        const stealColor = data.fromColor;
        const victim = room.players[pending.targetPlayer];
        const stolenCards = victim.properties[stealColor] || [];

        const newVictimProps = { ...victim.properties };
        delete newVictimProps[stealColor];

        const actingPlayer = room.players[pending.actingPlayer];
        const newActingProps = { ...actingPlayer.properties };
        newActingProps[stealColor] = stolenCards;

        updates[`players.${pending.targetPlayer}.properties`] = newVictimProps;
        updates[`players.${pending.actingPlayer}.properties`] = newActingProps;
        updates['pendingAction'] = null;
        updates['discard'] = [...room.discard, card];

      } else if (card.action === 'forced_deal') {
        // Swap properties
        const theirCardId = data.theirCardId;
        const theirColor = data.theirColor;
        const myCardId = pending.myCardId || data.myCardId;
        const myColor = data.myColor;

        const victim = room.players[pending.targetPlayer];
        const actor = room.players[pending.actingPlayer];

        const theirCard = victim.properties[theirColor]?.find(c => c.id === theirCardId);
        const myCard = actor.properties[myColor]?.find(c => c.id === myCardId);

        if (!theirCard || !myCard) throw new Error('Cards not found');

        const newVictimProps = { ...victim.properties };
        newVictimProps[theirColor] = victim.properties[theirColor].filter(c => c.id !== theirCardId);
        if (newVictimProps[theirColor].length === 0) delete newVictimProps[theirColor];
        newVictimProps[myCard.color || myCard.colors?.[0]] = [...(newVictimProps[myCard.color || myCard.colors?.[0]] || []), myCard];

        const newActorProps = { ...actor.properties };
        newActorProps[myColor] = actor.properties[myColor].filter(c => c.id !== myCardId);
        if (newActorProps[myColor].length === 0) delete newActorProps[myColor];
        newActorProps[theirCard.color || theirCard.colors?.[0]] = [...(newActorProps[theirCard.color || theirCard.colors?.[0]] || []), theirCard];

        updates[`players.${pending.targetPlayer}.properties`] = newVictimProps;
        updates[`players.${pending.actingPlayer}.properties`] = newActorProps;
        updates['pendingAction'] = null;
        updates['discard'] = [...room.discard, card];
      }
    }

    // Check win condition after action
    if (!updates['pendingAction'] && updates[`players.${pending?.actingPlayer}.properties`]) {
      const newProps = updates[`players.${pending.actingPlayer}.properties`];
      const { checkWin } = await import('../utils/gameLogic.js');
      if (checkWin(newProps)) {
        updates['winner'] = pending.actingPlayer;
        updates['status'] = 'finished';
      }
    }

    tx.update(roomRef, updates);
  });
}

// Move wildcard between color groups
export async function moveWildcard(code, playerId, cardId, fromColor, toColor) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();

    const currentPid = room.playerOrder[room.turnIndex];
    if (currentPid !== playerId) throw new Error('Not your turn');

    const player = room.players[playerId];
    const card = (player.properties[fromColor] || []).find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    const newFromColor = (player.properties[fromColor] || []).filter(c => c.id !== cardId);
    const newToColor = [...(player.properties[toColor] || []), { ...card, color: toColor }];

    const updates = {};
    if (newFromColor.length === 0) {
      const newProps = { ...player.properties };
      delete newProps[fromColor];
      newProps[toColor] = newToColor;
      updates[`players.${playerId}.properties`] = newProps;
    } else {
      updates[`players.${playerId}.properties.${fromColor}`] = newFromColor;
      updates[`players.${playerId}.properties.${toColor}`] = newToColor;
    }

    tx.update(roomRef, updates);
  });
}

// End turn
export async function endTurn(code, playerId, discardCardIds = []) {
  await runTransaction(db, async (tx) => {
    const roomRef = doc(db, 'rooms', code);
    const snap = await tx.get(roomRef);
    const room = snap.data();

    const currentPid = room.playerOrder[room.turnIndex];
    if (currentPid !== playerId) throw new Error('Not your turn');

    const player = room.players[playerId];
    let hand = player.hand;

    // Discard down to 7 if needed
    if (discardCardIds.length > 0) {
      const discarded = hand.filter(c => discardCardIds.includes(c.id));
      hand = hand.filter(c => !discardCardIds.includes(c.id));
      const newDiscard = [...room.discard, ...discarded];

      const nextIdx = (room.turnIndex + 1) % room.playerOrder.length;
      tx.update(roomRef, {
        [`players.${playerId}.hand`]: hand,
        discard: newDiscard,
        turnIndex: nextIdx,
        actionsThisTurn: 0,
        doubleRentActive: false,
        turnPhase: 'draw'
      });
    } else {
      const nextIdx = (room.turnIndex + 1) % room.playerOrder.length;
      tx.update(roomRef, {
        turnIndex: nextIdx,
        actionsThisTurn: 0,
        doubleRentActive: false,
        turnPhase: 'draw'
      });
    }
  });
}

// Subscribe to room updates
export function subscribeToRoom(code, callback) {
  const roomRef = doc(db, 'rooms', code);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) callback(snap.data());
    else callback(null);
  });
}
