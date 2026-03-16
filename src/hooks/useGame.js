import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, signInUser } from '../firebase/config.js';
import {
  createRoom, joinRoom, startGame, drawCards, playCard,
  respondToAction, moveWildcard, endTurn, subscribeToRoom,
  setPlayerConnected
} from '../firebase/gameService.js';
import { checkWin, countCompleteSets } from '../utils/gameLogic.js';

export function useGame() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef(null);

  // Sign in anonymously on mount
  useEffect(() => {
    signInUser()
      .then(setUser)
      .catch(e => alert('Erreur Firebase: ' + e.message));
  }, []);

  // Subscribe to room updates when we have a code
  useEffect(() => {
    if (!roomCode) return;
    if (unsubRef.current) unsubRef.current();

    unsubRef.current = subscribeToRoom(roomCode, (data) => {
      setRoom(data);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [roomCode]);

  // Mark connected/disconnected
  useEffect(() => {
    if (!roomCode || !user) return;
    setPlayerConnected(roomCode, user.uid, true).catch(() => {});
    const handleUnload = () => setPlayerConnected(roomCode, user.uid, false).catch(() => {});
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [roomCode, user]);

  const wrap = useCallback(async (fn) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateRoom = useCallback((nick) => wrap(async () => {
    if (!user) throw new Error('Not authenticated');
    const code = await createRoom(user.uid, nick);
    setNickname(nick);
    setRoomCode(code);
  }), [user, wrap]);

  const handleJoinRoom = useCallback((code, nick) => wrap(async () => {
    if (!user) throw new Error('Not authenticated');
    await joinRoom(code, user.uid, nick);
    setNickname(nick);
    setRoomCode(code.toUpperCase());
  }), [user, wrap]);

  const handleStartGame = useCallback(() => wrap(async () => {
    await startGame(roomCode, user.uid);
  }), [roomCode, user, wrap]);

  const handleDrawCards = useCallback(() => wrap(async () => {
    await drawCards(roomCode, user.uid);
  }), [roomCode, user, wrap]);

  const handlePlayCard = useCallback((cardId, targetData) => wrap(async () => {
    await playCard(roomCode, user.uid, cardId, targetData);
  }), [roomCode, user, wrap]);

  const handleRespondToAction = useCallback((response, data) => wrap(async () => {
    await respondToAction(roomCode, user.uid, response, data);
  }), [roomCode, user, wrap]);

  const handleMoveWildcard = useCallback((cardId, fromColor, toColor) => wrap(async () => {
    await moveWildcard(roomCode, user.uid, cardId, fromColor, toColor);
  }), [roomCode, user, wrap]);

  const handleEndTurn = useCallback((discardIds) => wrap(async () => {
    await endTurn(roomCode, user.uid, discardIds);
  }), [roomCode, user, wrap]);

  const isMyTurn = room && user && room.playerOrder?.[room.turnIndex] === user.uid;
  const me = room && user ? room.players?.[user.uid] : null;
  const currentPlayerId = room?.playerOrder?.[room?.turnIndex];

  return {
    user, nickname, roomCode, room, error, loading, isMyTurn, me, currentPlayerId,
    handleCreateRoom, handleJoinRoom, handleStartGame,
    handleDrawCards, handlePlayCard, handleRespondToAction,
    handleMoveWildcard, handleEndTurn
  };
}
