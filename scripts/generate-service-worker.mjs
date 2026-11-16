import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const workerPath = path.join(distDir, "sw.js");
async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path.join(directory, entry.name), relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

const allFiles = await listFiles(distDir);
const manifest = JSON.parse(await readFile(path.join(distDir, ".vite/manifest.json"), "utf8"));
const precacheFiles = new Set(["index.html", "offline.html", "logo.svg", "signature.svg", "manifest.json"]);

function addChunk(key) {
  const chunk = manifest[key];
  if (!chunk || precacheFiles.has(chunk.file)) return;
  precacheFiles.add(chunk.file);
  for (const file of [...(chunk.css ?? []), ...(chunk.assets ?? [])]) precacheFiles.add(file);
  for (const dependency of chunk.imports ?? []) addChunk(dependency);
}

// Cache the initial page, not every route and article on the visitor's first load.
for (const [key, chunk] of Object.entries(manifest)) {
  if (chunk.isEntry || key === "src/pages/Home.tsx") addChunk(key);
}

const hash = createHash("sha256");
for (const file of allFiles.filter((file) => file !== "sw.js" && !file.startsWith(".vite/")).sort()) {
  hash.update(file);
  hash.update(await readFile(path.join(distDir, file)));
}
const cacheVersion = hash.digest("hex").slice(0, 16);
const precacheUrls = new Set([...precacheFiles].map((file) => `/${file}`));
precacheUrls.add("/");

const template = await readFile(workerPath, "utf8");
if (
  !template.includes('"BUILD_CACHE_VERSION"') ||
  !template.includes('["BUILD_PRECACHE_URLS"]')
) {
  throw new Error("Service worker template placeholders are missing");
}

const worker = template
  .replace('"BUILD_CACHE_VERSION"', JSON.stringify(cacheVersion))
  .replace(
    '["BUILD_PRECACHE_URLS"]',
    JSON.stringify(Array.from(precacheUrls).sort(), null, 2),
  );

await writeFile(workerPath, worker, "utf8");
console.log(`Generated service worker ${cacheVersion} with ${precacheUrls.size} precached URLs.`);
