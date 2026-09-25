import { longitudeToSign } from "../utils/longitudeToSign";
import { buildPlanetProfile, PLANETS } from "../utils/planetProfile";

function PlanetDetails({ planetLongitudes, planetHouses }) {
  const visible = Object.entries(PLANETS)
    .filter(([id]) => Number.isFinite(planetLongitudes[id]))
    .map(([id, planet]) => ({ id, ...planet }));
  return (
    <section className="planet-details-section">
      <div className="section-heading">
        <span className="eyebrow">ВСЕ ПЛАНЕТЫ И ТОЧКИ</span>
        <h2>Что означает каждая позиция</h2>
        <p>Мы не прячем Нептун, Уран и Плутон: базовое положение каждой планеты доступно бесплатно. Для внешних планет особенно важно смотреть на дом и аспекты к личным планетам.</p>
      </div>
      <div className="planet-details-grid">
        {visible.map((planet) => {
          const info = longitudeToSign(planetLongitudes[planet.id]);
          const house = planetHouses[planet.id];
          const profile = buildPlanetProfile(planet.id, info.sign, house);
          return (
            <article className="planet-detail-card" key={planet.id}>
              <div className="planet-detail-card__head"><span className="planet-detail-card__symbol">{planet.symbol}</span><div><span className="planet-detail-card__eyebrow">{planet.name}</span><h3>{info.sign}</h3></div><div className="planet-detail-card__meta"><b>{info.formatted}</b><span>{house ? `${house}-й дом` : "—"}</span></div></div>
              <p className="planet-detail-card__main">{profile.main}</p>
              <div className="planet-detail-card__grid"><div><strong>Сильная сторона</strong><p>{profile.strengths}</p></div><div><strong>На что обратить внимание</strong><p>{profile.growth}</p></div></div>
              <div className="planet-detail-card__practical"><b>{profile.question}</b><p>{profile.practical}</p></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export default PlanetDetails;
