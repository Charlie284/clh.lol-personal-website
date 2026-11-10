import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("production responses contain meaningful content before JavaScript runs", async ({
  request,
}) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  const routes = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), (match) =>
    new URL(match[1]).pathname,
  );
  expect(routes).toContain("/");
  expect(routes).toContain("/projects/startle");
  expect(new Set(routes).size).toBe(routes.length);

  for (const route of [...routes, "/newsletter-confirmed", "/404.html"]) {
    const response = await request.get(route);
    expect(response.ok()).toBe(true);

    const html = await response.text();
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
    const root = body.match(/<div id="root">([\s\S]*?)<\/div>/i)?.[1] ?? "";

    expect(body).toContain("<div id=\"root\">");
    expect(root.trim(), `${route} should contain prerendered markup`).not.toBe("");
    expect(body, `${route} should contain its primary heading`).toMatch(/<h1\b/i);
    expect(body, `${route} should not require React to reveal hidden route content`)
      .not.toMatch(/<template id="B:|<div hidden id="S:/);

    const canonicalPath = route === "/404.html" ? "/404" : route;
    const canonical = new URL(canonicalPath, "https://clh.lol").toString();
    expect(html).toContain(`<link rel="canonical" href="${canonical}">`);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html.match(/<meta property="og:title"/g)).toHaveLength(1);
    expect(html.match(/<meta name="twitter:title"/g)).toHaveLength(1);
  }
});

test("article responses include BlogPosting structured data", async ({ request }) => {
  const response = await request.get("/blog/why-i-hate-raycast");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  const structuredData = Array.from(
    html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    (match) => JSON.parse(match[1]) as Record<string, unknown>,
  );
  const article = structuredData.find((entry) => entry["@type"] === "BlogPosting");

  expect(article).toMatchObject({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Why I Hate Raycast",
    datePublished: "2026-08-12",
    dateModified: "2026-08-12",
    url: "https://clh.lol/blog/why-i-hate-raycast",
    author: {
      "@type": "Person",
      name: "Charlie H",
    },
  });
});

test("prerendered metadata stays stable after hydration", async ({ page, request }) => {
  const cases = [
    {
      path: "/",
      title: "Charlie H — Developer Portfolio",
      description: "Charlie is a student developer building a macOS app, websites, and a homelab.",
      robots: "index, follow",
    },
    {
      path: "/newsletter-confirmed",
      title: "Newsletter — Charlie H",
      description: "Confirm your newsletter subscription through Kit and choose whether to hide signup prompts in this browser.",
      robots: "noindex, nofollow",
    },
  ];

  for (const metadata of cases) {
    const response = await request.get(metadata.path);
    expect(response.ok()).toBe(true);
    const html = await response.text();

    expect(html).toContain(`<title>${metadata.title}</title>`);
    expect(html).toContain(`<meta name="description" content="${metadata.description}">`);
    expect(html).toContain(`<meta name="robots" content="${metadata.robots}">`);
    expect(html).toContain(`<meta property="og:title" content="${metadata.title}">`);
    expect(html).toContain(`<meta name="twitter:title" content="${metadata.title}">`);

    await page.goto(metadata.path);
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    await expect(page).toHaveTitle(metadata.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      metadata.description,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      metadata.robots,
    );
  }
});

test("client navigation replaces route-specific metadata", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: /Why I Hate Raycast/i }).first().click();

  await expect(page).toHaveURL(/\/blog\/why-i-hate-raycast$/);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Why I Hate Raycast — Charlie H",
  );
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    "content",
    "2026-08-12",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map((script) => JSON.parse(script.textContent ?? "{}") as Record<string, unknown>)
          .some((entry) => entry["@type"] === "BlogPosting"),
      ),
    )
    .toBe(true);

  await page.locator("header").getByRole("link", { name: "Home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Charlie H — Developer Portfolio",
  );
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map((script) => JSON.parse(script.textContent ?? "{}") as Record<string, unknown>)
          .every((entry) => entry["@type"] !== "BlogPosting"),
      ),
    )
    .toBe(true);
});

test("prerendered pages remain readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    for (const path of [
      "/",
      "/projects",
      "/projects/startle",
      "/blog/why-i-hate-raycast",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("#main-content > div")).toHaveCSS("opacity", "1");
    }
  } finally {
    await context.close();
  }
});

test("prerendered pages hydrate without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const paths = [
    "/",
    "/projects",
    "/blog",
    "/blog/why-i-hate-raycast",
    "/privacy",
    "/newsletter-confirmed",
    "/projects/server",
    "/projects/startle",
    "/projects/thiswebsite",
    "/404.html",
  ];

  for (const path of paths) {
    errors.length = 0;
    await page.goto(path);
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors, `${path} should hydrate cleanly`).toEqual([]);
  }
});

