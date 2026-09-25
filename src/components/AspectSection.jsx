import { longitudeToSign } from "../utils/longitudeToSign";

function AspectSection({ aspects = [], planetLongitudes = {} }) {
  return (
    <section className="aspect-section">
      <div className="section-heading">
        <span className="eyebrow">ВЗАИМОДЕЙСТВИЕ ПЛАНЕТ</span>
        <h2>Аспекты — как разные части карты работают вместе</h2>
        <p>Аспект — это угловая связь между двумя планетами. В астрологической традиции гармоничные аспекты описывают более лёгкое взаимодействие, а напряжённые — точки, где требуется больше осознанности и развития.</p>
      </div>
      {aspects.length ? (
        <div className="aspect-grid">
          {aspects.map((item) => (
            <article className={`aspect-card aspect-card--${item.tone}`} key={item.id}>
              <div className="aspect-card__top"><span>{item.aSymbol} {item.aName}</span><b>{item.symbol}</b><span>{item.bSymbol} {item.bName}</span></div>
              <div className="aspect-card__name">{item.name} <small>орб {item.orb.toFixed(1)}°</small></div>
              <p>{item.meaning}. В вашей карте эта связь объединяет темы {item.aName.toLowerCase()} и {item.bName.toLowerCase()}.</p>
              <div className="aspect-card__positions"><span>{longitudeToSign(planetLongitudes[item.a]).formatted}</span><span>{longitudeToSign(planetLongitudes[item.b]).formatted}</span></div>
            </article>
          ))}
        </div>
      ) : <div className="empty-block">Основных аспектов в выбранных орбисах не найдено.</div>}
    </section>
  );
}
export default AspectSection;
