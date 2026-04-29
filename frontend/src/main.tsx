import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/leaflet-custom.css";

// ── Segurança: suprime console em produção ───────────────────────────────────
// O esbuild.drop já remove console.* do bundle, mas esta camada extra garante
// que nenhum log chegue ao DevTools caso algum trecho escape a minificação.
if (import.meta.env.PROD) {
  const noop = () => {};
  (window as any).console = {
    ...console,
    log:   noop,
    warn:  noop,
    error: noop,
    info:  noop,
    debug: noop,
    trace: noop,
    table: noop,
    group: noop,
    groupEnd: noop,
  };
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register Service Worker (apenas fora do ambiente de desenvolvimento local)
if ("serviceWorker" in navigator && !window.location.hostname.includes("localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