test("returning visitors hydrate cleanly with saved preferences", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "clh_cookie_choice",
      value: "allow",
      url: "http://127.0.0.1:43127",
    },
    {
      name: "clh_newsletter_subscription_confirmed",
      value: "1",
      url: "http://127.0.0.1:43127",
    },
  ]);

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const path of ["/", "/blog", "/privacy"]) {
    errors.length = 0;
    await page.goto(path);
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors, `${path} should hydrate cleanly with saved preferences`).toEqual([]);
  }
});

test("primary navigation and command palette reach public routes", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Charlie H/);

  const navigation = page.locator("header");
  await expect(navigation.getByRole("link")).toHaveCount(3);
  await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "GitHub profile" }),
  ).toHaveCount(0);
  await expect(
    navigation.getByRole("link", { name: "Privacy and cookie choices" }),
  ).toHaveCount(0);

  const homeLabel = navigation.getByText("Home", { exact: true });
  await expect(homeLabel).toHaveCSS("font-size", "12px");

  await navigation.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Privacy and cookie choices" }),
  ).toHaveAttribute("href", "/privacy");

  if (!testInfo.project.name.startsWith("mobile")) {
    await page.keyboard.press("/");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await expect(palette).toBeVisible();
    await palette.getByRole("combobox", { name: "Search commands" }).fill("writing");
    await palette.getByRole("option", { name: /Blog/i }).click();
    await expect(page).toHaveURL(/\/blog$/);
  }
});

test("homepage art keeps project previews uncropped", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.999; });
  await page.goto("/");
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  const gallery = page.getByRole("region", { name: "Featured projects" });
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.locator(".coverflow-card img")).toHaveCount(2);
  let checkedImages = 0;
  for (let index = 0; index < 6; index += 1) {
    const selected = gallery.locator('.coverflow-card[data-active="true"]');
    const destination = (await selected.getAttribute("href"))!;
    const image = gallery.locator('.coverflow-card[data-active="true"] img');
    if (await image.count()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
      checkedImages += 1;
    }
    if (index < 5) {
      await gallery.getByRole("button", { name: "Next project", exact: true }).click();
      await expect(selected).not.toHaveAttribute("href", destination);
    }
  }
  expect(checkedImages).toBe(2);
});

test("featured work exposes six unique projects through the carousel", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  const gallery = page.getByRole("region", { name: "Featured projects" });
  await expect(gallery.locator(".coverflow-card")).toHaveCount(6);
  const destinations = new Set<string>();
  for (let index = 0; index < 6; index += 1) {
    const selected = gallery.locator('.coverflow-card[data-active="true"]');
    await expect(selected).toHaveAttribute("aria-hidden", "false");
    const destination = (await selected.getAttribute("href"))!;
    destinations.add(destination);
    await expect(gallery.locator('.coverflow-card[aria-hidden="false"]')).toHaveCount(3);
    if (index < 5) {
      await gallery.getByRole("button", { name: "Next project", exact: true }).click();
      await expect(selected).not.toHaveAttribute("href", destination);
    }
  }
  expect(destinations.size).toBe(6);
});

test("homepage keeps desktop proof readable and the journey concise", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const toolsCopy = page.getByText(
    "I mostly build native apps, websites, and the systems behind them. Each one below links to a real project.",
  );
  const copyBox = await toolsCopy.boundingBox();
  expect(copyBox?.width ?? 0).toBeGreaterThanOrEqual(280);
  expect(copyBox?.height ?? Infinity).toBeLessThan(160);
  const headingBox = await page.getByRole("heading", { name: "What I work with", exact: true }).boundingBox();
  expect(headingBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(headingBox!.y + headingBox!.height <= copyBox!.y || headingBox!.x + headingBox!.width <= copyBox!.x).toBe(true);
  await expect(page.getByRole("link", { name: "Email Charlie Harper", exact: true }).first()).toBeInViewport();

  const pageLength = await page.evaluate(
    () => document.documentElement.scrollHeight / window.innerHeight,
  );
  expect(pageLength).toBeLessThanOrEqual(10);

  const faqTop = await page.locator("#faq").evaluate((element) =>
    element.getBoundingClientRect().top + window.scrollY,
  );
  const newsletterTop = await page.locator("#newsletter").evaluate((element) =>
    element.getBoundingClientRect().top + window.scrollY,
  );
  expect(newsletterTop).toBeGreaterThan(faqTop);
});

