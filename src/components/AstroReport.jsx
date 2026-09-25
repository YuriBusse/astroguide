import InterpretationCard from "./InterpretationCard";
import ProfileHeader from "./ProfileHeader";
import NatalWheel from "./NatalWheel";
import BeginnerSummary from "./BeginnerSummary";
import PersonalPortrait from "./PersonalPortrait";
import { calculateAspects } from "../utils/aspects";
import PremiumSection from "./PremiumSection";

function AstroReport({
  date, time, city, timezone, latitude, longitude,
  zodiac, moon, ascendant, mercury, venus, mars,
  planetLongitudes, ascendantLongitude, mcLongitude,
  houseLongitudes, planetHouses,
  sunText, moonText, ascendantText, mercuryText, venusText, marsText,
  sunDegree, moonDegree, mercuryDegree, venusDegree, marsDegree, ascendantDegree
}) {
  const aspects = calculateAspects(planetLongitudes);

  return (
    <div className="astro-report">
      <ProfileHeader
        date={date}
        time={time}
        city={city}
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
      />

      <NatalWheel
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
        planetLongitudes={planetLongitudes}
        ascendantLongitude={ascendantLongitude}
        mcLongitude={mcLongitude}
        houseLongitudes={houseLongitudes}
        planetHouses={planetHouses}
        sunDegree={sunDegree}
        moonDegree={moonDegree}
        mercuryDegree={mercuryDegree}
        venusDegree={venusDegree}
        marsDegree={marsDegree}
        ascendantDegree={ascendantDegree}
      />

      <BeginnerSummary
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
        planetLongitudes={planetLongitudes}
        planetHouses={planetHouses}
      />

      <PersonalPortrait
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
        planetHouses={planetHouses}
        planetLongitudes={planetLongitudes}
        sunText={sunText}
        moonText={moonText}
        ascendantText={ascendantText}
        venusText={venusText}
        marsText={marsText}
        aspects={aspects}
      />

      <section className="free-details-section">
        <div className="section-heading">
          <span className="eyebrow">БЕСПЛАТНО</span>
          <h2>Главные положения вашей карты</h2>
          <p>Этого достаточно, чтобы увидеть основные акценты. Подробная интерпретация связей между ними открывается в Premium.</p>
        </div>
        <div className="free-details-grid">
          <InterpretationCard title={`☀️ Солнце в ${zodiac}`} data={sunText} planet="sun" sign={zodiac} house={planetHouses.sun} degree={sunDegree} compact />
          <InterpretationCard title={`🌙 Луна в ${moon}`} data={moonText} planet="moon" sign={moon} house={planetHouses.moon} degree={moonDegree} compact />
          <InterpretationCard title={`⬆️ ASC в ${ascendant}`} data={ascendantText} planet="ascendant" sign={ascendant} house={1} degree={ascendantDegree} compact />
          <InterpretationCard title={`☿ Меркурий в ${mercury}`} data={mercuryText} planet="mercury" sign={mercury} house={planetHouses.mercury} degree={mercuryDegree} compact />
          <InterpretationCard title={`♀ Венера в ${venus}`} data={venusText} planet="venus" sign={venus} house={planetHouses.venus} degree={venusDegree} compact />
          <InterpretationCard title={`♂ Марс в ${mars}`} data={marsText} planet="mars" sign={mars} house={planetHouses.mars} degree={marsDegree} compact />
        </div>
      </section>

      <section className="free-mini-section">
        <div className="section-heading">
          <span className="eyebrow">ЕЩЁ В КАРТЕ</span>
          <h2>Все планеты, дома и аспекты уже рассчитаны</h2>
          <p>Нептун, Уран, Плутон, Юпитер, Сатурн, 12 домов и основные аспекты входят в расчёт. Их подробная трактовка — часть полного разбора.</p>
        </div>
        <div className="free-mini-pills">
          <span>♃ Юпитер</span><span>♄ Сатурн</span><span>♅ Уран</span><span>♆ Нептун</span><span>♇ Плутон</span>
          <span>12 домов</span><span>ASC / MC</span><span>{aspects.length} основных аспектов</span>
        </div>
      </section>

      <PremiumSection
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        venus={venus}
        mars={mars}
        planetHouses={planetHouses}
        planetLongitudes={planetLongitudes}
        ascendantLongitude={ascendantLongitude}
        mcLongitude={mcLongitude}
        chart={{ date, time, city, timezone, latitude, longitude }}
        aspects={aspects}
      />
    </div>
  );
}

export default AstroReport;
