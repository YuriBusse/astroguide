import { getZodiacSign } from "./zodiac";


export function getMercurySign(date) {

  const birthDate = new Date(date);

  // временный расчёт
  const mercuryDate = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate() + 2
  );

  return getZodiacSign(mercuryDate);
}