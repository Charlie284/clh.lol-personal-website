import { expect, test, type Page } from "@playwright/test";

async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "deny", url: baseURL! }]);
});

test("article lists keep visible bullet and number markers", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openPage(page, "/blog/why-every-developer-builds-a-personal-website");
  const prose = page.locator("article .blog-prose");
  await expect(prose.locator("ul").first()).toHaveCSS("list-style-type", "disc");
  await expect(prose.locator("ol").first()).toHaveCSS("list-style-type", "decimal");
  await expect(prose.locator("ol li")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test("case-study back link restores the project filters", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await openPage(page, "/projects?technology=Flutter&status=In+progress");
  await page.getByRole("link", { name: /New Trier Block/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "New Trier Block" })).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to projects", exact: true })).toHaveAttribute("href", "/projects?technology=Flutter&status=In+progress");
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: "Back to projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\?technology=Flutter&status=In\+progress$/);
  await expect(page.getByRole("heading", { level: 1, name: "Things I’ve built.", exact: true })).toBeVisible();
  const filters = page.getByRole("button", { name: /^Filter projects/ });
  if (await filters.isVisible()) await filters.click();
  await expect(page.getByRole("combobox", { name: "Technology" })).toHaveValue("Flutter");
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toHaveValue("In progress");
  await expect(page.getByText("Showing 1 of 10", { exact: true })).toBeVisible();
});

test("inline article links keep the original archive search", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await openPage(page, "/blog?q=instant");
  await page.getByRole("link", { name: /October 1, 2026.*Why I hate ChatGPT Instant/ }).click();
  await page.getByRole("link", { name: "why I hate Opus 5", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "WHY I HATE OPUS 5" })).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  await expect(page.getByRole("link", { name: /Back to Blog/ })).toHaveAttribute("href", "/blog?q=instant");
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: /Back to Blog/ }).click();
  await expect(page).toHaveURL(/\/blog\?q=instant$/);
  await expect(page.getByRole("textbox", { name: "Search blog posts" })).toHaveValue("instant");
  await expect(page.getByRole("status")).toHaveText("1 post matches your filters");
});

test("newsletter preference is explicit, consented, and survives reloads", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow", url: baseURL! }]);
  await openPage(page, "/newsletter-confirmed");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thanks for reading.");
  await expect(page.getByText(/Cookies are allowed/)).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === "clh_newsletter_subscription_confirmed")).toBe(false);
  await page.getByRole("button", { name: "Hide signup prompts", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signup prompts are hidden.");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  for (const path of ["/", "/blog", "/blog/why-i-used-rust-to-calculate-pi"]) {
    await openPage(page, path);
    await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toHaveCount(0);
  }
  await page.reload();
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address", exact: true })).toHaveCount(0);
  await openPage(page, "/privacy");
  await page.getByRole("button", { name: "Decline cookies", exact: true }).click();
  await openPage(page, "/newsletter-confirmed");
  await expect(page.getByRole("button", { name: "Hide signup prompts", exact: true })).toBeDisabled();
  await expect(page.getByText(/You declined preference cookies/)).toBeVisible();
});

test("command arrows continue moving focus after Tab reaches the options", async ({ page }) => {
  await openPage(page, "/blog");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(search).toBeFocused();
  await search.press("Tab");
  await page.keyboard.press("Tab");
  const home = page.getByRole("option", { name: /Home Back to the start/ });
  await expect(home).toBeFocused();
  await home.press("ArrowDown");
  const projects = page.getByRole("option", { name: /Projects See what I have built/ });
  await expect(projects).toBeFocused();
  await expect(projects).toHaveAttribute("aria-selected", "true");
  await expect(search).toHaveAttribute("aria-activedescendant", "command-projects");
  await projects.press("ArrowUp");
  await expect(home).toBeFocused();
  await expect(home).toHaveAttribute("aria-selected", "true");
});

test("returning-visitor notice stays clear of Ask AI on mobile", async ({ page, context, baseURL }) => {
  for (const width of [320, 390]) {
    await context.addCookies([
      { name: "clh_cookie_choice", value: "allow", url: baseURL! },
      { name: "clh_newsletter_last_visit", value: String(Date.now() - 91 * 24 * 60 * 60 * 1000), url: baseURL! },
    ]);
    await page.setViewportSize({ width, height: 844 });
    await openPage(page, "/");
    const notice = page.locator('[aria-labelledby="newsletter-notice-heading"]');
    await expect(notice).toBeVisible();
    const noticeBox = await notice.boundingBox();
    const askBox = await page.getByRole("button", { name: "Ask AI about Charlie" }).boundingBox();
    expect(noticeBox!.y + noticeBox!.height + 12).toBeLessThanOrEqual(askBox!.y);
    await notice.getByRole("button", { name: "Get new posts", exact: true }).click();
    await expect(notice.getByRole("textbox", { name: "Email address", exact: true })).toBeVisible();
    await expect(notice.getByRole("button", { name: "Sign me up", exact: true })).toBeVisible();
  }
});
