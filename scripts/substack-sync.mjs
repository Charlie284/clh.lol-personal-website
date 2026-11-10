import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

export const siteUrl = "https://clh.lol";
export const publicationUrl = "https://clhdev.substack.com";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workDir = path.join(root, ".substack-sync");
const blockTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "PRE", "BLOCKQUOTE", "BR", "HR"]);
const supportedTags = new Set([...blockTags, "A", "STRONG", "EM", "DEL", "S", "CODE", "IMG", "SUP", "SUB"]);
const unsupportedTags = new Set(["IFRAME", "VIDEO", "AUDIO", "CANVAS", "SVG", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "MATH"]);

export const normalizeText = (text) => text.normalize("NFC")
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const escapeHtml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function absoluteUrl(value, source, slugs, image = false) {
  const url = new URL(value, source);
  if (!["http:", "https:", ...(image ? [] : ["mailto:", "tel:"])].includes(url.protocol)) {
    throw new Error(`Unsupported content URL protocol: ${url.protocol}`);
  }
  if (!image && url.origin === siteUrl && url.pathname.startsWith("/blog/")) {
    const slug = url.pathname.slice("/blog/".length).replace(/\/$/, "");
    if (slugs.has(slug)) return `${publicationUrl}/p/${slug}${url.search}${url.hash}`;
  }
  return url.href;
}

function convertNode(node, source, slugs) {
  if (node.nodeType === 3) return escapeHtml(node.textContent);
  if (node.nodeType !== 1) return "";
  const tag = node.tagName;
  if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tag)) return "";
  if (unsupportedTags.has(tag)) throw new Error(`Unsupported article element: ${tag.toLowerCase()}`);
  if (tag === "PRE") return `<pre><code>${escapeHtml(node.textContent)}</code></pre>`;
  if (tag === "TABLE") {
    const rows = Array.from(node.rows);
    const headers = Array.from(rows.shift()?.cells ?? []).map((cell) => cell.textContent.trim());
    if (!headers.length || !rows.length) throw new Error("Cannot convert an empty article table");
    return `<ul>${rows.map((row) => {
      if (row.cells.length !== headers.length) throw new Error("Cannot convert a table with merged cells");
      return `<li>${Array.from(row.cells).map((cell, index) =>
        `<p><strong>${escapeHtml(headers[index])}:</strong> ${Array.from(cell.childNodes).map((child) => convertNode(child, source, slugs)).join("")}</p>`).join("")}</li>`;
    }).join("")}</ul>`;
  }
  let children = Array.from(node.childNodes).map((child) => convertNode(child, source, slugs)).join("");
  if (tag === "A") {
    const href = node.getAttribute("href");
    if (!href) return children;
    // Substack drops links wrapped around inline code on paste.
    children = children.replace(/<\/?code>/g, "");
    return `<a href="${escapeHtml(absoluteUrl(href, source, slugs))}">${children}</a>`;
  }
  if (tag === "IMG") {
    const src = node.getAttribute("src");
    if (!src) throw new Error("An article image has no source URL");
    return `<img src="${escapeHtml(absoluteUrl(src, source, slugs, true))}" alt="${escapeHtml(node.getAttribute("alt") ?? "")}">`;
  }
  if (tag === "BR" || tag === "HR") return `<${tag.toLowerCase()}>`;
  if (supportedTags.has(tag)) return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
  // Syntax-highlighting spans and layout wrappers do not belong in the copy.
  return children;
}

export function summarizeHtml(html) {
  const { document } = new JSDOM(html).window;
  const text = (node) => {
    // Code is verified separately; whitespace and quote changes can alter its behavior.
    if (node.nodeName === "PRE") return " ";
    if (node.nodeType === 3) return node.textContent;
    const children = Array.from(node.childNodes).map(text).join("");
    return blockTags.has(node.nodeName) ? ` ${children} ` : children;
  };
  const codeBlockTexts = Array.from(document.querySelectorAll("pre"), (block) => block.textContent);
  return {
    text: normalizeText(text(document.body)),
    links: Array.from(document.querySelectorAll("a[href]")).map((link) => link.getAttribute("href")),
    codeBlocks: codeBlockTexts.length,
    codeBlockTexts,
    images: Array.from(document.querySelectorAll("img")).map((image) => ({ src: image.getAttribute("src"), alt: image.getAttribute("alt") })),
  };
}

export function extractPost(html, source, knownSlugs) {
  const url = new URL(source);
  const slug = url.pathname.slice("/blog/".length);
  if (url.origin !== siteUrl || !url.pathname.startsWith("/blog/") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Only published clh.lol blog URLs can be synchronized");
  }
  const { document } = new JSDOM(html).window;
  const article = document.querySelector("article:has(.blog-prose)");
  const body = article?.querySelector(".blog-prose");
  const header = article?.querySelector("header");
  const title = header?.querySelector("h1")?.textContent.trim();
  const description = header?.querySelector("p")?.textContent.trim();
  const date = document.querySelector('meta[property="article:published_time"]')?.content;
  const tags = Array.from(header?.firstElementChild?.children ?? []).slice(2).map((tag) => tag.textContent.trim());
  if (!body?.textContent.trim() || !title || !description || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date ||
      tags.some((tag) => !tag || /\s/.test(tag))) {
    throw new Error(`Incomplete or changed published article markup: ${slug}`);
  }
  const content = Array.from(body.childNodes).map((node) => convertNode(node, source, knownSlugs)).join("");
  const summary = summarizeHtml(content);
  const post = { slug, title, description, date, tags, sourceUrl: url.href, substackUrl: `${publicationUrl}/p/${slug}`, html: content, ...summary };
  post.hash = createHash("sha256").update(JSON.stringify({ title, description, date, tags, html: content })).digest("hex");
  return post;
}

