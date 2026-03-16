// Complete Monopoly Deal card definitions - 110 cards total

export const PROPERTY_SETS = {
  brown:    { name: 'Brown',         color: '#8B4513', required: 2, rent: [1, 2] },
  lightblue:{ name: 'Light Blue',    color: '#87CEEB', required: 3, rent: [1, 2, 3] },
  pink:     { name: 'Pink',          color: '#FF69B4', required: 3, rent: [1, 2, 4] },
  orange:   { name: 'Orange',        color: '#FFA500', required: 3, rent: [1, 3, 5] },
  red:      { name: 'Red',           color: '#FF0000', required: 3, rent: [2, 3, 6] },
  yellow:   { name: 'Yellow',        color: '#FFD700', required: 3, rent: [2, 4, 6] },
  green:    { name: 'Green',         color: '#008000', required: 3, rent: [2, 4, 7] },
  darkblue: { name: 'Dark Blue',     color: '#00008B', required: 2, rent: [3, 8] },
  railroad: { name: 'Railroad',      color: '#696969', required: 4, rent: [1, 2, 3, 4] },
  utility:  { name: 'Utility',       color: '#C0C0C0', required: 2, rent: [1, 2] },
};

let cardId = 1;
const id = () => `c${cardId++}`;

function prop(color, name, value) {
  return { id: id(), type: 'property', color, name, value };
}
function wild(colors, value, name) {
  return { id: id(), type: 'wildcard', colors, value, name, color: colors[0] };
}
function money(value) {
  return { id: id(), type: 'money', value, name: `$${value}M` };
}
function action(actionType, value, name, rentColors) {
  return { id: id(), type: 'action', action: actionType, value, name, rentColors: rentColors || null };
}

