// Обёртка над Telegram Web App SDK.
// Безопасно работает и вне Telegram: весь доступ к window.Telegram идёт через ?.
// Серверная авторизация здесь НЕ выполняется — только чтение initData из окружения WebApp.

export function getWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

export function telegramAvailable() {
  return Boolean(getWebApp());
}

export function getInitData() {
  const app = getWebApp();
  return typeof app?.initData === "string" ? app.initData : "";
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// initDataUnsafe — данные без серверной валидации (только для UI/отладки).
export function getInitDataUnsafe() {
  const raw = getInitData();
  if (!raw) return null;
  try {
    const params = new URLSearchParams(raw);
    const user = params.get("user");
    return {
      ...Object.fromEntries(params.entries()),
      user: user ? safeJson(user) : null
    };
  } catch {
    return null;
  }
}

export function getTelegramUser() {
  const app = getWebApp();
  if (app?.initDataUnsafe?.user) return app.initDataUnsafe.user;
  return getInitDataUnsafe()?.user || null;
}

// startParam приходит из ссылки вида https://t.me/<bot>?startapp=<param>.
export function getStartParam() {
  const app = getWebApp();
  if (typeof app?.startParam === "string" && app.startParam) return app.startParam;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("tgWebAppStartParam") || url.searchParams.get("startapp") || null;
  } catch {
    return null;
  }
}

// Referral attribution is only a pending client hint. The backend must validate
// the code and bind it to the authenticated user exactly once.
export function getReferralCode() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("ref") || getStartParam() || null;
  } catch {
    return getStartParam();
  }
}

export function isDarkPreferred() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)")?.matches ?? false;
  } catch {
    return false;
  }
}

export function getColorScheme() {
  const app = getWebApp();
  if (app?.colorScheme === "light" || app?.colorScheme === "dark") return app.colorScheme;
  return isDarkPreferred() ? "dark" : "light";
}

// Telegram.WebApp.ready() — сигнал Telegram, что интерфейс готов.
export function notifyReady() {
  const app = getWebApp();
  if (!app) return;
  try {
    app.ready();
  } catch {
    // вне Telegram — игнорируем
  }
}

// Telegram.WebApp.expand() — раскрыть Mini App на весь экран.
export function expandView() {
  const app = getWebApp();
  if (!app?.expand) return;
  try {
    app.expand();
  } catch {
    // вне Telegram — игнорируем
  }
}
