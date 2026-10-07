import TAROT_CARDS from "./tarot-cards-final.json";

const SUIT_SYMBOLS = {
  Жезлы: "✦",
  Кубки: "◌",
  Мечи: "◇",
  Пентакли: "◈"
};

function buildCard(card, reversed) {
  const interpretation = reversed ? card.reversed : card.upright;
  return {
    id: card.id,
    name: card.name,
    arcana: card.arcana === "major" ? "Старший Аркан" : "Младший Аркан",
    suit: card.suit,
    number: card.number,
    image: card.image,
    keywords: interpretation.keywords,
    shortMeaning: interpretation.meaning,
    reversedMeaning: interpretation.meaning,
    lifeMeaning: interpretation.meaning,
    attention: interpretation.advice,
    advice: interpretation.advice,
    love: interpretation.love,
    career: interpretation.career,
    money: interpretation.money,
    yesNo: interpretation.yes_no,
    yesNoNote: interpretation.yes_no_note,
    reversed
  };
}

export const TAROT_DECK = TAROT_CARDS;

export function drawCards(count) {
  const pool = [...TAROT_CARDS];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count).map((card) => buildCard(card, Math.random() < 0.5));
}

export function getCardImagePath(card) {
  return card?.image || "";
}

export { SUIT_SYMBOLS };
