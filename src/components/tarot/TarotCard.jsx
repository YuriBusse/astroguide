import TarotCardArt from "./TarotCardArt";

function TarotCard({ card, position, revealed, onReveal, disabled = false }) {
  const label = revealed
    ? `${card.name}, ${card.reversed ? "перевёрнутая" : "прямая"}`
    : `Открыть карту: ${position}`;

  return (
    <button
      type="button"
      className={`tarot-card${revealed ? " is-revealed" : ""}${card.reversed && revealed ? " is-reversed" : ""}`}
      onClick={onReveal}
      disabled={disabled || revealed}
      aria-label={label}
    >
      <span className="tarot-card__inner">
        <span className="tarot-card__back" aria-hidden={revealed}>
          <span className="tarot-card__back-mark">✦</span>
          <small>{position}</small>
        </span>
        <span className="tarot-card__face" aria-hidden={!revealed}>
          <TarotCardArt card={card} size="compact" />
          <strong>{card.name}</strong>
          <small>{card.reversed ? "Перевёрнутая" : "Прямая"}</small>
        </span>
      </span>
    </button>
  );
}

export default TarotCard;
