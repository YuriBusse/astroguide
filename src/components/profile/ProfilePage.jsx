import { useCallback, useEffect, useMemo, useState } from "react";
import AccountPanel from "../AccountPanel";
import AppButton from "../AppButton";
import { cloudConfigured, getCloudCharts, getSession, getValidSession } from "../../utils/cloud";

const STORAGE_KEY = "astroguide_saved_charts";

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

function ProfilePage({ onNavigate }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [charts, setCharts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [premiumStatus, setPremiumStatus] = useState("checking");

  const loadProfile = useCallback(async () => {
    setStatus("loading");
    setError("");
    setPremiumStatus("checking");
    const currentSession = await getValidSession();
    setSession(currentSession);

    if (!currentSession) {
      setCharts([]);
      setPremiumStatus("inactive");
      setStatus("ready");
      return;
    }

    try {
      const loadedCharts = cloudConfigured && currentSession.access_token
        ? await getCloudCharts()
        : readLocalCharts();
      const normalizedCharts = (loadedCharts || []).map(normalizeChart);
      setCharts(normalizedCharts);
      setPremiumStatus(cloudConfigured && normalizedCharts.some((chart) => chart.premium) ? "active" : "inactive");
      setStatus("ready");
    } catch (loadError) {
      setCharts([]);
      setPremiumStatus("inactive");
      setError(loadError.message || "Не удалось загрузить профиль.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    const sync = () => { void loadProfile(); };
    window.addEventListener("astroguide:auth", sync);
    window.addEventListener("astroguide:chart-saved", sync);
    window.addEventListener("astroguide:premium", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("astroguide:auth", sync);
      window.removeEventListener("astroguide:chart-saved", sync);
      window.removeEventListener("astroguide:premium", sync);
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
            {premiumStatus === "checking" ? "Проверяем Premium…" : premiumStatus === "active" ? "✦ Premium активен" : "Premium не подключён"}
          </span>
        </section>

        {error && (
          <div className="profile-state profile-state--error" role="alert">
            <strong>Не удалось загрузить данные</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadProfile()}>Повторить</button>
          </div>
        )}

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
