import { expect, test, type Page, type Request } from "@playwright/test";
import { readFileSync } from "node:fs";

type Event = { api_key?: string; distinct_id?: string; event: string; properties: Record<string, unknown> };

function decodeEvents(request: Request): Event[] {
  const body = request.postData();
  if (!body) throw new Error("Missing analytics payload");
  const event: Event = JSON.parse(body);
  if (!event.api_key) throw new Error("Missing project token");
  // Keep public project configuration out of assertion failure reports.
  event.api_key = "[configured]";
  return [event];
}

async function observeAnalytics(page: Page) {
  const requests: string[] = [];
  const events: Event[] = [];
  const csp = readFileSync("public/_headers", "utf8").match(/Content-Security-Policy: (.+)/)![1];
  await page.route("http://127.0.0.1:43127/**", async route => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": csp } });
  });
  await page.route(/https:\/\/[^/]*posthog\.com\//, async route => {
    requests.push(route.request().url());
    if (route.request().method() === "POST") events.push(...decodeEvents(route.request()));
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  return { requests, events };
}

async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
}

test.use({ serviceWorkers: "block" });

test("unknown, declined, and old consent send no analytics; a new grant never replays earlier actions", async ({ page, context, baseURL }) => {
  const observed = await observeAnalytics(page);
  await openPage(page, "/");
  await page.getByRole("link", { name: "See Startle", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/startle$/);
  await page.getByRole("button", { name: "No thanks", exact: true }).click();
  await openPage(page, "/projects");
  await page.locator('main a[href="/projects/server"]').click();
  await expect(page).toHaveURL(/\/projects\/server$/);
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow", url: baseURL! }]);
  await openPage(page, "/");
  await expect(page.getByRole("button", { name: "Allow cookies", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "See Startle", exact: true }).click();
  await page.getByRole("button", { name: "Allow cookies", exact: true }).click();
  await openPage(page, "/");
  await page.waitForTimeout(350);
  expect(observed.requests).toEqual([]);

  await page.getByRole("link", { name: "See Startle", exact: true }).click();
  await expect.poll(() => observed.events.length).toBe(1);
  expect(observed.events[0]).toMatchObject({ event: "project_clicked", properties: {
    project_title: "Startle", project_href: "/projects/startle", page_path: "/",
  } });
});

test("only real project opens count, without SDK storage, automatic events, or sensitive URL data", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow-v2", url: baseURL! }]);
  await page.addInitScript(() => { Math.random = () => 0.999; });
  const observed = await observeAnalytics(page);
  await openPage(page, "/?email=private@example.com#private-fragment");
  const gallery = page.getByRole("region", { name: "Featured projects" });
  await gallery.getByRole("link", { name: "Select New Trier Block" }).click();
  await expect(page).toHaveURL(/email=private/);
  await gallery.getByRole("button", { name: "Next project", exact: true }).click();
  await gallery.getByRole("button", { name: "Previous project", exact: true }).click();
  await page.waitForTimeout(350);
  expect(observed.requests).toEqual([]);
  await gallery.getByRole("link", { name: "Open New Trier Block case study" }).click();
  await expect.poll(() => observed.events.length).toBe(1);
  await expect(page).toHaveURL(/\/projects\/new-trier-block$/);
  await openPage(page, "/projects");
  const popupPromise = context.waitForEvent("page");
  await page.locator('main a[href="https://github.com/Charlie284/pi-calc"]').click();
  const popup = await popupPromise;
  await popup.close();
  await expect.poll(() => observed.events.length).toBe(2);
  await page.waitForTimeout(350);
  expect(observed.events.map(event => event.event)).toEqual(["project_clicked", "project_clicked"]);
  expect(observed.requests).toHaveLength(2);
  expect(JSON.stringify(observed.events)).not.toMatch(/private@|private-fragment|\$current_url|\$referrer|\$browser|\$session_id/);
  expect((await context.cookies()).some(cookie => cookie.name.startsWith("ph_"))).toBe(false);
  expect(await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter(key => key.startsWith("ph_")))).toEqual([]);
});

test("newsletter records valid submissions without email data and preserves the native Kit POST", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow-v2", url: baseURL! }]);
  const observed = await observeAnalytics(page);
  let kitPost: { method: string; body: string | null } | undefined;
  await page.route("https://app.kit.com/forms/9788220/subscriptions", async route => {
    kitPost = { method: route.request().method(), body: route.request().postData() };
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Kit submission received</p>" });
  });
  await openPage(page, "/blog?email=private@example.com");
  const email = page.getByRole("textbox", { name: "Email address", exact: true });
  await email.fill("invalid");
  await page.getByRole("button", { name: "Send me new posts", exact: true }).click();
  expect(observed.requests).toEqual([]);
  await email.fill("private@example.com");
  expect(observed.requests).toEqual([]);
  await page.getByRole("button", { name: "Send me new posts", exact: true }).click();
  await expect.poll(() => observed.events.length).toBe(1);
  expect(observed.events[0]).toMatchObject({ event: "newsletter_submitted", properties: {
    source: "blog", page_path: "/blog", $process_person_profile: false,
  } });
  expect(JSON.stringify(observed.events)).not.toContain("private@example.com");
  expect(Object.keys(observed.events[0].properties).sort()).toEqual(["$process_person_profile", "page_path", "source"]);
  await expect.poll(() => kitPost?.method).toBe("POST");
  expect(new URLSearchParams(kitPost!.body!).get("email_address")).toBe("private@example.com");
  expect(observed.requests).toHaveLength(1);
});

test("withdrawing consent stops both events while project navigation and signup continue working", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "clh_cookie_choice", value: "allow-v2", url: baseURL! }]);
  const observed = await observeAnalytics(page);
  await openPage(page, "/");
  await page.getByRole("link", { name: "See Startle", exact: true }).click();
  await expect.poll(() => observed.events.length).toBe(1);
  await page.getByRole("link", { name: "Privacy and cookie choices", exact: true }).click();
  await page.getByRole("button", { name: "Decline cookies", exact: true }).click();
  await page.getByRole("link", { name: /Back home/ }).click();
  await page.getByRole("link", { name: "See Startle", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/startle$/);
  await page.route("https://app.kit.com/forms/9788220/subscriptions", route => route.fulfill({ status: 200, contentType: "text/html", body: "<p>Kit submission received</p>" }));
  await openPage(page, "/blog");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("private@example.com");
  await page.getByRole("button", { name: "Send me new posts", exact: true }).click();
  await expect(page).toHaveURL("https://app.kit.com/forms/9788220/subscriptions");
  expect(observed.events).toHaveLength(1);
  expect(observed.requests).toHaveLength(1);
});
