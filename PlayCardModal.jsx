import { useState } from 'react';
import { PROPERTY_SETS } from '../../data/cards.js';
import {
  getCompleteSetColors,
  getStealableProperties,
  calculateRent
} from '../../utils/gameLogic.js';

const COLOR_BG = {
  brown:'#8B4513', lightblue:'#87CEEB', pink:'#FF69B4',
  orange:'#FFA500', red:'#DC143C', yellow:'#FFD700',
  green:'#228B22', darkblue:'#00008B', railroad:'#2d2d2d',
  utility:'#888888',
};

export default function PlayCardModal({ card, room, user, onConfirm, onCancel }) {
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [targetColor,  setTargetColor]  = useState(null);

  const me     = room.players[user.uid];
  const others = room.playerOrder
    .filter(pid => pid !== user.uid)
    .map(pid => room.players[pid]);

  /* ── Rent ── */
  if (card.action === 'rent' || card.action === 'wild_rent') {
    const myProps     = me.properties || {};
    const validColors = card.action === 'wild_rent'
      ? Object.keys(myProps).filter(c => (myProps[c] || []).length > 0)
      : (card.rentColors || []).filter(c => myProps[c]?.length > 0);

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>💰 Collect Rent</h2>
          <p>Choose which color to collect rent on:</p>
          <div className="color-options">
            {validColors.length === 0 && (
              <p style={{ color: 'var(--text3)' }}>No matching properties in play.</p>
            )}
            {validColors.map(color => {
              const rent = calculateRent(myProps, color, room.doubleRentActive);
              return (
                <button key={color}
                  className={`color-option ${targetColor === color ? 'selected' : ''}`}
                  style={{
                    background: COLOR_BG[color] || '#ccc',
                    color: ['lightblue','yellow','orange'].includes(color) ? '#000' : '#fff'
                  }}
                  onClick={() => setTargetColor(color)}>
                  {PROPERTY_SETS[color]?.name} — ${rent}M{room.doubleRentActive ? ' (×2)' : ''}
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetColor && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { targetColor })}>
                Collect Rent from All
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Birthday ── */
  if (card.action === 'birthday') {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>🎂 It's My Birthday!</h2>
          <p>All other players must pay you <strong>$2M</strong> each.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary"
              onClick={() => onConfirm(card.id, { targetPlayer: others[0]?.id })}>
              Play Birthday! 🎉
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Debt Collector ── */
  if (card.action === 'debt_collector') {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>💸 Debt Collector</h2>
          <p>Choose a player to collect <strong>$5M</strong> from:</p>
          <div className="player-options">
            {others.map(p => (
              <button key={p.id}
                className={`player-option ${targetPlayer === p.id ? 'selected' : ''}`}
                onClick={() => setTargetPlayer(p.id)}>
                {p.nickname}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetPlayer && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { targetPlayer })}>
                Collect Debt
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Sly Deal ── */
  if (card.action === 'sly_deal') {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>🤏 Sly Deal</h2>
          <p>Choose a player to steal from (incomplete sets only):</p>
          <div className="player-options">
            {others.map(p => {
              const stealable = getStealableProperties(p.properties || {}).length;
              return (
                <button key={p.id}
                  className={`player-option ${targetPlayer === p.id ? 'selected' : ''}`}
                  disabled={stealable === 0}
                  onClick={() => setTargetPlayer(p.id)}>
                  {p.nickname} — {stealable} stealable
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetPlayer && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { targetPlayer })}>
                Sly Deal →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Deal Breaker ── */
  if (card.action === 'deal_breaker') {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>💔 Deal Breaker</h2>
          <p>Choose a player to steal a complete set from:</p>
          <div className="player-options">
            {others.map(p => {
              const sets = getCompleteSetColors(p.properties || {}).length;
              return (
                <button key={p.id}
                  className={`player-option ${targetPlayer === p.id ? 'selected' : ''}`}
                  disabled={sets === 0}
                  onClick={() => setTargetPlayer(p.id)}>
                  {p.nickname} — {sets} complete set{sets !== 1 ? 's' : ''}
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetPlayer && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { targetPlayer })}>
                Deal Breaker →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Forced Deal ── */
  if (card.action === 'forced_deal') {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>🔄 Forced Deal</h2>
          <p>Choose a player to swap a property with:</p>
          <div className="player-options">
            {others.map(p => {
              const stealable = getStealableProperties(p.properties || {}).length;
              return (
                <button key={p.id}
                  className={`player-option ${targetPlayer === p.id ? 'selected' : ''}`}
                  disabled={stealable === 0}
                  onClick={() => setTargetPlayer(p.id)}>
                  {p.nickname} — {stealable} swappable
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetPlayer && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { targetPlayer })}>
                Forced Deal →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── House / Hotel placement ── */
  if (card.action === 'house' || card.action === 'hotel') {
    const myProps = me.properties || {};
    const eligibleColors = Object.keys(myProps).filter(color => {
      const cards = myProps[color] || [];
      const propCards = cards.filter(c => c.type === 'property' || c.type === 'wildcard');
      const required  = (PROPERTY_SETS[color]?.required || 0);
      const isComplete = propCards.length >= required;
      if (!isComplete) return false;
      if (card.action === 'hotel') {
        return cards.some(c => c.action === 'house');
      }
      return !cards.some(c => c.action === 'house');
    });

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>{card.action === 'house' ? '🏠' : '🏨'} Place {card.action === 'house' ? 'House' : 'Hotel'}</h2>
          <p>Choose a complete set to add a {card.action === 'house' ? 'house' : 'hotel'} to:</p>
          <div className="color-options">
            {eligibleColors.length === 0 && (
              <p style={{ color: 'var(--text3)' }}>
                No eligible sets. {card.action === 'hotel' ? 'You need a house first.' : 'Complete a set first.'}
              </p>
            )}
            {eligibleColors.map(color => (
              <button key={color}
                className={`color-option ${targetColor === color ? 'selected' : ''}`}
                style={{
                  background: COLOR_BG[color] || '#ccc',
                  color: ['lightblue','yellow','orange'].includes(color) ? '#000' : '#fff'
                }}
                onClick={() => setTargetColor(color)}>
                {PROPERTY_SETS[color]?.name || color}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            {targetColor && (
              <button className="btn-primary"
                onClick={() => onConfirm(card.id, { color: targetColor })}>
                Place {card.action === 'house' ? 'House' : 'Hotel'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
