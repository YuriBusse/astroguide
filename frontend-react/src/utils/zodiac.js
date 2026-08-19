export function getZodiacSign(date) {

  const day = new Date(date);

  const month = day.getMonth() + 1;
  const dayNumber = day.getDate();


  if ((month === 3 && dayNumber >= 21) || (month === 4 && dayNumber <= 19)) {
    return "♈ Овен";
  }

  if ((month === 4 && dayNumber >= 20) || (month === 5 && dayNumber <= 20)) {
    return "♉ Телец";
  }

  if ((month === 5 && dayNumber >= 21) || (month === 6 && dayNumber <= 20)) {
    return "♊ Близнецы";
  }

  if ((month === 6 && dayNumber >= 21) || (month === 7 && dayNumber <= 22)) {
    return "♋ Рак";
  }

  if ((month === 7 && dayNumber >= 23) || (month === 8 && dayNumber <= 22)) {
    return "♌ Лев";
  }

  if ((month === 8 && dayNumber >= 23) || (month === 9 && dayNumber <= 22)) {
    return "♍ Дева";
  }

  if ((month === 9 && dayNumber >= 23) || (month === 10 && dayNumber <= 22)) {
    return "♎ Весы";
  }

  if ((month === 10 && dayNumber >= 23) || (month === 11 && dayNumber <= 21)) {
    return "♏ Скорпион";
  }

  if ((month === 11 && dayNumber >= 22) || (month === 12 && dayNumber <= 21)) {
    return "♐ Стрелец";
  }

  if ((month === 12 && dayNumber >= 22) || (month === 1 && dayNumber <= 19)) {
    return "♑ Козерог";
  }

  if ((month === 1 && dayNumber >= 20) || (month === 2 && dayNumber <= 18)) {
    return "♒ Водолей";
  }

  return "♓ Рыбы";
}