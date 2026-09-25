import { localDateTimeToUTC } from "./dateTime";
import { getSwissEphemeris, loadSwissEphemerisModule } from "./swisseph";

const normalize = (value) => ((value % 360) + 360) % 360;

export async function getPlanetLongitudes(
  date,
  time,
  timezone = "UTC"
) {
  console.log("[SWISS DEBUG] module/init: start");
  const { Planet, LunarPoint } = await loadSwissEphemerisModule();
  console.log("[SWISS DEBUG] module: loaded");
  const swe = await getSwissEphemeris();
  console.log("[SWISS DEBUG] WASM: ready");

  const dateTime = localDateTimeToUTC(date, time, timezone);
  console.log("[SWISS DEBUG] UTC dateTime:", dateTime);
  const jd = swe.dateToJulianDay(dateTime);
  console.log("[SWISS DEBUG] Julian Day:", jd);
  const bodies = {
    sun: Planet.Sun,
    moon: Planet.Moon,
    mercury: Planet.Mercury,
    venus: Planet.Venus,
    mars: Planet.Mars,
    jupiter: Planet.Jupiter,
    saturn: Planet.Saturn,
    uranus: Planet.Uranus,
    neptune: Planet.Neptune,
    pluto: Planet.Pluto,
    northNode: LunarPoint.MeanNode,
  };

  const result = {};

  for (const [name, body] of Object.entries(bodies)) {
    console.log(`[SWISS DEBUG] calculatePosition START: ${name}`);
    const position = swe.calculatePosition(jd, body);
    console.log(`[SWISS DEBUG] calculatePosition DONE: ${name}`, position);

    if (!position || typeof position.longitude !== "number") {
      throw new Error(
        `Swiss Ephemeris не вернул долготу для ${name}`
      );
    }

    result[name] = normalize(position.longitude);
  }

  return result;
}
