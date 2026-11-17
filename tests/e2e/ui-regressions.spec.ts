import { expect, test, type Page } from "@playwright/test";

async function openPage(page: Page, path: string) {
  await page.goto(path);
  // The built pages expose their content before React attaches event handlers.
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "deny", url: baseURL! }]);
});

test("blog tag menus fit narrow screens, including long selected tags", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, "/blog");
    await page.getByRole("button", { name: "Filter by tag: All" }).click();
    const menu = page.locator("#tag-options");
    for (const selected of [false, true]) {
      if (selected) {
        await menu.getByRole("button", { name: "accessibility", exact: true }).click();
        await page.getByRole("button", { name: "Filter by tag: accessibility" }).click();
      }
      const box = await menu.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(20);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width - 20);
    }
  }
});

test("blog keyboard focus stays visible and returns after menu selection or Escape", async ({ page }) => {
  await openPage(page, "/blog");
  const search = page.getByRole("textbox", { name: "Search blog posts" });
  await search.focus();
  await expect(search).toHaveCSS("outline-color", "rgba(255, 255, 255, 0.85)");

  const sort = page.getByRole("button", { name: /Sort order:/ });
  await sort.press("Enter");
  await page.locator("#sort-options").getByRole("button", { name: "oldest", exact: true }).press("Enter");
  await expect(sort).toBeFocused();
  await expect(sort).toHaveText("Sort: oldest");

  const tag = page.getByRole("button", { name: "Filter by tag: All" });
  await tag.press("Enter");
  await page.locator("#tag-options").getByRole("button", { name: "All", exact: true }).press("Escape");
  await expect(tag).toBeFocused();
  await expect(page.locator("#tag-options")).toBeHidden();
});

