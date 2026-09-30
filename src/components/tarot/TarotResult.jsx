import TarotCardArt from "./TarotCardArt";

const YES_CARDS = new Set(["the-magician", "the-empress", "the-lovers", "the-chariot", "strength", "wheel-of-fortune", "temperance", "the-star", "the-sun", "judgement", "the-world"]);
const NO_CARDS = new Set(["the-hermit", "justice", "the-hanged-man", "death", "the-devil", "the-tower", "the-moon"]);

function getYesNo(card) {
  let score = 0;
  if (YES_CARDS.has(card.id)) score += 2;
  if (NO_CARDS.has(card.id)) score -= 2;
  if (["Кубки", "Жезлы"].includes(card.suit)) score += 1;
  if (card.suit === "Мечи") score -= 1;
  if (card.reversed) score -= 1;

  if (score >= 2) return { label: "ДА", note: "Тенденция благоприятная, если действовать последовательно." };
  if (score === 1) return { label: "СКОРЕЕ ДА", note: "Шанс есть, но результат зависит от конкретного шага или разговора." };
  if (score <= -2) return { label: "НЕТ", note: "Сейчас сценарий встречает сильное сопротивление. Это не приговор, а сигнал менять подход." };
  if (score === -1) return { label: "СКОРЕЕ НЕТ", note: "Ситуация пока закрыта или несвоевременна. Не форсируйте ответ." };
  return { label: "НЕОПРЕДЕЛЁННО", note: "Слишком многое зависит от выбора, которого ещё нет. Сначала уточните условия." };
}

function getMeaning(card, position, question) {
  const theme = card.keywords[0];
  const detail = card.keywords[1] || "текущая ситуация";
  return {
    role: position === "Другой человек"
      ? "Это гипотеза о динамике, а не чтение мыслей другого человека."
      : position === "Будущее"
        ? "Это направление при сохранении текущих действий, а не гарантированное событие."
        : `Карта отвечает через тему «${theme}».`,
    meaning: card.reversed ? card.reversedMeaning : card.shortMeaning,
    question: question ? `В вопросе «${question}» это может проявиться через ${detail}.` : `В вашей ситуации это может проявиться через ${detail}.`,
    obstacle: card.reversed ? `Главная помеха — ${detail}: проверьте, не тормозит ли это решение.` : `Главная помеха — принять ${theme} за готовый результат вместо конкретного действия.`,
    action: card.advice,
    conclusion: `Итог: сейчас важнее всего тема «${theme}».`
  };
}

function getConnection(spread, cards) {
  if (spread.id === "three") {
    return `Прошлое: ${cards[0].keywords[0]} → сейчас: ${cards[1].keywords[0]} → дальше: ${cards[2].keywords[0]}. Главный переход — от опыта к конкретному выбору.`;
  }
  if (spread.id === "relationship") {
    return `Вы: ${cards[0].keywords[0]} → другой человек: ${cards[1].keywords[0]} → между вами: ${cards[2].keywords[0]}. Сверьте эту динамику с реальными действиями и границами.`;
  }
  return "Одна карта показывает главный фокус. Решение принимайте по фактам и своим границам.";
}

function TarotResult({ reading, spread, onRestart }) {
  const answer = spread.id === "yes-no" ? getYesNo(reading.cards[0]) : null;
  const recurringThemes = [...new Set(reading.cards.flatMap((card) => card.keywords))].slice(0, 2).join(" и ");

  return (
    <section className="tarot-result" aria-live="polite">
      <div className="tarot-result__heading">
        <span className="eyebrow">ВАШ РАСКЛАД</span>
        <h2>{spread.title}</h2>
        {reading.question && <p>«{reading.question}»</p>}
      </div>

      {answer && (
        <div className="tarot-yesno" aria-label={`Ответ: ${answer.label}`}>
          <span className="eyebrow">СИМВОЛИЧЕСКИЙ ОТВЕТ</span>
          <strong>{answer.label}</strong>
          <p>{answer.note}</p>
        </div>
      )}

      <div className={`tarot-result__cards tarot-result__cards--${reading.cards.length}`}>
        {reading.cards.map((card, index) => {
          const position = spread.positions[index];
          const meaning = getMeaning(card, position, reading.question);
          return (
            <article className="tarot-meaning-card" key={`${card.id}-${index}`}>
              <div className="tarot-meaning-card__top">
                <span>{position}</span>
                <b>{card.reversed ? "Перевёрнутая" : "Прямая"}</b>
              </div>
              <h3>{card.name}</h3>
              <div className="tarot-result-card-art"><TarotCardArt card={card} /></div>
              <div className="tarot-keywords">{card.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
              <p className="tarot-meaning-card__position">{meaning.role}</p>
              <div className="tarot-reading-points">
                <p><strong>Вывод</strong><span>{meaning.meaning}</span></p>
                <p><strong>Почему это важно</strong><span>{meaning.question}</span></p>
                <p><strong>Что мешает</strong><span>{meaning.obstacle}</span></p>
                <p><strong>Что делать</strong><span>{meaning.action}</span></p>
                <p><strong>Итог</strong><span>{meaning.conclusion}</span></p>
              </div>
            </article>
          );
        })}
      </div>

      {spread.id !== "single" && (
        <div className="tarot-connection">
          <span className="eyebrow">КАК ЭТО СВЯЗАНО</span>
          <p>{getConnection(spread, reading.cards)}</p>
        </div>
      )}

      <div className="tarot-summary">
        <span className="eyebrow">КОРОТКИЙ ИТОГ</span>
        <p>
          {answer ? `${answer.label}: ${answer.note}` : `Главные темы расклада — ${recurringThemes}. Выберите один конкретный шаг и проверьте ситуацию действиями.`}
        </p>
      </div>

      <div className="tarot-how-to-read">
        <span className="eyebrow">ПРЯМАЯ И ПЕРЕВЁРНУТАЯ</span>
        <p>Прямая карта проявляет тему открыто. Перевёрнутая может показывать блок, задержку или внутренний конфликт — это не автоматически «плохо».</p>
      </div>

      <button type="button" className="app-button app-button--secondary tarot-result__restart" onClick={onRestart}>
        Новый расклад
      </button>
    </section>
  );
}

export default TarotResult;
