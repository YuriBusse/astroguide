import { useMemo, useState } from "react";
import AppButton from "../components/AppButton";
import { getCityCoordinates, getPopularCities } from "../utils/cityCoordinates";
import { getPlanetLongitudes } from "../utils/astronomy";
import { buildCompatibilityInterpretation, calculateCrossAspects, getCompatibilitySummary } from "../utils/compatibility";
import { getSession, saveCloudResult } from "../utils/cloud";
import PremiumTeaser from "../components/premium/PremiumTeaser";

const EMPTY_PERSON = { name: "", date: "", time: "", city: "", unknownTime: false };

function PersonFields({
  person,
  index,
  cities,
  onChange,
  onFieldKeyDown,
}) {
  const update = (field, value) => onChange({ ...person, [field]: value });
  return (
    <div className="compatibility-person">
      <div className="compatibility-person__heading"><span className="eyebrow">ЧЕЛОВЕК {index + 1}</span><h2>{person.name || (index === 0 ? "Вы" : "Другой человек")}</h2></div>
      <label className="compatibility-field"><span>Имя <small>(необязательно)</small></span><input value={person.name} onChange={(event) => update("name", event.target.value)} onKeyDown={onFieldKeyDown} placeholder={index === 0 ? "Например, Юрий" : "Например, Анна"} /></label>
      <div className="compatibility-fields-row"><label className="compatibility-field"><span>Дата рождения</span><input type="date" value={person.date} onChange={(event) => update("date", event.target.value)} onKeyDown={onFieldKeyDown} /></label><label className="compatibility-field"><span>Время рождения</span><input type="time" value={person.unknownTime ? "" : person.time} disabled={person.unknownTime} onChange={(event) => update("time", event.target.value)} onKeyDown={onFieldKeyDown} /></label></div>
      <label className="compatibility-field"><span>Город рождения</span><select value={person.city} onChange={(event) => update("city", event.target.value)} onKeyDown={onFieldKeyDown}><option value="">Выберите город</option>{cities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}</select></label>
      <label className="compatibility-checkbox"><input type="checkbox" checked={person.unknownTime} onChange={(event) => update("unknownTime", event.target.checked)} /><span>Точное время неизвестно</span></label>
      {person.unknownTime && <p className="compatibility-note">Возьмём ориентир 12:00. Планеты будут рассчитаны, но дома и Асцендент здесь не используются.</p>}
    </div>
  );
}

