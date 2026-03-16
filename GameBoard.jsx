import { useState } from 'react';
import Card from './Card.jsx';
import PropertyArea from './PropertyArea.jsx';
import OpponentPanel from './OpponentPanel.jsx';
import ActionModal from './ActionModal.jsx';
import PlayCardModal from './PlayCardModal.jsx';
import PlaceWildModal from './PlaceWildModal.jsx';
import DiscardModal from './DiscardModal.jsx';
import { calcBankValue, countCompleteSets } from '../../utils/gameLogic.js';
import { PROPERTY_SETS } from '../../data/cards.js';

export default function GameBoard({
  room, user, isMyTurn, me,
  onDrawCards, onPlayCard, onRespondToAction,
  onMoveWildcard, onEndTurn, error
}) {
  const [activeCard, setActiveCard] = useState(null); // card being played
  const [wildcardCard, setWildcardCard] = useState(null); // wildcard placement
  const [showDiscard, setShowDiscard] = useState(false);

  if (!room || !me) return <div className="loading">Loading game...</div>;

  const currentPid = room.playerOrder[room.turnIndex];
  const opponents = room.playerOrder
    .filter(pid => pid !== user.uid)
    .map(pid => room.players[pid]);

  const handCount = me.hand?.length || 0;
  const bankValue = calcBankValue(me.bank || []);
  const completeSets = countCompleteSets(me.properties || {});
  const actionsLeft = 3 - (room.actionsThisTurn || 0);
  const needsDraw = isMyTurn && room.turnPhase !== 'action' && room.actionsThisTurn === 0;
  const hasPending = !!room.pendingAction;

  const handleCardClick = (card) => {
    if (!isMyTurn) return;
    if (hasPending) return;
    if (actionsLeft <= 0) return;

    if (card.type === 'money') {
      onPlayCard(card.id, {});
    } else if (card.type === 'property') {
      onPlayCard(card.id, { color: card.color });
    } else if (card.type === 'wildcard') {
      setWildcardCard(card);
    } else if (card.type === 'action') {
      const simpleActions = ['double_rent', 'house', 'hotel'];
      if (simpleActions.includes(card.action)) {
        // House/hotel need a color selection
        if (card.action === 'house' || card.action === 'hotel') {
          setActiveCard(card);
        } else {
          onPlayCard(card.id, {});
        }
      } else {
        setActiveCard(card);
      }
    }
  };

  const handleEndTurnClick = () => {
    if (handCount > 7) {
      setShowDiscard(true);
    } else {
      onEndTurn([]);
    }
  };

  return (
    <div className="game-board">
      {/* Opponents */}
      <div className="opponents-area">
        {opponents.map(p => (
          <OpponentPanel
            key={p.id}
            player={p}
            isCurrentTurn={currentPid === p.id}
          />
        ))}
      </div>

      {/* Center: deck + discard + status */}
      <div className="center-area">
        <div className="deck-area">
          <div className="deck-pile">
            <div className="card card-back">
              <div className="card-back-inner">
                <span>🎴</span>
                <small>{room.deck?.length || 0}</small>
              </div>
            </div>
            <span className="pile-label">Deck</span>
          </div>

          <div className="discard-pile">
            {room.discard?.length > 0 ? (
              <Card card={room.discard[room.discard.length - 1]} />
            ) : (
              <div className="empty-pile" />
            )}
            <span className="pile-label">Discard</span>
          </div>
        </div>

        <div className="game-status">
          {room.doubleRentActive && (
            <div className="status-badge double-rent">✖️ Double Rent Active</div>
          )}
          <div className="turn-info">
            {isMyTurn ? (
              <span className="your-turn">Your Turn — {actionsLeft} actions left</span>
            ) : (
              <span className="waiting-turn">
                {room.players[currentPid]?.nickname}'s Turn
              </span>
            )}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* Action buttons */}
        <div className="action-buttons">
          {isMyTurn && !hasPending && needsDraw && (
            <button className="btn-primary" onClick={onDrawCards}>
              Draw 2 Cards
            </button>
          )}
          {isMyTurn && !hasPending && !needsDraw && (
            <button className="btn-end-turn" onClick={handleEndTurnClick}>
              End Turn {handCount > 7 ? `(discard ${handCount - 7})` : ''}
            </button>
          )}
        </div>
      </div>

      {/* My area */}
      <div className="my-area">
        <div className="my-info">
          <span className="my-name">👤 You ({me.nickname})</span>
          <span className="my-stats">
            💵 ${bankValue}M · ✓ {completeSets}/3 sets
          </span>
        </div>

        {/* My properties */}
        <div className="my-properties">
          <PropertyArea
            properties={me.properties || {}}
            selectable={false}
          />
        </div>

        {/* My bank */}
        {me.bank?.length > 0 && (
          <div className="my-bank">
            <span className="section-label">Bank (${bankValue}M)</span>
            <div className="bank-cards">
              {[...me.bank].sort((a, b) => b.value - a.value).map(card => (
                <Card key={card.id} card={card} small />
              ))}
            </div>
          </div>
        )}

        {/* My hand */}
        <div className="my-hand">
          <span className="section-label">Hand ({handCount} cards)</span>
          <div className="hand-cards">
            {me.hand?.map(card => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
                disabled={!isMyTurn || hasPending || actionsLeft <= 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {hasPending && (
        <ActionModal
          room={room}
          user={user}
          onRespond={onRespondToAction}
        />
      )}

      {activeCard && !hasPending && (
        <PlayCardModal
          card={activeCard}
          room={room}
          user={user}
          onConfirm={(cardId, data) => {
            setActiveCard(null);
            onPlayCard(cardId, data);
          }}
          onCancel={() => setActiveCard(null)}
        />
      )}

      {wildcardCard && !hasPending && (
        <PlaceWildModal
          card={wildcardCard}
          onPlace={(color) => {
            setWildcardCard(null);
            onPlayCard(wildcardCard.id, { color });
          }}
          onCancel={() => setWildcardCard(null)}
        />
      )}

      {showDiscard && (
        <DiscardModal
          hand={me.hand}
          onDiscard={(ids) => {
            setShowDiscard(false);
            onEndTurn(ids);
          }}
        />
      )}
    </div>
  );
}
