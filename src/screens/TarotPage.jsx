import { useMemo, useState } from "react";
import { drawCards } from "../data/tarot/deck";
import { getSpread } from "../data/tarot/spreads";
import AppButton from "../components/AppButton";
import TarotCard from "../components/tarot/TarotCard";
import TarotResult from "../components/tarot/TarotResult";
import TarotSpreadSelector from "../components/tarot/TarotSpreadSelector";

function TarotPage() {
  const [spreadId, setSpreadId] = useState("single");
  const [question, setQuestion] = useState("");
  const [reading, setReading] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const spread = useMemo(() => getSpread(spreadId), [spreadId]);

  const startReading = () => {
    setReading({ question: question.trim(), cards: drawCards(spread.positions.length) });
    setRevealedCount(0);
  };

  const restart = () => {
    setReading(null);
    setRevealedCount(0);
  };

  const revealCard = (index) => {
    if (index !== revealedCount) return;
    setRevealedCount((current) => current + 1);
  };

  if (reading && revealedCount === reading.cards.length) {
    return <TarotResult reading={reading} spread={spread} onRestart={restart} />;
  }

  return (
    <section className="screen screen--tarot">
      <div className="screen-top">
        <div className="screen-top__title">
          <span className="eyebrow">ASTROGUIDE</span>
          <h1>Таро</h1>
        </div>
      </div>

      {!reading ? (
        <>
          <div className="tarot-intro">
            <div className="tarot-intro__mark" aria-hidden="true">✦</div>
            <div>
              <h2>Вопрос уже знает путь</h2>
              <p>Таро — это символический язык для размышления. Расклад не обещает точное будущее: он помогает увидеть вопрос под другим углом и выбрать следующий шаг самостоятельно.</p>
            </div>
          </div>

          <div className="tarot-section-heading">
            <span className="eyebrow">ШАГ 1</span>
            <h2>Выберите расклад</h2>
          </div>
          <TarotSpreadSelector value={spreadId} onChange={setSpreadId} />

          <div className="tarot-section-heading tarot-section-heading--question">
            <span className="eyebrow">ШАГ 2</span>
            <h2>Сформулируйте вопрос</h2>
          </div>
          <label className="tarot-question">
            <span className="sr-only">Ваш вопрос</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Что мне важно понять сейчас?"
              rows="3"
              maxLength="240"
            />
            <small>{question.length}/240</small>
          </label>
          <div className="tarot-question-examples" aria-label="Примеры вопросов">
            <span>Примеры хороших вопросов:</span>
            {[
              "Возобновятся ли наши отношения в ближайшие 3 месяца?",
              "Что поможет мне получить эту работу?",
              "На что обратить внимание в ближайший месяц?"
            ].map((example) => (
              <button type="button" key={example} onClick={() => setQuestion(example)}>{example}</button>
            ))}
          </div>
          <p className="tarot-question-help">Чем конкретнее вопрос и срок, тем точнее символический ориентир расклада.</p>
          <AppButton size="lg" onClick={startReading}>Начать расклад</AppButton>
        </>
      ) : (
        <div className="tarot-draw">
          <div className="tarot-draw__heading">
            <span className="eyebrow">ШАГ 3</span>
            <h2>Откройте карты по одной</h2>
            <p>{revealedCount === 0 ? "Начните с первой позиции." : `Открыто ${revealedCount} из ${reading.cards.length}`}</p>
          </div>
          <div className={`tarot-draw__deck tarot-draw__deck--${reading.cards.length}`}>
            {reading.cards.map((card, index) => (
              <div className="tarot-draw__slot" key={card.id}>
                <TarotCard
                  card={card}
                  position={spread.positions[index]}
                  revealed={index < revealedCount}
                  disabled={index !== revealedCount}
                  onReveal={() => revealCard(index)}
                />
              </div>
            ))}
          </div>
          <p className="tarot-draw__hint">Каждая карта вытянута случайно и может быть прямой или перевёрнутой.</p>
        </div>
      )}
    </section>
  );
}

export default TarotPage;