test("homepage gives mobile visitors labeled navigation and usable touch targets", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/");

  await expect(page.locator("header").getByText("Projects", { exact: true })).toBeVisible();

  for (const target of [
    page.locator("header").getByRole("link", { name: "Home" }),
    page.getByRole("link", { name: "Email Charlie Harper", exact: true }).first(),
  ]) {
    const box = await target.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  await expect(page.getByText("Press / for quick navigation")).toBeHidden();
});

test("homepage connects capabilities and featured work to real project evidence", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("region", { name: "Featured projects" }).locator('.coverflow-card[data-active="true"]'),
  ).toHaveAttribute("href", /^(\/projects\/|https:\/\/github.com\/)/);

  const capabilities = page.getByRole("region", { name: "What I work with" });
  await expect(capabilities.getByRole("link", { name: /Startle/i })).toBeVisible();
  await expect(capabilities.getByRole("link", { name: /This Website/i })).toBeVisible();
  await expect(capabilities.getByRole("link", { name: /Server Project/i })).toBeVisible();
});

test("Startle case-study heading and introduction keep separate geometry", async ({
  page,
}) => {
  await page.goto("/projects/startle");

  const headingGeometry = await page
    .getByRole("heading", { level: 1, name: "Startle", exact: true })
    .evaluate((element) => ({
      bounds: element.getBoundingClientRect().toJSON(),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
  const introBounds = await page
    .getByText(/^A menu bar app that plays local videos on a schedule/)
    .evaluate((element) => element.getBoundingClientRect().toJSON());

  const verticallySeparated = headingGeometry.bounds.bottom <= introBounds.top;
  const horizontallySeparated = headingGeometry.bounds.right <= introBounds.left;
  expect(headingGeometry.scrollWidth).toBeLessThanOrEqual(
    headingGeometry.clientWidth,
  );
  expect(verticallySeparated || horizontallySeparated).toBe(true);
});

test("pages fit the viewport and avoid accessibility violations", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const paths = [
    "/",
    "/projects",
    "/blog",
    "/blog/why-i-hate-raycast",
    "/privacy",
    "/newsletter-confirmed",
    "/projects/server",
    "/projects/startle",
    "/projects/thiswebsite",
    "/404.html",
  ];

  for (const path of paths) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("#main-content > div")).toHaveCSS("opacity", "1");
      await page.waitForTimeout(1_000);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test("production app reloads and navigates previously visited pages offline", async ({ page, context }) => {
  await page.goto("/");

  // Unvisited pages are no longer downloaded speculatively during installation.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
      });
    }
  });
  await page.locator("header").getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Things I've\s*built/i);
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  await page.locator("header").getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Charlie" })).toBeVisible();
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();

  const serviceWorker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
      });
    }
    return {
      scriptUrl: registration.active?.scriptURL ?? "",
      cacheUrls: (await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("charlie-site-"))
          .map(async (key) => (await (await caches.open(key)).keys()).map((request) => request.url)),
      )).flat(),
    };
  });

  expect(serviceWorker.scriptUrl).toMatch(/\/sw\.js$/);
  expect(serviceWorker.cacheUrls.some((url) => /\/assets\/.*\.js$/.test(url))).toBe(true);
  expect(serviceWorker.cacheUrls.some((url) => /\/assets\/.*\.css$/.test(url))).toBe(true);

  const failedOfflineAssets: string[] = [];
  page.on("requestfailed", (request) => {
    const resourceType = request.resourceType();
    const isStaticAsset = resourceType === "script" || resourceType === "stylesheet";
    if (isStaticAsset && new URL(request.url()).origin === new URL(page.url()).origin) {
      failedOfflineAssets.push(`${resourceType}: ${request.url()}`);
    }
  });

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Charlie" })).toBeVisible();

    await page.locator("header").getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Things I've\s*built/i);
    expect(failedOfflineAssets, "same-origin assets should load from the service-worker cache")
      .toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});


test("blog listings do not download articles until one is opened", async ({ page }) => {
  const articles = new Set<string>();
  page.on("request", (request) => {
    const filename = new URL(request.url()).pathname;
    if (/\/assets\/2026-.*\.js$/.test(filename)) articles.add(filename);
  });
  await page.goto("/blog");
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  expect([...articles]).toEqual([]);

  await page.getByRole("link", { name: /Why I Hate Raycast/i }).first().click();
  await expect(page.locator("article h2").first()).toBeVisible();
  expect([...articles]).toHaveLength(1);
  expect([...articles][0]).toContain("why-i-hate-raycast");
});
