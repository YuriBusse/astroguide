const zodiacSigns = [
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

export function longitudeToSign(longitude) {
  if (longitude === undefined || longitude === null) {
    return { sign: "", degree: 0, minute: 0, longitude: null };
  }

  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const withinSign = normalized % 30;
  const degree = Math.floor(withinSign);
  const minute = Math.floor((withinSign - degree) * 60);

  return {
    sign: zodiacSigns[signIndex],
    degree,
    minute,
    longitude: normalized,
    formatted: `${degree}° ${String(minute).padStart(2, "0")}′`
  };
}
