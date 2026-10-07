import spreadsData from "./spreads.json";

export const TAROT_SPREADS = Object.entries(spreadsData).map(([id, spread]) => ({
  id,
  title: spread.name,
  description:
    id === "question"
      ? "Пять карт, чтобы получить прямой ответ на один конкретный вопрос."
      : id === "love"
        ? "Что человек чувствует, думает, чего хочет и куда движется ситуация."
        : id === "situation"
          ? "Разбор ситуации: что происходит, что скрыто, что мешает и чем всё может закончиться."
          : "Разбор финансового вопроса: ситуация, возможность, проблема, результат и совет.",
  positions: spread.positions,
  finalCard: spread.final_card || null
}));

export function getSpread(id) {
  if (id === "single") {
    return {
      id: "single",
      title: "Одна карта",
      description: "Старый сохранённый расклад.",
      positions: ["Фокус"],
      finalCard: null
    };
  }
  return TAROT_SPREADS.find((spread) => spread.id === id) || TAROT_SPREADS[0];
}
