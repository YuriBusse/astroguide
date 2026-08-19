import SwissEph, { Planet, LunarPoint } from "@swisseph/browser";
import { localDateTimeToUTC } from "./dateTime";

const swe = new SwissEph();
const sweReady = swe.init();

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

const normalize = (value) => ((value % 360) + 360) % 360;

/**
 * Natal positions are calculated from the same Swiss Ephemeris engine
 * that calculates the houses. This keeps the wheel internally consistent.
 */
export async function getPlanetLongitudes(date, time, timezone = "UTC") {
  await sweReady;

  const dateTime = localDateTimeToUTC(date, time, timezone);
  const jd = swe.dateToJulianDay(dateTime);

  const result = {};

  for (const [name, body] of Object.entries(bodies)) {
    const position = swe.calculatePosition(jd, body);
    result[name] = normalize(position.longitude);
  }

  return result;
}
