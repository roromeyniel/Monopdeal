export default function WinScreen({ room, user }) {
  const winner = room.players[room.winner];
  const isMe = room.winner === user?.uid;

  return (
    <div className="win-screen">
      <div className="win-card">
        <div className="win-emoji">{isMe ? '🏆' : '🎉'}</div>
        <h1 className="win-title">
          {isMe ? 'You Win!' : `${winner?.nickname} Wins!`}
        </h1>
        <p className="win-sub">
          {isMe
            ? 'Congratulations! You collected 3 complete property sets!'
            : `${winner?.nickname} collected 3 complete property sets!`}
        </p>
        <button
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
