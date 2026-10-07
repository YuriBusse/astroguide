import { ASPECTS } from "./aspects";
import { getPlanetLongitudes } from "./astronomy";
import { getHouseLongitudes, getPlanetHouse } from "./houses";

const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const NAMES = { sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс", jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон", ascendant: "ASC", mc: "MC" };
const TOPICS = {
  sun: ["Личный фокус", "Выбери одну задачу, по которой нужен видимый результат."],
  moon: ["Эмоции", "Перед реакцией назови, что именно тебя задело, и возьми короткую паузу."],
  mercury: ["Общение", "Важную мысль сформулируй письменно и проверь, нет ли двусмысленности."],
  venus: ["Отношения", "Покажи отношение конкретным действием, а не ожиданием, что другой догадается."],
  mars: ["Энергия и действия", "Направь напор в одну задачу и заранее определи границу, после которой остановишься."]
};
const ASPECT_WEIGHTS = { "Соединение": 5, "Оппозиция": 4, "Квадрат": 4, "Тригон": 3, "Секстиль": 2 };
const HOUSE_TOPICS = { 2: ["Деньги и ресурсы", "Проверь условия сделки и бюджет перед тем, как соглашаться."], 3: ["Общение", "Запиши ключевые тезисы и задай прямой вопрос вместо догадки."], 5: ["Творчество и отношения", "Вырази интерес действием и выдели время на живое удовольствие."], 6: ["Работа и нагрузка", "Раздели задачу на шаги и оставь место для восстановления."], 7: ["Отношения", "Обсуди ожидания и границы с тем, кого это касается."], 10: ["Работа и цели", "Выбери один измеримый результат и проверь приоритеты."], 12: ["Внутренний фокус", "Оставь время без новых задач, чтобы завершить и восстановиться."] };
const normalize = (value) => ((value % 360) + 360) % 360;

function findAspect(distance) {
  return ASPECTS.find((aspect) => Math.abs(distance - aspect.angle) <= aspect.orb);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}

function interpret(transit, natal, aspect, house = null) {
  const pair = `${transit}-${natal}`;
  const tense = ["Квадрат", "Оппозиция"].includes(aspect.name);
  const texts = {
    "moon-moon": ["Эмоциональный фон", "Сегодня легче заметить свою настоящую реакцию, но настроение может быстро меняться.", "Не принимай важные решения на пике эмоций: сначала назови чувство, потом действуй."],
    "sun-sun": ["Личный фокус", "День подталкивает яснее понять, чего ты хочешь и где готов проявиться заметнее.", "Выбери одну главную задачу и доведи её до видимого результата."],
    "mercury-mercury": ["Разговоры", "Мысли и слова становятся важной частью событий дня: разговор может быстро прояснить ситуацию.", "Перед отправкой важного сообщения перечитай его и убери двусмысленность."],
    "venus-venus": ["Отношения и ценности", "Внимание естественно возвращается к близости, симпатии и тому, что приносит удовольствие.", "Покажи отношение конкретным действием, а не только ожиданием ответа."],
    "mars-mars": ["Действия", "Появляется импульс двигаться быстрее и отстаивать своё.", "Направь напор в одну задачу; не превращай скорость в спор."],
  };
  const fallback = transit === "moon" || natal === "moon"
    ? ["Эмоциональный фон", "События могут сильнее обычного задевать настроение и потребность в безопасности.", "Дай себе паузу перед резким ответом и уточни, что именно тебя задело."]
    : transit === "mercury" || natal === "mercury"
      ? ["Общение", "Слова, договорённости и детали могут заметно повлиять на развитие ситуации.", "Фиксируй важные договорённости письменно и задавай прямые вопросы."]
      : transit === "venus" || natal === "venus"
        ? ["Отношения", "В фокусе оказываются симпатия, границы и обмен вниманием.", "Скажи, чего хочешь, вместо того чтобы проверять другого догадками."]
        : ["Энергия", "День подсвечивает способ действовать и проявлять себя.", "Сделай один конкретный шаг, который можно проверить по результату."];
  const base = texts[pair] || fallback;
  const topic = HOUSE_TOPICS[house] || TOPICS[transit] || [base[0], base[2]];
  const natalFocus = natal === "sun" ? "самооценки и личного выбора" : natal === "moon" ? "эмоциональной реакции и чувства безопасности" : natal === "mercury" ? "мыслей и решений" : natal === "venus" ? "отношений и ценностей" : "действий и границ";
  const effect = tense ? "создаёт напряжение вокруг" : "делает заметнее";
  return {
    area: topic[0],
    summary: `${NAMES[transit]} ${effect} тему ${topic[0].toLowerCase()} через вашу натальную точку ${NAMES[natal]} — ${natalFocus}.`,
    why: `${NAMES[transit]} ${aspect.symbol} натальное ${NAMES[natal]}, орб ${aspect.orb.toFixed(2)}°.`,
    manifestation: tense ? "Может проявляться как необходимость быстрее реагировать и одновременно не давить на себя или других." : "Может проявляться как более доступный способ заметить и использовать эту тему в обычных делах.",
    action: `${base[2]} ${topic[1]}`,
    tense,
    source: { transitName: NAMES[transit], natalName: NAMES[natal], symbol: aspect.symbol, aspect: aspect.name, orb: aspect.orb, house }
  };
}

