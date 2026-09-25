const ASPECTS = [
  { angle: 0, orb: 8, name: "Соединение", symbol: "☌", tone: "gold", meaning: "слияние и усиление двух принципов" },
  { angle: 60, orb: 5, name: "Секстиль", symbol: "✶", tone: "blue", meaning: "возможность, которую легче раскрыть через действие" },
  { angle: 90, orb: 6, name: "Квадрат", symbol: "□", tone: "red", meaning: "напряжение, которое заставляет развиваться" },
  { angle: 120, orb: 6, name: "Тригон", symbol: "△", tone: "green", meaning: "естественный поток и врождённая лёгкость" },
  { angle: 180, orb: 8, name: "Оппозиция", symbol: "☍", tone: "purple", meaning: "полярность и необходимость находить баланс" }
];

const normalize = (value) => ((value % 360) + 360) % 360;

const PLANET_NAMES = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс",
  jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон", northNode: "Северный узел"
};

const PLANET_SYMBOLS = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", northNode: "☊"
};

export function calculateAspects(longitudes = {}) {
  const ids = Object.keys(PLANET_NAMES).filter((id) => Number.isFinite(longitudes[id]));
  const result = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = ids[i];
      const b = ids[j];
      const distanceRaw = Math.abs(normalize(longitudes[a]) - normalize(longitudes[b]));
      const distance = Math.min(distanceRaw, 360 - distanceRaw);
      const aspect = ASPECTS.find((item) => Math.abs(distance - item.angle) <= item.orb);
      if (!aspect) continue;
      const orb = Math.abs(distance - aspect.angle);
      result.push({
        id: `${a}-${b}-${aspect.angle}`,
        a, b,
        aName: PLANET_NAMES[a], bName: PLANET_NAMES[b],
        aSymbol: PLANET_SYMBOLS[a], bSymbol: PLANET_SYMBOLS[b],
        ...aspect,
        orb,
        exactDistance: distance
      });
    }
  }
  return result.sort((a, b) => a.orb - b.orb);
}

export { PLANET_NAMES, PLANET_SYMBOLS, ASPECTS };
