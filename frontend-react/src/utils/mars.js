import { getZodiacSign } from "./zodiac";


export function getMarsSign(date) {

  const birthDate = new Date(date);

  // временный расчёт
  const marsDate = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate() + 7
  );

  return getZodiacSign(marsDate);
}
