import { PROPERTY_SETS } from '../../data/cards.js';

export default function PlaceWildModal({ card, onPlace, onCancel }) {
  const colors = card.isMultiWild ? Object.keys(PROPERTY_SETS) : (card.colors || []);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Place Wildcard</h2>
        <p>Choose which color group to place this wildcard in:</p>
        <div className="color-options">
          {colors.map(color => (
            <button
              key={color}
              className="color-option"
              style={{ background: getColorBg(color) }}
              onClick={() => onPlace(color)}
            >
              {PROPERTY_SETS[color]?.name || color}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function getColorBg(color) {
  const map = {
    brown: '#8B4513', lightblue: '#87CEEB', pink: '#FF69B4',
    orange: '#FFA500', red: '#DC143C', yellow: '#FFD700',
    green: '#228B22', darkblue: '#00008B', railroad: '#2d2d2d',
    utility: '#888888', rainbow: '#999',
  };
  return map[color] || '#ccc';
}
