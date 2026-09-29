function TarotResult({ reading, spread, onRestart }) {
  return (
    <section className="tarot-result" aria-live="polite">
      <div className="tarot-result__heading">
        <span className="eyebrow">ВАШ РАСКЛАД</span>
        <h2>{spread.title}</h2>
        {reading.question && <p>«{reading.question}»</p>}
      </div>

      <div className={`tarot-result__cards tarot-result__cards--${reading.cards.length}`}>
        {reading.cards.map((card, index) => {
          const position = spread.positions[index];
          return (
            <article className="tarot-meaning-card" key={`${card.id}-${index}`}>
              <div className="tarot-meaning-card__top">
                <span>{position}</span>
                <b>{card.reversed ? "Перевёрнутая" : "Прямая"}</b>
              </div>
              <h3>{card.name}</h3>
              <div className="tarot-keywords">{card.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
              <p>{card.reversed ? card.reversedMeaning : card.shortMeaning}</p>
              <small>
                Эта позиция может отражать тему «{position.toLowerCase()}» и не является категоричным предсказанием.
              </small>
            </article>
          );
        })}
      </div>

      <div className="tarot-summary">
        <span className="eyebrow">ИТОГ РАСКЛАДА</span>
        <p>
          Карты предлагают образ для размышления: сопоставьте повторяющиеся темы с тем, что уже происходит в вашей жизни, и выберите следующий шаг самостоятельно.
        </p>
      </div>

      <button type="button" className="app-button app-button--secondary tarot-result__restart" onClick={onRestart}>
        Новый расклад
      </button>
    </section>
  );
}

export default TarotResult;
