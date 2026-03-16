import { PROPERTY_SETS } from '../../data/cards.js';

const ACTION_ICONS = {
  rent: '💰',
  wild_rent: '💰',
  double_rent: '✖️',
  birthday: '🎂',
  debt_collector: '💸',
  sly_deal: '🤏',
  forced_deal: '🔄',
  deal_breaker: '💔',
  just_say_no: '🚫',
  house: '🏠',
  hotel: '🏨',
};

const COLOR_STYLES = {
  brown:     { bg: '#8B4513', text: '#fff' },
  lightblue: { bg: '#87CEEB', text: '#000' },
  pink:      { bg: '#FF69B4', text: '#fff' },
  orange:    { bg: '#FFA500', text: '#000' },
  red:       { bg: '#DC143C', text: '#fff' },
  yellow:    { bg: '#FFD700', text: '#000' },
  green:     { bg: '#228B22', text: '#fff' },
  darkblue:  { bg: '#00008B', text: '#fff' },
  railroad:  { bg: '#2d2d2d', text: '#fff' },
  utility:   { bg: '#888888', text: '#fff' },
  rainbow:   { bg: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)', text: '#fff' },
};

export default function Card({
  card,
  onClick,
  selected,
  small,
  faceDown,
  disabled
}) {
  if (!card) return null;

  if (faceDown) {
    return (
      <div className={`card card-back ${small ? 'card-small' : ''}`} onClick={onClick}>
        <div className="card-back-inner">
          <span>🎴</span>
        </div>
      </div>
    );
  }

  const cls = ['card'];
  if (small) cls.push('card-small');
  if (selected) cls.push('card-selected');
  if (disabled) cls.push('card-disabled');
  if (onClick) cls.push('card-clickable');

  if (card.type === 'money') {
    return (
      <div className={cls.join(' ')} onClick={!disabled ? onClick : undefined}>
        <div className="card-money">
          <div className="card-value">${card.value}M</div>
          <div className="card-icon">💵</div>
          <div className="card-label">MONEY</div>
        </div>
      </div>
    );
  }

  if (card.type === 'property' || card.type === 'wildcard') {
    const color = card.color || card.colors?.[0];
    const colorStyle = COLOR_STYLES[color] || { bg: '#ccc', text: '#000' };
    const setInfo = PROPERTY_SETS[color];

    return (
      <div
        className={cls.join(' ')}
        onClick={!disabled ? onClick : undefined}
        style={{ '--card-bg': colorStyle.bg, '--card-text': colorStyle.text }}
      >
        <div className="card-property" style={{ background: colorStyle.bg, color: colorStyle.text }}>
          <div className="card-prop-header">
            <span className="card-value-badge">${card.value}M</span>
            {card.type === 'wildcard' && (
              <span className="wild-badge">WILD</span>
            )}
          </div>
          <div className="card-prop-name">{card.name}</div>
          {setInfo && (
            <div className="card-prop-set">{setInfo.name}</div>
          )}
          {card.type === 'wildcard' && card.colors && !card.isMultiWild && (
            <div className="card-wild-colors">
              {card.colors.map(c => (
                <span
                  key={c}
                  className="wild-color-dot"
                  style={{ background: COLOR_STYLES[c]?.bg || '#ccc' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (card.type === 'action') {
    const isRent = card.action === 'rent' || card.action === 'wild_rent';
    return (
      <div className={cls.join(' ')} onClick={!disabled ? onClick : undefined}>
        <div className="card-action">
          <div className="card-action-value">${card.value}M</div>
          <div className="card-action-icon">{ACTION_ICONS[card.action] || '🃏'}</div>
          <div className="card-action-name">{card.name}</div>
          {isRent && card.rentColors && (
            <div className="card-rent-colors">
              {card.rentColors.map(c => (
                <span
                  key={c}
                  className="rent-color-dot"
                  style={{ background: COLOR_STYLES[c]?.bg || '#ccc' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
