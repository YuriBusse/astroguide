import { useEffect, useState } from "react";
import AstroReport from "./AstroReport";
import { sunInterpretations } from "../data/interpretations/sun";
import { moonInterpretations } from "../data/interpretations/moon";
import { marsInterpretations } from "../data/interpretations/mars";
import { ascendantInterpretations } from "../data/interpretations/ascendant";
import { mercuryInterpretations } from "../data/interpretations/mercury";
import { venusInterpretations } from "../data/interpretations/venus";
import { getPlanetLongitudes } from "../utils/astronomy";
import { cloudConfigured, saveCloudChart } from "../utils/cloud";
import { longitudeToSign } from "../utils/longitudeToSign";
import { getHouseLongitudes, getPlanetHouse } from "../utils/houses";

function ResultCard({ result }) {
  const [planetLongitudes, setPlanetLongitudes] = useState(null);
  const [houseLongitudes, setHouseLongitudes] = useState({});
  const [swissAscendant, setSwissAscendant] = useState(null);
  const [swissMC, setSwissMC] = useState(null);
  const [calculationError, setCalculationError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function calculateChart() {
      setCalculationError("");
      setPlanetLongitudes(null);
      setHouseLongitudes({});
      setSwissAscendant(null);
      setSwissMC(null);

      try {
        const [planets, houses] = await Promise.all([
          getPlanetLongitudes(result.date, result.time, result.timezone),
          getHouseLongitudes(
            result.date,
            result.time,
            result.latitude,
            result.longitude,
            result.timezone
          )
        ]);

        if (cancelled) return;

        setPlanetLongitudes(planets);
        setHouseLongitudes(houses.houses);
        setSwissAscendant(houses.ascendant);
        setSwissMC(houses.mc);
      } catch (error) {
        console.error("Ошибка расчёта натальной карты:", error);
        if (!cancelled) {
          setCalculationError("Не удалось рассчитать карту. Проверьте дату, время и город рождения.");
        }
      }
    }

    calculateChart();

    return () => {
      cancelled = true;
    };
  }, [
    result.date,
    result.time,
    result.latitude,
    result.longitude,
    result.timezone
  ]);

  if (calculationError) {
    return <div className="calculation-error">{calculationError}</div>;
  }

  if (!planetLongitudes || swissAscendant === null) {
    return (
      <div className="calculation-state">
        <div className="calculation-state__spinner" />
        <strong>Рассчитываем натальную карту</strong>
        <span>Планеты, дома и аспекты</span>
      </div>
    );
  }

  const planetSigns = Object.fromEntries(
    Object.entries(planetLongitudes).map(([key, longitude]) => [
      key,
      longitudeToSign(longitude)
    ])
  );

  const zodiac = planetSigns.sun.sign;
  const moon = planetSigns.moon.sign;
  const mercury = planetSigns.mercury.sign;
  const venus = planetSigns.venus.sign;
  const mars = planetSigns.mars.sign;

  const ascendantData = longitudeToSign(swissAscendant);
  const ascendant = ascendantData.sign;

  const planetHouses = Object.fromEntries(
    Object.entries(planetLongitudes).map(([key, longitude]) => [
      key,
      getPlanetHouse(longitude, houseLongitudes)
    ])
  );

  const sunText = sunInterpretations[zodiac] || {};
  const moonText = moonInterpretations[moon] || {};
  const ascendantText = ascendantInterpretations[ascendant] || {};
  const mercuryText = mercuryInterpretations[mercury] || {};
  const venusText = venusInterpretations[venus] || {};
  const marsText = marsInterpretations[mars] || {};
  const saveChart = async () => {
    try {
      const STORAGE_KEY = "astroguide_saved_charts";
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const chart = {
        id: `${result.date}-${result.time}-${result.city}-${Date.now()}`,
        city: result.city,
        date: result.date,
        time: result.time,
        timezone: result.timezone,
        latitude: result.latitude,
        longitude: result.longitude,
        premium: localStorage.getItem("astroguide_premium") === "true"
      };
      const duplicate = existing.some(
        (item) =>
          item.city === chart.city &&
          item.date === chart.date &&
          item.time === chart.time
      );
      if (!duplicate) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([chart, ...existing].slice(0, 20))
        );
      }

      if (cloudConfigured) {
        try {
          await saveCloudChart(chart);
        } catch (error) {
          console.error("Облачное сохранение не удалось:", error);
        }
      }

      window.dispatchEvent(new Event("astroguide:chart-saved"));
    } catch (error) {
      console.error("Не удалось сохранить карту:", error);
    }
  };


  return (
    <div className="result">
      <div className="birth-summary">
        <div className="birth-summary__item">
          <span>Дата рождения</span>
          <strong>{result.date}</strong>
        </div>
        <div className="birth-summary__item">
          <span>Местное время</span>
          <strong>{result.time}</strong>
        </div>
        <div className="birth-summary__item">
          <span>Место рождения</span>
          <strong>{result.city}</strong>
        </div>
        <button className="save-chart-button" type="button" onClick={saveChart}>
          <span>＋</span> Сохранить карту
        </button>
      </div>

      <AstroReport
        date={result.date}
        time={result.time}
        city={result.city}
        timezone={result.timezone}
        latitude={result.latitude}
        longitude={result.longitude}
        zodiac={zodiac}
        moon={moon}
        ascendant={ascendant}
        mercury={mercury}
        venus={venus}
        mars={mars}
        planetLongitudes={planetLongitudes}
        ascendantLongitude={swissAscendant}
        mcLongitude={swissMC}
        houseLongitudes={houseLongitudes}
        planetHouses={planetHouses}
        sunDegree={planetSigns.sun.degree}
        moonDegree={planetSigns.moon.degree}
        mercuryDegree={planetSigns.mercury.degree}
        venusDegree={planetSigns.venus.degree}
        marsDegree={planetSigns.mars.degree}
        ascendantDegree={ascendantData.degree}
        sunText={sunText}
        moonText={moonText}
        ascendantText={ascendantText}
        mercuryText={mercuryText}
        venusText={venusText}
        marsText={marsText}
      />
    </div>
  );
}

export default ResultCard;
