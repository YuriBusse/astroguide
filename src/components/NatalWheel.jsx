import { useMemo, useState } from "react";
import { longitudeToSign } from "../utils/longitudeToSign";

const ZODIAC = [
  { symbol: "♈", name: "Овен" }, { symbol: "♉", name: "Телец" },
  { symbol: "♊", name: "Близнецы" }, { symbol: "♋", name: "Рак" },
  { symbol: "♌", name: "Лев" }, { symbol: "♍", name: "Дева" },
  { symbol: "♎", name: "Весы" }, { symbol: "♏", name: "Скорпион" },
  { symbol: "♐", name: "Стрелец" }, { symbol: "♑", name: "Козерог" },
  { symbol: "♒", name: "Водолей" }, { symbol: "♓", name: "Рыбы" }
];

const PLANETS = [
  { id: "sun", symbol: "☉", name: "Солнце", tone: "sun" },
  { id: "moon", symbol: "☽", name: "Луна", tone: "moon" },
  { id: "mercury", symbol: "☿", name: "Меркурий", tone: "mercury" },
  { id: "venus", symbol: "♀", name: "Венера", tone: "venus" },
  { id: "mars", symbol: "♂", name: "Марс", tone: "mars" },
  { id: "jupiter", symbol: "♃", name: "Юпитер", tone: "jupiter" },
  { id: "saturn", symbol: "♄", name: "Сатурн", tone: "saturn" },
  { id: "uranus", symbol: "♅", name: "Уран", tone: "uranus" },
  { id: "neptune", symbol: "♆", name: "Нептун", tone: "neptune" },
  { id: "pluto", symbol: "♇", name: "Плутон", tone: "pluto" },
  { id: "northNode", symbol: "☊", name: "Северный узел", tone: "node" }
];

const ASPECTS = [
  { angle: 0, orb: 8, label: "Соединение", className: "conjunction" },
  { angle: 60, orb: 5, label: "Секстиль", className: "sextile" },
  { angle: 90, orb: 6, label: "Квадрат", className: "square" },
  { angle: 120, orb: 6, label: "Тригон", className: "trine" },
  { angle: 180, orb: 8, label: "Оппозиция", className: "opposition" }
];

const normalize = (value) => ((value % 360) + 360) % 360;
const angularDistance = (a, b) => {
  const diff = Math.abs(normalize(a) - normalize(b));
  return Math.min(diff, 360 - diff);
};

function pointFor(longitude, ascendantLongitude, radius, center = 200) {
  const visual = normalize(180 + (longitude - ascendantLongitude));
  const radians = (visual * Math.PI) / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius
  };
}

function formatLongitude(longitude) {
  return longitudeToSign(longitude).formatted;
}

function findAspect(a, b) {
  const distance = angularDistance(a, b);
  return ASPECTS.find((aspect) => Math.abs(distance - aspect.angle) <= aspect.orb);
}

function assignPlanetLanes(items) {
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const placed = [];
  const minSeparation = 6.5;
  const maxLanes = 5;

  for (const item of sorted) {
    let lane = 0;
    while (lane < maxLanes) {
      const conflict = placed.some(
        (existing) => existing.lane === lane && angularDistance(existing.longitude, item.longitude) < minSeparation
      );
      if (!conflict) break;
      lane += 1;
    }
    placed.push({ ...item, lane: Math.min(lane, maxLanes - 1) });
  }

  return items.map((item) => placed.find((entry) => entry.id === item.id) || { ...item, lane: 0 });
}

