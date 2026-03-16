import { PROPERTY_SETS, getRent, getPropertySetSize } from '../data/cards.js';

// Check if a color group is complete
export function isCompleteSet(propertiesInColor, color, houses = 0, hotels = 0) {
  const required = getPropertySetSize(color);
  return propertiesInColor.length >= required;
}

// Get all complete sets for a player
export function getCompleteSets(properties) {
  const sets = {};
  for (const [color, cards] of Object.entries(properties)) {
    if (!cards || cards.length === 0) continue;
    const required = getPropertySetSize(color);
    if (cards.filter(c => c.type === 'property' || c.type === 'wildcard').length >= required) {
      sets[color] = cards;
    }
  }
  return sets;
}

// Count complete sets
export function countCompleteSets(properties) {
  return Object.keys(getCompleteSets(properties)).length;
}

// Check win condition
export function checkWin(properties) {
  return countCompleteSets(properties) >= 3;
}

// Calculate total bank value
export function calcBankValue(bank) {
  return bank.reduce((sum, c) => sum + (c.value || 0), 0);
}

// Calculate total property value
export function calcPropertyValue(properties) {
  let total = 0;
  for (const cards of Object.values(properties)) {
    for (const c of (cards || [])) {
      total += c.value || 0;
    }
  }
  return total;
}

// Calculate rent for a color
export function calculateRent(properties, color, doubled = false) {
  const cards = (properties[color] || []).filter(c => c.type === 'property' || c.type === 'wildcard');
  const hasHouse = (properties[color] || []).some(c => c.action === 'house');
  const hasHotel = (properties[color] || []).some(c => c.action === 'hotel');
  const rent = getRent(color, cards.length, hasHouse, hasHotel);
  return doubled ? rent * 2 : rent;
}

// Get cards player can use to pay a given amount
export function getPayableCards(bank, properties) {
  const cards = [];
  // Sort bank by value descending
  const sortedBank = [...bank].sort((a, b) => b.value - a.value);
  for (const c of sortedBank) cards.push(c);
  for (const [color, colorCards] of Object.entries(properties)) {
    for (const c of (colorCards || [])) {
      cards.push({ ...c, fromColor: color });
    }
  }
  return cards;
}

// Compute how much a set of chosen cards is worth
export function totalPaymentValue(cards) {
  return cards.reduce((s, c) => s + (c.value || 0), 0);
}

// Remove cards from player state (bank + properties)
export function removeCardsFromPlayer(player, cardIds) {
  const newBank = player.bank.filter(c => !cardIds.includes(c.id));
  const newProperties = {};
  for (const [color, cards] of Object.entries(player.properties || {})) {
    newProperties[color] = (cards || []).filter(c => !cardIds.includes(c.id));
    if (newProperties[color].length === 0) delete newProperties[color];
  }
  return { ...player, bank: newBank, properties: newProperties };
}

// Add cards to receiver's bank
export function addCardsToBank(player, cards) {
  return { ...player, bank: [...player.bank, ...cards] };
}

// Add property to player's color group
export function addPropertyToPlayer(player, card, color) {
  const props = { ...(player.properties || {}) };
  props[color] = [...(props[color] || []), card];
  return { ...player, properties: props };
}

// Get all stealable (incomplete set) properties of a player
export function getStealableProperties(properties) {
  const result = [];
  const completeSets = getCompleteSets(properties);
  for (const [color, cards] of Object.entries(properties)) {
    if (completeSets[color]) continue; // skip complete sets
    for (const c of (cards || [])) {
      if (c.type === 'property' || c.type === 'wildcard') {
        result.push({ ...c, fromColor: color });
      }
    }
  }
  return result;
}

// Get all complete set colors for a player
export function getCompleteSetColors(properties) {
  return Object.keys(getCompleteSets(properties));
}

// Generate a random room code
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Determine if a wildcard can be placed in a color
export function wildcardCompatible(card, color) {
  if (card.isMultiWild) return true;
  return card.colors?.includes(color);
}
