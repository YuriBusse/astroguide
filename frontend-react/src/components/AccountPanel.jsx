import { useEffect, useState } from "react";
import {
  cloudConfigured,
  deleteCloudChart,
  getCloudCharts,
  getSession,
  signIn,
  signOut,
  signUp
} from "../utils/cloud";

const STORAGE_KEY = "astroguide_saved_charts";
const PREMIUM_KEY = "astroguide_premium";

function readCharts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function normalizeCloudChart(chart) {
  return {
    id: chart.id,
    city: chart.city,
    date: chart.birth_date,
    time: chart.birth_time,
    timezone: chart.timezone,
    latitude: chart.latitude,
    longitude: chart.longitude,
    premium: Boolean(chart.premium)
  };
}

function AccountPanel({ open, onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [charts, setCharts] = useState([]);
  const [premium, setPremium] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setPremium(localStorage.getItem(PREMIUM_KEY) === "true");
    if (cloudConfigured && getSession()) {
      try {
        const cloudCharts = await getCloudCharts();
        setCharts((cloudCharts || []).map(normalizeCloudChart));
        return;
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить карты с сервера. Показываем локальные данные.");
      }
    }
    setCharts(readCharts());
  };

  useEffect(() => {
    if (!open) return;
    setSession(getSession());
    setMessage("");
    setError("");
    refresh();
  }, [open]);

  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      refresh();
    };
    window.addEventListener("astroguide:chart-saved", sync);
    window.addEventListener("astroguide:premium", sync);
    window.addEventListener("astroguide:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("astroguide:chart-saved", sync);
      window.removeEventListener("astroguide:premium", sync);
      window.removeEventListener("astroguide:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email || !password || (mode === "register" && !name)) {
      setError("Заполните обязательные поля.");
      return;
    }

    setLoading(true);
    try {
      const result = mode === "register"
        ? await signUp({ email, password, name })
        : await signIn({ email, password });

      setSession(getSession());
      setMessage(
        result.localOnly
          ? "Готово. Сейчас работает локальный режим. После настройки Supabase аккаунт будет синхронизироваться между устройствами."
          : (mode === "register"
            ? "Аккаунт создан. Если включено подтверждение email, проверьте почту."
            : "Вы вошли в аккаунт.")
      );
      await refresh();
    } catch (err) {
      setError(err.message || "Не удалось выполнить операцию.");
    } finally {
      setLoading(false);
    }
  };

  const removeChart = async (id) => {
    setError("");
    if (cloudConfigured && session?.access_token) {
      try {
        await deleteCloudChart(id);
        setCharts((current) => current.filter((chart) => chart.id !== id));
        return;
      } catch (err) {
        setError(err.message || "Не удалось удалить карту.");
        return;
      }
    }
    const next = charts.filter((chart) => chart.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCharts(next);
  };

  const logout = () => {
    signOut();
    setSession(null);
    setCharts(readCharts());
    setMessage("Вы вышли из аккаунта.");
  };

  return (
    <div className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="account-modal__backdrop" onClick={onClose} />
      <div className="account-modal__card">
        <button className="account-modal__close" type="button" onClick={onClose} aria-label="Закрыть">×</button>

        <div className="account-modal__top">
          <div>
            <span className="eyebrow">ASTROGUIDE ACCOUNT</span>
            <h2 id="account-title">Мои карты</h2>
            <p>{session ? "Ваши карты и статус Premium." : "Сохраняйте расчёты и возвращайтесь к ним позже."}</p>
          </div>
          <span className={`account-status ${premium ? "account-status--premium" : ""}`}>
            {premium ? "✦ Premium" : session ? "Бесплатный аккаунт" : "Гость"}
          </span>
        </div>

        {session ? (
          <>
            <div className="account-signed">
              <div><span className="eyebrow">ВЫ ВОШЛИ КАК</span><strong>{session.user?.email || email}</strong></div>
              <button type="button" className="account-logout" onClick={logout}>Выйти</button>
            </div>
          </>
        ) : (
          <>
            <div className="account-tabs">
              <button className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setMessage(""); setError(""); }}>Войти</button>
              <button className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setMessage(""); setError(""); }}>Регистрация</button>
            </div>

            <form className="account-form" onSubmit={submit}>
              {mode === "register" && (
                <label><span>Имя</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" /></label>
              )}
              <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label><span>Пароль</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} /></label>
              <button className="account-submit" type="submit" disabled={loading}>{loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"} <span>→</span></button>
            </form>
          </>
        )}

        {message && <div className="account-message">{message}</div>}
        {error && <div className="account-error">{error}</div>}

        <div className="saved-charts">
          <div className="saved-charts__heading">
            <div><span className="eyebrow">СОХРАНЁННЫЕ РАСЧЁТЫ</span><h3>Мои натальные карты</h3></div>
            <span>{charts.length}</span>
          </div>

          {charts.length ? (
            <div className="saved-chart-list">
              {charts.map((chart) => (
                <article className="saved-chart" key={chart.id}>
                  <div className="saved-chart__icon">✦</div>
                  <div className="saved-chart__body">
                    <strong>{chart.city}</strong>
                    <span>{chart.date} · {chart.time}</span>
                  </div>
                  <div className="saved-chart__actions">
                    <button
                      type="button"
                      className="saved-chart__open"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("astroguide:open-chart", { detail: chart }));
                        onClose();
                      }}
                    >Открыть</button>
                    <span className="saved-chart__badge">{chart.premium ? "Premium" : "Free"}</span>
                    <button type="button" className="saved-chart__delete" onClick={() => removeChart(chart.id)} aria-label="Удалить карту">×</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="saved-charts__empty">Сохранённых карт пока нет. После расчёта нажмите «Сохранить карту».</div>
          )}
        </div>

        <small className="account-note">
          {cloudConfigured
            ? "Облачный режим включён: аккаунт и карты синхронизируются через Supabase."
            : "Сейчас используется локальный режим. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY, чтобы включить облачную авторизацию и синхронизацию."}
        </small>
      </div>
    </div>
  );
}

export default AccountPanel;