export function extractBlogUrls(xml) {
  const { document } = new JSDOM(xml, { contentType: "application/xml" }).window;
  const urls = Array.from(document.querySelectorAll("url > loc"), (node) => node.textContent.trim());
  const blogs = urls.filter((value) => {
    const url = new URL(value);
    return url.origin === siteUrl && /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname);
  });
  if (!blogs.length || new Set(blogs).size !== blogs.length) throw new Error("The live sitemap has no blog posts or contains duplicate blog URLs");
  return blogs;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "clh.lol Substack sync" } });
  if (!response.ok) throw new Error(`Cannot read published source ${url}: HTTP ${response.status}`);
  return response.text();
}

export async function readPublishedPosts() {
  const urls = extractBlogUrls(await fetchText(`${siteUrl}/sitemap.xml`));
  const slugs = new Set(urls.map((url) => new URL(url).pathname.slice("/blog/".length)));
  const posts = [];
  for (let index = 0; index < urls.length; index += 4) {
    posts.push(...await Promise.all(urls.slice(index, index + 4).map(async (url) => extractPost(await fetchText(url), url, slugs))));
  }
  return posts;
}

export function planChanges(posts, state) {
  if (new Set(posts.map((post) => post.slug)).size !== posts.length) throw new Error("Duplicate source slugs");
  const entries = state.posts ?? {};
  return {
    version: 1,
    source: siteUrl,
    publication: publicationUrl,
    checkedAt: new Date().toISOString(),
    total: posts.length,
    pending: posts.filter((post) => entries[post.slug]?.hash !== post.hash)
      .map((post) => ({ ...post, action: entries[post.slug] ? "update" : "reconcile-or-create", postId: entries[post.slug]?.postId ?? null })),
    removed: Object.keys(entries).filter((slug) => !posts.some((post) => post.slug === slug)),
  };
}

export function verifyProof(post, proof) {
  const canonicalUrl = new URL(proof.url);
  canonicalUrl.search = "";
  canonicalUrl.hash = "";
  const checks = {
    hash: proof.hash === post.hash,
    url: canonicalUrl.href === post.substackUrl,
    title: normalizeText(proof.title ?? "") === normalizeText(post.title),
    description: normalizeText(proof.description ?? "") === normalizeText(post.description),
    date: typeof proof.date === "string" && proof.date.slice(0, 10) === post.date,
    text: normalizeText(proof.text ?? "") === post.text,
    links: JSON.stringify(proof.links) === JSON.stringify(post.links),
    codeBlocks: proof.codeBlocks === post.codeBlocks,
    codeBlockTexts: Array.isArray(post.codeBlockTexts) && Array.isArray(proof.codeBlockTexts) &&
      JSON.stringify(proof.codeBlockTexts) === JSON.stringify(post.codeBlockTexts),
    tags: JSON.stringify(proof.tags) === JSON.stringify(post.tags),
    images: JSON.stringify(proof.images) === JSON.stringify(post.images),
    postId: Number.isSafeInteger(proof.postId) && proof.postId > 0 &&
      (post.postId == null || proof.postId === post.postId),
  };
  const failures = Object.entries(checks).filter(([, valid]) => !valid).map(([name]) => name);
  if (failures.length) throw new Error(`Cannot acknowledge ${post.slug}; verification failed: ${failures.join(", ")}`);
}

export async function writeJson(filename, value) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, filename);
}

async function loadState() {
  try {
    const state = JSON.parse(await readFile(path.join(workDir, "state.json"), "utf8"));
    if (state.version !== 1 || state.source !== siteUrl || state.publication !== publicationUrl || typeof state.posts !== "object") throw new Error("Invalid sync state");
    return state;
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, source: siteUrl, publication: publicationUrl, posts: {} };
    throw error;
  }
}

async function main() {
  const command = process.argv[2] ?? "plan";
  if (command === "plan") {
    const plan = planChanges(await readPublishedPosts(), await loadState());
    await writeJson(path.join(workDir, "plan.json"), plan);
    console.log(JSON.stringify({ total: plan.total, pending: plan.pending.map(({ slug, action }) => ({ slug, action })), removed: plan.removed }));
    return;
  }
  if (command === "ack" && process.argv[3]) {
    const proof = JSON.parse(await readFile(path.resolve(process.argv[3]), "utf8"));
    const plan = JSON.parse(await readFile(path.join(workDir, "plan.json"), "utf8"));
    const post = plan.pending.find((candidate) => candidate.slug === proof.slug && candidate.hash === proof.hash);
    if (!post) throw new Error("The receipt does not match the current pending plan");
    verifyProof(post, proof);
    const state = await loadState();
    state.posts[post.slug] = { hash: post.hash, postId: proof.postId, substackUrl: post.substackUrl, verifiedAt: new Date().toISOString() };
    await writeJson(path.join(workDir, "state.json"), state);
    console.log(JSON.stringify({ acknowledged: post.slug }));
    return;
  }
  throw new Error("Usage: node scripts/substack-sync.mjs plan | ack <proof.json>");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
