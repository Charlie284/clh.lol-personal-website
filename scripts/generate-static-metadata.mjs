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

const manifest = JSON.parse(await readFile(path.join(distDir, ".vite/manifest.json"), "utf8"));

const addRoutePreloads = (html, route) => {
  const existingAssets = new Set(Array.from(
    html.matchAll(/<(?:link|script)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1],
  ));
  const visited = new Set();
  const links = [];
  const addChunk = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing browser chunk for ${key}`);
    const url = `/${chunk.file}`;
    if (!existingAssets.has(url)) {
      existingAssets.add(url);
      links.push(chunk.file.endsWith(".css")
        ? `<link rel="stylesheet" crossorigin href="${escapeHtml(url)}">`
        : `<link rel="modulepreload" crossorigin href="${escapeHtml(url)}">`);
    }
    for (const file of chunk.css ?? []) {
      const stylesheet = `/${file}`;
      if (existingAssets.has(stylesheet)) continue;
      existingAssets.add(stylesheet);
      links.push(`<link rel="stylesheet" crossorigin href="${escapeHtml(stylesheet)}">`);
    }
    // Dynamic imports remain on demand; an article must not fetch the archive.
    for (const dependency of chunk.imports ?? []) addChunk(dependency);
  };
  for (const key of route.preloadModules ?? []) addChunk(key);
  for (const key of route.deferredStylesheets ?? []) {
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing deferred stylesheet for ${key}`);
    links.push(`<noscript><link rel="stylesheet" href="/${escapeHtml(chunk.file)}"></noscript>`);
  }
  return html.replace("</head>", () => `${links.join("\n")}\n</head>`);
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
  const html = setRenderedContent(addRoutePreloads(renderMetadata(template, route), route), content);
  if (route.path === "/") {
    // Cloudflare skips automatic Early Hints for crossorigin links. Explicit
    // headers retain credentials and use preload, which its 103 cache accepts.
    // The HTML keeps modulepreload so scripts also receive module compilation.
    const hints = [];
    const activeHtml = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
    for (const [tag] of activeHtml.matchAll(/<(?:link|script)\b[^>]+>/gi)) {
      const attribute = name => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1];
      const href = attribute("href") ?? attribute("src");
      if (!href?.startsWith("/assets/")) continue;
      const rel = attribute("rel");
      const module = rel === "modulepreload" || attribute("type") === "module";
      const as = module ? "script" : rel === "stylesheet" ? "style" : attribute("as");
      if (!module && rel !== "stylesheet" && rel !== "preload") continue;
      const crossorigin = /\bcrossorigin\b/i.test(tag) ? "; crossorigin" : "";
      hints.push(`<${href}>; rel=preload; as=${as}${crossorigin}`);
    }
    const headersPath = path.join(distDir, "_headers");
    const headers = await readFile(headersPath, "utf8").catch(error => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    await writeFile(headersPath, `${headers.trimEnd()}\n\n/\n  ! Link\n  Link: ${[...new Set(hints)].join(", ")}\n`, "utf8");
  }
  for (const output of outputs) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
  }
}

// Client-side visits may cache route chunks without fetching their HTML.
// An empty root uses the normal client render path instead of hydrating a 404.
await writeFile(path.join(distDir, "offline.html"), renderMetadata(template, offlineMetadata), "utf8");

const notFound = setRenderedContent(addRoutePreloads(renderMetadata(template, notFoundMetadata), notFoundMetadata), await render("/404"));
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
