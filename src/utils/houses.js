import { localDateTimeToUTC } from "./dateTime";
import { getSwissEphemeris, loadSwissEphemerisModule } from "./swisseph";

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
  const [{ HouseSystem }, swe] = await Promise.all([
    loadSwissEphemerisModule(),
    getSwissEphemeris()
  ]);

  const birthDate = localDateTimeToUTC(date, time, timezone);
  const jd = swe.dateToJulianDay(birthDate);

  const result = swe.calculateHouses(
    jd,
    Number(latitude),
    Number(longitude),
    HouseSystem.Placidus
  );

  if (!result || !result.cusps) {
    throw new Error(
      "Swiss Ephemeris не вернул данные домов"
    );
  }

  const houses = {};

  for (let i = 1; i <= 12; i++) {
    houses[i] = normalizeDegrees(result.cusps[i]);
  }

  return {
    houses,
    ascendant: normalizeDegrees(result.ascendant),
    mc: normalizeDegrees(result.mc),
  };
}

export function getPlanetHouse(
  planetLongitude,
  houseLongitudes
) {
  if (
    planetLongitude === undefined ||
    planetLongitude === null ||
    !houseLongitudes ||
    Object.keys(houseLongitudes).length !== 12
  ) {
    return null;
  }

  const longitude = normalizeDegrees(Number(planetLongitude));

  for (let i = 1; i <= 12; i++) {
    const start = normalizeDegrees(houseLongitudes[i]);
    const end = normalizeDegrees(
      houseLongitudes[i === 12 ? 1 : i + 1]
    );

    if (start < end) {
      if (longitude >= start && longitude < end) {
        return i;
      }
    } else {
      if (longitude >= start || longitude < end) {
        return i;
      }
    }
  }

  return null;
}