test("blog and project filters survive visiting a result and going back", async ({ page }) => {
  await openPage(page, "/blog");
  const search = page.getByRole("textbox", { name: "Search blog posts" });
  await search.fill("tailscale");
  await page.getByRole("button", { name: "Sort order: newest" }).click();
  await page.locator("#sort-options").getByRole("button", { name: "oldest", exact: true }).click();
  await page.getByRole("button", { name: "Filter by tag: All" }).click();
  await page.locator("#tag-options").getByRole("button", { name: "networking", exact: true }).click();
  await page.getByRole("link", { name: /Tailscale vs WireGuard/ }).click();
  await expect(page).toHaveURL(/\/blog\/tailscale-vs-wireguard$/);
  await page.goBack();
  await expect(search).toHaveValue("tailscale");
  await expect(page.getByRole("button", { name: "Sort order: oldest" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter by tag: networking" })).toBeVisible();

  await openPage(page, "/projects");
  const filters = page.getByRole("button", { name: /^Filter projects/ });
  if (await filters.isVisible()) await filters.click();
  const technology = page.getByRole("combobox", { name: "Technology" });
  await technology.selectOption("Flutter");
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("In progress");
  await page.getByRole("link", { name: /New Trier Block/ }).click();
  await expect(page).toHaveURL(/\/projects\/new-trier-block$/);
  await page.goBack();
  if (await filters.isVisible()) await filters.click();
  await expect(technology).toHaveValue("Flutter");
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toHaveValue("In progress");
  await expect(page.getByText("Showing 1 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText("Showing 10 of 10")).toBeVisible();
});

test("newsletter fields keep usable width in both article and page containers", async ({ page }) => {
  for (const width of [1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/blog/why-i-used-rust-to-calculate-pi", "/"]) {
      await openPage(page, path);
      const email = page.getByRole("textbox", { name: "Email address", exact: true });
      await email.scrollIntoViewIfNeeded();
      const box = await email.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(224);
      await email.fill("reader@example.com");
      const textFits = await email.evaluate((input) => input.scrollWidth <= input.clientWidth);
      expect(textFits).toBe(true);
    }
  }
});

test("tablet featured cards stay inside the section gutters", async ({ page }) => {
  for (const width of [768, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await openPage(page, "/");
    const cards = page.locator(".coverflow-stage");
    await expect(cards).toHaveCount(1);
    const geometry = await cards.evaluateAll((elements) => elements.map((card) => {
      const section = card.closest("section")!;
      const bounds = section.getBoundingClientRect();
      const style = getComputedStyle(section);
      const rect = card.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        allowedLeft: bounds.left + parseFloat(style.paddingLeft),
        allowedRight: bounds.right - parseFloat(style.paddingRight),
      };
    }));
    for (const card of geometry) {
      expect(card.left).toBeGreaterThanOrEqual(card.allowedLeft - 1);
      expect(card.right).toBeLessThanOrEqual(card.allowedRight + 1);
    }
  }
});

test("mobile privacy choices remain reachable with or without newsletter content", async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.addCookies([
    { name: "clh_cookie_choice", value: "allow-v2", url: baseURL! },
    { name: "clh_newsletter_subscription_confirmed", value: "1", url: baseURL! },
  ]);
  for (const path of ["/", "/projects/startle"]) {
    await openPage(page, path);
    if (path === "/") await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
    const privacy = page.getByRole("contentinfo").getByRole("link", { name: "Privacy and cookie choices" });
    await privacy.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    const linkBox = await privacy.boundingBox();
    const askBox = await page.getByRole("button", { name: "Ask AI about Charlie" }).boundingBox();
    expect(linkBox).not.toBeNull();
    expect(askBox).not.toBeNull();
    const separated = linkBox!.y + linkBox!.height <= askBox!.y ||
      askBox!.y + askBox!.height <= linkBox!.y ||
      linkBox!.x + linkBox!.width <= askBox!.x ||
      askBox!.x + askBox!.width <= linkBox!.x;
    expect(separated).toBe(true);
    await privacy.click();
    await expect(page).toHaveURL(/\/privacy$/);
  }
});

test("Ask AI has a visible native cursor and yields to the command palette", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPage(page, "/blog");
  await page.getByRole("button", { name: "Ask AI about Charlie" }).click();
  const popover = page.locator("[popover]");
  await expect(popover).toBeVisible();
  await popover.getByRole("heading", { name: "Ask AI about me" }).hover();
  await expect(popover).toHaveCSS("cursor", "auto");
  await expect(popover.getByRole("link", { name: /ChatGPT/ })).toHaveCSS("cursor", "pointer");
  await expect(page.locator(".custom-cursor")).toHaveCSS("visibility", "hidden");

  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await expect(popover).toBeHidden();
  for (const selector of ["footer", '[aria-label="Ask AI about Charlie"]']) {
    expect(await page.locator(selector).evaluate((element) => !!element.closest("[inert]"))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ask AI about Charlie" }).click();
  await expect(popover).toBeVisible();
});

test("command keyboard selection stays visible and closing restores the original field", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPage(page, "/blog");
  await expect(page.locator("html")).toHaveClass(/custom-cursor-active/);
  const search = page.getByRole("textbox", { name: "Search blog posts" });
  await search.focus();
  await page.keyboard.press("Control+k");
  const commands = page.getByRole("combobox", { name: "Search commands" });
  await expect(commands).toBeFocused();
  for (let index = 0; index < 5; index++) await commands.press("ArrowDown");
  const email = page.getByRole("option", { name: /Email/ });
  await expect(email).toHaveAttribute("aria-selected", "true");
  const optionBox = await email.boundingBox();
  const listBox = await page.getByRole("listbox", { name: "Commands" }).boundingBox();
  expect(optionBox!.y).toBeGreaterThanOrEqual(listBox!.y);
  expect(optionBox!.y + optionBox!.height).toBeLessThanOrEqual(listBox!.y + listBox!.height);
  await commands.press("Escape");
  await expect(search).toBeFocused();
});

test("command palette also makes consent portal controls inactive", async ({ page, context }) => {
  await context.clearCookies();
  await openPage(page, "/blog");
  const consent = page.getByRole("region", { name: "Can I remember this browser?" });
  await expect(consent).toBeVisible();
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  expect(await page.locator('[aria-labelledby="cookie-consent-heading"]').evaluate((element) => !!element.closest("[inert]"))).toBe(true);
  const paletteLayer = Number(await palette.evaluate((element) => getComputedStyle(element).zIndex));
  const consentLayer = Number(await page.locator('[aria-labelledby="cookie-consent-heading"]').evaluate((element) => getComputedStyle(element).zIndex));
  expect(paletteLayer).toBeGreaterThan(consentLayer);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "No thanks", exact: true }).click();
  await expect(consent).toBeHidden();
});

test("desktop featured projects support native new-tab and keyboard navigation", async ({ page, context }, testInfo) => {
  await page.addInitScript(() => { Math.random = () => 0.999; });
  test.skip(testInfo.project.name.startsWith("mobile"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openPage(page, "/");
  const gallery = page.getByRole("region", { name: "Featured projects" });
  const selected = gallery.locator('.coverflow-card[data-active="true"]');
  await expect(gallery.locator(".coverflow-card")).toHaveCount(6);
  await selected.scrollIntoViewIfNeeded();
  await selected.focus();
  for (const key of ["ArrowRight", "ArrowRight", "End", "Home", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-hidden", "false");
  }
  // The selection can include external repositories; use an internal case study for navigation.
  const internal = gallery.locator('.coverflow-card[href^="/projects/"]').first();
  const href = await internal.getAttribute("href");
  expect(href).toBeTruthy();
  // Select it via the controls so offstage links remain unavailable to ordinary clicks.
  for (let index = 0; index < 6 && await selected.getAttribute("href") !== href; index += 1) {
    await gallery.getByRole("button", { name: "Next project", exact: true }).click();
  }
  const newTab = context.waitForEvent("page");
  await selected.click({ modifiers: ["ControlOrMeta"] });
  const project = await newTab;
  await expect(project).toHaveURL(new RegExp(`${href}$`));
  await expect(page).toHaveURL(/\/$/);
  await project.close();
  await selected.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("blog menus dismiss when keyboard focus leaves them", async ({ page }) => {
  await openPage(page, "/blog");
  const sort = page.getByRole("button", { name: "Sort order: newest" });
  await sort.press("Enter");
  const lastSort = page.locator("#sort-options").getByRole("button").last();
  await lastSort.focus();
  await lastSort.press("Tab");
  const tag = page.getByRole("button", { name: "Filter by tag: All" });
  await expect(tag).toBeFocused();
  await expect(page.locator("#sort-options")).toBeHidden();
  await tag.press("Enter");
  const firstTag = page.locator("#tag-options").getByRole("button").first();
  await firstTag.press("Shift+Tab");
  await expect(tag).toBeFocused();
  await tag.press("Shift+Tab");
  await expect(sort).toBeFocused();
  await expect(page.locator("#tag-options")).toBeHidden();
});

test("blog result feedback and reset preserve unrelated URL parameters", async ({ page }) => {
  await openPage(page, "/blog?ref=portfolio&q=no-such-post-title&tag=networking&sort=oldest");
  const feedback = page.getByRole("status");
  await expect(feedback).toHaveText("0 posts match your filters");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/blog\?ref=portfolio$/);
  const search = page.getByRole("textbox", { name: "Search blog posts" });
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "Sort order: newest" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter by tag: All" })).toBeVisible();
  await expect(feedback).toHaveText(/\d+ posts in the archive/);
  await search.fill("tailscale");
  await expect(feedback).toHaveText("1 post matches your filters");
  await expect(search).toBeFocused();
});

test("article navigation moves focus and Back to Blog restores the filtered archive", async ({ page }) => {
  await openPage(page, "/blog?q=tailscale&sort=oldest&tag=networking");
  const article = page.getByRole("link", { name: /Tailscale vs WireGuard/ });
  await article.press("Enter");
  await expect(page).toHaveURL(/\/blog\/tailscale-vs-wireguard$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.getByRole("link", { name: /Back to Blog/i }).press("Enter");
  await expect(page).toHaveURL(/\/blog\?q=tailscale&sort=oldest&tag=networking$/);
  await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Search blog posts" })).toHaveValue("tailscale");
  await expect(page.getByRole("button", { name: "Sort order: oldest" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter by tag: networking" })).toBeVisible();
});


test("FAQ answers and capability actions stay within their rows", async ({ page }) => {
  for (const width of [320, 768, 1100, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await openPage(page, "/");
    await page.evaluate(() => document.fonts.ready);
    const questions = await page.locator("#faq dl > div").evaluateAll((rows) => rows.map((row) => {
      const question = row.querySelector("dt")!;
      const answer = row.querySelector("dd")!;
      const q = question.getBoundingClientRect();
      const a = answer.getBoundingClientRect();
      return { questionFits: question.scrollWidth <= question.clientWidth, separated: q.bottom <= a.top };
    }));
    for (const question of questions) {
      expect(question.questionFits).toBe(true);
      expect(question.separated).toBe(true);
    }
    const rows = await page.getByRole("region", { name: "What I work with" }).getByRole("link").evaluateAll((elements) => elements.map((row) => {
      const bounds = row.getBoundingClientRect();
      return Array.from(row.children).every((child) => {
        const box = child.getBoundingClientRect();
        return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
      });
    }));
    expect(rows.every(Boolean)).toBe(true);
  }
});

test("mobile archives show work first and retain collapsible filters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, "/projects");
  const technology = page.getByRole("combobox", { name: "Technology" });
  await expect(technology).toBeHidden();
  await expect(page.getByRole("link", { name: /New Trier Block/ }).getByText("Read case study")).toBeInViewport();
  await page.getByRole("button", { name: "Filter projects", exact: true }).click();
  await technology.selectOption("Flutter");
  await expect(page.getByText("Showing 1 of 10")).toBeVisible();
  await page.getByRole("button", { name: /^Hide filters/ }).click();
  await expect(technology).toBeHidden();
  await expect(page.getByRole("button", { name: /^Filter projects/ })).toContainText("(1)");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.getByRole("button", { name: "Filter projects", exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/projects$/);

  await openPage(page, "/blog");
  const featuredPost = page.getByRole("link", { name: /One from the archive/ });
  await expect(featuredPost).toBeInViewport();
  const title = await featuredPost.getByRole("heading").innerText();
  const href = await featuredPost.getAttribute("href");
  expect(href).toMatch(/^\/blog\/[^/]+$/);
  await featuredPost.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test("Ask AI popover fits narrow screens", async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, "/blog");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const ask = page.getByRole("button", { name: "Ask AI about Charlie" });
    const bounds = await nav.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(12);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 12);
    await ask.click();
    const panel = page.locator("[popover]");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    await panel.getByRole("button", { name: "Close Ask AI" }).click();
    await expect(panel).toBeHidden();
  }
});

test("case studies show loaded product images with honest preview labels", async ({ page }) => {
  await openPage(page, "/projects/startle");
  const dashboard = page.getByRole("img", { name: /macOS dashboard/ });
  await expect(dashboard).toBeVisible();
  await expect(dashboard).toHaveJSProperty("naturalWidth", 2100);
  await expect(page.getByRole("link", { name: "Unsigned previews", exact: true })).toBeVisible();
  await openPage(page, "/projects/new-trier-block");
  const schedule = page.getByRole("img", { name: /Future View showing/ });
  await expect(schedule).toBeVisible();
  await expect(schedule).toHaveJSProperty("naturalWidth", 576);
  await expect(page.getByText("Development preview using bundled sample schedule data.")).toBeVisible();
  await expect(page.getByText("Private repository", { exact: true })).toBeVisible();
});

test.describe("delayed route navigation", () => {
  test.use({ serviceWorkers: "block" });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`slow route loading allows changing destination (${reducedMotion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route(/\/assets\/BlogPage-[^/]+\.js$/, async (route) => {
        await gate;
        await route.continue();
      });
      try {
        await openPage(page, "/projects");
        const nav = page.getByRole("navigation", { name: "Main navigation" });
        const loading = page.getByRole("status").filter({ hasText: "Loading page…" });
        await nav.getByRole("link", { name: "Blog", exact: true }).click();
        await expect(loading).toBeVisible();
        await nav.getByRole("link", { name: "Projects", exact: true }).click();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things I’ve built.");
        await expect(page.locator('[data-route-ready="true"]')).toHaveCSS("opacity", "1");
        await expect(loading).toBeHidden();
        await nav.getByRole("link", { name: "Blog", exact: true }).click();
        await expect(loading).toBeVisible();
        release();
        await expect(page.getByRole("heading", { level: 1, name: "Blog", exact: true })).toBeFocused();
        await expect(page.locator('[data-route-ready="true"]')).toHaveCSS("opacity", "1");
        await expect(page.locator('[data-route-ready="true"]')).toHaveCSS("filter", "none");
        await expect(loading).toBeHidden();
      } finally {
        release();
      }
    });
  }
});

test("editable fields keep native pointer feedback", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"));
  await openPage(page, "/blog");
  const search = page.getByRole("textbox", { name: "Search blog posts" });
  await search.hover();
  await expect(search).toHaveCSS("cursor", "text");
  await expect(page.locator(".custom-cursor")).toHaveCSS("visibility", "hidden");
  await page.getByRole("navigation").getByRole("link", { name: "Projects", exact: true }).click();
  const technology = page.getByRole("combobox", { name: "Technology" });
  await technology.hover();
  await expect(technology).toHaveCSS("cursor", "auto");
  await expect(page.locator(".custom-cursor")).toHaveCSS("visibility", "hidden");
});

test("command selection follows Tab focus", async ({ page }) => {
  await openPage(page, "/blog");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(search).toBeFocused();
  await search.press("Tab");
  const close = page.getByRole("button", { name: "Close command palette" });
  await expect(close).toBeFocused();
  const closeBounds = await close.boundingBox();
  expect(closeBounds!.width).toBeGreaterThanOrEqual(44);
  expect(closeBounds!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const projects = page.getByRole("option", { name: /Projects/ });
  await expect(projects).toBeFocused();
  await expect(projects).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option", { name: /Home/ })).toHaveAttribute("aria-selected", "false");
});
