import { getZodiacSign } from "./zodiac";


export function getMoonSign(date) {

  const birthDate = new Date(date);

  // временный расчёт для первой версии
  const day = birthDate.getDate();

  const fakeMoonDate = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    day + 3
  );

  return getZodiacSign(fakeMoonDate);
}