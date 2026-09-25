import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import StartupErrorBoundary from "./components/StartupErrorBoundary";
import { getWebApp, notifyReady } from "./telegram/initData";
import { applyTelegramTheme, setupTelegramTheme } from "./telegram/theme";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("AstroGuide: #root не найден");
}

function updateTelegramViewport() {
  try {
    const app = getWebApp();

    if (!app) {
      return;
    }

    const height =
      Number(app.viewportStableHeight) ||
      Number(app.viewportHeight) ||
      Number(window.visualViewport?.height) ||
      Number(window.innerHeight);

    if (height > 1) {
      document.documentElement.style.setProperty(
        "--tg-viewport-stable-height",
        `${height}px`
      );
    }

    document.documentElement.style.setProperty(
      "--tg-viewport-height",
      `${Number(app.viewportHeight) || height}px`
    );
  } catch (error) {
    console.warn("[Telegram] viewport update failed:", error);
  }
}

function initializeTelegram() {
  try {
    const app = getWebApp();

    if (!app) {
      console.info("[Telegram] WebApp API is not available");
      return;
    }

    applyTelegramTheme();
    setupTelegramTheme();
    updateTelegramViewport();

    if (typeof app.onEvent === "function") {
      app.onEvent("viewportChanged", updateTelegramViewport);
    }

    if (typeof window.visualViewport?.addEventListener === "function") {
      window.visualViewport.addEventListener(
        "resize",
        updateTelegramViewport
      );
    }

    notifyReady();

    console.info("[Telegram] WebApp initialized", {
      version: app.version,
      viewportHeight: app.viewportHeight,
      viewportStableHeight: app.viewportStableHeight,
      isExpanded: app.isExpanded,
    });
  } catch (error) {
    console.warn("[Telegram] initialization failed (non-fatal):", error);
  }
}

initializeTelegram();

createRoot(rootElement).render(
  <StrictMode>
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  </StrictMode>
);