function CompatibilityResult({ data, onReset }) {
  const crossAspects = useMemo(() => data.crossAspects || calculateCrossAspects(data.firstPlanets, data.secondPlanets), [data]);
  const summary = getCompatibilitySummary(crossAspects);
  const interpretation = buildCompatibilityInterpretation(crossAspects);
  const renderAspect = (aspect) => <details className="compatibility-aspect" key={aspect.id}><summary><strong>{aspect.area}</strong><span>{aspect.firstName} + {aspect.secondName} · {aspect.symbol} {aspect.name}</span><em>{aspect.precision}</em></summary><div className="compatibility-aspect__body"><p><b>Что это даёт:</b> {aspect.what}</p><p><b>Как проявляется:</b> {aspect.manifestation}</p><p><b>Что делать:</b> {aspect.action}</p></div></details>;
  const renderGroup = (title, items, empty) => <div className="compatibility-result__section"><span className="eyebrow">{title}</span>{items.length ? <div className="compatibility-aspects">{items.slice(0, 4).map(renderAspect)}</div> : <p className="compatibility-empty">{empty}</p>}</div>;
  const renderCompactGroup = (title, items, empty) => <div className="compatibility-result__section compatibility-result__section--compact"><span className="eyebrow">{title}</span>{items.length ? <ul className="compatibility-compact-list">{items.slice(0, 4).map((aspect) => <li key={aspect.id}><b>{aspect.area}</b><span>{aspect.firstName} + {aspect.secondName} · {aspect.symbol} {aspect.name}</span></li>)}</ul> : <p className="compatibility-empty">{empty}</p>}</div>;
  const [saveState, setSaveState] = useState("idle");
  const saveResult = async () => {
    if (saveState === "saving" || saveState === "saved") return;
    if (!getSession()?.access_token) { setSaveState("auth"); return; }
    setSaveState("saving");
    try {
      await saveCloudResult({
        resultType: "compatibility",
        title: `Совместимость: ${data.first.name || "Вы"} и ${data.second.name || "Другой человек"}`,
        sourceData: { first: data.first, second: data.second },
        resultData: { firstPlanets: data.firstPlanets, secondPlanets: data.secondPlanets, crossAspects, interpretation }
      });
      setSaveState("saved");
      window.dispatchEvent(new Event("astroguide:result-saved"));
    } catch (error) {
      console.error("Не удалось сохранить совместимость:", error);
      setSaveState("error");
    }
  };
  return (
    <section className="compatibility-result" aria-live="polite">
      <div className="compatibility-result__header"><span className="eyebrow">ВАША СОВМЕСТИМОСТЬ</span><h1>{data.first.name || "Вы"} + {data.second.name || "Другой человек"}</h1><p>Символическое сравнение планет. Это не диагноз и не гарантия будущего.</p></div>
      <div className={`compatibility-summary compatibility-summary--${summary.tone}`}><span className="eyebrow">ГЛАВНАЯ ДИНАМИКА</span><strong>{summary.label}</strong><p>{interpretation.main ? `${interpretation.main.area}: ${interpretation.main.what}` : "Ярких межпланетных связей не найдено — сравнивайте вывод с реальным общением."}</p></div>
      <div className="compatibility-key-themes"><span className="eyebrow">КЛЮЧЕВЫЕ ТЕМЫ</span><div>{interpretation.keyThemes.map((theme) => <span key={theme.area}>{theme.area}</span>)}</div></div>
      {renderGroup("ЭМОЦИИ", interpretation.emotional, "В текущем наборе нет точной связи Луны. Это не отменяет чувств, но их нельзя выводить из этого расчёта.")}
      {renderGroup("ПРИТЯЖЕНИЕ", interpretation.attraction, "Связи Венеры и Марса не найдены — не делаем вывод о наличии или отсутствии притяжения.")}
      {renderGroup("ОБЩЕНИЕ", interpretation.communication, "Точных связей Меркурия не найдено — важнее проверить, как вы реально обсуждаете сложные темы.")}
      {renderCompactGroup("СИЛЬНЫЕ СТОРОНЫ · СВОДКА", interpretation.supportive, "Поддерживающих аспектов не найдено среди рассчитанных связей.")}
      {renderCompactGroup("СЛОЖНОСТИ · СВОДКА", interpretation.tense, "Явных напряжённых аспектов не найдено.")}
      <div className="compatibility-result__section"><span className="eyebrow">ПРАКТИЧЕСКИ</span><h2>Что делать с этим выводом</h2><ul className="compatibility-actions">{[...interpretation.supportive, ...interpretation.tense].slice(0, 4).map((aspect) => <li key={`action-${aspect.id}`}><b>{aspect.area}:</b> {aspect.action}</li>)}</ul></div>
      <div className="compatibility-result__section"><span className="eyebrow">ИТОГ</span><h2>Что это значит для пары</h2><p>{interpretation.main ? `Главная тема — ${interpretation.main.area.toLowerCase()}: ${interpretation.main.what}` : "По этим данным нельзя выделить одну ведущую тему."} {interpretation.tense.length ? `Сложность может быть в ${interpretation.tense[0].area.toLowerCase()}; её лучше обсуждать конкретно, а не угадывать.` : "Сильнее всего результат раскрывается через реальные разговоры и действия."}</p></div>
      <PremiumTeaser productId="compatibility_extended" productName="расширенный разбор совместимости" title="Расширенный разбор пары" description="Базовый результат уже показывает главные связи. Premium соберёт их в более конкретную историю отношений." items={["глубокая динамика пары", "скрытые точки напряжения", "дополнительные аспекты и рекомендации"]} onAction={() => window.dispatchEvent(new Event("astroguide:checkout-requested"))} />
      <div className="compatibility-save"><AppButton onClick={saveResult} disabled={saveState === "saving" || saveState === "saved"}>{saveState === "saving" ? "Сохраняем…" : saveState === "saved" ? "✓ Результат сохранён" : "Сохранить результат"}</AppButton>{saveState === "auth" && <p className="form-error">Войдите в аккаунт, чтобы сохранить результат в профиле.</p>}{saveState === "error" && <p className="form-error">Не удалось сохранить результат. Попробуйте ещё раз.</p>}</div>
      <AppButton variant="secondary" onClick={onReset}>← Назад к вводу</AppButton>
    </section>
  );
}

