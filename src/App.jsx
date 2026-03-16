import { useGame } from './hooks/useGame.js';
import Lobby from './components/lobby/Lobby.jsx';
import WaitingRoom from './components/lobby/WaitingRoom.jsx';
import GameBoard from './components/game/GameBoard.jsx';
import WinScreen from './components/game/WinScreen.jsx';
import './styles/main.css';

export default function App() {
  const {
    user, roomCode, room, error, loading, isMyTurn, me, currentPlayerId,
    handleCreateRoom, handleJoinRoom, handleStartGame,
    handleDrawCards, handlePlayCard, handleRespondToAction,
    handleMoveWildcard, handleEndTurn
  } = useGame();

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Connecting...</p>
        <p style={{color:'red'}}>{error}</p>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <Lobby
        onCreate={handleCreateRoom}
        onJoin={handleJoinRoom}
        error={error}
        loading={loading}
      />
    );
  }

  if (!room) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading room...</p>
      </div>
    );
  }

  if (room.status === 'lobby') {
    return (
      <WaitingRoom
        room={room}
        user={user}
        onStart={handleStartGame}
        error={error}
      />
    );
  }

  if (room.status === 'finished') {
    return <WinScreen room={room} user={user} />;
  }

  return (
    <GameBoard
      room={room}
      user={user}
      isMyTurn={isMyTurn}
      me={me}
      onDrawCards={handleDrawCards}
      onPlayCard={handlePlayCard}
      onRespondToAction={handleRespondToAction}
      onMoveWildcard={handleMoveWildcard}
      onEndTurn={handleEndTurn}
      error={error}
    />
  );
}
