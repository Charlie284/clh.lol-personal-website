import { Suspense } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { usePrerenderedReturnTo } from "../lib/usePrerenderedReturnTo";
import {
  formatBlogDate,
  getBlogPostBySlug,
  getAllBlogPosts,
  type BlogPostFrontmatter,
} from "../lib/blog";
import RouteMeta from "../components/RouteMeta";
import { getBlogMetadata } from "../lib/routeMetadata";
import NewsletterSignup from "../components/NewsletterSignup";

function PostMeta({ meta, wordCount }: { meta: BlogPostFrontmatter; wordCount: number }) {
  // Determine displayed date: use updated if present, else original date
  const displayDate = meta.updated ? meta.updated : meta.date;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
      <span className="text-xs text-white/60">
        {formatBlogDate(displayDate)}
      </span>
      <span className="text-xs text-white/60">
        {readingTime} min read
      </span>
      {meta.tags.map((tag) => (
        <span
          key={tag}
          className="text-xs text-white/60"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="page-shell">
      <RouteMeta
        title="Post Not Found"
        description="That blog post is not here anymore."
        path={window.location.pathname}
        noIndex
      />
      <div className="max-w-3xl mx-auto">
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-[1.5rem] border border-white/[0.06] bg-[#070707] p-10 md:p-14 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/50 mb-5">
            Blog
          </p>
          <h1 className="page-title mb-6">
            Post not found
          </h1>
          <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 italic">
            That post is gone, or I changed its address and missed a link.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/65 transition-colors hover:border-white hover:text-white"
          >
            Back to Blog
          </Link>
        </motion.section>
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const blogReturnTo = usePrerenderedReturnTo("/blog");
  const post = slug ? getBlogPostBySlug(slug) : null;

  if (!post) {
    return <PostNotFound />;
  }

  const { meta, Content, wordCount } = post;

  // Compute reading time handled in PostMeta
  // Related posts based on shared tags (max 2, so the two-column grid never leaves an orphan)
  const allPosts = getAllBlogPosts();
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.meta.slug !== meta.slug &&
        p.meta.tags.some((tag) => meta.tags.includes(tag)),
    )
    .slice(0, 2);

  return (
    <div className="page-shell">
      <RouteMeta {...getBlogMetadata(meta)} />
      <article className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to={blogReturnTo}
            className="inline-flex min-h-11 items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-white mb-5"
          >
            <span>←</span>
            <span>Back to Blog</span>
          </Link>

          <header className="mb-10 border-b border-white/10 pb-8">
            <PostMeta meta={meta} wordCount={wordCount} />
            <h1 className="page-title article-title mb-5">
              {meta.title}
            </h1>
            <p className="page-lead">
              {meta.description}
            </p>
          </header>

          <div className="max-w-[65ch]">
            <div className="blog-prose">
              <Suspense fallback={<p role="status">Loading article…</p>}>
                <Content components={{
                  a: ({ href, ...props }) => href?.startsWith("/blog/")
                    ? <Link to={href} state={{ blogReturnTo }} {...props} />
                    : <a href={href} {...props} />,
                }} />
              </Suspense>
            </div>
          </div>
          <NewsletterSignup source="article" className="mt-12 md:mt-16" />
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="font-serif text-2xl uppercase text-white mb-6">
                Keep reading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((p) => (
                  <motion.article
                    key={p.meta.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6 }}
                    className="group"
                  >
                    <Link
                      to={`/blog/${p.meta.slug}`}
                      state={{ blogReturnTo }}
                      className="block rounded-[1.5rem] border border-white/[0.06] bg-[#070707] p-6 hover:border-white/15 hover:bg-[#090909] transition-[border-color,background-color] duration-500"
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs text-white/60">
                          {formatBlogDate(p.meta.date)}
                        </span>
                        {p.meta.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/55"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="editorial-title mb-3">
                        {p.meta.title}
                      </h3>
                      <p className="text-white/60 text-sm italic">
                        {p.meta.description}
                      </p>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </article>
    </div>
  );
}
