import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { URL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const origin = "https://example.test";

function createWorker() {
  type RequestDetails = Pick<Request, "url" | "method" | "mode" | "destination">;
  type FetchEvent = {
    request: RequestDetails;
    respondWith: (response: Promise<Response>) => void;
  };
  type CacheMessageEvent = {
    data: unknown;
    waitUntil: (work: Promise<unknown>) => void;
  };
  type WorkerEvent = FetchEvent | CacheMessageEvent;
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const cache = {
    match: vi.fn<() => Promise<Response | undefined>>().mockResolvedValue(undefined),
    put: vi.fn<(request: RequestDetails, response: Response) => Promise<void>>().mockResolvedValue(undefined),
  };
  const caches = { open: vi.fn(async () => cache) };
  const fetch = vi.fn<(request: string | RequestDetails, options?: RequestInit) => Promise<Response>>(
    async () => new Response("fresh network content"),
  );

  runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (name: string, listener: (event: WorkerEvent) => void) => {
        listeners.set(name, listener);
      },
    },
    caches,
    fetch,
    URL,
    Response,
  });

  async function request(path: string, mode: RequestMode = "cors") {
    let response: Promise<Response> | undefined;
    listeners.get("fetch")!({
      request: {
        url: new URL(path, origin).href,
        method: "GET",
        mode,
        destination: mode === "navigate" ? "document" : "script",
      },
      respondWith: (result) => { response = result; },
    });
    if (!response) throw new Error("The worker did not handle the request");
    return response;
  }

  async function message(data: unknown) {
    let work: Promise<unknown> | undefined;
    listeners.get("message")!({ data, waitUntil: (result) => { work = result; } });
    await work;
  }

  return { cache, caches, fetch, request, message };
}

describe("service worker cache failures", () => {
  for (const { path, mode } of [
    { path: "/assets/new.js", mode: "cors" },
    { path: "/projects", mode: "navigate" },
  ] as const) {
    const operations = mode === "navigate" ? ["open", "put"] as const : ["open", "match", "put"] as const;
    it.each(operations)(
      `delivers the network response for ${path} when cache %s fails`,
      async (operation) => {
        const worker = createWorker();
        const failure = new DOMException("Storage unavailable", "QuotaExceededError");
        if (operation === "open") worker.caches.open.mockRejectedValue(failure);
        else worker.cache[operation].mockRejectedValue(failure);

        const response = await worker.request(path, mode);

        expect(response.status).toBe(200);
        expect(await response.text()).toBe("fresh network content");
      },
    );
  }

  it("still caches successful responses when storage is available", async () => {
    const worker = createWorker();

    const response = await worker.request("/assets/new.js");

    expect(await response.text()).toBe("fresh network content");
    expect(worker.cache.put).toHaveBeenCalledOnce();
    const [, cachedResponse] = worker.cache.put.mock.calls[0];
    expect(await cachedResponse.text()).toBe("fresh network content");
  });

  it("serves an already cached asset without a network request", async () => {
    const worker = createWorker();
    worker.cache.match.mockResolvedValue(new Response("cached asset"));

    expect(await (await worker.request("/assets/cached.js")).text()).toBe("cached asset");
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it("uses cached document content when the network fails", async () => {
    const worker = createWorker();
    worker.fetch.mockRejectedValue(new TypeError("Offline"));
    worker.cache.match.mockResolvedValue(new Response("cached page"));

    expect(await (await worker.request("/projects", "navigate")).text()).toBe("cached page");
  });
});

describe("initial page resource caching", () => {
  it("retains only requested same-origin build resources and deduplicates URLs", async () => {
    const worker = createWorker();
    await worker.message({
      type: "CACHE_INITIAL_RESOURCES",
      urls: [
        `${origin}/assets/Projects.js`,
        `${origin}/assets/Projects.js`,
        `${origin}/assets/article.js`,
        `${origin}/assets/site.css`,
        `${origin}/assets/font.woff2`,
        "https://third-party.test/assets/tracker.js",
        `${origin}/api/subscriptions`,
        `${origin}/api/export.js`,
        `${origin}/blog/article`,
        "not a URL",
        null,
      ],
    });

    expect(worker.fetch.mock.calls.map(([url]) => url)).toEqual([
      `${origin}/assets/Projects.js`,
      `${origin}/assets/article.js`,
      `${origin}/assets/site.css`,
      `${origin}/assets/font.woff2`,
    ]);
    expect(worker.cache.put).toHaveBeenCalledTimes(4);
    expect(worker.fetch).toHaveBeenCalledWith(`${origin}/assets/Projects.js`, { cache: "force-cache" });
  });

  it("does not redownload an already cached resource", async () => {
    const worker = createWorker();
    worker.cache.match.mockResolvedValue(new Response("already cached"));

    await worker.message({ type: "CACHE_INITIAL_RESOURCES", urls: [`${origin}/assets/Projects.js`] });

    expect(worker.fetch).not.toHaveBeenCalled();
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  it.each(["open", "match", "put", "fetch"] as const)(
    "tolerates initial-resource %s failures",
    async (operation) => {
      const worker = createWorker();
      const failure = new Error("Unavailable");
      if (operation === "open") worker.caches.open.mockRejectedValue(failure);
      else if (operation === "fetch") worker.fetch.mockRejectedValue(failure);
      else worker.cache[operation].mockRejectedValue(failure);

      await expect(worker.message({
        type: "CACHE_INITIAL_RESOURCES",
        urls: [`${origin}/assets/Projects.js`],
      })).resolves.toBeUndefined();
    },
  );

  it("does not retain unsuccessful fetches", async () => {
    const worker = createWorker();
    worker.fetch.mockResolvedValue(new Response("Missing", { status: 404 }));

    await worker.message({ type: "CACHE_INITIAL_RESOURCES", urls: [`${origin}/assets/Projects.js`] });

    expect(worker.cache.put).not.toHaveBeenCalled();
  });
});
