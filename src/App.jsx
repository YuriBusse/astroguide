import { lazy, Suspense, useEffect, useState } from "react";

import Home from "./screens/Home";
import ChartBirth from "./screens/ChartBirth";
import ComingSoon from "./screens/ComingSoon";
import BottomNav from "./components/BottomNav";
import ProfilePage from "./components/profile/ProfilePage";
import Requisites from "./screens/Requisites";
import TarotPage from "./screens/TarotPage";
import Compatibility from "./screens/Compatibility";
import Forecast from "./screens/Forecast";
import PremiumPreview from "./components/premium/PremiumPreview";
import AdminPage from "./screens/AdminPage";
import { hydrateSessionFromUrl, updatePassword } from "./utils/cloud";

// ChartResult + Swiss Ephemeris загружаются только тогда,
// когда пользователь действительно открыл результат.
const ChartResult = lazy(() => import("./screens/ChartResult"));

// Карты сохраняем в localStorage, чтобы результат переживал перезагрузку WebView.
const PENDING_KEY = "astroguide_pending_chart";

const STUB_SCREENS = {
  charts: {
    title: "Карты",
    icon: "✦",
    description: "Здесь будут ваши сохранённые натальные карты."
  },
  tarot: {
    title: "Таро",
    icon: "🃏",
    description: "Расклады и карты дня появятся здесь."
  },
  profile: {
    title: "Профиль",
    icon: "👤",
    description: "Аккаунт, настройки и история — скоро."
  },
  forecast: {
    title: "Прогноз",
    icon: "◌",
    description: "Персональные прогнозы появятся в следующих обновлениях."
  }
};

function normalizeRoute(path) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function readHash() {
  const pathname = normalizeRoute(window.location.pathname || "/");
  const authPath =
    pathname === "/auth/confirmed" ||
    pathname === "/auth/reset-password";

  if (authPath) return pathname;

  const raw = window.location.hash || "";

  if (raw.includes("access_token=") || raw.includes("type=signup")) {
    return "/auth/confirmed";
  }

  if (raw.includes("type=recovery")) {
    return "/auth/reset-password";
  }

  const path = raw.startsWith("#") ? raw.slice(1) : raw;
  return normalizeRoute(path || "/");
}

function readInitialRoute() {
  const pathname = normalizeRoute(window.location.pathname || "/");

  if (pathname === "/auth/confirmed" || pathname === "/auth/reset-password") {
    return pathname;
  }

  if (new URLSearchParams(window.location.search).has("astroguide_order")) {
    return "/chart-result";
  }

  return readHash();
}

function loadPendingChart() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ChartResultFallback() {
  return (
    <section
      className="screen"
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "24px"
      }}
    >
      <div>
        <div className="calc-spinner" />
        <p>Загружаем расчёт карты…</p>
      </div>
    </section>
  );
}


const TELEGRAM_RETURN_URL =
  "https://t.me/AstroGuideAppBot/email?startapp=email_confirmed";

function EmailConfirmedScreen({ onNavigate }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    hydrateSessionFromUrl()
      .then((session) => {
        if (!active) return;
        setStatus(session ? "success" : "error");
        if (!session) {
          setError("Не удалось подтвердить почту. Возможно, ссылка уже использована или устарела.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setError(err.message || "Не удалось подтвердить почту.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <section className="screen" style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <div style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}>
          <div className="calc-spinner" />
          <p>Подтверждаем почту…</p>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="screen" style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <div style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "14px" }}>⚠️</div>
          <h2>Не удалось подтвердить почту</h2>
          <p style={{ opacity: 0.75, lineHeight: 1.5 }}>{error}</p>
          <button type="button" className="account-submit" onClick={() => onNavigate("/")} style={{ marginTop: "18px" }}>
            Вернуться в AstroGuide →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen" style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>✓</div>
        <span className="eyebrow">ASTROGUIDE ACCOUNT</span>
        <h2>Почта подтверждена</h2>
        <p style={{ opacity: 0.75, lineHeight: 1.5 }}>
          Ваш аккаунт подтверждён. Теперь можно вернуться в Telegram и продолжить работу с AstroGuide.
        </p>
        <button
          type="button"
          className="account-submit"
          onClick={() => { window.location.href = TELEGRAM_RETURN_URL; }}
          style={{ marginTop: "18px" }}
        >
          Вернуться в Telegram →
        </button>
        <button
          type="button"
          className="account-confirm-email__back"
          onClick={() => onNavigate("/")}
          style={{ marginTop: "10px" }}
        >
          Остаться на сайте
        </button>
      </div>
    </section>
  );
}

