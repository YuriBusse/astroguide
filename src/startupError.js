// ВРЕМЕННАЯ ДИАГНОСТИКА мобильного Telegram WebView.
// Если до/во время старта приложения возникает непойманное исключение,
// пользователь увидит текст ошибки вместо чёрного экрана.
// Модуль намеренно не импортирует ничего: он должен работать даже если
// сломан любой другой модуль приложения.

const OVERLAY_ID = "ag-startup-error";

function formatError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const name = error.name || "Error";
  const message = error.message || String(error);
  const stack = typeof error.stack === "string" ? error.stack : "";
  return stack ? `${name}: ${message}\n\n${stack}` : `${name}: ${message}`;
}

// Рисуем оверлей инлайновыми стилями — не зависим от загрузки CSS.
export function showStartupError(title, error) {
  try {
    if (typeof document === "undefined") return;

    let box = document.getElementById(OVERLAY_ID);
    if (!box) {
      box = document.createElement("div");
      box.id = OVERLAY_ID;
      box.setAttribute(
        "style",
        [
          "position:fixed",
          "inset:0",
          "z-index:99999",
          "overflow:auto",
          "padding:16px",
          "background:#1b1020",
          "color:#ffd7d7",
          "font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
          "-webkit-overflow-scrolling:touch"
        ].join(";")
      );
      const root = document.body || document.documentElement;
      if (root) root.appendChild(box);
    }

    const heading = document.createElement("div");
    heading.setAttribute("style", "font-weight:800;font-size:15px;margin:0 0 8px;color:#ff9aa2");
    heading.textContent = `AstroGuide — ошибка запуска: ${title}`;

    const pre = document.createElement("pre");
    pre.setAttribute(
      "style",
      "white-space:pre-wrap;word-break:break-word;margin:0 0 14px;font-size:12px;color:#ffd7d7"
    );
    pre.textContent = formatError(error);

    const meta = document.createElement("div");
    meta.setAttribute("style", "font-size:11px;color:#b9a8c7");
    const hasTelegram = typeof window !== "undefined" && Boolean(window.Telegram);
    const hasWebApp = typeof window !== "undefined" && Boolean(window.Telegram?.WebApp);
    meta.textContent = `Telegram: ${hasTelegram} · WebApp: ${hasWebApp} · UA: ${
      typeof navigator !== "undefined" ? navigator.userAgent : "n/a"
    }`;

    box.appendChild(heading);
    box.appendChild(pre);
    box.appendChild(meta);
  } catch {
    // последний рубеж — диагностика не должна ронять приложение
  }
}

// Глобальные перехватчики: любая непойманная ошибка становится видимой.
export function setupStartupErrorHandler() {
  try {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      const error = event?.error || event?.message || "script error";
      console.error("[startup] window.onerror:", error);
      showStartupError("window.onerror", event?.error || new Error(String(event?.message || error)));
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event?.reason;
      console.error("[startup] unhandledrejection:", reason);
      showStartupError("unhandledrejection", reason instanceof Error ? reason : new Error(String(reason)));
    });
  } catch (error) {
    console.error("[startup] setupStartupErrorHandler failed (non-fatal):", error);
  }
}