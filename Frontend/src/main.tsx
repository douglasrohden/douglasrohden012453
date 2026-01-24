import { initThemeMode } from "flowbite-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeInit } from "../.flowbite-react/init";
import App from "./App.tsx";
import "./index.css";
import { recordUserAction } from "./services/userAction";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeInit />
    <App />
  </StrictMode>,
);

initThemeMode();

// Track high-level user interactions so the backend can group fan-out requests (e.g., list + thumbnails)
// under a single rate-limit token.
if (typeof window !== "undefined") {
  const w = window as unknown as { __userActionListenerInstalled?: boolean };
  if (!w.__userActionListenerInstalled) {
    w.__userActionListenerInstalled = true;
    document.addEventListener("click", () => recordUserAction(), true);

    // Also create an initial action id so the first page-load requests can be grouped.
    recordUserAction();
  }
}
