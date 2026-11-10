import { describe, expect, it } from "vitest";
import { extractBlogUrls, extractPost, planChanges, summarizeHtml, verifyProof } from "./substack-sync.mjs";

const source = "https://clh.lol/blog/example";
const article = (body = "<p>A published article.</p>", title = "Example") => `<!doctype html><html><head>
  <meta property="article:published_time" content="2026-07-16">
  </head><body><article><div><header><div><span>July 16, 2026</span><span>1 min read</span><span>development</span></div>
  <h1>${title}</h1><p>A real description.</p></header><div class="blog-prose">${body}</div></div></article></body></html>`;
const read = (body, title) => extractPost(article(body, title), source, new Set(["example", "other"]));
const proofFor = (post) => ({ ...post, postId: 123, url: post.substackUrl });

describe("Substack source and change detection", () => {
  it("discovers published blog routes without importing unrelated or external pages", () => {
    const xml = '<urlset><url><loc>https://clh.lol/blog/example</loc></url><url><loc>https://clh.lol/projects</loc></url><url><loc>https://elsewhere.test/blog/example</loc></url></urlset>';
    expect(extractBlogUrls(xml)).toEqual([source]);
    expect(() => extractBlogUrls('<urlset><url><loc>https://clh.lol/blog/example</loc></url><url><loc>https://clh.lol/blog/example</loc></url></urlset>')).toThrow("duplicate");
  });

  it("ignores surrounding site changes but detects article and metadata edits", () => {
    const post = read();
    const cosmetic = extractPost(article().replace('class="blog-prose"', 'class="blog-prose changed-styling"'), source, new Set(["example"]));
    expect(cosmetic.hash).toBe(post.hash);
    const state = { posts: { example: { hash: post.hash, postId: 123 } } };
    expect(planChanges([post], state).pending).toEqual([]);
    expect(planChanges([read("<p>Edited article.</p>")], state).pending[0]).toMatchObject({ action: "update", postId: 123 });
    expect(planChanges([read(undefined, "New title")], state).pending).toHaveLength(1);
  });

  it("reconciles unknown posts before creating and never deletes removed posts", () => {
    const plan = planChanges([read()], { posts: { old: { hash: "old" } } });
    expect(plan.pending[0].action).toBe("reconcile-or-create");
    expect(plan.removed).toEqual(["old"]);
    expect(() => planChanges([read(), read()], {})).toThrow("Duplicate");
  });

  it("keeps all table cells, code, links, and image descriptions readable", () => {
    const post = read('<table><thead><tr><th>Need</th><th>Tool</th></tr></thead><tbody><tr><td>Permanent</td><td><strong>Compose</strong></td></tr></tbody></table><pre><code><span>if x &lt; 2 {</span>\n  <span>return x;</span>\n}</code></pre><p><a href="/blog/other"><code>Other</code></a></p><img src="/example.png" alt="Example picture">');
    expect(post.text).toContain("Need: Permanent Tool: Compose");
    expect(post.html).toContain("if x &lt; 2 {\n  return x;\n}");
    expect(post.codeBlocks).toBe(1);
    expect(post.links).toEqual(["https://clhdev.substack.com/p/other"]);
    expect(post.images).toEqual([{ src: "https://clh.lol/example.png", alt: "Example picture" }]);
    expect(post.html).not.toContain("<table");
    expect(post.html).not.toContain("<a href=\"https://clhdev.substack.com/p/other\"><code>");
  });

  it("refuses incomplete source pages and unsupported interactive content", () => {
    expect(() => extractPost("<p>Not the article</p>", source, new Set())).toThrow("Incomplete");
    expect(() => extractPost(article(), "https://elsewhere.test/blog/example", new Set())).toThrow("Only published");
    expect(() => read('<p>Article text.</p><iframe src="https://elsewhere.test"></iframe>')).toThrow("Unsupported");
    expect(() => read('<a href="javascript:alert(1)">bad link</a>')).toThrow("protocol");
  });

  it("acknowledges only a matching, verified public copy", () => {
    const post = read();
    expect(() => verifyProof(post, proofFor(post))).not.toThrow();
    expect(() => verifyProof(post, { ...proofFor(post), hash: "outdated-source" })).toThrow("hash");
    expect(() => verifyProof(post, { ...proofFor(post), text: "Incomplete copy" })).toThrow("text");
    expect(() => verifyProof(post, { ...proofFor(post), date: "2026-10-19" })).toThrow("date");
    expect(() => verifyProof(post, { ...proofFor(post), tags: [] })).toThrow("tags");
    expect(() => verifyProof(post, { ...proofFor(post), url: "https://other.substack.com/p/example" })).toThrow("url");
  });

  it("normalizes prose while retaining exact code-block text", () => {
    const code = 'if True:\n    print("hello  world")\n    print("bye")';
    const post = read(`<p>It’s a published article.</p><pre><code>${code}</code></pre>`);
    const observed = summarizeHtml(`<p>It's   a published\narticle.</p><pre><code>${code}</code></pre>`);
    expect(post.text).toBe("It's a published article.");
    expect(post.codeBlockTexts).toEqual([code]);
    expect(() => verifyProof(post, { ...proofFor(post), ...observed })).not.toThrow();
  });

  it.each([
    ['collapsed lines', 'if True: print("hello  world") print("bye")'],
    ['changed indentation', 'if True:\nprint("hello  world")\n    print("bye")'],
    ['changed string whitespace', 'if True:\n    print("hello world")\n    print("bye")'],
    ['smart quotes', 'if True:\n    print(“hello  world”)\n    print("bye")'],
  ])("rejects %s in observed code", (_change, observedCode) => {
    const post = read('<pre><code>if True:\n    print("hello  world")\n    print("bye")</code></pre>');
    const observed = summarizeHtml(`<pre><code>${observedCode}</code></pre>`);
    expect(() => verifyProof(post, { ...proofFor(post), ...observed })).toThrow("codeBlockTexts");
  });

  it("requires exact code contents in receipts, including block order", () => {
    const post = read('<pre><code>first()</code></pre><pre><code>second()</code></pre>');
    const observed = summarizeHtml('<pre><code>second()</code></pre><pre><code>first()</code></pre>');
    expect(() => verifyProof(post, { ...proofFor(post), ...observed })).toThrow("codeBlockTexts");
    const receipt = proofFor(post);
    delete receipt.codeBlockTexts;
    expect(() => verifyProof(post, receipt)).toThrow("codeBlockTexts");
  });

  it("preserves known destination IDs while allowing reconciled new IDs", () => {
    const post = read();
    const update = planChanges([post], { posts: { example: { hash: "previous-hash", postId: 123 } } }).pending[0];
    expect(() => verifyProof(update, proofFor(post))).not.toThrow();
    expect(() => verifyProof(update, { ...proofFor(post), postId: 999 })).toThrow("postId");
    const unknown = planChanges([post], {}).pending[0];
    expect(() => verifyProof(unknown, { ...proofFor(post), postId: 999 })).not.toThrow();
  });
});
