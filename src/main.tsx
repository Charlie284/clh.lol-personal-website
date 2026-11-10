import React from "react";
import ReactDOM from "react-dom/client";
import { MDXProvider } from "@mdx-js/react";
import App from "./App";

// Import CSS
import "./assets/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const app = (
  <React.StrictMode>
    <MDXProvider>
      <App />
    </MDXProvider>
  </React.StrictMode>
);

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    // The first page's imports finish before the worker takes control. Preserve
    // those exact chunks too; offline.html can then render the visited route.
    if (!navigator.serviceWorker.controller) {
      const pendingResources = new Set<string>();
      let controlledAt: number | undefined;
      const collectResources = (entries: PerformanceEntry[]) => {
        for (const entry of entries) {
          if (controlledAt !== undefined && entry.startTime > controlledAt) continue;
          const url = new URL(entry.name, window.location.href);
          if (url.origin === window.location.origin &&
            url.pathname.startsWith("/assets/") && /\.(js|css|woff2)$/.test(url.pathname)) {
            pendingResources.add(url.href);
          }
        }
        if (controlledAt !== undefined && navigator.serviceWorker.controller && pendingResources.size) {
          navigator.serviceWorker.controller.postMessage({
            type: "CACHE_INITIAL_RESOURCES",
            urls: [...pendingResources],
          });
          pendingResources.clear();
        }
      };

      if ("PerformanceObserver" in window) {
        // Include requests started before control that finish after the claim.
        new PerformanceObserver((list) => collectResources(list.getEntries()))
          .observe({ type: "resource", buffered: true });
      }
      collectResources(performance.getEntriesByType("resource"));
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        controlledAt = performance.now();
        collectResources(performance.getEntriesByType("resource"));
      }, { once: true });
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
}
