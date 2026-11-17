/* global MutationObserver, document, window, requestAnimationFrame */
import { chromium } from "@playwright/test";
import { preview } from "vite";

// Production HTML, a fresh browser cache, 1.6 Mbps, 150 ms latency, and 4x CPU.
// Run on an otherwise idle machine; this is a manual performance budget check.
const conditions = { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 100000 };
const targetMs = 1000;
const liveUrl = process.argv.find(argument => argument.startsWith("--url="))?.slice(6);
const server = liveUrl ? null : await preview({ preview: { host: "127.0.0.1", port: 0, strictPort: true, open: false } });
let browser;
const results = [];

try {
  const address = server?.httpServer.address();
  if (!liveUrl && (!address || typeof address === "string")) throw new Error("Missing preview address");
  const origin = liveUrl ?? `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch();
  // Measure a new site visit, not the browser process's own first launch.
  // This page never requests the site; every measured context still has an
  // empty HTTP cache, no cookies, and no service worker.
  const browserWarmup = await browser.newPage();
  await browserWarmup.goto("data:text/html,<h1>Browser ready</h1>");
  await browserWarmup.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  await browserWarmup.close();
  for (const mobile of [false, true]) {
    for (let run = 0; run < 3; run++) {
      const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: mobile ? { width: 393, height: 851 } : { width: 1280, height: 720 },
        isMobile: mobile,
        hasTouch: mobile,
      });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await cdp.send("Network.emulateNetworkConditions", conditions);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await page.addInitScript(() => {
          const fontsLoaded = () => ["Outfit", "Charlie Name", "Charlie Kicker"].every(name =>
            [...document.fonts].some(font => font.family.replaceAll('"', "") === name && font.status === "loaded"),
          );
          const check = () => {
            if (!window.routeReadyAt && document.querySelector('[data-route-ready="true"]')) {
              window.routeReadyAt = performance.now();
            }
            if (window.routeReadyAt && !window.fontsReadyAt && fontsLoaded()) window.fontsReadyAt = performance.now();
          };
          new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true });
          document.fonts.addEventListener("loadingdone", check);
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.largestPaintAt = entry.startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        });
        await page.goto(origin, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => window.fontsReadyAt && window.largestPaintAt, undefined, { timeout: 10000 });
        // Allow the buffered paint observer to report the initial viewport.
        await page.waitForTimeout(150);
        const timing = await page.evaluate(() => ({
          interactiveMs: Math.round(window.routeReadyAt),
          readyMs: Math.round(Math.max(window.routeReadyAt, window.fontsReadyAt, window.largestPaintAt)),
          largestContentfulPaintMs: Math.round(window.largestPaintAt),
          htmlReadyMs: Math.round(performance.getEntriesByType("navigation")[0].responseEnd),
          resources: performance.getEntriesByType("resource").map(resource => ({
            file: resource.name.split("/").pop(),
            initiator: resource.initiatorType,
            startMs: Math.round(resource.startTime),
            responseMs: Math.round(resource.responseStart),
            endMs: Math.round(resource.responseEnd),
            bytes: resource.transferSize,
          })),
          firstContentfulPaintMs: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0),
          fontsLoaded: Boolean(window.fontsReadyAt),
          unexpectedFallbackFonts: performance.getEntriesByType("resource")
            .filter(resource => resource.startTime <= window.routeReadyAt && /-latin-.*\.woff2$/.test(resource.name))
            .map(resource => resource.name.split("/").pop()),
        }));
        // Verify a homepage handler, including on touch layouts.
        await page.getByRole("button", { name: "Next project", exact: true }).click();
        await page.waitForFunction(() => {
          const selected = document.querySelector('.coverflow-card[data-active="true"]');
          return selected && selected.getAttribute("href") !== "/projects/startle";
        });
        results.push({ device: mobile ? "mobile" : "desktop", ...timing, firstClickWorks: true, errors });
      } finally {
        await context.close();
      }
    }
  }
  console.log(JSON.stringify({ url: origin, targetMs, conditions, cpuSlowdown: 4, results }, null, 2));
  if (results.some(result => result.readyMs >= targetMs || !result.fontsLoaded || result.unexpectedFallbackFonts.length || result.errors.length)) {
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