function NatalWheel({ planetLongitudes = {}, ascendantLongitude, houseLongitudes = {}, planetHouses = {}, mcLongitude }) {
  const [activePlanet, setActivePlanet] = useState(null);

  const ready = Number.isFinite(ascendantLongitude) && Object.keys(houseLongitudes).length === 12;

  const planets = useMemo(() => {
    const base = PLANETS
      .filter((planet) => Number.isFinite(planetLongitudes[planet.id]))
      .map((planet) => ({ ...planet, longitude: planetLongitudes[planet.id] }));

    if (!ready) return base.map((planet) => ({ ...planet, lane: 0, position: null, anchor: null }));

    const radii = [130, 112, 94, 76, 60];
    return assignPlanetLanes(base).map((planet) => ({
      ...planet,
      radius: radii[planet.lane],
      anchor: pointFor(planet.longitude, ascendantLongitude, 143),
      position: pointFor(planet.longitude, ascendantLongitude, radii[planet.lane])
    }));
  }, [planetLongitudes, ascendantLongitude, ready]);

  const aspects = useMemo(() => {
    const result = [];
    const available = planets.filter((planet) => planet.anchor);
    for (let i = 0; i < available.length; i += 1) {
      for (let j = i + 1; j < available.length; j += 1) {
        const aspect = findAspect(available[i].longitude, available[j].longitude);
        if (aspect) {
          result.push({ id: `${available[i].id}-${available[j].id}-${aspect.angle}`, a: available[i], b: available[j], aspect });
        }
      }
    }
    return result;
  }, [planets]);

  if (!ready) {
    return (
      <section className="natal-card natal-card--loading">
        <div className="natal-card__heading">
          <div><span className="eyebrow">ASTROGUIDE</span><h2>Натальная карта</h2></div>
          <span className="calculation-badge">Расчёт…</span>
        </div>
        <div className="professional-wheel professional-wheel--loading" />
      </section>
    );
  }

  const houseNumbers = Array.from({ length: 12 }, (_, index) => index + 1);
  const mc = Number.isFinite(mcLongitude) ? mcLongitude : normalize(ascendantLongitude + 90);
  const angleLabels = [
    { name: "ASC", longitude: ascendantLongitude },
    { name: "DSC", longitude: normalize(ascendantLongitude + 180) },
    { name: "MC", longitude: mc },
    { name: "IC", longitude: normalize(mc + 180) }
  ];

  return (
    <section className="natal-card">
      <div className="natal-card__heading">
        <div>
          <span className="eyebrow">ASTROGUIDE · PLACIDUS</span>
          <h2>Натальная карта</h2>
          <p>Точные положения планет, куспиды домов и основные аспекты</p>
        </div>
        <div className="chart-legend">
          <span><i className="legend-dot legend-dot--planet" /> Планеты</span>
          <span><i className="legend-dot legend-dot--aspect" /> Аспекты</span>
        </div>
      </div>

      <div className="professional-wheel-wrap">
        <svg className="professional-wheel" viewBox="0 0 400 400" role="img" aria-label="Натальная карта">
          <defs>
            <radialGradient id="wheelBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#282341" />
              <stop offset="70%" stopColor="#17152a" />
              <stop offset="100%" stopColor="#0f0d1d" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="190" className="wheel-bg" fill="url(#wheelBg)" />
          <circle cx="200" cy="200" r="187" className="wheel-outline" />
          <circle cx="200" cy="200" r="166" className="wheel-ring wheel-ring--zodiac" />
          <circle cx="200" cy="200" r="143" className="wheel-ring" />
          <circle cx="200" cy="200" r="88" className="wheel-ring wheel-ring--inner" />

          {ZODIAC.map((sign, index) => {
            const longitude = index * 30;
            const label = pointFor(longitude + 15, ascendantLongitude, 177);
            const next = pointFor(longitude + 30, ascendantLongitude, 166);
            return (
              <g key={sign.name}>
                <line x1="200" y1="200" x2={next.x} y2={next.y} className="zodiac-divider" />
                <text x={label.x} y={label.y + 7} className="zodiac-glyph" textAnchor="middle">{sign.symbol}</text>
                <title>{sign.name}</title>
              </g>
            );
          })}

          {houseNumbers.map((house) => {
            const longitude = houseLongitudes[house];
            const point = pointFor(longitude, ascendantLongitude, 143);
            const next = houseLongitudes[house === 12 ? 1 : house + 1];
            let delta = normalize(next - longitude);
            if (delta === 0) delta = 30;
            const numberPoint = pointFor(longitude + delta / 2, ascendantLongitude, 112);
            const isAngle = [1, 4, 7, 10].includes(house);
            return (
              <g key={`house-${house}`}>
                <line x1="200" y1="200" x2={point.x} y2={point.y} className={isAngle ? "house-cusp house-cusp--angle" : "house-cusp"} />
                <text x={numberPoint.x} y={numberPoint.y + 4} className={isAngle ? "house-number house-number--angle" : "house-number"} textAnchor="middle">{house}</text>
              </g>
            );
          })}

          {angleLabels.map((label) => {
            const point = pointFor(label.longitude, ascendantLongitude, 177);
            return (
              <g key={label.name}>
                <circle cx={point.x} cy={point.y} r="10" className="angle-marker" />
                <text x={point.x} y={point.y + 3} className="angle-label" textAnchor="middle">{label.name}</text>
              </g>
            );
          })}

          {aspects.map(({ id, a, b, aspect }) => (
            <line key={id} x1={a.anchor.x} y1={a.anchor.y} x2={b.anchor.x} y2={b.anchor.y} className={`aspect-stroke ${aspect.className}`} />
          ))}

          {planets.map((planet) => (
            <g key={planet.id} className="planet-node" onMouseEnter={() => setActivePlanet(planet.id)} onMouseLeave={() => setActivePlanet(null)}>
              {planet.lane > 0 && (
                <line x1={planet.anchor.x} y1={planet.anchor.y} x2={planet.position.x} y2={planet.position.y} className="planet-guide" />
              )}
              <circle cx={planet.position.x} cy={planet.position.y} r="13" className={`planet-node__halo planet-node__halo--${planet.tone}`} />
              <circle cx={planet.position.x} cy={planet.position.y} r="9" className="planet-node__circle" />
              <text x={planet.position.x} y={planet.position.y + 5} className="planet-node__glyph" textAnchor="middle">{planet.symbol}</text>
            </g>
          ))}

          <g>
            <circle cx="200" cy="200" r="28" className="wheel-center" />
            <text x="200" y="196" className="wheel-center__star" textAnchor="middle">✦</text>
            <text x="200" y="212" className="wheel-center__label" textAnchor="middle">ASTROGUIDE</text>
          </g>
        </svg>

        {activePlanet && (() => {
          const planet = planets.find((item) => item.id === activePlanet);
          if (!planet) return null;
          const sign = longitudeToSign(planet.longitude);
          const house = planetHouses[planet.id];
          return (
            <div className="planet-detail">
              <strong>{planet.symbol} {planet.name}</strong>
              <span>{sign.sign} · {sign.formatted}</span>
              <span>{house ? `${house}-й дом` : "дом рассчитывается"}</span>
            </div>
          );
        })()}
      </div>

      <div className="chart-stats">
        <div><span>ASC</span><strong>{longitudeToSign(ascendantLongitude).sign}</strong><small>{formatLongitude(ascendantLongitude)}</small></div>
        <div><span>MC</span><strong>{longitudeToSign(mc).sign}</strong><small>{formatLongitude(mc)}</small></div>
        <div><span>АСПЕКТЫ</span><strong>{aspects.length}</strong><small>основных связей</small></div>
      </div>

      <div className="planet-table">
        <div className="planet-table__head">
          <span>Планета</span><span>Знак</span><span>Градус</span><span>Дом</span>
        </div>
        {planets.map((planet) => {
          const sign = longitudeToSign(planet.longitude);
          return (
            <div className="planet-table__row" key={planet.id}>
              <span className={`planet-table__name planet-table__name--${planet.tone}`}><b>{planet.symbol}</b>{planet.name}</span>
              <span>{sign.sign}</span>
              <span>{sign.formatted}</span>
              <span>{planetHouses[planet.id] ? `${planetHouses[planet.id]} дом` : "—"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default NatalWheel;
