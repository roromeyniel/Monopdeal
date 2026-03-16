import Card from './Card.jsx';
import PropertyArea from './PropertyArea.jsx';
import { countCompleteSets, calcBankValue } from '../../utils/gameLogic.js';

export default function OpponentPanel({ player, isCurrentTurn }) {
  const completeSets = countCompleteSets(player.properties || {});
  const bankValue = calcBankValue(player.bank || []);

  return (
    <div className={`opponent-panel ${isCurrentTurn ? 'active-turn' : ''}`}>
      <div className="opponent-header">
        <div className="player-avatar">{player.nickname[0].toUpperCase()}</div>
        <div className="player-info">
          <span className="player-name">{player.nickname}</span>
          {isCurrentTurn && <span className="turn-badge">▶ Turn</span>}
        </div>
        <div className="player-stats">
          <span className="stat">🃏 {player.hand?.length || 0}</span>
          <span className="stat">💵 ${bankValue}M</span>
          <span className="stat">✓ {completeSets}/3</span>
        </div>
      </div>

      <div className="opponent-body">
        {/* Face-down hand */}
        <div className="opponent-hand">
          {Array.from({ length: Math.min(player.hand?.length || 0, 7) }).map((_, i) => (
            <div key={i} className="card card-back card-small">
              <div className="card-back-inner"><span>🎴</span></div>
            </div>
          ))}
        </div>

        {/* Bank */}
        <div className="opponent-bank">
          <span className="section-label">Bank: ${bankValue}M</span>
        </div>

        {/* Properties */}
        <PropertyArea properties={player.properties || {}} compact />
      </div>
    </div>
  );
}
