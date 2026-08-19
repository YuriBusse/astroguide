import { getZodiacSign } from "./zodiac";

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function getJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function getGMST(date) {
  const jd = getJulianDate(date);
  const T = (jd - 2451545.0) / 36525;

  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;

  return normalizeDegrees(gmst);
}

function getUtcDateFromLocal(date, time, timezone) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const target = Date.UTC(
    year,
    month - 1,
    day,
    hours,
    minutes
  );

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset"
  });

  const parts = formatter.formatToParts(new Date(target));

  const offsetPart = parts.find(
    (part) => part.type === "timeZoneName"
  );

  const match = offsetPart?.value.match(
    /GMT([+-])(\d{2}):?(\d{2})?/
  );

  if (!match) {
    return new Date(target);
  }

  const sign = match[1] === "+" ? 1 : -1;
  const offsetHours = Number(match[2]);
  const offsetMinutes = Number(match[3] || 0);

  const offsetMs =
    sign *
    (offsetHours * 60 + offsetMinutes) *
    60 *
    1000;

  return new Date(target - offsetMs);
}

export function getAscendant(
  date,
  time,
  latitude,
  longitude,
  timezone
) {
  const birthDate = getUtcDateFromLocal(
    date,
    time,
    timezone
  );

  const latitudeRad = latitude * Math.PI / 180;

  // Местное звёздное время
  const lst =
    normalizeDegrees(
      getGMST(birthDate) + longitude
    );

  const lstRad = lst * Math.PI / 180;

  // Наклон эклиптики
  const obliquity = 23.439291 * Math.PI / 180;

  // Расчёт эклиптической долготы Асцендента
  const y =
    -Math.cos(lstRad);

  const x =
    Math.sin(lstRad) * Math.cos(obliquity) +
    Math.tan(latitudeRad) * Math.sin(obliquity);

  let ascendantLongitude =
    Math.atan2(y, x) * 180 / Math.PI;

  ascendantLongitude =
    normalizeDegrees(ascendantLongitude);

  const signData = getZodiacSignFromLongitude(
    ascendantLongitude
  );

  return {
    sign: signData.sign,
    degree: signData.degree,
    longitude: ascendantLongitude
  };
}

function getZodiacSignFromLongitude(longitude) {
  const signs = [
    "♈ Овен",
    "♉ Телец",
    "♊ Близнецы",
    "♋ Рак",
    "♌ Лев",
    "♍ Дева",
    "♎ Весы",
    "♏ Скорпион",
    "♐ Стрелец",
    "♑ Козерог",
    "♒ Водолей",
    "♓ Рыбы"
  ];

  const normalized = normalizeDegrees(longitude);

  const signIndex =
    Math.floor(normalized / 30);

  const degree =
    Math.floor(normalized % 30);

  return {
    sign: signs[signIndex],
    degree,
    longitude: normalized
  };
}