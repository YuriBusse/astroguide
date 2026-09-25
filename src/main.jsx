import "./styles/app.css";
import { setupStartupErrorHandler } from "./startupError";

setupStartupErrorHandler();

import("./react-entry.jsx").catch((error) => {
  console.error("[startup] failed to load react-entry:", error);
});