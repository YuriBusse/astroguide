import { useCallback, useEffect, useMemo, useState } from "react";
import AccountPanel from "../AccountPanel";
import AppButton from "../AppButton";
import ReferralCard from "./ReferralCard";
import { cloudConfigured, getCloudCharts, getCloudResults, getSession, getValidSession } from "../../utils/cloud";

const STORAGE_KEY = "astroguide_saved_charts";
const SERVER_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_ASTROGUIDE_SERVER_URL || "";

function readLocalCharts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function normalizeChart(chart) {
  return {
    id: chart.id,
    city: chart.city,
    date: chart.birth_date || chart.date,
    time: chart.birth_time || chart.time,
    timezone: chart.timezone,
    latitude: chart.latitude,
    longitude: chart.longitude,
    premium: Boolean(chart.premium),
    createdAt: chart.created_at || chart.createdAt || null
  };
}

function formatCreatedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function getUserLabel(session) {
  const user = session?.user || {};
  const metadata = user.user_metadata || {};
  const telegramName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return metadata.name || telegramName || user.email || user.username || "Пользователь AstroGuide";
}

function getUserIdentifier(session) {
  const user = session?.user || {};
  return user.email || (user.username ? `@${user.username}` : "Аккаунт AstroGuide");
}

function ProfileChartCard({ chart }) {
  const openChart = () => {
    window.dispatchEvent(new CustomEvent("astroguide:open-chart", { detail: chart }));
  };

  return (
    <article className="profile-chart-card">
      <div className="profile-chart-card__icon" aria-hidden="true">✦</div>
      <div className="profile-chart-card__body">
        <strong>{chart.city || "Натальная карта"}</strong>
        <span>{chart.date || "Дата не указана"}{chart.time ? ` · ${chart.time}` : ""}</span>
        {chart.createdAt && <small>Сохранена {formatCreatedAt(chart.createdAt)}</small>}
      </div>
      <button type="button" className="profile-chart-card__open" onClick={openChart}>Открыть</button>
    </article>
  );
}

function ProfileResultCard({ result }) {
  const isTarot = result.result_type === "tarot";
  const isForecast = result.result_type === "forecast";
  const isReport = result.result_type === "report";
  const typeLabel = isTarot ? "Таро" : isForecast ? "Прогноз" : isReport ? "Premium-отчёт" : "Совместимость";
  const title = result.title || typeLabel;
  const openResult = () => window.dispatchEvent(new CustomEvent(isTarot ? "astroguide:open-tarot-result" : isForecast ? "astroguide:open-forecast-result" : "astroguide:open-compatibility-result", { detail: result }));
  return (
    <article className="profile-chart-card profile-result-card">
      <div className="profile-chart-card__icon" aria-hidden="true">{isTarot ? "🔮" : isForecast ? "◌" : "♡"}</div>
      <div className="profile-chart-card__body"><strong>{title}</strong><span>{typeLabel}</span>{result.created_at && <small>Сохранён {formatCreatedAt(result.created_at)}</small>}</div>
      <button type="button" className="profile-chart-card__open" onClick={openResult}>Открыть</button>
    </article>
  );
}

