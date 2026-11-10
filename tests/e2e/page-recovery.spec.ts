import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

for (const destination of ["project archive", "article"] as const) {
  test(`a missing ${destination} chunk offers recovery and reloads successfully`, async ({ page }) => {
    const chunk = destination === "project archive"
      ? /\/assets\/Projects-[^/]+\.js$/
      : /\/assets\/2026-08-12-why-i-hate-raycast-[^/]+\.js$/;
    let failedRequests = 0;
    await page.route(chunk, async (route) => {
      if (failedRequests++ === 0) {
        await route.fulfill({ status: 404, contentType: "text/plain", body: "Removed by a new deployment" });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    if (destination === "project archive") {
      await nav.getByRole("link", { name: "Projects", exact: true }).click();
    } else {
      await nav.getByRole("link", { name: "Blog", exact: true }).click();
      await page.getByRole("link", { name: /Why I Hate Raycast/ }).first().click();
    }

    await expect(page.getByRole("alert")).toContainText("This page couldn’t load.");
    await expect(nav).toBeVisible();
    await page.getByRole("button", { name: "Reload page", exact: true }).click();
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      destination === "project archive" ? "Things I've built." : "Why I Hate Raycast",
    );
    if (destination === "article") {
      await expect(page.locator(".blog-prose > *").first()).toBeVisible();
    }
    expect(failedRequests).toBeGreaterThan(1);
  });
}
