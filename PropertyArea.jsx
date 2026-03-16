import Card from './Card.jsx';
import { PROPERTY_SETS } from '../../data/cards.js';
import { isCompleteSet } from '../../utils/gameLogic.js';

export default function PropertyArea({
  properties,
  onCardClick,
  selectable,
  selectedCards,
  compact
}) {
  const colors = Object.keys(properties || {}).filter(c => (properties[c] || []).length > 0);

  if (colors.length === 0) {
    return (
      <div className="property-area empty">
        <span className="empty-hint">No properties yet</span>
      </div>
    );
  }

  return (
    <div className={`property-area ${compact ? 'compact' : ''}`}>
      {colors.map(color => {
        const cards = properties[color] || [];
        const propCards = cards.filter(c => c.type === 'property' || c.type === 'wildcard');
        const improvements = cards.filter(c => c.action === 'house' || c.action === 'hotel');
        const complete = isCompleteSet(propCards, color);
        const setInfo = PROPERTY_SETS[color];

        return (
          <div key={color} className={`property-group ${complete ? 'complete' : ''}`}>
            <div className="group-header" style={{ background: getColorBg(color) }}>
              <span className="group-name">{setInfo?.name || color}</span>
              <span className="group-count">{propCards.length}/{setInfo?.required || '?'}</span>
              {complete && <span className="complete-badge">✓</span>}
              {improvements.map((imp, i) => (
                <span key={i} className="improvement-badge">
                  {imp.action === 'house' ? '🏠' : '🏨'}
                </span>
              ))}
            </div>
            <div className="group-cards">
              {propCards.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  small={compact}
                  selected={selectedCards?.includes(card.id)}
                  onClick={selectable ? () => onCardClick?.(card, color) : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getColorBg(color) {
  const map = {
    brown: '#8B4513', lightblue: '#87CEEB', pink: '#FF69B4',
    orange: '#FFA500', red: '#DC143C', yellow: '#FFD700',
    green: '#228B22', darkblue: '#00008B', railroad: '#2d2d2d',
    utility: '#888888', rainbow: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)'
  };
  return map[color] || '#ccc';
}
