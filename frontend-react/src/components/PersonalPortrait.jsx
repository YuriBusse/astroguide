import { longitudeToSign } from "../utils/longitudeToSign";
import { zodiacDescriptions } from "../data/zodiacDescriptions";

const SIGN_SHORT = (sign = "") => sign.replace(/^\S+\s+/, "");

function PersonalPortrait({
  zodiac,
  moon,
  ascendant,
  mercury,
  venus,
  mars,
  planetLongitudes = {},
  sunText,
  moonText,
  ascendantText,
  aspects = []
}) {
  const sun = zodiacDescriptions[zodiac];
  const moonData = zodiacDescriptions[moon];
  const sunElement = sun?.element || "";
  const moonElement = moonData?.element || "";

  const intro = [
    sunText?.main || `Солнце в ${zodiac} задаёт одну из центральных тем карты.`,
    moonText?.main || `Луна в ${moon} описывает эмоциональную сторону.`,
    ascendantText?.main || `ASC в ${ascendant} влияет на внешнюю подачу.`
  ].join(" ");

  const contrast = sunElement && moonElement && sunElement !== moonElement
    ? ` Внутренние потребности и способ проявляться могут ощущаться по-разному: Солнце относится к ${sunElement.toLowerCase()}, а Луна — к ${moonElement.toLowerCase()}.`
    : "";

  const items = [
    ["☉", "Солнце", zodiac, "ядро личности"],
    ["☽", "Луна", moon, "эмоциональный фон"],
    ["↑", "ASC", ascendant, "первое впечатление"],
    ["☿", "Меркурий", mercury, "мышление и речь"],
    ["♀", "Венера", venus, "отношения и ценности"],
    ["♂", "Марс", mars, "действия и энергия"]
  ];

  return (
    <section className="personal-portrait personal-portrait--short">
      <div className="personal-portrait__header">
        <div>
          <span className="eyebrow">КРАТКИЙ ПОРТРЕТ</span>
          <h2>Что можно увидеть в вашей карте</h2>
          <p>Небольшой первый вывод. Полный анализ показывает, как эти показатели работают вместе.</p>
        </div>
        <div className="portrait-badge">Бесплатно</div>
      </div>

      <div className="portrait-lead">
        <div className="portrait-lead__mark">✦</div>
        <div>
          <strong>Если коротко</strong>
          <p>{intro}{contrast}</p>
        </div>
      </div>

      <div className="portrait-bottom portrait-bottom--six">
        {items.map(([icon, label, value, meaning]) => (
          <div className="portrait-mini" key={label}>
            <span className="portrait-mini__label">{icon} {label}</span>
            <strong>{SIGN_SHORT(value)}</strong>
            <p>{meaning}</p>
          </div>
        ))}
      </div>

      {aspects[0] && (
        <div className="portrait-aspect-teaser">
          <span>✦ КЛЮЧЕВОЙ АСПЕКТ</span>
          <strong>{aspects[0].aName} {aspects[0].symbol} {aspects[0].bName}</strong>
          <p>Аспекты помогают понять, как разные части карты взаимодействуют. Их подробный синтез входит в Premium.</p>
        </div>
      )}
    </section>
  );
}

export default PersonalPortrait;
