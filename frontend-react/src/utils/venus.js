import { getZodiacSign } from "./zodiac";


export function getVenusSign(date) {

  const birthDate = new Date(date);

  // временный расчёт
  const venusDate = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate() + 5
  );

  return getZodiacSign(venusDate);
}