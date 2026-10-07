import TarotCardArt from "./TarotCardArt";

function getYesNo(card) {
  const map = {
    yes: {
      label: "🟢 СКОРЕЕ ДА",
      tone: "yes",
      note: "Ситуация скорее движется в нужную сторону."
    },
    no: {
      label: "🔴 СКОРЕЕ НЕТ",
      tone: "no",
      note: "Сейчас ситуация скорее сопротивляется желаемому результату."
    },
    maybe: {
      label: "🟡 ПОКА НЕЯСНО",
      tone: "maybe",
      note: "Ситуация ещё не определилась. Есть фактор, который может изменить результат."
    }
  };

  return map[card?.yesNo] || map.maybe;
}

function getPositionLabel(position) {
  const labels = {
    "Что человек чувствует": "❤️ Что он/она чувствует",
    "Что человек думает": "🧠 Что он/она думает",
    "Чего хочет": "🎯 Чего хочет",
    "Что будет дальше": "🔮 Что будет дальше",
    "Совет": "⚡ Совет",

    "Суть ситуации": "🎯 Суть ситуации",
    "Что за": "🟢 Что работает на тебя",
    "Что против": "🔴 Что мешает",
    "Вероятный результат": "🔮 Вероятный результат",
    "Итог": "❤️ Итог",

    "Что происходит сейчас": "📍 Что происходит сейчас",
    "Что скрыто": "👀 Что скрыто",
    "Что мешает": "🔴 Что мешает",
    "Что изменится": "🔮 Что изменится",

    "Текущая ситуация": "📍 Текущая ситуация",
    "Возможность": "💡 Возможность",
    "Главная проблема": "🔴 Главная проблема",
    "Откуда придёт результат": "💰 Откуда придёт результат"
  };

  return labels[position] || position;
}

/*
 * Базовое значение карты.
 * Используем только существующие данные карты.
 */
function getPositionMeaning(card, position) {
  if (!card) return "";

  switch (position) {
    case "Что человек чувствует":
      return card.love || card.shortMeaning;

    case "Что человек думает":
      return card.shortMeaning;

    case "Чего хочет":
      return card.love || card.shortMeaning;

    case "Что будет дальше":
      return card.shortMeaning;

    case "Совет":
      return card.advice || card.shortMeaning;

    case "Суть ситуации":
      return card.shortMeaning;

    case "Что за":
      return buildPositiveMeaning(card);

    case "Что против":
      return buildNegativeMeaning(card);

    case "Вероятный результат":
      return card.shortMeaning;

    case "Итог":
      return buildFinalMeaning(card);

    case "Что происходит сейчас":
      return card.shortMeaning;

    case "Что скрыто":
      return card.shortMeaning;

    case "Что мешает":
      return buildNegativeMeaning(card);

    case "Что изменится":
      return card.shortMeaning;

    case "Текущая ситуация":
      return card.money || card.shortMeaning;

    case "Возможность":
      return card.money || card.shortMeaning;

    case "Главная проблема":
      return buildNegativeMeaning(card);

    case "Откуда придёт результат":
      return card.money || card.shortMeaning;

    default:
      return card.shortMeaning;
  }
}

function buildPositiveMeaning(card) {
  return card.love || card.shortMeaning;
}

function buildNegativeMeaning(card) {
  if (
    card.reversedMeaning &&
    card.reversedMeaning !== card.shortMeaning
  ) {
    return card.reversedMeaning;
  }

  return card.shortMeaning;
}

function buildFinalMeaning(card) {
  return (
    card.shortMeaning ||
    card.love ||
    card.advice ||
    ""
  );
}

/*
 * Определяем контекст самого вопроса.
 */
function detectQuestionContext(question = "") {
  const text = question.toLowerCase();

  if (
    /отношен|любов|любим|чувств|девуш|парен|бывш|пара|роман/.test(
      text
    )
  ) {
    return "love";
  }

  if (
    /напиш|сообщ|позвон|ответ|встрет|верн|свяж|контакт/.test(
      text
    )
  ) {
    return "communication";
  }

  if (
    /работ|карьер|началь|коллег|собесед|должност|увольн/.test(
      text
    )
  ) {
    return "work";
  }

  if (
    /деньг|финанс|заработ|доход|кредит|бизнес|продаж|прибыл/.test(
      text
    )
  ) {
    return "money";
  }

  return "general";
}

/*
 * Короткое объяснение именно позиции.
 */
