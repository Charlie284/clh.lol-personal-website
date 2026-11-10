import { expect, test } from "@playwright/test";

test("every prerendered route keeps its metadata after hydration", async ({ page, request }) => {
  test.setTimeout(90_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const routes = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), (match) =>
    new URL(match[1]).pathname,
  );

  for (const route of [...routes, "/newsletter-confirmed", "/404"]) {
    const response = await request.get(route);
    expect(response.ok(), route).toBe(true);
    const html = await response.text();
    await page.goto(route);
    await expect(page.locator('[data-route-ready="true"]')).toBeVisible();

    const { initial, hydrated } = await page.evaluate((source) => {
      function metadata(doc: Document) {
        return {
          title: doc.title,
          canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
          tags: Array.from(doc.querySelectorAll("meta[name], meta[property]"), (tag) => [
            tag.getAttribute("name") ?? tag.getAttribute("property"),
            tag.getAttribute("content"),
          ]).sort(([a], [b]) => (a ?? "").localeCompare(b ?? "")),
          article: JSON.parse(doc.querySelector("#route-structured-data")?.textContent ?? "null"),
        };
      }
      return {
        initial: metadata(new DOMParser().parseFromString(source, "text/html")),
        hydrated: metadata(document),
      };
    }, html);
    expect(hydrated, `${route} metadata should not change during hydration`).toEqual(initial);
  }
});
