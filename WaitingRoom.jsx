export default function WaitingRoom({ room, user, onStart, error }) {
  const players = Object.values(room.players || {});
  const isHost = room.hostId === user?.uid;
  const canStart = players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
  };

  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <h2>Waiting Room</h2>

        <div className="room-code-display">
          <span className="room-code-label">Room Code</span>
          <div className="room-code-value">
            <span>{room.code}</span>
            <button className="copy-btn" onClick={copyCode} title="Copy code">
              📋
            </button>
          </div>
          <p className="room-code-hint">Share this code with your friends to invite them</p>
        </div>

        <div className="player-list">
          <h3>Players ({players.length}/5)</h3>
          {players.map(p => (
            <div key={p.id} className="player-item">
              <span className={`status-dot ${p.connected ? 'online' : 'offline'}`} />
              <span>{p.nickname}</span>
              {p.id === room.hostId && <span className="host-badge">HOST</span>}
            </div>
          ))}
          {players.length < 5 && (
            <div className="player-item empty">
              <span className="status-dot waiting" />
              <span className="waiting-text">Waiting for players...</span>
            </div>
          )}
        </div>

        {error && <div className="error-msg">{error}</div>}

        {isHost ? (
          <button
            className="btn-primary"
            onClick={onStart}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : 'Need at least 2 players'}
          </button>
        ) : (
          <p className="waiting-text">Waiting for host to start the game...</p>
        )}
      </div>
    </div>
  );
}