function Compatibility({ savedResult = null }) {
  const cities = useMemo(() => getPopularCities(), []);
  const [first, setFirst] = useState(EMPTY_PERSON);
  const [second, setSecond] = useState(EMPTY_PERSON);
  const [result, setResult] = useState(savedResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleFieldKeyDown = (event) => {
  if (event.key !== "Enter") return;

  const form = event.currentTarget.closest("form");
  if (!form) return;

  const fields = [
    ...form.querySelectorAll(
      'input:not([type="checkbox"]):not([disabled]), select'
    ),
  ];

  const currentIndex = fields.indexOf(event.currentTarget);

  if (currentIndex === -1) return;

  event.preventDefault();

  const nextField = fields[currentIndex + 1];

  if (nextField) {
    nextField.focus();
  } else {
    form.requestSubmit();
  }
};
  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (!first.date || !first.city || !second.date || !second.city) { setError("Укажите дату и город рождения для обоих людей."); return; }
    const firstCoordinates = getCityCoordinates(first.city); const secondCoordinates = getCityCoordinates(second.city);
    if (!firstCoordinates || !secondCoordinates) { setError("Выберите города из списка."); return; }
    setLoading(true);
    try {
      const firstTime = first.unknownTime ? "12:00" : first.time; const secondTime = second.unknownTime ? "12:00" : second.time;
      if (!firstTime || !secondTime) throw new Error("Укажите время или отметьте «Точное время неизвестно».");
      const [firstPlanets, secondPlanets] = await Promise.all([getPlanetLongitudes(first.date, firstTime, firstCoordinates.timezone), getPlanetLongitudes(second.date, secondTime, secondCoordinates.timezone)]);
      setResult({ first, second, firstPlanets, secondPlanets });
    } catch (calculationError) { setError(calculationError?.message || "Не удалось рассчитать совместимость. Попробуйте ещё раз."); } finally { setLoading(false); }
  };
  if (result) return <CompatibilityResult data={result} onReset={() => setResult(null)} />;
  return (
    <section className="screen screen--compatibility"><div className="screen-top"><div className="screen-top__title"><span className="eyebrow">ASTROGUIDE</span><h1>Совместимость</h1></div></div><div className="compatibility-intro"><div className="compatibility-intro__mark" aria-hidden="true">♡</div><div><h2>Как сочетаются ваши карты?</h2><p>Укажите данные двух людей. Мы сравним основные положения планет и объясним сильные стороны и различия простыми словами.</p></div></div><form className="compatibility-form" onSubmit={submit}>
      <PersonFields
  person={first}
  index={0}
  cities={cities}
  onChange={setFirst}
  onFieldKeyDown={handleFieldKeyDown}
/>

<PersonFields
  person={second}
  index={1}
  cities={cities}
  onChange={setSecond}
  onFieldKeyDown={handleFieldKeyDown}
/>{error && <div className="form-error">{error}</div>}<AppButton size="lg" type="submit" disabled={loading}>{loading ? "Сравниваем карты…" : "Посмотреть совместимость"}</AppButton></form><p className="compatibility-disclaimer">Совместимость — интерпретационный инструмент для саморефлексии. Реальные отношения зависят от общения, выбора и обстоятельств.</p></section>
  );
}

export default Compatibility;
