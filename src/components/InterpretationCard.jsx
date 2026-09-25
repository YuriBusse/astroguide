import { buildInterpretation } from "../utils/interpretation";

function InterpretationCard({ title, data, planet, sign, house, degree, compact = false }) {
  const text = buildInterpretation({ planet, sign, house, degree, data });

  if (compact) {
    return (
      <article className="interpretation interpretation--compact">
        <div className="interpretation__topline">
          <div>
            <span className="interpretation__label">{text.planetName}</span>
            <h3>{title}</h3>
          </div>
          <div className="interpretation__meta">
            {degree && <span>{degree}</span>}
            {house ? <span>{house}-й дом</span> : null}
          </div>
        </div>
        <p className="interpretation__lead">{text.main}</p>
        <div className="interpretation__compact-note">
          <span>PREMIUM</span>
          Подробности о сильных сторонах, отношениях, реализации и точках роста — в полном разборе.
        </div>
      </article>
    );
  }

  return (
    <article className="interpretation">
      <div className="interpretation__topline">
        <div>
          <span className="interpretation__label">{text.planetName}</span>
          <h3>{title}</h3>
        </div>
        <div className="interpretation__meta">
          {degree && <span>{degree}</span>}
          {house ? <span>{house}-й дом</span> : null}
        </div>
      </div>
      <p className="interpretation__lead">{text.main}</p>
      <div className="interpretation__grid">
        <div><strong>Сильные стороны</strong><p>{text.strengths}</p></div>
        <div><strong>Зона роста</strong><p>{text.growth}</p></div>
        <div><strong>Отношения</strong><p>{text.relationships}</p></div>
        <div><strong>Реализация</strong><p>{text.career}</p></div>
      </div>
      <div className="interpretation__practical">
        <span>Как это читать</span>
        <p>{text.practical}</p>
      </div>
    </article>
  );
}

export default InterpretationCard;
