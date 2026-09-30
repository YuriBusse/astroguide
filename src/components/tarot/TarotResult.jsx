import TarotCardArt from "./TarotCardArt";

function TarotResult({ reading, spread, onRestart }) {
  const yesCards = new Set(["the-magician", "the-empress", "the-lovers", "the-chariot", "strength", "wheel-of-fortune", "temperance", "the-star", "the-sun", "judgement", "the-world"]);
  const noCards = new Set(["the-hermit", "justice", "the-hanged-man", "death", "the-devil", "the-tower", "the-moon"]);

  const positionGuidance = {
    "Фокус": "На что сейчас полезно направить внимание, не требуя от карты готового решения.",
    "Прошлое": "Какой опыт или привычный сценарий мог повлиять на ситуацию.",
    "Настоящее": "Что сейчас происходит в динамике вопроса и что можно заметить уже сегодня.",
    "Будущее": "Какое направление может проявиться, если текущий способ действий сохранится.",
    "Я": "Как вы можете воспринимать себя и свою роль в этой истории.",
    "Другой человек": "Символический взгляд на динамику взаимодействия, а не утверждение о мыслях другого человека.",
    "Между нами": "Что возникает в пространстве контакта: притяжение, напряжение, разговор или граница.",
    "Ответ": "Карта отвечает на ваш конкретный вопрос, но показывает тенденцию, а не гарантию."
  };

  const getYesNo = (card) => {
    let score = 0;
    if (yesCards.has(card.id)) score += 2;
    if (noCards.has(card.id)) score -= 2;
    if (card.suit === "Кубки" || card.suit === "Жезлы") score += 1;
    if (card.suit === "Мечи") score -= 1;
    if (card.reversed) score -= 1;

    if (score >= 2) return { label: "ДА", note: "В традиционной трактовке карта поддерживает развитие ситуации. Это скорее благоприятная тенденция, если вы действуете открыто и последовательно." };
    if (score === 1) return { label: "СКОРЕЕ ДА", note: "Потенциал есть, но результат зависит от конкретного шага, разговора или готовности не торопить события." };
    if (score <= -2) return { label: "НЕТ", note: "Карта указывает на серьёзное сопротивление текущему сценарию. Это не приговор: измениться может сам вопрос или способ действий." };
    if (score === -1) return { label: "СКОРЕЕ НЕТ", note: "Сейчас ситуация выглядит закрытой или несвоевременной. Полезно проверить ожидания и не форсировать ответ." };
    return { label: "НЕОПРЕДЕЛЁННО", note: "Карта не даёт чистого ответа: слишком многое зависит от выбора, которого ещё нет. Сначала проясните условия и факты." };
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
    obstacle: card.reversed ? `Мешать может ${card.keywords[1] || "внутреннее сопротивление"}: это сигнал проверить темп и ожидания, а не приговор.` : `Явного препятствия карта не подчёркивает; важно не спутать ${card.keywords[0]} с готовым результатом.`,
    advice: card.advice,
    conclusion: `Коротко: заметьте тему «${card.keywords[0]}» и сделайте один проверяемый шаг.`
  });

  const recurringThemes = [...new Set(reading.cards.flatMap((card) => card.keywords))].slice(0, 3).join(", ");
  const connection = spread.id === "three"
    ? `Прошлое показывает «${reading.cards[0].keywords[0]}», настоящее — «${reading.cards[1].keywords[0]}», а будущее — «${reading.cards[2].keywords[0]}». Связка может указывать на переход от прошлого опыта к текущему выбору и его возможному последствию.`
    : spread.id === "relationship"
      ? `Ваша позиция — «${reading.cards[0].keywords[0]}», позиция другого человека — «${reading.cards[1].keywords[0]}», а общая динамика — «${reading.cards[2].keywords[0]}». Сравните ожидания с реальными действиями и личными границами.`
      : "Одна карта показывает главный фокус вопроса; следующий шаг лучше выбирать по фактам, а не только по символу.";

  return (
    <section className="tarot-result" aria-live="polite">
      <div className="tarot-result__heading">
        <span className="eyebrow">ВАШ РАСКЛАД</span>
        <h2>{spread.title}</h2>
        {reading.question && <p>«{reading.question}»</p>}
      </div>

      {spread.id === "yes-no" && (() => {
        const answer = getYesNo(reading.cards[0]);
        return <div className="tarot-yesno" aria-label={`Ответ: ${answer.label}`}><span className="eyebrow">СИМВОЛИЧЕСКИЙ ОТВЕТ</span><strong>{answer.label}</strong><p>{answer.note}</p></div>;
      })()}

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
              <div className="tarot-result-card-art"><TarotCardArt card={card} /></div>
              <div className="tarot-keywords">{card.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
              <p className="tarot-meaning-card__position"><strong>Роль позиции:</strong> {getMeaning(card, position).position}</p>
              <div className="tarot-reading-points">
                <p><strong>Главный смысл</strong><span>{getMeaning(card, position).meaning}</span></p>
                <p><strong>Для вашего вопроса</strong><span>{getMeaning(card, position).context}</span></p>
                <p><strong>Тенденция</strong><span>{getMeaning(card, position).trend}</span></p>
                <p><strong>Что мешает</strong><span>{getMeaning(card, position).obstacle}</span></p>
                <p><strong>Что сделать</strong><span>{getMeaning(card, position).advice}</span></p>
                <p><strong>Короткий итог</strong><span>{getMeaning(card, position).conclusion}</span></p>
              </div>
              <small>
                Это символический ориентир в традиции Таро, а не гарантированный прогноз и не факт о вас или другом человеке.
              </small>
            </article>
          );
        })}
      </div>

      {spread.id !== "single" && (
        <div className="tarot-connection">
          <span className="eyebrow">КАК ЭТО СВЯЗАНО</span>
          <p>{connection}</p>
        </div>
      )}

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
