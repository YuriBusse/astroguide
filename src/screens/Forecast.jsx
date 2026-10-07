import { useEffect, useMemo, useState } from "react";
import AppButton from "../components/AppButton";
import { getCloudCharts, getSession, saveCloudResult } from "../utils/cloud";
import { calculateForecast } from "../utils/forecast";
import PremiumTeaser from "../components/premium/PremiumTeaser";

const LOCAL_KEY = "astroguide_saved_charts";
const PERIODS = [{ id: "today", label: "Сегодня" }, { id: "tomorrow", label: "Завтра" }, { id: "week", label: "7 дней" }];

function localCharts() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]").map(normalizeChart); } catch { return []; } }
function normalizeChart(chart) { return { ...chart, date: chart.date || chart.birth_date, time: chart.time || chart.birth_time }; }

function ForecastResult({ result, onReset }) {
  const [saveState, setSaveState] = useState("idle");
  const save = async () => {
    if (saveState !== "idle") return;
    if (!getSession()?.access_token) { setSaveState("auth"); return; }
    setSaveState("saving");
    try { await saveCloudResult({ resultType: "forecast", title: `Прогноз на ${result.displayDate}`, sourceData: { date: result.date, period: result.period, chart: result.chart }, resultData: result }); setSaveState("saved"); window.dispatchEvent(new Event("astroguide:result-saved")); } catch { setSaveState("error"); }
  };
  return <section className="screen forecast-page">
    <div className="screen-top"><div className="screen-top__title"><span className="eyebrow">ASTROGUIDE · ПРОГНОЗ</span><h1>Прогноз на {result.displayDate}</h1></div></div>
    <div className="forecast-disclaimer">Для карты из {result.chart.city}. {result.limitation}</div>
    <section className="forecast-main"><span className="eyebrow">ГЛАВНАЯ ТЕМА</span><h2>{result.mainTheme?.area || "Без сильного акцента"}</h2><p>{result.mainTheme?.summary || result.advice}</p>{result.mainTheme?.why && <><strong>Почему</strong><p>{result.mainTheme.why}</p><p>{result.mainTheme.manifestation}</p></>}</section>
    {result.period === "week" && <section className="forecast-week"><span className="eyebrow">ДЕНЬ ЗА ДНЁМ</span>{result.days?.map((day) => <article key={day.date}><strong>{day.displayDate}</strong><span>{day.mainTheme ? `${day.mainTheme.area}: ${day.mainTheme.summary}` : "Без сильного аспекта"}</span></article>)}</section>}
    <div className="forecast-grid">{result.themes.map((theme) => <article className="forecast-card" key={`${theme.area}-${theme.transitPlanet}-${theme.natalPlanet}`}><span className="eyebrow">{theme.area}</span><p>{theme.summary}</p><small>{theme.why}</small><strong>Как может проявиться</strong><p>{theme.manifestation}</p><strong>Что сделать</strong><p>{theme.action}</p></article>)}</div>
    <section className="forecast-advice"><span className="eyebrow">СОВЕТ ДНЯ</span><p>{result.advice}</p></section>
    <details className="forecast-technical"><summary>🧭 На чём основан прогноз</summary><p>Сравниваем вашу натальную карту с текущими позициями планет. Орб — расстояние до точного аспекта: чем он меньше, тем точнее связь. Дом добавляет сферу жизни, если координаты карты доступны.</p>{result.aspects.length ? result.aspects.map((item) => <div key={`${item.transitPlanet}-${item.natalPlanet}-${item.name}-${item.day || "day"}`}><b>{item.transitName} → натальное {item.natalName}</b><span>{item.symbol} {item.name}, орб {item.orb.toFixed(2)}°{item.house ? ` · ${item.house} дом` : ""}{item.day ? ` · ${item.day}` : ""}</span></div>) : <p>Сильных аспектов в выбранном периоде не найдено.</p>}</details>
    <PremiumTeaser productId="forecast_extended" productName="расширенный прогноз" title="Расширенный прогноз" description="Бесплатный прогноз даёт короткий ориентир. Premium добавит больше транзитов, тем периода и персональных рекомендаций." items={["дополнительные темы и транзиты", "более подробные рекомендации", "расширенный разбор периода"]} onAction={() => window.dispatchEvent(new Event("astroguide:checkout-requested"))} />
    <div className="forecast-actions"><AppButton onClick={save} disabled={saveState === "saving" || saveState === "saved"}>{saveState === "saving" ? "Сохраняем…" : saveState === "saved" ? "✓ Прогноз сохранён" : "Сохранить прогноз"}</AppButton><AppButton variant="secondary" onClick={onReset}>← Назад к выбору</AppButton></div>
    {saveState === "auth" && <p className="form-error">Войдите в аккаунт, чтобы сохранить прогноз в профиле.</p>}{saveState === "error" && <p className="form-error">Не удалось сохранить прогноз. Попробуйте ещё раз.</p>}
  </section>;
}

export default function Forecast({ savedResult = null }) {
  const [charts, setCharts] = useState([]); const [period, setPeriod] = useState("today"); const [result, setResult] = useState(savedResult?.result_data || null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (savedResult?.result_data) { setResult(savedResult.result_data); return; } (async () => { try { const cloud = await getCloudCharts(); setCharts(cloud?.length ? cloud.map(normalizeChart) : localCharts()); } catch { setCharts(localCharts()); } })(); }, [savedResult]);
  const chart = useMemo(() => charts[0], [charts]);
  const calculate = async () => { if (!chart) return; setLoading(true); setError(""); try { setResult(await calculateForecast(chart, period)); } catch (e) { setError(e.message || "Не удалось рассчитать прогноз."); } finally { setLoading(false); } };
  if (result) return <ForecastResult result={result} onReset={() => setResult(null)} />;
 return <section className="screen forecast-page"><div className="screen-top"><div className="screen-top__title"><span className="eyebrow">ASTROGUIDE</span><h1>Прогноз</h1></div></div><div className="forecast-intro"><span aria-hidden="true">◌</span><div><h2>Персональный прогноз</h2><p>Сравним текущие транзиты с вашей натальной картой. Каждый вывод покажет, какой аспект его вызвал.</p></div></div>{!chart ? <div className="profile-empty"><strong>Сначала создайте натальную карту</strong><p>Она нужна для персонального прогноза.</p><AppButton onClick={() => { window.location.hash = "#/chart-birth"; window.dispatchEvent(new HashChangeEvent("hashchange")); }}>Создать карту</AppButton></div> : <><div className="forecast-periods" role="tablist">{PERIODS.map((item) => <button type="button" key={item.id} className={period === item.id ? "is-active" : ""} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div><p className="forecast-note">7 дней рассчитываются отдельно для каждого дня, а не по одной средней дате.</p><AppButton size="lg" onClick={calculate} disabled={loading}>{loading ? "Считаем транзиты…" : "Получить прогноз"}</AppButton></>} {error && <div className="form-error">Не удалось рассчитать прогноз. Попробуйте ещё раз.</div>}</section>;
}