function PasswordResetScreen({ onNavigate }) {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateSessionFromUrl()
      .then((session) => {
        if (!active) return;
        if (!session) {
          setError("Ссылка для восстановления пароля недействительна или устарела.");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Не удалось открыть восстановление пароля.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    if (password !== repeatPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSaved(true);
      setMessage("Пароль успешно изменён. Теперь можно войти в AstroGuide с новым паролем.");
      setPassword("");
      setRepeatPassword("");
    } catch (err) {
      setError(err.message || "Не удалось изменить пароль.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ready && !error) {
    return (
      <section className="screen" style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
        <div style={{ textAlign: "center" }}><div className="calc-spinner" /><p>Проверяем ссылку…</p></div>
      </section>
    );
  }

  return (
    <section className="screen" style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: "460px", width: "100%" }}>
        <span className="eyebrow">ASTROGUIDE ACCOUNT</span>
        <h2>{saved ? "Пароль изменён" : "Восстановление пароля"}</h2>

        {saved ? (
          <>
            <p style={{ opacity: 0.75, lineHeight: 1.5 }}>{message}</p>
            <button type="button" className="account-submit" onClick={() => onNavigate("/")} style={{ marginTop: "18px" }}>
              Вернуться в AstroGuide →
            </button>
          </>
        ) : error ? (
          <>
            <p style={{ opacity: 0.75, lineHeight: 1.5 }}>{error}</p>
            <button type="button" className="account-submit" onClick={() => onNavigate("/")} style={{ marginTop: "18px" }}>
              Вернуться в AstroGuide →
            </button>
          </>
        ) : (
          <form className="account-form" onSubmit={submit} style={{ marginTop: "18px" }}>
            <label>
              <span>Новый пароль</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" minLength={6} autoComplete="new-password" />
            </label>
            <label>
              <span>Повторите пароль</span>
              <input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} placeholder="Введите пароль ещё раз" minLength={6} autoComplete="new-password" />
            </label>
            <button className="account-submit" type="submit" disabled={loading}>
              {loading ? "Сохраняем…" : "Сохранить новый пароль"} <span>→</span>
            </button>
          </form>
        )}

        {message && !saved && <div className="account-message" style={{ marginTop: "14px", whiteSpace: "pre-line" }}>{message}</div>}
        {error && !saved && <div className="account-error" style={{ marginTop: "14px" }}>{error}</div>}
      </div>
    </section>
  );
}

function App() {
  const [route, setRoute] = useState(readInitialRoute);
  const [pendingChart, setPendingChart] = useState(loadPendingChart);
  const [chartReturnRoute, setChartReturnRoute] = useState("/");
  const [savedCompatibilityResult, setSavedCompatibilityResult] = useState(null);
  const [savedTarotResult, setSavedTarotResult] = useState(null);
  const [savedForecastResult, setSavedForecastResult] = useState(null);
  const [reportsRequested, setReportsRequested] = useState(false);
  const [premiumPreview, setPremiumPreview] = useState(null);

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    const onOpenChart = (event) => {
      const chart = event.detail;
      if (!chart?.date || !chart?.time || !chart?.city) return;
      setChartReturnRoute("/profile");
      setPendingChart(chart);
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(chart));
      } catch {
        // Продолжаем работать в памяти.
      }
      navigateToChartResult();
    };
    const onOpenReports = (event) => {
      const chart = event.detail;
      if (!chart?.date || !chart?.time || !chart?.city) return;
      setChartReturnRoute("/profile");
      setPendingChart(chart);
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify(chart));
      } catch {
        // Продолжаем работать в памяти.
      }
      navigateToChartResult();
      setReportsRequested(true);
    };
    const onOpenCompatibilityResult = (event) => {
      const result = event.detail;
      if (!result?.result_data) return;
      setSavedCompatibilityResult({
        first: result.source_data?.first,
        second: result.source_data?.second,
        firstPlanets: result.result_data.firstPlanets,
        secondPlanets: result.result_data.secondPlanets,
        crossAspects: result.result_data.crossAspects
      });
      navigate("/compatibility");
    };
    const onOpenTarotResult = (event) => {
      const result = event.detail;
      if (!result?.result_data?.reading) return;
      setSavedTarotResult(result);
      navigate("/tarot");
    };
    const onOpenForecastResult = (event) => {
      if (!event.detail?.result_data) return;
      setSavedForecastResult(event.detail);
      navigate("/forecast");
    };
    const onPremiumPreview = (event) => setPremiumPreview(event.detail || {});

    window.addEventListener("hashchange", onHash);
    window.addEventListener("astroguide:open-chart", onOpenChart);
    window.addEventListener("astroguide:open-reports", onOpenReports);
    window.addEventListener("astroguide:open-compatibility-result", onOpenCompatibilityResult);
    window.addEventListener("astroguide:open-tarot-result", onOpenTarotResult);
    window.addEventListener("astroguide:open-forecast-result", onOpenForecastResult);
    window.addEventListener("astroguide:premium-preview", onPremiumPreview);

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("astroguide:open-chart", onOpenChart);
      window.removeEventListener("astroguide:open-reports", onOpenReports);
      window.removeEventListener("astroguide:open-compatibility-result", onOpenCompatibilityResult);
      window.removeEventListener("astroguide:open-tarot-result", onOpenTarotResult);
      window.removeEventListener("astroguide:open-forecast-result", onOpenForecastResult);
      window.removeEventListener("astroguide:premium-preview", onPremiumPreview);
    };
  }, []);

  const navigate = (path) => {
    const normalized = normalizeRoute(path);

    // Состояние меняем независимо от URL.
    setRoute(normalized);

    try {
      const next = `#${normalized}`;

      if (window.location.hash !== next) {
        window.history.replaceState(null, "", next);
      }
    } catch {
      // URL не критичен — React state уже обновлён.
    }
  };

  const navigateToChartResult = () => {
    const normalized = "/chart-result";
    setRoute(normalized);
    try {
      const next = `#${normalized}`;
      if (window.location.hash !== next) window.history.replaceState(null, "", next);
    } catch {
      // URL не критичен — React state уже обновлён.
    }
  };

  const completeChart = (chart) => {
    setChartReturnRoute("/chart-birth");
    setPendingChart(chart);

    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(chart));
    } catch {
      // Продолжаем работать в памяти.
    }

    navigate("/chart-result");
  };

  let screen;

  if (route === "/") {
    screen = <Home onNavigate={navigate} />;
  } else if (route === "/auth/confirmed") {
    screen = <EmailConfirmedScreen onNavigate={navigate} />;
  } else if (route === "/auth/reset-password") {
    screen = <PasswordResetScreen onNavigate={navigate} />;
  } else if (route === "/chart-birth") {
    screen = (
      <ChartBirth
        onComplete={completeChart}
        onBack={() => navigate("/")}
      />
    );
  } else if (route === "/chart-result") {
    screen = (
      <Suspense fallback={<ChartResultFallback />}>
        <ChartResult
          chart={pendingChart}
          onNavigate={navigate}
          onBack={() => navigate(chartReturnRoute)}
          reportsRequested={reportsRequested}
          onReportsRequestHandled={() => setReportsRequested(false)}
        />
      </Suspense>
    );
  } else if (route === "/profile") {
    screen = <ProfilePage onNavigate={navigate} />;
  } else if (route === "/admin" || route.startsWith("/admin/users/")) {
    screen = <AdminPage onNavigate={navigate} userId={route.startsWith("/admin/users/") ? decodeURIComponent(route.slice("/admin/users/".length)) : ""} />;
  } else if (route === "/tarot") {
    screen = <TarotPage savedResult={savedTarotResult} />;
  } else if (route === "/compatibility") {
    screen = <Compatibility savedResult={savedCompatibilityResult} />;
  } else if (route === "/forecast") {
    screen = <Forecast savedResult={savedForecastResult} />;
  } else if (route === "/requisites") {
    screen = <Requisites />;
  } else {
    const stub = STUB_SCREENS[route.slice(1)];

    if (stub) {
      screen = (
        <ComingSoon
          {...stub}
          onBack={() => navigate("/")}
        />
      );
    } else {
      screen = <Home onNavigate={navigate} />;
    }
  }

  const showNav = !route.startsWith("/auth/");

  return (
    <div className="app-shell">
      <main className="app-content">
        {screen}
      </main>

      {showNav && (
        <BottomNav
          route={route}
          onNavigate={navigate}
        />
      )}
      {premiumPreview && <PremiumPreview {...premiumPreview} onClose={() => setPremiumPreview(null)} onPurchase={() => setPremiumPreview((current) => ({ ...current, purchaseUnavailable: true }))} />}
    </div>
  );
}

export default App;
