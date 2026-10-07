import { TAROT_SPREADS } from "../../data/tarot/spreads";

function TarotSpreadSelector({ value, onChange }) {
  return (
    <div className="tarot-spreads" role="radiogroup" aria-label="Выбор расклада">
      {TAROT_SPREADS.map((spread, index) => (
        <button
          key={spread.id}
          type="button"
          className={`tarot-spread-option${value === spread.id ? " is-selected" : ""}`}
          role="radio"
          aria-checked={value === spread.id}
          onClick={() => onChange(spread.id)}
        >
          <span className="tarot-spread-option__count" aria-hidden="true">{index + 1}</span>
          <span className="tarot-spread-option__body">
            <strong>{spread.title}</strong>
            <small>{spread.description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export default TarotSpreadSelector;
