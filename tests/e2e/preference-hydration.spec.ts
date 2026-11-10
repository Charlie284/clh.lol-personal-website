import { expect, test, type Page } from "@playwright/test";

async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
}

async function delayClientChunk(page: Page, chunk: "index" | "BlogPage" | "Projects") {
  let releaseScript = () => {};
  const scriptGate = new Promise<void>(resolve => { releaseScript = resolve; });
  await page.route(new RegExp(`/assets/${chunk}-[^/]+\\.js$`), async route => {
    await scriptGate;
    await route.continue();
  });
  return releaseScript;
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "deny", url: baseURL! }]);
});

test("hiding signup prompts applies when returning home without reloading", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow", url: baseURL! }]);
  await openPage(page, "/newsletter-confirmed");
  await page.getByRole("button", { name: "Hide signup prompts", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signup prompts are hidden.");

  await page.getByRole("link", { name: "Back home", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Charlie", exact: true })).toBeVisible();

  await expect(page.getByRole("button", { name: "Get new posts", exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toHaveCount(0);
});

test("reduced-motion visitors hydrate the homepage without replacing its content", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const releaseScript = await delayClientChunk(page, "index");
  try {
    await page.goto("/", { waitUntil: "commit" });
    const prerenderedHeading = await page.getByRole("heading", { level: 1, name: "Charlie", exact: true }).elementHandle();
    if (!prerenderedHeading) throw new Error("The prerendered homepage heading is missing");

    releaseScript();
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    expect(await prerenderedHeading.evaluate(heading => heading.isConnected)).toBe(true);
  } finally {
    releaseScript();
  }
  expect(errors.filter(error => /hydration|hydrate|Minified React error #418/i.test(error))).toEqual([]);
});

test("shared section links survive hydration and returning from another route", async ({ page }) => {
  await openPage(page, "/#faq");
  await expect(page.locator("#faq")).toBeInViewport();

  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Things I've built.", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Charlie", exact: true })).toBeVisible();
  await expect(page.locator("#faq")).toBeInViewport();

  await openPage(page, "/projects/startle#startle-privacy");
  await expect(page.locator("#startle-privacy")).toBeInViewport();
});

for (const chunk of ["index", "BlogPage"] as const) {
  test(`blog filters wait for ${chunk} to hydrate before accepting input`, async ({ page }) => {
    const releaseScript = await delayClientChunk(page, chunk);
    try {
      await page.goto("/blog", { waitUntil: "commit" });
      const search = page.getByRole("textbox", { name: "Search blog posts" });
      await expect(search).toBeDisabled();
      await expect(page.getByRole("button", { name: "Sort order: newest", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Filter by tag: All", exact: true })).toBeDisabled();
      await expect(page.getByRole("link", { name: /One from the archive/i })).toBeVisible();
      await expect(page.getByRole("button", { name: "Send me new posts", exact: true })).toBeEnabled();

      releaseScript();
      await expect(search).toBeEnabled();
      await search.fill("tailscale");
      await expect(search).toHaveValue("tailscale");
      await expect(page).toHaveURL(/q=tailscale/);
      await expect(page.getByText("1 post matches your filters", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Theo \(t3\) Hates Open Source/i })).toHaveCount(0);
    } finally {
      releaseScript();
    }
  });
}

test("project filters wait for their route handlers before accepting changes", async ({ page }) => {
  const releaseScript = await delayClientChunk(page, "Projects");
  try {
    await page.goto("/projects", { waitUntil: "commit" });
    const technology = page.locator("#technology-filter");
    await expect(technology).toBeDisabled();
    await expect(page.locator("#category-filter")).toBeDisabled();
    await expect(page.locator("#status-filter")).toBeDisabled();
    await expect(page.getByText("Showing 10 of 10", { exact: true })).toBeVisible();

    releaseScript();
    await expect(technology).toBeEnabled();
    const filterToggle = page.getByRole("button", { name: /^Filter projects/ });
    if (await filterToggle.isVisible()) await filterToggle.click();
    await technology.selectOption("Flutter");
    await expect(technology).toHaveValue("Flutter");
    await expect(page).toHaveURL(/technology=Flutter/);
    await expect(page.getByText("Showing 1 of 10", { exact: true })).toBeVisible();
  } finally {
    releaseScript();
  }
});
