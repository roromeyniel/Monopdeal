import { useState } from 'react';
import Card from './Card.jsx';
import { PROPERTY_SETS } from '../../data/cards.js';
import {
  getCompleteSetColors,
  getStealableProperties,
  totalPaymentValue,
  calculateRent
} from '../../utils/gameLogic.js';

export default function ActionModal({ room, user, onRespond }) {
  const pending = room.pendingAction;
  if (!pending) return null;

  const me           = room.players[user.uid];
  const actingPlayer = room.players[pending.actingPlayer];
  const isTarget     = pending.targetPlayer === user.uid;
  const isActor      = pending.actingPlayer === user.uid;
  const card         = pending.card;

  const isBirthday    = card.action === 'birthday';
  const isDebtCollect = card.action === 'debt_collector';
  const isRent        = card.action === 'rent' || card.action === 'wild_rent';
  const isSlyDeal     = card.action === 'sly_deal';
  const isDealBreaker = card.action === 'deal_breaker';
  const isForcedDeal  = card.action === 'forced_deal';

  const jsnStack = pending.jsn_stack || [];
  const needsToRespondJSN = jsnStack.length > 0 && (
    jsnStack.length % 2 === 0 ? isTarget : isActor
  );
  const myJSN = me?.hand?.find(c => c.action === 'just_say_no');

  let payAmount = 0;
  if (isBirthday)    payAmount = 2;
  if (isDebtCollect) payAmount = 5;
  if (isRent) {
    payAmount = calculateRent(
      actingPlayer?.properties || {},
      pending.targetColor || card.rentColors?.[0],
      pending.doubled
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal action-modal">
        <div className="modal-header">
          <span className="action-icon">{getActionIcon(card.action)}</span>
          <h2>{card.name}</h2>
        </div>

        {jsnStack.length > 0 && (
          <div className="jsn-chain">
            <p>⚡ Just Say No chain active — {jsnStack.length} card(s) played</p>
          </div>
        )}

        <ActionBody
          pending={pending} card={card} room={room} me={me}
          actingPlayer={actingPlayer}
          isTarget={isTarget} isActor={isActor}
          payAmount={payAmount} onRespond={onRespond}
          myJSN={myJSN} needsToRespondJSN={needsToRespondJSN}
          isBirthday={isBirthday} isDebtCollect={isDebtCollect}
          isRent={isRent} isSlyDeal={isSlyDeal}
          isDealBreaker={isDealBreaker} isForcedDeal={isForcedDeal}
        />
      </div>
    </div>
  );
}

function ActionBody({
  pending, card, room, me, actingPlayer,
  isTarget, isActor, payAmount, onRespond,
  myJSN, needsToRespondJSN,
  isBirthday, isDebtCollect, isRent, isSlyDeal, isDealBreaker, isForcedDeal
}) {
  const [selPayIds,        setSelPayIds]        = useState([]);
  const [selStealColor,    setSelStealColor]    = useState(null);
  const [selStealCard,     setSelStealCard]     = useState(null);
  const [mySelCard,        setMySelCard]        = useState(null);
  const [mySelColor,       setMySelColor]       = useState(null);

  const target = pending.targetPlayer ? room.players[pending.targetPlayer] : null;

  /* ── JSN counter ── */
  if (needsToRespondJSN) {
    return (
      <div>
        <p>Just Say No was played against you! Counter with your own?</p>
        <div className="modal-actions" style={{ marginTop: 12 }}>
          {myJSN && (
            <button className="btn-jsn"
              onClick={() => onRespond('just_say_no', { cardId: myJSN.id })}>
              🚫 Just Say No!
            </button>
          )}
          <button className="btn-secondary"
            onClick={() => onRespond('accept_jsn', {})}>
            Accept – action is cancelled
          </button>
        </div>
      </div>
    );
  }

  /* ── Sly Deal ── */
  if (isSlyDeal && isActor) {
    const stealable = getStealableProperties(target?.properties || {});
    return (
      <div>
        <p>Steal 1 property from <strong>{target?.nickname}</strong> (incomplete sets):</p>
        <div className="steal-options">
          {stealable.length === 0
            ? <p style={{ color: 'var(--text3)' }}>No stealable properties.</p>
            : stealable.map(c => (
              <div key={c.id}
                className={`steal-option ${selStealCard?.id === c.id ? 'selected' : ''}`}
                onClick={() => { setSelStealCard(c); setSelStealColor(c.fromColor); }}>
                <Card card={c} small />
                <span>{PROPERTY_SETS[c.fromColor]?.name || c.fromColor}</span>
              </div>
            ))
          }
        </div>
        {selStealCard && (
          <div className="modal-actions">
            <button className="btn-primary"
              onClick={() => onRespond('give_property', {
                cardId: selStealCard.id,
                fromColor: selStealColor,
                toColor: selStealCard.color || selStealCard.colors?.[0]
              })}>
              Steal {selStealCard.name}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Deal Breaker ── */
  if (isDealBreaker && isActor) {
    const completeSets = getCompleteSetColors(target?.properties || {});
    return (
      <div>
        <p>Steal a complete set from <strong>{target?.nickname}</strong>:</p>
        <div className="steal-options">
          {completeSets.length === 0
            ? <p style={{ color: 'var(--text3)' }}>No complete sets available.</p>
            : completeSets.map(color => (
              <div key={color}
                className={`steal-option ${selStealColor === color ? 'selected' : ''}`}
                onClick={() => setSelStealColor(color)}>
                <strong>{PROPERTY_SETS[color]?.name || color}</strong>
                <div className="mini-cards">
                  {(target.properties[color] || []).map(c =>
                    <Card key={c.id} card={c} small />)}
                </div>
              </div>
            ))
          }
        </div>
        {selStealColor && (
          <div className="modal-actions">
            <button className="btn-primary"
              onClick={() => onRespond('give_property', { fromColor: selStealColor })}>
              Steal {PROPERTY_SETS[selStealColor]?.name} set
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Forced Deal ── */
  if (isForcedDeal && isActor) {
    const theirCards = getStealableProperties(target?.properties || {});
    const myCards    = getStealableProperties(me?.properties   || {});
    return (
      <div>
        <p>Swap a property with <strong>{target?.nickname}</strong>:</p>
        <div className="two-col">
          <div>
            <h4>Take from them:</h4>
            <div className="steal-options">
              {theirCards.map(c => (
                <div key={c.id}
                  className={`steal-option ${selStealCard?.id === c.id ? 'selected' : ''}`}
                  onClick={() => { setSelStealCard(c); setSelStealColor(c.fromColor); }}>
                  <Card card={c} small />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4>Give to them:</h4>
            <div className="steal-options">
              {myCards.map(c => (
                <div key={c.id}
                  className={`steal-option ${mySelCard?.id === c.id ? 'selected' : ''}`}
                  onClick={() => { setMySelCard(c); setMySelColor(c.fromColor); }}>
                  <Card card={c} small />
                </div>
              ))}
            </div>
          </div>
        </div>
        {selStealCard && mySelCard && (
          <div className="modal-actions">
            <button className="btn-primary"
              onClick={() => onRespond('give_property', {
                theirCardId: selStealCard.id,
                theirColor: selStealColor,
                myCardId: mySelCard.id,
                myColor: mySelColor
              })}>
              Swap Properties
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Payment ── */
  const mustPay = (isRent && isTarget)
    || (isBirthday    && !isActor)
    || (isDebtCollect && isTarget);

  if (mustPay && me) {
    const allPayable = [
      ...me.bank.map(c => ({ ...c, fromBank: true })),
      ...Object.entries(me.properties || {}).flatMap(([color, cards]) =>
        (cards || []).map(c => ({ ...c, fromColor: color }))
      )
    ];
    const maxAvail   = allPayable.reduce((s, c) => s + (c.value || 0), 0);
    const selTotal   = totalPaymentValue(allPayable.filter(c => selPayIds.includes(c.id)));
    const canSubmit  = selTotal >= payAmount || maxAvail <= payAmount;

    const toggle = (c) =>
      setSelPayIds(prev =>
        prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
      );

    return (
      <div>
        <p><strong>{actingPlayer?.nickname}</strong> played {card.name}!</p>
        <p>You must pay <strong>${payAmount}M</strong>. Selected: <strong>${selTotal}M</strong></p>
        {selTotal < payAmount && maxAvail > payAmount && (
          <p className="hint">Select more cards (overpayment is OK, no change given)</p>
        )}
        <div className="pay-cards">
          {allPayable.map(c => (
            <div key={c.id}
              className={`pay-card-wrap ${selPayIds.includes(c.id) ? 'selected' : ''}`}
              onClick={() => toggle(c)}>
              <Card card={c} small selected={selPayIds.includes(c.id)} />
              <span className="from-label">
                {c.fromBank ? 'Bank' : (PROPERTY_SETS[c.fromColor]?.name || c.fromColor)}
              </span>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          {myJSN && (
            <button className="btn-jsn"
              onClick={() => onRespond('just_say_no', { cardId: myJSN.id })}>
              🚫 Just Say No!
            </button>
          )}
          <button className="btn-primary" disabled={!canSubmit}
            onClick={() => onRespond('pay', {
              payCards: allPayable.filter(c => selPayIds.includes(c.id))
            })}>
            Pay ${selTotal}M
          </button>
        </div>
      </div>
    );
  }

  /* ── Waiting (other player acting) ── */
  return (
    <div className="waiting-action">
      <p>⏳ Waiting for players to respond to <strong>{card.name}</strong>…</p>
    </div>
  );
}

function getActionIcon(action) {
  return ({
    rent:'💰', wild_rent:'💰', double_rent:'✖️',
    birthday:'🎂', debt_collector:'💸', sly_deal:'🤏',
    forced_deal:'🔄', deal_breaker:'💔', just_say_no:'🚫',
    house:'🏠', hotel:'🏨'
  })[action] || '🎴';
}
