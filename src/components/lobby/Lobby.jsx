import { useState } from 'react';

export default function Lobby({ onCreate, onJoin, error, loading }) {
  const [tab, setTab] = useState('create');
  const [nick, setNick] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nick.trim()) return;
    if (tab === 'create') onCreate(nick.trim());
    else onJoin(code.trim().toUpperCase(), nick.trim());
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="logo">
          <span className="logo-m">M</span>
          <span className="logo-text">onopoly</span>
          <span className="logo-deal">DEAL</span>
        </div>
        <p className="logo-sub">The Fast-Dealing Property Trading Card Game</p>

        <div className="tabs">
          <button className={tab === 'create' ? 'tab active' : 'tab'} onClick={() => setTab('create')}>
            Create Room
          </button>
          <button className={tab === 'join' ? 'tab active' : 'tab'} onClick={() => setTab('join')}>
            Join Room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <label>Your Nickname</label>
          <input
            type="text"
            maxLength={20}
            placeholder="Enter your name..."
            value={nick}
            onChange={e => setNick(e.target.value)}
            autoFocus
          />

          {tab === 'join' && (
            <>
              <label>Room Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="XXXXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="code-input"
              />
            </>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : tab === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
