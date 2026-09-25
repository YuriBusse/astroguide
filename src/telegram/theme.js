// Применение цветовой темы Telegram Mini App к CSS-переменным интерфейса.
// Вне Telegram используются fallback-палитры (тёмная/светлая по prefers-color-scheme).

import { getWebApp, getColorScheme } from "./initData";

// Соответствие параметров Telegram CSS-переменным темы.
const VAR_MAP = {
  bg_color: "--tg-theme-bg-color",
  secondary_bg_color: "--tg-theme-secondary-bg-color",
  text_color: "--tg-theme-text-color",
  hint_color: "--tg-theme-hint-color",
  link_color: "--tg-theme-link-color",
  button_color: "--tg-theme-button-color",
  button_text_color: "--tg-theme-button-text-color"
};

// Fallback-палитры (используются только вне Telegram, где нет WebApp.themeParams).
export const FALLBACK_THEME_DARK = {
  "--tg-theme-bg-color": "#14101f",
  "--tg-theme-secondary-bg-color": "#1f1830",
  "--tg-theme-text-color": "#f4f0f9",
  "--tg-theme-hint-color": "#a39bb6",
  "--tg-theme-link-color": "#8ab6ff",
  "--tg-theme-button-color": "#b26ef0",
  "--tg-theme-button-text-color": "#fbf5ff"
};

export const FALLBACK_THEME_LIGHT = {
  "--tg-theme-bg-color": "#f7f3ff",
  "--tg-theme-secondary-bg-color": "#ede6fa",
  "--tg-theme-text-color": "#241f33",
  "--tg-theme-hint-color": "#8d86a0",
  "--tg-theme-link-color": "#3a6fd8",
  "--tg-theme-button-color": "#8e4fd6",
  "--tg-theme-button-text-color": "#ffffff"
};

function fallbackPalette() {
  return getColorScheme() === "dark" ? FALLBACK_THEME_DARK : FALLBACK_THEME_LIGHT;
}

// Переносит параметры темы Telegram в CSS-переменные на :root.
export function applyTelegramTheme() {
  const root = document.documentElement;
  if (!root) return;

  const app = getWebApp();
  if (app && typeof app.themeParams === "object" && app.themeParams) {
    for (const [paramKey, cssVar] of Object.entries(VAR_MAP)) {
      const value = app.themeParams[paramKey];
      if (typeof value === "string" && value) {
        root.style.setProperty(cssVar, value);
      } else {
        root.style.removeProperty(cssVar);
      }
    }
  } else {
    // Вне Telegram: снимаем переопределения, чтобы работала CSS-media-палитра ниже.
    for (const cssVar of Object.values(VAR_MAP)) {
      root.style.removeProperty(cssVar);
    }
    const palette = fallbackPalette();
    for (const [cssVar, value] of Object.entries(palette)) {
      root.style.setProperty(cssVar, value);
    }
  }

  root.setAttribute("data-color-scheme", getColorScheme());
}

// Вызывается при старте приложения; подписывается на смену темы внутри Telegram.
export function setupTelegramTheme(onThemeChanged = null) {
  applyTelegramTheme();
  const app = getWebApp();
  if (app && typeof app.onThemeChanged === "function") {
    try {
      app.onThemeChanged(() => {
        applyTelegramTheme();
        if (typeof onThemeChanged === "function") onThemeChanged();
      });
    } catch {
      // вне Telegram — игнорируем
    }
  }
  return applyTelegramTheme;
}