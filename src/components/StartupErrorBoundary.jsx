import { Component } from "react";

// ВРЕМЕННЫЙ Error Boundary для диагностики мобильного Telegram WebView.
// Вместо чёрного экрана показывает текст ошибки рендера.
class StartupErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[startup] React render error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error?.message || String(error);
    const stack = typeof error?.stack === "string" ? error.stack : "";

    // Инлайновые стили: не зависят от загрузки CSS.
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "16px",
          background: "#1b1020",
          color: "#ffd7d7",
          font: "13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
          overflow: "auto"
        }}
      >
        <div style={{ fontWeight: 800, fontSize: "15px", margin: "0 0 8px", color: "#ff9aa2" }}>
          AstroGuide — ошибка интерфейса
        </div>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 14px", fontSize: "12px" }}>
          {stack ? `${message}\n\n${stack}` : message}
        </pre>
        <div style={{ fontSize: "11px", color: "#b9a8c7" }}>
          {`Telegram: ${Boolean(typeof window !== "undefined" && window.Telegram)} · WebApp: ${Boolean(
            typeof window !== "undefined" && window.Telegram?.WebApp
          )}`}
        </div>
      </div>
    );
  }
}

export default StartupErrorBoundary;