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
    for (const directory of ["dist", ".prerender"]) {
      mkdirSync(join(fixture, directory), { recursive: true });
    }
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(fixture, "dist/index.html"), '<!doctype html><html><head><title>Template</title><meta name="description" content="Template"></head><body><div id="root"></div></body></html>');
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
