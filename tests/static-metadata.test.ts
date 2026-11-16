import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { expect, it } from "vitest";
import { transpileModule, ModuleKind } from "typescript";
import { getBlogMetadata } from "../src/lib/routeMetadata";
import { frontmatter as yamlMetadata } from "./fixtures-metadata.mdx";

it("preserves literal tokens and parsed YAML frontmatter in generated article HTML and metadata", () => {
  const fixture = mkdtempSync(join(tmpdir(), "website-metadata-"));
  const literal = "Metadata tokens: $& $$ <example>";
  const bodyLiteral = "Body tokens: $& $' $` $$ <example>";
  const escaped = bodyLiteral.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  try {
    for (const directory of ["dist/.vite", ".prerender"]) {
      mkdirSync(join(fixture, directory), { recursive: true });
    }
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(fixture, "dist/index.html"), '<!doctype html><html><head><title>Template</title><meta name="description" content="Template"></head><body><div id="root"></div></body></html>');
    writeFileSync(join(fixture, "dist/.vite/manifest.json"), "{}");
    // Exercise the real shared metadata resolver through the HTML writer.
    const metadataModule = transpileModule(readFileSync(resolve("src/lib/routeMetadata.ts"), "utf8"), {
      compilerOptions: { module: ModuleKind.ESNext },
    }).outputText;
    writeFileSync(join(fixture, ".prerender/metadata.js"), metadataModule);
    const routes = [
      getBlogMetadata({ title: literal, description: literal, slug: "replacement-tokens", date: "2026-10-19", tags: [], wordCount: 0 }),
      getBlogMetadata(yamlMetadata),
    ];
    writeFileSync(join(fixture, ".prerender/entry-server.js"), `
      export { resolveMetadata, notFoundMetadata, offlineMetadata, siteUrl } from "./metadata.js";
      export const prerenderRoutes = ${JSON.stringify(routes)};
      export const render = () => ${JSON.stringify(`<p>${escaped}</p>`)};
    `);

    execFileSync(process.execPath, [resolve("scripts/generate-static-metadata.mjs")], { cwd: fixture });

    const html = readFileSync(join(fixture, "dist/blog/replacement-tokens.html"), "utf8");
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll("#root")).toHaveLength(1);
    expect(document.querySelector("#root")!.textContent).toBe(bodyLiteral);
    expect(document.title).toBe(`${literal} — Charlie H`);
    expect(document.querySelector('meta[name="description"]')!.getAttribute("content")).toBe(literal);
    expect(document.querySelector('meta[property="og:title"]')!.getAttribute("content")).toBe(`${literal} — Charlie H`);
    const structuredData = JSON.parse(document.querySelector("#route-structured-data")!.textContent!);
    expect(structuredData.headline).toBe(literal);
    expect(structuredData.description).toBe(literal);

    const yamlHtml = readFileSync(join(fixture, "dist/blog/yaml-frontmatter.html"), "utf8");
    const yamlDocument = new DOMParser().parseFromString(yamlHtml, "text/html");
    expect(yamlDocument.title).toBe("A single-quoted title — Charlie H");
    expect(yamlDocument.querySelector('meta[name="description"]')!.getAttribute("content"))
      .toBe("A folded description with two lines.");
    expect(yamlDocument.querySelector('meta[property="article:modified_time"]')!.getAttribute("content"))
      .toBe("2026-10-24");
    expect(readFileSync(join(fixture, "dist/sitemap.xml"), "utf8"))
      .toContain("<lastmod>2026-10-24</lastmod>");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

it("preloads only the current route and its static dependencies in generated HTML", () => {
  const fixture = mkdtempSync(join(tmpdir(), "website-preloads-"));
  try {
    mkdirSync(join(fixture, "dist/.vite"), { recursive: true });
    mkdirSync(join(fixture, ".prerender"));
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(fixture, "dist/index.html"), '<html><head><title>Template</title><script type="module" src="/assets/app.js"></script><link rel="modulepreload" crossorigin href="/assets/shared.js"></head><body><div id="root"></div></body></html>');
    writeFileSync(join(fixture, "dist/.vite/manifest.json"), JSON.stringify({
      "index.html": { file: "assets/app.js", imports: ["shared"] },
      shared: { file: "assets/shared.js" },
      "src/pages/Home.tsx": { file: "assets/home.js", imports: ["index.html", "shared"] },
      "src/pages/BlogPostPage.tsx": { file: "assets/article-page.js", imports: ["shared", "blog"] },
      blog: { file: "assets/blog.js", imports: ["index.html"], dynamicImports: ["src/content/blog/other.mdx"] },
      "src/content/blog/current.mdx": { file: "assets/current.js", imports: ["shared"] },
      "src/content/blog/other.mdx": { file: "assets/other.js" },
      "fonts.css": { file: "assets/fonts.css" },
      "src/pages/NotFound.tsx": { file: "assets/not-found.js", imports: ["shared"] },
    }));
    writeFileSync(join(fixture, ".prerender/entry-server.js"), `
      export const siteUrl = "https://clh.lol";
      export const prerenderRoutes = [
        { path: "/", preloadModules: ["src/pages/Home.tsx"], deferredStylesheets: ["fonts.css"] },
        { path: "/blog/current", preloadModules: ["src/pages/BlogPostPage.tsx", "src/content/blog/current.mdx", "fonts.css"] },
      ];
      export const notFoundMetadata = { path: "/404", preloadModules: ["src/pages/NotFound.tsx"] };
      export const offlineMetadata = { path: "/offline" };
      export const resolveMetadata = route => ({ title: "Fixture", tags: [], canonicalUrl: siteUrl + route.path });
      export const render = () => "<h1>Fixture</h1>";
    `);
    execFileSync(process.execPath, [resolve("scripts/generate-static-metadata.mjs")], { cwd: fixture });

    const preloads = (file: string) => {
      const document = new DOMParser().parseFromString(readFileSync(join(fixture, "dist", file), "utf8"), "text/html");
      const links = Array.from(document.querySelectorAll('link[rel="modulepreload"]'));
      for (const link of links) expect(link.hasAttribute("crossorigin")).toBe(true);
      return links.map(link => link.getAttribute("href"));
    };
    expect(readFileSync(join(fixture, "dist/index.html"), "utf8"))
      .toContain('<noscript><link rel="stylesheet" href="/assets/fonts.css"></noscript>');
    expect(preloads("index.html")).toEqual(["/assets/shared.js", "/assets/home.js"]);
    expect(preloads("blog/current.html")).toEqual([
      "/assets/shared.js", "/assets/article-page.js", "/assets/blog.js", "/assets/current.js",
    ]);
    const article = new DOMParser().parseFromString(readFileSync(join(fixture, "dist/blog/current.html"), "utf8"), "text/html");
    expect(article.querySelector('link[rel="stylesheet"]')?.getAttribute("href")).toBe("/assets/fonts.css");
    expect(preloads("blog/current/index.html")).toEqual(preloads("blog/current.html"));
    expect(preloads("404.html")).toEqual(["/assets/shared.js", "/assets/not-found.js"]);
    expect(preloads("offline.html")).toEqual(["/assets/shared.js"]);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
