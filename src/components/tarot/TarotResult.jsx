function TarotResult({ reading, spread, onRestart }) {
  const positionGuidance = {
    "Фокус": "На что сейчас полезно направить внимание, не требуя от карты готового решения.",
    "Прошлое": "Какой опыт или привычный сценарий мог повлиять на ситуацию.",
    "Настоящее": "Что сейчас происходит в динамике вопроса и что можно заметить уже сегодня.",
    "Будущее": "Какое направление может проявиться, если текущий способ действий сохранится.",
    "Я": "Как вы можете воспринимать себя и свою роль в этой истории.",
    "Другой человек": "Символический взгляд на динамику взаимодействия, а не утверждение о мыслях другого человека.",
    "Между нами": "Что возникает в пространстве контакта: притяжение, напряжение, разговор или граница."
  };

  const getMeaning = (card, position) => ({
    position: positionGuidance[position] || "Как эта карта может отражать выбранную позицию.",
    meaning: card.reversed ? card.reversedMeaning : card.shortMeaning,
    context: position === "Будущее"
      ? "Если текущая динамика сохранится, это может стать заметным направлением ближайшего периода — не обязательным событием."
      : position === "Прошлое"
        ? "Это может быть опытом или привычкой, которые до сих пор окрашивают ваш вопрос."
        : position === "Другой человек"
          ? "Это символическая гипотеза для разговора, а не утверждение о мыслях или намерениях другого человека."
          : "Сопоставьте эту тему с конкретной ситуацией, которую вы описали в вопросе.",
    trend: `Тенденция: тема «${card.keywords[0]}» может проявиться заметнее, если не менять привычный способ действий.`,
    advice: card.advice
  });

  const recurringThemes = [...new Set(reading.cards.flatMap((card) => card.keywords))].slice(0, 3).join(", ");

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
              <div className="tarot-result-card-art" aria-hidden="true">
                <span>{card.suit ? card.suit.slice(0, 1) : "✦"}</span>
              </div>
              <div className="tarot-keywords">{card.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
              <p className="tarot-meaning-card__position"><strong>Роль позиции:</strong> {getMeaning(card, position).position}</p>
              <div className="tarot-reading-points">
                <p><strong>Главный смысл</strong><span>{getMeaning(card, position).meaning}</span></p>
                <p><strong>Для вашего вопроса</strong><span>{getMeaning(card, position).context}</span></p>
                <p><strong>Тенденция</strong><span>{getMeaning(card, position).trend}</span></p>
                <p><strong>Что сделать</strong><span>{getMeaning(card, position).advice}</span></p>
              </div>
              <small>
                Это символический ориентир в традиции Таро, а не гарантированный прогноз и не факт о вас или другом человеке.
              </small>
            </article>
          );
        })}
      </div>

      <div className="tarot-summary">
        <span className="eyebrow">ИТОГ РАСКЛАДА</span>
        <p>
          В раскладе повторяются темы: <strong>{recurringThemes}</strong>. Это может быть главным направлением для размышления сейчас. В раскладе на три карты «Будущее» показывает возможную тенденцию, а не неизбежное событие; в отношениях карты помогают сформулировать вопросы и границы, но не доказывают, что другой человек думает или сделает.
        </p>
      </div>

      <div className="tarot-how-to-read">
        <span className="eyebrow">КАК ЧИТАТЬ</span>
        <p><strong>Прямая карта</strong> показывает тему более открыто, а <strong>перевёрнутая</strong> может подсветить внутреннее напряжение, задержку или необходимость посмотреть на вопрос иначе. Это не «хорошо» и не «плохо».</p>
      </div>

      <button type="button" className="app-button app-button--secondary tarot-result__restart" onClick={onRestart}>
        Новый расклад
      </button>
    </section>
  );
}

export default TarotResult;