function getPositionContext(position) {
  const map = {
    "Что человек чувствует":
      "Здесь мы смотрим на внутренние эмоции человека.",

    "Что человек думает":
      "Здесь речь о том, как человек воспринимает происходящее.",

    "Чего хочет":
      "Здесь карта показывает внутреннее желание и намерение.",

    "Что будет дальше":
      "Здесь карта показывает наиболее вероятное направление развития.",

    "Совет":
      "Здесь карта скорее подсказывает, как тебе лучше действовать.",

    "Суть ситуации":
      "Здесь карта показывает центральную тему ситуации.",

    "Что за":
      "Здесь находится фактор, который работает в твою пользу.",

    "Что против":
      "Здесь находится фактор, который создаёт сопротивление.",

    "Вероятный результат":
      "Здесь показано возможное развитие при сохранении нынешних обстоятельств.",

    "Итог":
      "Здесь собран главный смысл расклада.",

    "Что происходит сейчас":
      "Здесь описывается текущая фаза ситуации.",

    "Что скрыто":
      "Здесь карта показывает то, что пока может быть неочевидно.",

    "Что мешает":
      "Здесь находится основной фактор задержки или сопротивления.",

    "Что изменится":
      "Здесь показано возможное направление изменений.",

    "Текущая ситуация":
      "Здесь карта описывает текущее финансовое положение.",

    "Возможность":
      "Здесь стоит искать потенциальный ресурс или возможность.",

    "Главная проблема":
      "Здесь находится главное финансовое препятствие.",

    "Откуда придёт результат":
      "Здесь карта показывает возможный источник результата."
  };

  return map[position] || "Здесь карта раскрывает отдельную часть ситуации.";
}

/*
 * Формируем более человеческую трактовку:
 * вопрос + карта + позиция + контекст + положение карты.
 */

function getContextualMeaning(
  card,
  position,
  question = ""
) {
  if (!card) return "";

  const baseMeaning =
    card.reversed && card.reversedMeaning
      ? card.reversedMeaning
      : getPositionMeaning(card, position);

  const cleanBase = String(
    baseMeaning || ""
  ).trim();

  if (!cleanBase) return "";

  let connection = "";

  switch (position) {
    case "Что человек чувствует":
      connection =
        "Здесь важнее всего эмоциональная реакция человека: чувства могут быть сильнее, чем это видно по его поведению.";
      break;

    case "Что человек думает":
      connection =
        "Карта показывает внутреннее восприятие ситуации и то, что сейчас занимает мысли человека.";
      break;

    case "Чего хочет":
      connection =
        "Это показывает внутреннее желание человека, но желание ещё не всегда означает готовность действовать.";
      break;

    case "Что будет дальше":
      connection =
        "Это наиболее вероятное направление развития ситуации, если нынешние обстоятельства существенно не изменятся.";
      break;

    case "Совет":
      connection =
        "Здесь карта скорее подсказывает линию поведения, которая может помочь тебе в этой ситуации.";
      break;

    case "Суть ситуации":
      connection =
        "Эта карта показывает главную тему, вокруг которой сейчас развивается ситуация.";
      break;

    case "Что за":
      connection =
        "Это тот фактор, который сейчас может сыграть в твою пользу.";
      break;

    case "Что против":
      connection =
        "Именно этот фактор может создавать сопротивление или мешать ситуации развиваться свободно.";
      break;

    case "Вероятный результат":
      connection =
        "Если ситуация продолжит развиваться примерно так же, эта тенденция может привести именно к такому результату.";
      break;

    case "Итог":
      connection =
        "Эта карта собирает основной смысл расклада и показывает, к чему в итоге сводится ситуация.";
      break;

    case "Что происходит сейчас":
      connection =
        "Карта описывает текущую фазу ситуации и то, что уже начинает проявляться.";
      break;

    case "Что скрыто":
      connection =
        "Здесь стоит обратить внимание на то, что пока не очевидно из внешних событий или поведения.";
      break;

    case "Что мешает":
      connection =
        "Карта показывает главный фактор, который сейчас создаёт задержку или сопротивление.";
      break;

    case "Что изменится":
      connection =
        "Эта карта показывает направление, в котором ситуация может начать меняться.";
      break;

    case "Текущая ситуация":
      connection =
        "Карта показывает текущее состояние финансовой стороны вопроса.";
      break;

    case "Возможность":
      connection =
        "Здесь находится направление, через которое сейчас может появиться возможность получить результат.";
      break;

    case "Главная проблема":
      connection =
        "Карта показывает фактор, который сильнее всего может мешать финансовому результату.";
      break;

    case "Откуда придёт результат":
      connection =
        "Карта указывает направление, через которое результат вероятнее всего может прийти.";
      break;

    default:
      connection =
        "Эта карта раскрывает отдельную сторону ситуации.";
  }

  return [
    cleanBase,
    connection
  ]
    .filter(Boolean)
    .join(" ");
}

