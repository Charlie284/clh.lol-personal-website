const CACHE_PREFIX = "charlie-site-";
const CACHE_VERSION = "BUILD_CACHE_VERSION";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const PRECACHE_URLS = ["BUILD_PRECACHE_URLS"];

async function matchCache(requests, options) {
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const request of requests) {
      const response = await cache.match(request, options);
      if (response) return response;
    }
  } catch {
    // Cache Storage is optional; network delivery must survive storage failures.
  }
}

async function cacheResponse(request, response) {
  if (!response.ok) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch {
    // A quota or storage error must not discard a successful network response.
  }
}

// Updates wait for existing tabs, which still reference the old build’s chunks.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_INITIAL_RESOURCES" || !Array.isArray(event.data.urls)) return;

  const urls = new Set();
  for (const value of event.data.urls) {
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      if (url.origin === self.location.origin && url.pathname.startsWith("/assets/") &&
        /\.(js|css|woff2)$/.test(url.pathname)) urls.add(url.href);
    } catch {
      // Ignore malformed resources; only this build's static chunks are eligible.
    }
  }

  event.waitUntil(Promise.all([...urls].map(async (url) => {
    try {
      if (await matchCache([url])) return;
      const response = await fetch(url, { cache: "force-cache" });
      await cacheResponse(url, response);
    } catch {
      // Losing connectivity or optional storage must not affect the open page.
    }
  })));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          await cacheResponse(request, response);
          return response;
        } catch {
          const pathname = url.pathname === "/"
            ? "/"
            : url.pathname.replace(/\/+$/, "");
          const candidates = pathname === "/"
            ? [request, "/", "/index.html"]
            : [request, pathname, `${pathname}.html`, `${pathname}/index.html`];

          return await matchCache([...candidates, "/offline.html"], { ignoreSearch: true }) ||
            Response.error();
        }
      })(),
    );
    return;
  }

  // Third-party requests remain network-only and are never retained.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache static resources as they are used. Never cache API responses.
  // Vite fetches module-preload dependencies with an empty destination.
  const isBuildAsset = url.pathname.startsWith("/assets/") &&
    /\.(js|css|woff2)$/.test(url.pathname);
  if (!isBuildAsset && !["script", "style", "font", "image"].includes(request.destination)) return;

  event.respondWith((async () => {
    const cached = await matchCache([request], { ignoreVary: true });
    if (cached) return cached;
    const response = await fetch(request);
    await cacheResponse(request, response);
    return response;
  })());
});
