import { ASPECTS } from "./aspects";

const PLANETS = ["sun", "moon", "venus", "mars", "mercury"];
const PLANET_NAMES = { sun: "Солнце", moon: "Луна", venus: "Венера", mars: "Марс", mercury: "Меркурий" };
const normalize = (value) => ((value % 360) + 360) % 360;

export function calculateCrossAspects(first = {}, second = {}) {
  const result = [];
  for (const firstPlanet of PLANETS) {
    for (const secondPlanet of PLANETS) {
      if (!Number.isFinite(first[firstPlanet]) || !Number.isFinite(second[secondPlanet])) continue;
      const rawDistance = Math.abs(normalize(first[firstPlanet]) - normalize(second[secondPlanet]));
      const distance = Math.min(rawDistance, 360 - rawDistance);
      const aspect = ASPECTS.find((item) => Math.abs(distance - item.angle) <= item.orb);
      if (!aspect) continue;
      result.push({ id: `${firstPlanet}-${secondPlanet}-${aspect.angle}`, firstPlanet, secondPlanet, firstName: PLANET_NAMES[firstPlanet], secondName: PLANET_NAMES[secondPlanet], orb: Math.abs(distance - aspect.angle), ...aspect });
    }
  }
  return result.sort((a, b) => a.orb - b.orb);
}

export function getCompatibilitySummary(aspects = []) {
  const supportive = aspects.filter((aspect) => ["gold", "green", "blue"].includes(aspect.tone)).length;
  const tense = aspects.filter((aspect) => ["red", "purple"].includes(aspect.tone)).length;
  if (supportive > tense + 1) return { label: "Легко находить общий язык", tone: "positive" };
  if (tense > supportive + 1) return { label: "Нужны ясные договорённости", tone: "attention" };
  return { label: "Притяжение сочетается с различиями", tone: "balanced" };
}

const pairKey = (first, second) => [first, second].sort().join("-");

const AREA_COPY = {
  "moon-moon": { area: "Эмоции", what: "Эмоциональные реакции могут быть понятны друг другу без долгих объяснений.", action: "Называйте чувство прямо, не заставляя другого угадывать, что происходит." },
  "moon-venus": { area: "Тепло и забота", what: "Один человек может тонко чувствовать потребность другого в поддержке и близости.", action: "Показывайте заботу конкретно: словами, временем или делами, которые важны партнёру." },
  "mars-moon": { area: "Эмоции и реакция", what: "Действия одного могут быстро включать эмоциональную реакцию другого.", action: "В споре сначала снижайте накал, а уже потом обсуждайте решение." },
  "mars-venus": { area: "Притяжение", what: "Между вами может быть заметная химия и желание действовать навстречу.", action: "Переводите притяжение в ясные договорённости, а не оставляйте всё на догадках." },
  "mercury-mercury": { area: "Общение", what: "Вам проще обмениваться мыслями и находить общий язык в разговоре.", action: "Обсуждайте не только факты, но и то, как каждый понял разговор." },
  "mercury-moon": { area: "Слова и чувства", what: "Разговоры могут напрямую задевать настроение и внутреннее состояние.", action: "Перед важным разговором уточните, нужна ли сейчас поддержка или решение проблемы." },
  "mercury-mars": { area: "Споры и темп", what: "Общение может быть быстрым, прямым и иногда резким.", action: "Отделяйте честность от давления: делайте паузу перед ответом в конфликте." },
  "sun-moon": { area: "Базовое понимание", what: "Внешнее самовыражение одного человека может хорошо сочетаться с эмоциональными потребностями другого.", action: "Учитывайте разницу между тем, что хочется показать, и тем, что хочется почувствовать." },
  "sun-sun": { area: "Ценности и характер", what: "Вам легче узнавать себя в целях и стиле самовыражения друг друга.", action: "Поддерживайте общие цели, но оставляйте каждому собственное пространство." }
};

const ASPECT_EFFECTS = {
  "Тригон": { flow: "поддерживает естественный контакт", tension: "может создавать ощущение, что вас понимают без лишних слов" },
  "Секстиль": { flow: "даёт возможность договориться", tension: "раскрывается сильнее, когда вы оба делаете шаг навстречу" },
  "Соединение": { flow: "усиливает общую тему", tension: "делает её заметной и трудно игнорируемой" },
  "Квадрат": { flow: "включает трение", tension: "показывает различие привычек и реакций" },
  "Оппозиция": { flow: "создаёт притяжение через различия", tension: "заставляет учиться балансу, а не перетягиванию каната" }
};

export function interpretCompatibilityAspect(aspect) {
  const copy = AREA_COPY[pairKey(aspect.firstPlanet, aspect.secondPlanet)] || (aspect.firstPlanet === "mercury" || aspect.secondPlanet === "mercury"
    ? { area: "Общение", what: "Ваши способы думать и формулировать мысли встречаются в одном разговоре.", action: "Сначала перескажите, как вы поняли слова партнёра, и только потом возражайте." }
    : aspect.firstPlanet === "venus" || aspect.secondPlanet === "venus"
      ? { area: "Ценности и симпатия", what: "Связь затрагивает то, как вы проявляете симпатию и понимаете приятную совместную жизнь.", action: "Договоритесь об одном конкретном проявлении заботы, которое важно каждому." }
      : aspect.firstPlanet === "mars" || aspect.secondPlanet === "mars"
        ? { area: "Действия и границы", what: "Связь влияет на темп действий, инициативу и реакцию на давление.", action: "Заранее договоритесь, как вы просите о помощи и как останавливаете спор." }
        : { area: "Ценности и характер", what: "Связь показывает, как ваши цели и способы проявлять себя встречаются в отношениях.", action: "Выберите общую цель, но оставьте каждому право делать по-своему." });
  const effect = ASPECT_EFFECTS[aspect.name] || ASPECT_EFFECTS["Соединение"];
  const supportive = ["green", "blue"].includes(aspect.tone);
  const tense = ["red", "purple"].includes(aspect.tone);
  return {
    ...aspect,
    area: copy.area,
    category: supportive ? "supportive" : tense ? "tense" : "mixed",
    what: `${copy.what} ${effect.flow[0].toUpperCase()}${effect.flow.slice(1)} и ${effect.tension}.`,
    manifestation: tense ? `${copy.area} может проявляться через ${aspect.name === "Оппозиция" ? "перетягивание инициативы" : "разные реакции и повторяющийся спор"}.` : `${copy.area} может проявляться через конкретную поддержку и готовность учитывать темп друг друга.`,
    action: copy.action,
    precision: aspect.orb <= 2 ? "Связь очень точная" : aspect.orb <= 4 ? "Связь заметная" : "Связь умеренной силы"
  };
}

export function buildCompatibilityInterpretation(aspects = []) {
  const interpreted = aspects.map(interpretCompatibilityAspect);
  const supportive = interpreted.filter((item) => item.category === "supportive");
  const tense = interpreted.filter((item) => item.category === "tense");
  const emotional = interpreted.filter((item) => item.area === "Эмоции" || item.area === "Тепло и забота" || item.area === "Эмоции и реакция");
  const attraction = interpreted.filter((item) => item.area === "Притяжение");
  const communication = interpreted.filter((item) => item.area === "Общение" || item.area === "Слова и чувства" || item.area === "Споры и темп");
  const main = interpreted[0];
  const keyThemes = [...new Map(interpreted.map((item) => [item.area, item])).values()].slice(0, 3);
  return { interpreted, supportive, tense, emotional, attraction, communication, main, keyThemes };
}
