import { useEffect, useState } from "react";
import NatalWheel from "../components/NatalWheel";
import BeginnerSummary from "../components/BeginnerSummary";
import PersonalPortrait from "../components/PersonalPortrait";
import AppButton from "../components/AppButton";
import PremiumSection from "../components/PremiumSection";
import { getPlanetLongitudes } from "../utils/astronomy";
import { getHouseLongitudes, getPlanetHouse } from "../utils/houses";
import { longitudeToSign } from "../utils/longitudeToSign";
import { calculateAspects } from "../utils/aspects";
import { sunInterpretations } from "../data/interpretations/sun";
import { moonInterpretations } from "../data/interpretations/moon";
import { ascendantInterpretations } from "../data/interpretations/ascendant";

// Экран результата: переиспользует расчётный стек Swiss Ephemeris
// и компоненты NatalWheel, BeginnerSummary, PersonalPortrait.
function ChartResult({ chart, onNavigate, onBack, reportsRequested = false, onReportsRequestHandled }) {
  const [result, setResult] = useState(null);
  const [calculationError, setCalculationError] = useState("");

  useEffect(() => {
    if (!chart) return;
    let cancelled = false;
    setResult(null);
    setCalculationError("");

    const run = async () => {
      try {
        const planets = await getPlanetLongitudes(chart.date, chart.time, chart.timezone);
        const houses = await getHouseLongitudes(
          chart.date,
          chart.time,
          chart.latitude,
          chart.longitude,
          chart.timezone
        );
        if (cancelled) return;

        const planetHouses = {};
        for (const id of Object.keys(planets)) {
          planetHouses[id] = getPlanetHouse(planets[id], houses.houses);
        }

        const planetSigns = Object.fromEntries(
          Object.entries(planets).map(([id, longitude]) => [id, longitudeToSign(longitude)])
        );

        setResult({
          planets,
          planetSigns,
          houseLongitudes: houses.houses,
          ascendantLongitude: houses.ascendant,
          mcLongitude: houses.mc,
          planetHouses,
          aspects: calculateAspects(planets)
        });
      } catch (error) {
        if (!cancelled) {
          setCalculationError(error?.message || String(error));
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (!chart) {
    return (
      <section className="screen screen--result">
        <div className="screen-top">
          <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">←</button>
          <div className="screen-top__title">
            <span className="eyebrow">ASTROGUIDE</span>
            <h1>Натальная карта</h1>
          </div>
        </div>
        <div className="empty-note-card">
          <div className="empty-note-card__icon" aria-hidden="true">🔮</div>
          <h2>Карта ещё не рассчитана</h2>
          <p>Сначала укажите данные рождения — и мы построим вашу натальную карту.</p>
          <AppButton variant="primary" onClick={() => onNavigate("chart-birth")}>
            Создать натальную карту
          </AppButton>
        </div>
      </section>
    );
  }

  if (calculationError) {
    return (
      <section className="screen screen--result">
        <div className="screen-top">
          <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">←</button>
          <div className="screen-top__title">
            <span className="eyebrow">ASTROGUIDE</span>
            <h1>Натальная карта</h1>
          </div>
        </div>
        <div className="calc-card calc-card--error" role="alert">
          <div className="calc-card__icon" aria-hidden="true">⚠️</div>
          <h2>Не удалось рассчитать карту</h2>
          <p>{calculationError}</p>
          <AppButton variant="primary" onClick={() => onNavigate("chart-birth")}>
            Попробовать снова
          </AppButton>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="screen screen--result">
        <div className="screen-top">
          <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">←</button>
          <div className="screen-top__title">
            <span className="eyebrow">ASTROGUIDE</span>
            <h1>Натальная карта</h1>
          </div>
        </div>
        <div className="calc-card">
          <div className="calc-spinner" aria-hidden="true" />
          <strong>Рассчитываем карту</strong>
          <span>Планеты, дома и аспекты по Swiss Ephemeris…</span>
        </div>
      </section>
    );
  }
  const { planets, planetSigns, houseLongitudes, ascendantLongitude, mcLongitude, planetHouses, aspects } = result;

  const zodiac = planetSigns.sun.sign;
  const moon = planetSigns.moon.sign;
  const ascendant = longitudeToSign(ascendantLongitude).sign;
  const mercury = planetSigns.mercury.sign;
  const venus = planetSigns.venus.sign;
  const mars = planetSigns.mars.sign;

  return (
    <section className="screen screen--result">
      <div className="screen-top">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Назад">←</button>
        <div className="screen-top__title">
          <span className="eyebrow">ASTROGUIDE</span>
          <h1>Натальная карта</h1>
        </div>
      </div>

      <div className="result-birth">
        <div className="result-birth__meta">
          <span>{chart.date}</span>
          <span>{chart.time}</span>
          <span>{chart.city}</span>
          <span>Placidus · Swiss Ephemeris</span>
        </div>
        <div className="result-bigthree">
          <div>
            <span>☉ Солнце</span>
            <strong>{zodiac}</strong>
            <small>Личность и воля</small>
          </div>
          <div>
            <span>☽ Луна</span>
            <strong>{moon}</strong>
            <small>Эмоции и внутренний мир</small>
          </div>
          <div className="result-bigthree__accent">
            <span>ASC</span>
            <strong>{ascendant}</strong>
            <small>Первое впечатление</small>
          </div>
        </div>
      </div>

      <section className="result-section result-section--premium-teaser">
        <div className="result-section--premium-teaser__inner">
          <div className="result-section--premium-teaser__copy">
            <span className="eyebrow">PREMIUM</span>
            <h2>Полный персональный разбор</h2>
            <p>
              Характер, отношения, карьера и жизненные периоды —
              единый каталог Premium-разборов вашей натальной карты.
            </p>
            <div className="result-section--premium-teaser__chips">
              <span>Личность</span>
              <span>Отношения</span>
              <span>Карьера</span>
              <span>Жизненные периоды</span>
            </div>
          </div>

          <button
            className="result-section--premium-teaser__button"
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("astroguide:checkout-requested"));
            }}
          >
            <strong>Получить полный разбор</strong>
            <span>300 ₽ · один платёж</span>
            <b>↓</b>
          </button>
        </div>
      </section>

      <NatalWheel
        planetLongitudes={planets}
        ascendantLongitude={ascendantLongitude}
        mcLongitude={mcLongitude}
        houseLongitudes={houseLongitudes}
        planetHouses={planetHouses}
      />

      <BeginnerSummary
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
      />

      <PersonalPortrait
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
        planetLongitudes={planets}
        sunText={sunInterpretations[zodiac] || {}}
        moonText={moonInterpretations[moon] || {}}
        ascendantText={ascendantInterpretations[ascendant] || {}}
        aspects={aspects}
      />

      <section className="result-section">
        <div className="section-heading">
          <span className="eyebrow">ВЗАИМОДЕЙСТВИЕ ПЛАНЕТ</span>
          <h2>Основные аспекты</h2>
          <p>Угловые связи между планетами — как разные части карты работают вместе.</p>
        </div>
        {aspects.length ? (
          <div className="aspect-list">
            {aspects.map((item) => (
              <div className="aspect-row" key={item.id}>
                <span className="aspect-row__glyphs" aria-hidden="true">
                  {item.aSymbol} {item.symbol} {item.bSymbol}
                </span>
                <div className="aspect-row__body">
                  <strong>{item.aName} — {item.bName}</strong>
                  <span>{item.name} · орб {item.orb.toFixed(1)}° · {item.meaning}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-note">Основных аспектов в выбранных орбисах не найдено.</div>
        )}
      </section>

        <div id="premium">
          <PremiumSection
          zodiac={zodiac}
          moon={moon}
          ascendant={ascendant}
          venus={venus}
          mars={mars}
          planetHouses={planetHouses}
          planetLongitudes={planets}
          ascendantLongitude={ascendantLongitude}
          mcLongitude={mcLongitude}
          chart={chart}
          aspects={aspects}
          reportsRequested={reportsRequested}
          onReportsRequestHandled={onReportsRequestHandled}
          />

        </div>

        <div className="result-actions">
          <AppButton variant="ghost" onClick={() => onNavigate("chart-birth")}>
            Новая карта
          </AppButton>
        </div>

    </section>
  );
}

export default ChartResult;