function getPositionIntro(position) {
  const intros = {
    "Что человек чувствует":
      "Что происходит у человека внутри.",

    "Что человек думает":
      "Как человек сейчас воспринимает ситуацию.",

    "Чего хочет":
      "К чему человек внутренне склоняется.",

    "Что будет дальше":
      "Куда ситуация вероятнее всего движется.",

    "Совет":
      "Что тебе лучше сделать сейчас.",

    "Суть ситуации":
      "Что на самом деле лежит в основе ситуации.",

    "Что за":
      "Что сейчас играет в твою пользу.",

    "Что против":
      "Что сильнее всего мешает ситуации.",

    "Вероятный результат":
      "К чему ситуация может прийти, если всё продолжится примерно так же.",

    "Итог":
      "Главный вывод из всего расклада.",

    "Что происходит сейчас":
      "Что происходит в ситуации прямо сейчас.",

    "Что скрыто":
      "Что пока не очевидно с первого взгляда.",

    "Что мешает":
      "Главная причина, которая тормозит ситуацию.",

    "Что изменится":
      "Как ситуация может измениться дальше.",

    "Текущая ситуация":
      "Что сейчас происходит с деньгами.",

    "Возможность":
      "Где сейчас есть возможность получить результат.",

    "Главная проблема":
      "Что сильнее всего мешает финансовому результату.",

    "Откуда придёт результат":
      "Через что вероятнее всего придёт результат."
  };

  return (
    intros[position] ||
    "Главный смысл этой позиции."
  );
}

/*
 * Итог всего расклада.
 */
function getSmartSummary(reading, spread) {
  if (!reading?.cards?.length) return "";

  const cards = reading.cards;

  const reversedCount = cards.filter(
    (card) => card.reversed
  ).length;

  const question = reading.question?.trim();

  const firstCard = cards[0];
  const lastCard =
    cards[cards.length - 1];

  const firstMeaning =
    firstCard?.reversed &&
    firstCard?.reversedMeaning
      ? firstCard.reversedMeaning
      : firstCard?.shortMeaning;

  const lastMeaning =
    lastCard?.reversed &&
    lastCard?.reversedMeaning
      ? lastCard.reversedMeaning
      : lastCard?.shortMeaning;

  const opening = question
    ? `По вопросу «${question}» расклад показывает несколько связанных факторов, а не одну однозначную причину.`
    : "Расклад показывает несколько связанных между собой факторов.";

  let dynamicPart = "";

  if (reversedCount === 0) {
    dynamicPart =
      "Все карты вышли прямо, поэтому ситуация выглядит достаточно открытой для проявления показанных тенденций.";
  } else if (
    reversedCount === cards.length
  ) {
    dynamicPart =
      "Все карты перевёрнуты — сейчас особенно заметны внутренние ограничения, задержки или противоречия.";
  } else if (
    reversedCount >=
    Math.ceil(cards.length / 2)
  ) {
    dynamicPart =
      "Большая часть карт перевёрнута, поэтому ситуация сейчас сталкивается с заметным внутренним сопротивлением или обстоятельствами, которые мешают свободному развитию.";
  } else {
    dynamicPart =
      "При этом часть энергии расклада проявляется открыто, а часть сталкивается с ограничениями или сомнениями.";
  }

  const firstPart = firstMeaning
    ? `В начале расклада особенно выделяется тема: ${firstMeaning}.`
    : "";

  const lastPosition =
    spread.positions[
      spread.positions.length - 1
    ];

  const lastPart =
    lastMeaning && lastPosition
      ? `Финальная позиция «${lastPosition}» указывает на тему: ${lastMeaning}.`
      : "";

  return [
    opening,
    firstPart,
    dynamicPart,
    lastPart
  ]
    .filter(Boolean)
    .join(" ");
}

function getConnection(spread, cards) {
  return cards
    .map(
      (card, index) =>
        `${spread.positions[index]} — ${
          card.keywords?.[0] || card.name
        }`
    )
    .join(" → ");
}