export const ALL_CARDS = [
  // === PROPERTY CARDS ===
  // Brown (2)
  prop('brown', 'Mediterranean Avenue', 1),
  prop('brown', 'Baltic Avenue', 1),

  // Light Blue (3)
  prop('lightblue', 'Oriental Avenue', 1),
  prop('lightblue', 'Vermont Avenue', 1),
  prop('lightblue', 'Connecticut Avenue', 1),

  // Pink (3)
  prop('pink', 'St. Charles Place', 2),
  prop('pink', 'States Avenue', 2),
  prop('pink', 'Virginia Avenue', 2),

  // Orange (3)
  prop('orange', 'St. James Place', 2),
  prop('orange', 'Tennessee Avenue', 2),
  prop('orange', 'New York Avenue', 2),

  // Red (3)
  prop('red', 'Kentucky Avenue', 3),
  prop('red', 'Indiana Avenue', 3),
  prop('red', 'Illinois Avenue', 3),

  // Yellow (3)
  prop('yellow', 'Atlantic Avenue', 3),
  prop('yellow', 'Ventnor Avenue', 3),
  prop('yellow', 'Marvin Gardens', 3),

  // Green (3)
  prop('green', 'Pacific Avenue', 4),
  prop('green', 'North Carolina Avenue', 4),
  prop('green', 'Pennsylvania Avenue', 4),

  // Dark Blue (2)
  prop('darkblue', 'Park Place', 4),
  prop('darkblue', 'Boardwalk', 4),

  // Railroad (4)
  prop('railroad', 'Reading Railroad', 2),
  prop('railroad', 'Pennsylvania Railroad', 2),
  prop('railroad', 'B&O Railroad', 2),
  prop('railroad', 'Short Line Railroad', 2),

  // Utility (2)
  prop('utility', 'Electric Company', 2),
  prop('utility', 'Water Works', 2),

  // === WILDCARD PROPERTIES ===
  wild(['railroad', 'utility'], 2, 'Railroad/Utility Wild'),
  wild(['railroad', 'utility'], 2, 'Railroad/Utility Wild'),
  wild(['brown', 'lightblue'], 1, 'Brown/Light Blue Wild'),
  wild(['pink', 'orange'], 2, 'Pink/Orange Wild'),
  wild(['pink', 'orange'], 2, 'Pink/Orange Wild'),
  wild(['red', 'yellow'], 3, 'Red/Yellow Wild'),
  wild(['red', 'yellow'], 3, 'Red/Yellow Wild'),
  wild(['green', 'darkblue'], 4, 'Green/Dark Blue Wild'),
  wild(['green', 'darkblue'], 4, 'Green/Dark Blue Wild'),
  wild(['lightblue', 'railroad'], 4, 'Light Blue/Railroad Wild'),
  { id: id(), type: 'wildcard', colors: Object.keys(PROPERTY_SETS), value: 0, name: 'Multi-Color Wild', color: 'rainbow', isMultiWild: true },
  { id: id(), type: 'wildcard', colors: Object.keys(PROPERTY_SETS), value: 0, name: 'Multi-Color Wild', color: 'rainbow', isMultiWild: true },

  // === MONEY CARDS ===
  money(10),
  money(10),
  money(10),
  money(10),
  money(10),
  money(5),
  money(5),
  money(5),
  money(4),
  money(4),
  money(4),
  money(3),
  money(3),
  money(3),
  money(2),
  money(2),
  money(2),
  money(2),
  money(2),
  money(2),
  money(1),
  money(1),
  money(1),
  money(1),
  money(1),
  money(1),

  // === ACTION CARDS ===
  // Deal Breaker (2) - steal complete set
  action('deal_breaker', 5, 'Deal Breaker'),
  action('deal_breaker', 5, 'Deal Breaker'),

  // Just Say No (3) - cancel action
  action('just_say_no', 4, 'Just Say No'),
  action('just_say_no', 4, 'Just Say No'),
  action('just_say_no', 4, 'Just Say No'),

  // Sly Deal (3) - steal one property from incomplete set
  action('sly_deal', 3, 'Sly Deal'),
  action('sly_deal', 3, 'Sly Deal'),
  action('sly_deal', 3, 'Sly Deal'),

  // Forced Deal (3) - swap properties
  action('forced_deal', 3, 'Forced Deal'),
  action('forced_deal', 3, 'Forced Deal'),
  action('forced_deal', 3, 'Forced Deal'),

  // Debt Collector (3) - collect 5M from one player
  action('debt_collector', 3, 'Debt Collector'),
  action('debt_collector', 3, 'Debt Collector'),
  action('debt_collector', 3, 'Debt Collector'),

  // Birthday (3) - all pay 2M
  action('birthday', 2, "It's My Birthday"),
  action('birthday', 2, "It's My Birthday"),
  action('birthday', 2, "It's My Birthday"),

  // Double Rent (2) - doubles next rent
  action('double_rent', 1, 'Double Rent'),
  action('double_rent', 1, 'Double Rent'),

  // House (3)
  action('house', 3, 'House'),
  action('house', 3, 'House'),
  action('house', 3, 'House'),

  // Hotel (3)
  action('hotel', 4, 'Hotel'),
  action('hotel', 4, 'Hotel'),
  action('hotel', 4, 'Hotel'),

  // Rent cards (by color pair)
  action('rent', 1, 'Rent (Brown/Light Blue)',   ['brown', 'lightblue']),
  action('rent', 1, 'Rent (Brown/Light Blue)',   ['brown', 'lightblue']),
  action('rent', 1, 'Rent (Pink/Orange)',         ['pink', 'orange']),
  action('rent', 1, 'Rent (Pink/Orange)',         ['pink', 'orange']),
  action('rent', 1, 'Rent (Red/Yellow)',          ['red', 'yellow']),
  action('rent', 1, 'Rent (Red/Yellow)',          ['red', 'yellow']),
  action('rent', 1, 'Rent (Green/Dark Blue)',     ['green', 'darkblue']),
  action('rent', 1, 'Rent (Green/Dark Blue)',     ['green', 'darkblue']),
  action('rent', 1, 'Rent (Railroad/Utility)',    ['railroad', 'utility']),
  action('rent', 1, 'Rent (Railroad/Utility)',    ['railroad', 'utility']),
  // Wild rent - any color (2)
  action('wild_rent', 3, 'Wild Rent'),
  action('wild_rent', 3, 'Wild Rent'),
];

export function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getPropertySetSize(color) {
  return PROPERTY_SETS[color]?.required || 0;
}

export function getRent(color, count, hasHouse, hasHotel) {
  const set = PROPERTY_SETS[color];
  if (!set) return 0;
  const baseRent = set.rent[Math.min(count, set.rent.length) - 1] || 0;
  let extra = 0;
  if (hasHouse) extra += 3;
  if (hasHotel) extra += 4;
  return baseRent + extra;
}
