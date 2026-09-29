import { DEMO_REPORT_SECTIONS } from "./demoContent.js";

const _DEMO_SECTIONS = [
  {
    id: "overview",
    eyebrow: "ОСНОВНЫЕ ПОЛОЖЕНИЯ",
    title: "Как читать этот раздел",
    body: "Это демонстрационный просмотр структуры Premium-отчёта. В будущем сюда будут подставляться интерпретации реальных положений натальной карты пользователя. Сейчас текст показывает только формат, а не персональный вывод."
  },
  {
    id: "strengths",
    eyebrow: "СИЛЬНЫЕ СТОРОНЫ",
    title: "Ресурсы и опоры",
    body: "В готовом отчёте этот блок может собирать повторяющиеся темы карты: что помогает действовать, учиться, строить отношения и восстанавливаться. Формулировки будут вероятностными и предназначенными для саморефлексии."
  },
  {
    id: "attention",
    eyebrow: "ЗОНЫ ВНИМАНИЯ",
    title: "Что полезно наблюдать",
    body: "Вместо категоричных прогнозов отчёт будет предлагать вопросы для наблюдения: где возникает напряжение, какие привычные реакции повторяются и какой небольшой альтернативный шаг можно попробовать."
  },
  {
    id: "summary",
    eyebrow: "ИТОГ",
    title: "Личная карта наблюдений",
    body: "Демонстрационный текст не заменяет индивидуальный расчёт. После подключения реальных данных этот раздел будет связывать положения планет, дома и аспекты в аккуратное резюме без медицинских, юридических или финансовых утверждений."
  }
];

export const REPORT_CATALOG = [
  {
    id: "personality",
    title: "Характер и личность",
    description: "Понятное введение в самонаблюдение через язык натальной карты.",
    status: "available",
    statusLabel: "ДЕМО · ПОЛНЫЙ ПРИМЕР",
    icon: "◌",
    sections: DEMO_REPORT_SECTIONS.personality
  },
  {
    id: "relationships",
    title: "Отношения",
    description: "Как говорить о близости, границах и взаимодействии без ярлыков.",
    status: "available",
    statusLabel: "ДЕМО · ПОЛНЫЙ ПРИМЕР",
    icon: "♡",
    sections: DEMO_REPORT_SECTIONS.relationships
  },
  {
    id: "career",
    title: "Карьера и реализация",
    description: "Как исследовать рабочий стиль, мотивацию и развитие простыми шагами.",
    status: "available",
    statusLabel: "ДЕМО · ПОЛНЫЙ ПРИМЕР",
    icon: "⌁",
    sections: DEMO_REPORT_SECTIONS.career
  },
  {
    id: "periods",
    title: "Жизненные периоды",
    description: "Бережный способ смотреть на перемены, циклы и следующий шаг.",
    status: "available",
    statusLabel: "ДЕМО · ПОЛНЫЙ ПРИМЕР",
    icon: "◒",
    sections: DEMO_REPORT_SECTIONS.periods
  }
];

export function getReport(id) {
  return REPORT_CATALOG.find((report) => report.id === id) || REPORT_CATALOG[0];
}
