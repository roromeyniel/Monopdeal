import { useState } from 'react';
import Card from './Card.jsx';

export default function DiscardModal({ hand, onDiscard }) {
  const excess = hand.length - 7;
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal discard-modal">
        <h2>End Turn – Discard</h2>
        <p>You have {hand.length} cards. Discard <strong>{excess}</strong> card{excess > 1 ? 's' : ''} to get down to 7.</p>
        <p>Selected: {selected.length} / {excess}</p>

        <div className="hand-cards">
          {hand.map(card => (
            <div
              key={card.id}
              className={`discard-card-wrap ${selected.includes(card.id) ? 'selected' : ''}`}
              onClick={() => toggle(card.id)}
            >
              <Card card={card} selected={selected.includes(card.id)} />
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          disabled={selected.length !== excess}
          onClick={() => onDiscard(selected)}
        >
          Discard Selected & End Turn
        </button>
      </div>
    </div>
  );
}
