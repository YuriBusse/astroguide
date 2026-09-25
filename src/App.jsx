import { lazy, Suspense, useEffect, useState } from "react";

import Home from "./screens/Home";
import ChartBirth from "./screens/ChartBirth";
import ComingSoon from "./screens/ComingSoon";
import BottomNav from "./components/BottomNav";

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
  }
};

const NAV_ROUTES = ["/", "/charts", "/tarot", "/profile"];

function normalizeRoute(path) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function readHash() {
  const raw = window.location.hash || "#/";
  const path = raw.startsWith("#") ? raw.slice(1) : raw;
  return normalizeRoute(path);
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

function App() {
  const [route, setRoute] = useState(readHash);
  const [pendingChart, setPendingChart] = useState(loadPendingChart);

  useEffect(() => {
    const onHash = () => setRoute(readHash());

    window.addEventListener("hashchange", onHash);

    return () => {
      window.removeEventListener("hashchange", onHash);
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

  const completeChart = (chart) => {
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
          onBack={() => navigate("/")}
        />
      </Suspense>
    );
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

  const showNav = NAV_ROUTES.includes(route);

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
    </div>
  );
}

export default App;