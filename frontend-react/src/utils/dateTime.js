function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

/**
 * Преобразует локальные дату/время рождения в настоящий UTC Date
 * с учетом часового пояса города и DST.
 */
export function localDateTimeToUTC(date, time, timezone) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes = 0, seconds = 0] = time.split(":").map(Number);

  const localAsUTC = Date.UTC(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds
  );

  const getOffset = (instant) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(instant);

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)])
    );

    const asUTC = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );

    return asUTC - instant.getTime();
  };

  // Сначала определяем смещение для предполагаемого момента,
  // затем пересчитываем локальное время в UTC.
  const firstGuess = new Date(localAsUTC);
  const firstOffset = getOffset(firstGuess);

  let utcMillis = localAsUTC - firstOffset;

  // Повторяем один раз — это важно на переходах DST.
  const secondOffset = getOffset(new Date(utcMillis));
  if (secondOffset !== firstOffset) {
    utcMillis = localAsUTC - secondOffset;
  }

  return new Date(utcMillis);
}

export function normalizeAngle(value) {
  return normalizeDegrees(value);
}
