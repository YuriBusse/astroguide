import SwissEph, { HouseSystem } from "@swisseph/browser";
import { localDateTimeToUTC } from "./dateTime";

const swe = new SwissEph();
const sweReady = swe.init();

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

export async function getHouseLongitudes(
  date,
  time,
  latitude,
  longitude,
  timezone = "UTC"
) {
  await sweReady;

  // ВАЖНО: Swiss Ephemeris должен получить реальный UTC-момент.
  // Нельзя делать new Date(`${date}T${time}`), потому что это зависит
  // от часового пояса компьютера пользователя.
  const birthDate = localDateTimeToUTC(date, time, timezone);
  const jd = swe.dateToJulianDay(birthDate);

  const result = swe.calculateHouses(
    jd,
    latitude,
    longitude,
    HouseSystem.Placidus
  );

  const houses = {};

  for (let i = 1; i <= 12; i++) {
    houses[i] = normalizeDegrees(result.cusps[i]);
  }

  return {
    houses,
    ascendant: normalizeDegrees(result.ascendant),
    mc: normalizeDegrees(result.mc)
  };
}

export function getPlanetHouse(planetLongitude, houseLongitudes) {
  if (
    planetLongitude === undefined ||
    planetLongitude === null ||
    !houseLongitudes ||
    Object.keys(houseLongitudes).length !== 12
  ) {
    return null;
  }

  for (let i = 1; i <= 12; i++) {
    const start = houseLongitudes[i];
    const end = houseLongitudes[i === 12 ? 1 : i + 1];

    if (start < end) {
      if (planetLongitude >= start && planetLongitude < end) {
        return i;
      }
    } else {
      if (planetLongitude >= start || planetLongitude < end) {
        return i;
      }
    }
  }

  return null;
}