function scoreAspect(item) {
  const planetWeight = { moon: 3, mars: 2, venus: 2, mercury: 2, sun: 2, jupiter: 3, saturn: 3, uranus: 3, neptune: 2, pluto: 3 };
  const pointWeight = { ascendant: 4, mc: 4 };
  return (ASPECT_WEIGHTS[item.name] || 1) * 10 + (planetWeight[item.transitPlanet] || 1) + (planetWeight[item.natalPlanet] || pointWeight[item.natalPlanet] || 1) + (item.house ? 2 : 0) + Math.max(0, 3 - item.orb);
}

async function calculateDay(chart, target, natal, natalHouses, timezone) {
  const date = target.toISOString().slice(0, 10);
  const transit = await getPlanetLongitudes(date, "12:00", timezone);
  const aspects = [];
  const natalPoints = [...PLANETS, "ascendant", "mc"].filter((point) => Number.isFinite(natal[point]));
  for (const transitPlanet of PLANETS.filter((planet) => Number.isFinite(transit[planet]))) {
    const house = natalHouses ? getPlanetHouse(transit[transitPlanet], natalHouses.houses) : null;
    for (const natalPlanet of natalPoints) {
      const distance = Math.min(Math.abs(normalize(transit[transitPlanet] - natal[natalPlanet])), 360 - Math.abs(normalize(transit[transitPlanet] - natal[natalPlanet])));
      const aspect = findAspect(distance);
      if (aspect) {
        const orb = Math.abs(distance - aspect.angle);
        aspects.push({ transitPlanet, natalPlanet, transitName: NAMES[transitPlanet], natalName: NAMES[natalPlanet], house, ...aspect, orb, ...interpret(transitPlanet, natalPlanet, aspect, house) });
      }
    }
  }
  const ranked = aspects.map((item) => ({ ...item, score: scoreAspect(item) })).sort((a, b) => b.score - a.score || a.orb - b.orb).slice(0, 8);
  const themes = [...new Map(ranked.map((item) => [item.area, item])).values()].slice(0, 4);
  return { date, displayDate: formatDate(target), aspects: ranked, themes, mainTheme: themes[0] || null, advice: themes[0]?.action || "Сильных транзитных влияний по используемым показателям не найдено." };
}

export async function calculateForecast(chart, period = "today") {
  const timezone = chart.timezone || "Europe/Moscow";
  const natal = await getPlanetLongitudes(chart.date, chart.time, timezone);
  let natalHouses = null;
  try {
    if (Number.isFinite(Number(chart.latitude)) && Number.isFinite(Number(chart.longitude))) {
      natalHouses = await getHouseLongitudes(chart.date, chart.time, chart.latitude, chart.longitude, timezone);
      natal.ascendant = natalHouses.ascendant;
      natal.mc = natalHouses.mc;
    }
  } catch (error) {
    console.warn("Дома недоступны для прогноза:", error);
  }
  const offsets = period === "tomorrow" ? [1] : period === "week" ? [0, 1, 2, 3, 4, 5, 6] : [0];
  const targets = offsets.map((offset) => {
    const target = new Date();
    target.setHours(12, 0, 0, 0);
    target.setDate(target.getDate() + offset);
    return target;
  });
  const calculatedDays = [];
  for (const target of targets) calculatedDays.push(await calculateDay(chart, target, natal, natalHouses, timezone));
  const first = calculatedDays[0];
  const aspects = period === "week"
    ? calculatedDays.flatMap((day) => day.aspects.map((aspect) => ({ ...aspect, day: day.displayDate }))).sort((a, b) => b.score - a.score || a.orb - b.orb).slice(0, 8)
    : first.aspects;
  const themes = [...new Map(aspects.map((item) => [item.area, item])).values()].slice(0, 4);
  return {
    date: first.date,
    displayDate: period === "week" ? `${calculatedDays[0].displayDate} — ${calculatedDays[6].displayDate}` : first.displayDate,
    period,
    chart: { date: chart.date, time: chart.time, city: chart.city },
    aspects,
    themes,
    mainTheme: themes[0] || null,
    days: period === "week" ? calculatedDays.map((day) => ({ date: day.date, displayDate: day.displayDate, mainTheme: day.mainTheme, aspects: day.aspects.slice(0, 2) })) : undefined,
    advice: themes[0]?.action || "Сильных транзитных влияний по используемым показателям не найдено.",
    limitation: "Это интерпретация транзитов в астрологической традиции, а не научный диагноз и не гарантированное предсказание."
  };
}