function ProfilePage({ onNavigate }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [charts, setCharts] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [premiumStatus, setPremiumStatus] = useState("checking");
  const [premiumChart, setPremiumChart] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);
  const [freeAnalysis, setFreeAnalysis] = useState(null);

  const loadProfile = useCallback(async () => {
    setStatus("loading");
    setError("");
    setPremiumStatus("checking");
    const currentSession = await getValidSession();
    setSession(currentSession);

    if (!currentSession) {
      setCharts([]);
      setResults([]);
      setPremiumChart(null);
      setReferralInfo(null);
      setFreeAnalysis(null);
      setPremiumStatus("inactive");
      setStatus("ready");
      return;
    }

    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref");
      if (referralCode) {
        await fetch(`${SERVER_URL}/api/referral/attach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession.access_token}`
          },
          body: JSON.stringify({ code: referralCode })
        });
      }
      const referralResponse = await fetch(`${SERVER_URL}/api/referral`, {
        headers: { Authorization: `Bearer ${currentSession.access_token}` }
      });
      if (!referralResponse.ok) throw new Error("Referral API unavailable");
      setReferralInfo(await referralResponse.json());
      const freeAnalysisResponse = await fetch(`${SERVER_URL}/api/free-analysis`, {
        headers: { Authorization: `Bearer ${currentSession.access_token}` }
      });
      if (!freeAnalysisResponse.ok) throw new Error("Free analysis API unavailable");
      setFreeAnalysis(await freeAnalysisResponse.json());
    } catch {
      setReferralInfo(null);
      setFreeAnalysis(null);
    }

    let normalizedCharts = [];
    try {
      const loadedCharts = cloudConfigured && currentSession.access_token
        ? await getCloudCharts()
        : readLocalCharts();
      normalizedCharts = (loadedCharts || []).map(normalizeChart);
      setCharts(normalizedCharts);
      try {
        setResults(await getCloudResults());
      } catch (resultsError) {
        console.warn("Не удалось загрузить сохранённые результаты:", resultsError);
        setResults([]);
      }
    } catch (loadError) {
      setCharts([]);
      setPremiumChart(null);
      setPremiumStatus("inactive");
      console.error("Не удалось загрузить профиль:", loadError);
      setError("Не удалось загрузить данные. Попробуйте ещё раз.");
      setStatus("error");
      return;
    }

    const chartCandidates = normalizedCharts.filter((chart) => chart.date && chart.time && chart.city);
    if (!cloudConfigured || !chartCandidates.length) {
      setPremiumChart(null);
      setPremiumStatus("inactive");
      setStatus("ready");
      return;
    }

    try {
      const premiumResults = await Promise.all(chartCandidates.map(async (chart) => {
        const query = new URLSearchParams({ date: chart.date, time: chart.time, city: chart.city });
        const response = await fetch(`${SERVER_URL}/api/premium-status?${query.toString()}`, {
          headers: { Authorization: `Bearer ${currentSession.access_token}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Не удалось проверить Premium.");
        return { chart, premium: Boolean(data.premium) };
      }));
      const activeChart = premiumResults.find((result) => result.premium)?.chart || null;
      setPremiumChart(activeChart);
      setPremiumStatus(activeChart ? "active" : "inactive");
    } catch (premiumError) {
      setPremiumChart(null);
      setPremiumStatus("error");
      setError(premiumError.message || "Не удалось проверить Premium.");
    }
    setStatus("ready");
  }, []);

  useEffect(() => {
    void loadProfile();
    const sync = () => { void loadProfile(); };
    window.addEventListener("astroguide:auth", sync);
    window.addEventListener("astroguide:chart-saved", sync);
    window.addEventListener("astroguide:premium", sync);
    window.addEventListener("astroguide:result-saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("astroguide:auth", sync);
      window.removeEventListener("astroguide:chart-saved", sync);
      window.removeEventListener("astroguide:premium", sync);
      window.removeEventListener("astroguide:result-saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadProfile]);

  const userLabel = useMemo(() => getUserLabel(session), [session]);
  const userIdentifier = useMemo(() => getUserIdentifier(session), [session]);
  const initials = userLabel === "Пользователь AstroGuide" ? "✦" : userLabel.trim().slice(0, 1).toUpperCase();

  const openAccount = () => setAccountOpen(true);
  const closeAccount = () => {
    setAccountOpen(false);
    void loadProfile();
  };

  const openReports = () => {
    const reportChart = premiumChart || charts[0];
    if (!reportChart) {
      onNavigate("/chart-birth");
      return;
    }
    window.dispatchEvent(new CustomEvent("astroguide:open-reports", { detail: reportChart }));
  };

  const premiumLabel = premiumStatus === "checking"
    ? "Проверяем Premium…"
    : premiumStatus === "active"
      ? "Premium активен"
      : premiumStatus === "error"
        ? "Статус Premium недоступен"
        : "Premium не подключён";

  if (status === "loading") {
    return (
      <section className="screen profile-page" aria-busy="true">
        <div className="screen-top"><div className="screen-top__title"><span className="eyebrow">ASTROGUIDE</span><h1>Профиль</h1></div></div>
        <div className="profile-loading"><span className="calc-spinner" /><strong>Загружаем профиль…</strong><small>Проверяем аккаунт, Premium и сохранённые карты.</small></div>
      </section>
    );
  }

  if (!session) {
    return (
      <>
        <section className="screen profile-page profile-page--guest">
          <div className="profile-guest__icon" aria-hidden="true">👤</div>
          <span className="eyebrow">ASTROGUIDE ACCOUNT</span>
          <h1>Войдите в AstroGuide</h1>
          <p>Сохраняйте натальные карты и возвращайтесь к ним позже.</p>
          <AppButton onClick={openAccount}>Войти</AppButton>
        </section>
        <AccountPanel open={accountOpen} onClose={closeAccount} onAuthChange={loadProfile} />
      </>
    );
  }

  return (
    <>
      <section className="screen profile-page">
        <div className="screen-top"><div className="screen-top__title"><span className="eyebrow">ASTROGUIDE ACCOUNT</span><h1>Профиль</h1></div></div>

        <section className="profile-header-card">
          <div className="profile-header-card__avatar" aria-hidden="true">{initials}</div>
          <div className="profile-header-card__body">
            <strong>{userLabel}</strong>
            <span>{userIdentifier}</span>
          </div>
          <span className={`profile-premium-badge profile-premium-badge--${premiumStatus}`}>
            {premiumStatus === "active" ? "✦ " : ""}{premiumLabel}
          </span>
        </section>

        {error && (
          <div className="profile-state profile-state--error" role="alert">
            <strong>Не удалось загрузить данные</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadProfile()}>Повторить</button>
          </div>
        )}

        <section className="profile-section profile-reports">
          <div className="profile-reports__copy">
            <span className="eyebrow">ASTROGUIDE PREMIUM</span>
            <h2>Premium</h2>
            <p>{premiumStatus === "active" ? "Premium активен — расширенные возможности доступны." : "Premium не подключён — базовые результаты остаются бесплатными."}</p>
          </div>
          <AppButton
            variant={premiumStatus === "active" ? "primary" : "secondary"}
            onClick={premiumStatus === "active" ? openReports : () => window.dispatchEvent(new CustomEvent("astroguide:premium-preview", { detail: { productId: "premium_subscription", accessType: "subscription", title: "AstroGuide Premium" } }))}
            disabled={premiumStatus === "checking" || premiumStatus === "error"}
          >
            {premiumStatus === "active" ? "Открыть отчёты" : "Подробнее о Premium"}
          </AppButton>
        </section>

        <section className="profile-section">
          <div className="profile-section__heading"><div><span className="eyebrow">ИСТОРИЯ</span><h2>Мои натальные карты</h2></div><b>{charts.length}</b></div>
          {charts.length ? (
            <div className="profile-chart-list">{charts.map((chart) => <ProfileChartCard chart={chart} key={chart.id} />)}</div>
          ) : (
            <div className="profile-empty">
              <span className="profile-empty__icon" aria-hidden="true">✦</span>
              <strong>У вас пока нет сохранённых карт</strong>
              <p>Создайте натальную карту, чтобы сохранить её здесь и возвращаться к расчёту позже.</p>
              <AppButton size="sm" onClick={() => onNavigate("/chart-birth")}>Создать натальную карту</AppButton>
            </div>
          )}
        </section>

        <section className="profile-section">
          <div className="profile-section__heading"><div><span className="eyebrow">ИСТОРИЯ</span><h2>Мои результаты</h2></div><b>{results.length}</b></div>
          {results.length ? <div className="profile-chart-list">{results.map((result) => <ProfileResultCard result={result} key={result.id} />)}</div> : <div className="profile-empty"><strong>Здесь будут ваши сохранённые разборы</strong><p>Создайте первый результат, чтобы возвращаться к нему позже.</p><AppButton size="sm" onClick={() => onNavigate("/chart-birth")}>Создать первый результат</AppButton></div>}
        </section>

        <ReferralCard
          referralCode={referralInfo?.code || null}
          invitedCount={referralInfo?.invitedCount || 0}
          qualifiedCount={referralInfo?.qualifiedCount || 0}
          rewardsCount={referralInfo?.rewardsCount || 0}
          freeAnalysisBalance={freeAnalysis?.balance || 0}
        />

        <section className="profile-section profile-actions">
          <div className="profile-section__heading"><div><span className="eyebrow">БЫСТРЫЕ ДЕЙСТВИЯ</span><h2>Продолжить путь</h2></div></div>
          <AppButton onClick={() => onNavigate("/chart-birth")}>Создать натальную карту</AppButton>
          <AppButton variant="secondary" onClick={openAccount}>Управление аккаунтом</AppButton>
        </section>

      </section>
      <AccountPanel open={accountOpen} onClose={closeAccount} onAuthChange={loadProfile} />
    </>
  );
}

export default ProfilePage;
