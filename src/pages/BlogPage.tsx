import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { formatBlogDate, getAllBlogPosts, parseBlogDate } from "../lib/blog";
import { usePrerenderedSearchParams } from "../lib/usePrerenderedSearchParams";
import NewsletterSignup from "../components/NewsletterSignup";
import RouteMeta from "../components/RouteMeta";

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const featuredPost = posts.find((post) => post.meta.slug === "why-i-used-rust-to-calculate-pi");
  const [searchParams, setSearchParams, filtersReady] = usePrerenderedSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const allTags = Array.from(new Set(posts.flatMap((p) => p.meta.tags)));
  const tag = searchParams.get("tag") ?? "All";
  const selectedTag = allTags.includes(tag) ? tag : "All";
  const sortOrder = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const [activeMenu, setActiveMenu] = useState<"sort" | "tag" | null>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const tagTriggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const hasFilters = Boolean(searchQuery || selectedTag !== "All" || sortOrder !== "newest");
  const returnSearch = searchParams.toString();
  const articleState = { blogReturnTo: `/blog${returnSearch ? `?${returnSearch}` : ""}` };

  function clearFilters() {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const name of ["q", "tag", "sort"]) next.delete(name);
      return next;
    }, { replace: true, preventScrollReset: true });
    searchRef.current?.focus({ preventScroll: true });
  }

  function dismissOnBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setActiveMenu(null);
  }

  function updateFilter(name: "q" | "tag" | "sort", value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (!value || (name === "tag" && value === "All") || (name === "sort" && value === "newest")) next.delete(name);
      else next.set(name, value);
      return next;
    }, { replace: true, preventScrollReset: true });
  }

  const closeMenu = useCallback(() => {
    if (activeMenu === null) return;
    (activeMenu === "sort" ? sortTriggerRef : tagTriggerRef).current?.focus({ preventScroll: true });
    setActiveMenu(null);
  }, [activeMenu]);

  // Close menus when clicking outside or pressing Escape.
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  // Apply filters: search -> tag -> sort
  let visiblePosts = posts.filter((post) => {
    // 1. Search Query Filter (Partial match across title, desc, and tags)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        post.meta.title.toLowerCase().includes(q) ||
        post.meta.description.toLowerCase().includes(q) ||
        post.meta.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    // 2. Tag Filter
    if (selectedTag !== "All") {
      if (!post.meta.tags.includes(selectedTag)) return false;
    }

    return true;
  });

  // 3. Sorting
  visiblePosts = visiblePosts.slice().sort((a, b) => {
    const aTime = parseBlogDate(a.meta.date).getTime();
    const bTime = parseBlogDate(b.meta.date).getTime();
    return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="page-shell">
      <RouteMeta path="/blog" />
      <motion.header
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-5 grid max-w-6xl gap-5 border-b border-white/10 pb-5 sm:mb-8 sm:gap-8 sm:pb-8 md:grid-cols-[0.7fr_1.3fr] md:items-start md:gap-16"
      >
        <h1 className="page-title">
          <span>Blog</span>
        </h1>
        {featuredPost && (
          <Link to={`/blog/${featuredPost.meta.slug}`} state={articleState} className="group block">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/60">One from the archive</p>
            <h2 className="editorial-title">{featuredPost.meta.title}</h2>
            <p className="mt-3 hidden max-w-[60ch] text-base leading-relaxed text-white/70 sm:block">{featuredPost.meta.description}</p>
            <span className="mt-1 inline-flex min-h-11 items-center text-xs sm:mt-3 font-bold uppercase tracking-[0.14em] text-white underline decoration-white/30 underline-offset-4 group-hover:decoration-white">Read this post →</span>
          </Link>
        )}
      </motion.header>

      <div className="mx-auto mb-3 grid max-w-6xl gap-3 border-b border-white/10 pb-3 lg:grid-cols-[minmax(14rem,1fr)_auto] lg:items-center lg:gap-6">
        {/* Search */}
        <div className="relative group">
          <label htmlFor="blog-search" className="sr-only">
            Search blog posts
          </label>
          <div className="absolute inset-0 bg-white/[0.01] rounded-2xl blur-xl group-focus-within:bg-white/[0.03] transition-colors pointer-events-none" />
          <div className="relative flex items-center">
            <span className="absolute left-6 text-white/55 group-focus-within:text-white/60 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              ref={searchRef}
              id="blog-search"
              type="text"
              disabled={!filtersReady}
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 pl-14 pr-4 text-white placeholder:text-white/55 focus:border-white/50 transition-colors text-base"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="relative flex flex-wrap justify-start items-center gap-4">
          {/* Sort Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()} onBlur={dismissOnBlur}>
            <button
              ref={sortTriggerRef}
              disabled={!filtersReady}
              onClick={() =>
                setActiveMenu(activeMenu === "sort" ? null : "sort")
              }
              aria-expanded={activeMenu === "sort"}
              aria-controls="sort-options"
              aria-label={`Sort order: ${sortOrder}`}
              className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-[0.14em] ${
                activeMenu === "sort"
                  ? "border-white text-white bg-white/5"
                  : "border-white/10 text-white/55 hover:border-white/20"
              }`}
            >
              <span>Sort: {sortOrder}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  activeMenu === "sort" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {activeMenu === "sort" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  id="sort-options"
                  aria-label="Sort order options"
                  className="absolute top-full left-0 mt-3 p-2 bg-[#0a0a0a] border border-white/10 rounded-2xl min-w-[160px] z-50 backdrop-blur-xl"
                >
                  {(["newest", "oldest"] as const).map((order) => (
                    <button
                      key={order}
                      onClick={() => {
                        updateFilter("sort", order);
                        closeMenu();
                      }}
                      aria-pressed={sortOrder === order}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-xs font-bold uppercase tracking-[0.14em] ${
                        sortOrder === order
                          ? "bg-white/10 text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {order}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tag Dropdown */}
          <div className="max-w-full sm:relative" onClick={(e) => e.stopPropagation()} onBlur={dismissOnBlur}>
            <button
              ref={tagTriggerRef}
              disabled={!filtersReady}
              onClick={() => setActiveMenu(activeMenu === "tag" ? null : "tag")}
              aria-expanded={activeMenu === "tag"}
              aria-controls="tag-options"
              aria-label={`Filter by tag: ${selectedTag}`}
              className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-[0.14em] ${
                activeMenu === "tag"
                  ? "border-white text-white bg-white/5"
                  : "border-white/10 text-white/55 hover:border-white/20"
              }`}
            >
              <span>Tag: {selectedTag}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  activeMenu === "tag" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {activeMenu === "tag" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  id="tag-options"
                  aria-label="Tag filter options"
                  className="absolute left-0 top-full z-50 mt-3 max-h-[300px] w-[200px] max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-2 backdrop-blur-xl sm:left-auto sm:right-0"
                >
                  {["All", ...allTags].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        updateFilter("tag", tag);
                        closeMenu();
                      }}
                      aria-pressed={selectedTag === tag}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-xs font-bold uppercase tracking-[0.14em] ${
                        selectedTag === tag
                          ? "bg-white/10 text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mb-2 flex min-h-11 items-center justify-between gap-4">
        <p role="status" aria-atomic="true" className="text-sm text-white/65">
          {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"}{hasFilters ? (visiblePosts.length === 1 ? " matches your filters" : " match your filters") : " in the archive"}
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="min-h-11 shrink-0 text-sm text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            Clear filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2">
        {visiblePosts.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-white/55 text-xl font-light italic">
              I could not find a post matching that.
            </p>
            <p className="mt-3 text-sm text-white/65">Try a different search or clear the filters above.</p>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <motion.div
              key={post.meta.slug}
            >
              <Link
                to={`/blog/${post.meta.slug}`}
                state={articleState}
                className="group relative flex h-full flex-col border-b border-white/10 py-7 sm:py-8"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs text-white/60">
                      {formatBlogDate(post.meta.date)}
                    </span>
                    {post.meta.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="editorial-title mb-3 group-hover:text-white/80 transition-colors">
                    {post.meta.title}
                  </h2>

                  <p className="text-white/70 text-base leading-relaxed mb-5">
                    {post.meta.description}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/70 group-hover:text-white transition-colors">
                      Read post
                    </span>
                    <div className="w-10 h-px bg-white/10 group-hover:w-16 group-hover:bg-white transition-all duration-700" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
      <NewsletterSignup source="blog" className="mx-auto mt-16 max-w-6xl md:mt-24" />
    </div>
  );
}
