export const TAROT_SPREADS = [
  {
    id: "single",
    title: "Одна карта",
    description: "Короткий ориентир для одного важного вопроса.",
    positions: ["Фокус"]
  },
  {
    id: "three",
    title: "Три карты",
    description: "Посмотрите на путь через прошлое, настоящее и будущее.",
    positions: ["Прошлое", "Настоящее", "Будущее"]
  },
  {
    id: "relationship",
    title: "Отношения",
    description: "Мягко исследуйте свою роль, динамику и пространство между вами.",
    positions: ["Я", "Другой человек", "Между нами"]
  }
];

export function getSpread(id) {
  return TAROT_SPREADS.find((spread) => spread.id === id) || TAROT_SPREADS[0];
}
