import { useMemo, useRef, useState } from "react";
import { drawCards } from "../data/tarot/deck";
import { getSpread } from "../data/tarot/spreads";
import AppButton from "../components/AppButton";
import TarotCard from "../components/tarot/TarotCard";
import TarotResult from "../components/tarot/TarotResult";
import TarotSpreadSelector from "../components/tarot/TarotSpreadSelector";
import { getSession, saveCloudResult } from "../utils/cloud";

function TarotPage({ savedResult = null }) {
  const savedReading = savedResult?.result_data?.reading;

  const [spreadId, setSpreadId] = useState(
    savedResult?.source_data?.spreadId || "question"
  );

  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState(savedReading || null);

  const [currentPosition, setCurrentPosition] = useState(
    savedReading?.cards?.length || 0
  );

  const [choiceCards, setChoiceCards] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealingChoice, setRevealingChoice] = useState(false);

  const [saveState, setSaveState] = useState("idle");

  const questionRef = useRef(null);

  const spread = useMemo(
    () => getSpread(spreadId),
    [spreadId]
  );

  const drawChoiceCards = (usedCards = []) => {
    const usedIds = new Set(
      usedCards.map((card) => card.id)
    );

    const candidates = [];
    let attempts = 0;

    while (candidates.length < 3 && attempts < 20) {
      attempts += 1;

      const drawn = drawCards(3);

      for (const card of drawn) {
        if (
          candidates.length < 3 &&
          !usedIds.has(card.id) &&
          !candidates.some(
            (item) => item.id === card.id
          )
        ) {
          candidates.push(card);
        }
      }
    }

    return candidates;
  };

  const startReading = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    const firstCards = drawChoiceCards([]);

    setReading({
      question: trimmedQuestion,
      cards: []
    });

    setCurrentPosition(0);
    setChoiceCards(firstCards);
    setSelectedChoice(null);
    setRevealingChoice(false);
    setSaveState("idle");
  };

  const handleChoice = (index) => {
    if (
      selectedChoice !== null ||
      revealingChoice
    ) {
      return;
    }

    const selectedCard = choiceCards[index];

    if (!selectedCard) return;

    setSelectedChoice(index);
    setRevealingChoice(true);

    setTimeout(() => {
      setReading((current) => {
        if (!current) return current;

        return {
          ...current,
          cards: [
            ...current.cards,
            selectedCard
          ]
        };
      });

      const nextPosition = currentPosition + 1;

      setRevealingChoice(false);
      setSelectedChoice(null);

      if (
        nextPosition >= spread.positions.length
      ) {
        setChoiceCards([]);
        setCurrentPosition(nextPosition);
        return;
      }

      setCurrentPosition(nextPosition);

      setTimeout(() => {
        setReading((current) => {
          const currentCards =
            current?.cards || [];

          setChoiceCards(
            drawChoiceCards(currentCards)
          );

          return current;
        });
      }, 50);
    }, 900);
  };

  const restart = () => {
    setReading(null);
    setCurrentPosition(0);
    setChoiceCards([]);
    setSelectedChoice(null);
    setRevealingChoice(false);
    setSaveState("idle");
  };

  const saveReading = async () => {
    if (
      saveState === "saving" ||
      saveState === "saved"
    ) {
      return;
    }

    if (!getSession()?.access_token) {
      setSaveState("auth");
      return;
    }

    setSaveState("saving");

    try {
      await saveCloudResult({
        resultType: "tarot",

        title: `Расклад: ${spread.title}`,

        sourceData: {
          spreadId: spread.id,
          question: reading.question,
          createdAt: new Date().toISOString()
        },

        resultData: {
          reading: {
            question: reading.question,
            cards: reading.cards
          },

          spread: {
            id: spread.id,
            title: spread.title,
            positions: spread.positions
          }
        }
      });

      setSaveState("saved");

      window.dispatchEvent(
        new Event("astroguide:result-saved")
      );
    } catch (error) {
      console.error(
        "Не удалось сохранить Tarot:",
        error
      );

      setSaveState("error");
    }
  };

  const insertQuestionBreak = () => {
    const textarea = questionRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const nextQuestion =
      question.slice(0, start) +
      "\n" +
      question.slice(end);

    setQuestion(nextQuestion);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + 1,
        start + 1
      );
    });
  };

  const handleQuestionKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      startReading();
    }
  };

  const handleQuestionFocus = () => {
    const textarea = questionRef.current;

    if (!textarea) return;

    const scrollToKeyboardSafePosition = () => {
      const viewport = window.visualViewport;

      if (!viewport) {
        textarea.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        return;
      }

      const rect =
        textarea.getBoundingClientRect();

      const keyboardTop = viewport.height;
      const safeBottom = keyboardTop - 24;

      if (rect.bottom > safeBottom) {
        window.scrollBy({
          top: rect.bottom - safeBottom,
          behavior: "smooth"
        });
      }
    };

    setTimeout(
      scrollToKeyboardSafePosition,
      50
    );

    setTimeout(
      scrollToKeyboardSafePosition,
      200
    );

    setTimeout(
      scrollToKeyboardSafePosition,
      400
    );

    setTimeout(
      scrollToKeyboardSafePosition,
      700
    );
  };

  if (
    reading &&
    reading.cards.length ===
      spread.positions.length
  ) {
    return (
      <TarotResult
        reading={reading}
        spread={spread}
        onRestart={restart}
        onSave={saveReading}
        saveState={saveState}
      />
    );
  }

  return (
    <section className="screen screen--tarot">
      <div className="screen-top">
        <div className="screen-top__title">
          <span className="eyebrow">
            ASTROGUIDE
          </span>

          <h1>Таро</h1>
        </div>
      </div>

      {!reading ? (
        <>
          <div className="tarot-intro">
            <div
              className="tarot-intro__mark"
              aria-hidden="true"
            >
              ✦
            </div>

            <div>
              <h2>
                Один вопрос — один расклад
              </h2>

              <p>
                Сформулируй один конкретный
                вопрос. Карты дадут
                символический ориентир — без
                обещаний точного будущего и без
                «магических» гарантий.
              </p>
            </div>
          </div>

          <div className="tarot-section-heading">
            <span className="eyebrow">
              ШАГ 1
            </span>

            <h2>
              Выберите расклад
            </h2>
          </div>

          <TarotSpreadSelector
            value={spreadId}
            onChange={setSpreadId}
          />

          <div className="tarot-section-heading tarot-section-heading--question">
            <span className="eyebrow">
              ШАГ 2
            </span>

            <h2>
              Сформулируйте вопрос
            </h2>
          </div>

          <label className="tarot-question">
            <span className="sr-only">
              Ваш вопрос
            </span>

            <textarea
              ref={questionRef}
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={
                handleQuestionKeyDown
              }
              onFocus={
                handleQuestionFocus
              }
              placeholder='Например: «Напишет ли он мне?»'
              rows="3"
              maxLength="240"
            />

            <div className="tarot-question__tools">
              <small>
                {question.length}/240
              </small>

              <button
                type="button"
                className="tarot-question__break"
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={
                  insertQuestionBreak
                }
              >
                ↵ Перенос
              </button>
            </div>
          </label>

          <div
            className="tarot-question-examples"
            aria-label="Примеры вопросов"
          >
            <span>
              Примеры хороших вопросов:
            </span>

            {[
              "Возобновятся ли наши отношения в ближайшие 3 месяца?",
              "Что поможет мне получить эту работу?",
              "На что обратить внимание в ближайший месяц?"
            ].map((example) => (
              <button
                type="button"
                key={example}
                onClick={() =>
                  setQuestion(example)
                }
              >
                {example}
              </button>
            ))}
          </div>

          <p className="tarot-question-help">
            Чем конкретнее вопрос, тем полезнее
            получится ответ.
          </p>

          <AppButton
            size="lg"
            onClick={startReading}
          >
            Начать расклад
          </AppButton>
        </>
      ) : (
        <div className="tarot-draw">
          <div className="tarot-draw__heading">
            <span className="eyebrow">
              ШАГ 3
            </span>

            <h2>
              {spread.positions[
                currentPosition
              ]?.title ||
                "Выберите карту"}
            </h2>

            <p>
              Выберите одну из трёх карт
            </p>

            <small>
              Позиция{" "}
              {Math.min(
                currentPosition + 1,
                spread.positions.length
              )}{" "}
              из {spread.positions.length}
            </small>
          </div>

          <div className="tarot-choice-grid">
            {choiceCards.map(
              (card, index) => (
                <div
                  className={`tarot-choice-slot ${
                    selectedChoice === index
                      ? "tarot-choice-slot--selected"
                      : ""
                  }`}
                  key={`${card.id}-${index}`}
                >
                  <TarotCard
                    card={card}
                    position={
                      spread.positions[
                        currentPosition
                      ]
                    }
                    revealed={
                      selectedChoice ===
                        index &&
                      revealingChoice
                    }
                    disabled={
                      selectedChoice !==
                        null ||
                      revealingChoice
                    }
                    onReveal={() =>
                      handleChoice(index)
                    }
                  />
                </div>
              )
            )}
          </div>

          <p className="tarot-draw__hint">
            Доверьтесь интуиции и выберите
            одну карту.
          </p>
        </div>
      )}
    </section>
  );
}

export default TarotPage;