function TarotResult({
  reading,
  spread,
  onRestart,
  onSave,
  saveState
}) {
  const finalIndex = spread.finalCard
    ? spread.positions.indexOf(
        spread.finalCard
      )
    : -1;

  const finalCard =
    finalIndex >= 0
      ? reading.cards[finalIndex]
      : null;

  const answer =
    spread.id === "question" && finalCard
      ? getYesNo(finalCard)
      : null;

  return (
    <section
      className="tarot-result"
      aria-live="polite"
    >
      <div className="tarot-result__heading">
        <span className="eyebrow">
          ВАШ РАСКЛАД
        </span>

        <h2>{spread.title}</h2>

        {reading.question && (
          <p>«{reading.question}»</p>
        )}
      </div>

      {answer && (
        <div
          className={`tarot-yesno tarot-yesno--${answer.tone}`}
          aria-label={`Ответ: ${answer.label}`}
        >
          <span className="eyebrow">
            ОТВЕТ
          </span>

          <strong>{answer.label}</strong>

          <p>{answer.note}</p>
        </div>
      )}

      <div
        className={`tarot-result__cards tarot-result__cards--${reading.cards.length}`}
      >
        {reading.cards.map((card, index) => {
          const position =
            spread.positions[index];

          const positionLabel =
            getPositionLabel(position);

          return (
            <article
              className="tarot-result-card"
              key={`${card.id}-${index}`}
            >
              <div className="tarot-result-card__position">
                {positionLabel}
              </div>

              <div className="tarot-result-card__art">
                <TarotCardArt card={card} />
              </div>

              <h3>{card.name}</h3>

              <span className="tarot-result-card__direction">
                {card.reversed
                  ? "Перевёрнутая"
                  : "Прямая"}
              </span>
            </article>
          );
        })}
      </div>

      <div className="tarot-result__readings">
        <div className="tarot-result__section-heading">
          <span className="eyebrow">
            ТРАКТОВКА
          </span>

          <h3>
            Что показывает расклад
          </h3>
        </div>

        {reading.cards.map((card, index) => {
          const position =
            spread.positions[index];

          const positionLabel =
            getPositionLabel(position);

          const meaning =
            getContextualMeaning(
              card,
              position,
              reading.question
            );

          return (
            <article
              className="tarot-reading"
              key={`reading-${card.id}-${index}`}
            >
              <div className="tarot-reading__top">
                <div>
                  <span className="tarot-reading__number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <h4>
                    {positionLabel}
                  </h4>
                </div>

                <span className="tarot-reading__direction">
                  {card.reversed
                    ? "Перевёрнутая"
                    : "Прямая"}
                </span>
              </div>

              <h3>{card.name}</h3>

              <p className="tarot-reading__intro">
                {getPositionIntro(position)}
              </p>

              <div className="tarot-keywords">
                {(card.keywords || [])
                  .slice(0, 3)
                  .map((keyword) => (
                    <span key={keyword}>
                      {keyword}
                    </span>
                  ))}
              </div>

              <p className="tarot-reading__answer">
                {meaning}
              </p>
            </article>
          );
        })}
      </div>

      {reading.cards.length > 1 && (
        <div className="tarot-connection">
          <span className="eyebrow">
            КАК ЭТО СВЯЗАНО
          </span>

          <p>
            {getConnection(
              spread,
              reading.cards
            )}
          </p>
        </div>
      )}

      <div className="tarot-summary">
        <span className="eyebrow">
          КРАТКИЙ ИТОГ
        </span>

        <p>
          {answer
            ? `${answer.label}. ${answer.note}`
            : getSmartSummary(
                reading,
                spread
              )}
        </p>
      </div>

      <div className="tarot-how-to-read">
        <span className="eyebrow">
          ВАЖНО
        </span>

        <p>
          Перевёрнутая карта не означает
          автоматически «плохо». Она может
          показывать блок, задержку,
          внутренний конфликт или другое
          проявление энергии карты.
          Таро даёт символический ориентир,
          а не гарантированный прогноз.
        </p>
      </div>

      <div className="tarot-result__save">
        <button
          type="button"
          className="app-button app-button--primary"
          onClick={onSave}
          disabled={
            saveState === "saving" ||
            saveState === "saved"
          }
        >
          {saveState === "saving"
            ? "Сохраняем…"
            : saveState === "saved"
              ? "✓ Расклад сохранён"
              : "Сохранить расклад"}
        </button>

        {saveState === "auth" && (
          <p className="form-error">
            Войдите в аккаунт, чтобы
            сохранить расклад в профиле.
          </p>
        )}

        {saveState === "error" && (
          <p className="form-error">
            Не удалось сохранить расклад.
            Попробуйте ещё раз.
          </p>
        )}
      </div>

      <button
        type="button"
        className="app-button app-button--secondary tarot-result__restart"
        onClick={onRestart}
      >
        ← Новый расклад
      </button>
    </section>
  );
}

export default TarotResult;