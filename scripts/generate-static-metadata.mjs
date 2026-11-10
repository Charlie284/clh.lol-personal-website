import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const serverEntry = path.join(rootDir, ".prerender/entry-server.js");
const { render, prerenderRoutes: routes, notFoundMetadata, offlineMetadata, resolveMetadata, siteUrl } =
  await import(pathToFileURL(serverEntry).href);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);

const setMeta = (html, attribute, key, value) => {
  const expression = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`;
  return expression.test(html) ? html.replace(expression, () => tag) : html.replace("</head>", () => `    ${tag}\n</head>`);
};

const setCanonical = (html, url) => {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  return /<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i, () => tag)
    : html.replace("</head>", () => `    ${tag}\n</head>`);
};

const addStructuredData = (html, data) => {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return html.replace(
    "</head>",
    () => `    <script id="route-structured-data" type="application/ld+json">${json}</script>\n</head>`,
  );
};

const renderMetadata = (template, route) => {
  const metadata = resolveMetadata(route);
  let html = setTitle(template, metadata.title);
  for (const { attribute, key, content } of metadata.tags) {
    html = setMeta(html, attribute, key, content);
  }
  html = setCanonical(html, metadata.canonicalUrl);
  return metadata.structuredData ? addStructuredData(html, metadata.structuredData) : html;
};

const setRenderedContent = (html, content) => {
  const root = /<div\s+id=["']root["']><\/div>/i;
  if (!root.test(html)) {
    throw new Error("The client HTML template is missing an empty #root element");
  }
  return html.replace(root, () => `<div id="root">${content}</div>`);
};

const template = await readFile(path.join(distDir, "index.html"), "utf8");
for (const route of routes) {
  const outputs = route.path === "/"
    ? [path.join(distDir, "index.html")]
    : [
        path.join(distDir, `${route.path.slice(1)}.html`),
        path.join(distDir, route.path.slice(1), "index.html"),
      ];
  const content = await render(route.path);
  const html = setRenderedContent(renderMetadata(template, route), content);
  for (const output of outputs) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
  }
}

// Client-side visits may cache route chunks without fetching their HTML.
// An empty root uses the normal client render path instead of hydrating a 404.
await writeFile(path.join(distDir, "offline.html"), renderMetadata(template, offlineMetadata), "utf8");

const notFound = setRenderedContent(renderMetadata(template, notFoundMetadata), await render("/404"));
await writeFile(path.join(distDir, "404.html"), notFound, "utf8");

const sitemapRoutes = routes
  .filter((route) => !route.noIndex)
  .map((route) => {
    const location = new URL(route.path, siteUrl).toString();
    const lastmod = route.modifiedTime ? `\n    <lastmod>${route.modifiedTime}</lastmod>` : "";
    return `  <url>\n    <loc>${location}</loc>${lastmod}\n  </url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes}\n</urlset>\n`;
await writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

// Legacy SPA fallbacks turn genuine missing URLs into soft 404s. Known routes
// now have static entry files, so these files should not ship in the build.
await Promise.all([
  rm(path.join(distDir, "_redirects"), { force: true }),
  rm(path.join(distDir, "_routes.json"), { force: true }),
  rm(path.join(rootDir, ".prerender"), { force: true, recursive: true }),
]);

console.log(`Generated metadata for ${routes.length} routes plus sitemap.xml, offline.html, and 404.html.`);
