import React, { type ComponentType } from "react";
import { setPrerenderedArticles, type BlogPostFrontmatter } from "./lib/blog";
import { MDXProvider } from "@mdx-js/react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppContent, type AppPageComponents } from "./App";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import Privacy from "./pages/Privacy";
import NewsletterConfirmed from "./pages/NewsletterConfirmed";
import NotFound from "./pages/NotFound";
import Server from "./pages/projects/Server";
import NewTrierBlock from "./pages/projects/NewTrierBlock";
import Startle from "./pages/projects/Startle";
import ThisWebsite from "./pages/projects/ThisWebsite";
import { getBlogMetadata, staticPageMetadata } from "./lib/routeMetadata";

export { notFoundMetadata, offlineMetadata, resolveMetadata, siteUrl } from "./lib/routeMetadata";

const blogMetadata = import.meta.glob<BlogPostFrontmatter>("/src/content/blog/*.mdx", {
  eager: true,
  import: "frontmatter",
  query: "?metadata",
});

export const prerenderRoutes = [
  ...Object.entries(staticPageMetadata).map(([path, metadata]) => ({ path, ...metadata })),
  ...Object.entries(blogMetadata).map(([file, meta]) => {
    if (!meta.slug || !meta.title || !meta.description || !meta.date) {
      throw new Error(`Missing required frontmatter in ${file}`);
    }
    return getBlogMetadata(meta);
  }),
];

setPrerenderedArticles(import.meta.glob<ComponentType>("/src/content/blog/*.mdx", {
  eager: true,
  import: "default",
}));

const prerenderPages: AppPageComponents = {
  Home,
  Projects,
  BlogPage,
  BlogPostPage,
  Privacy,
  NewsletterConfirmed,
  NotFound,
  Server,
  Startle,
  NewTrierBlock,
  ThisWebsite,
};

export function render(pathname: string) {
  return renderToString(
    <React.StrictMode>
      <MDXProvider>
        <StaticRouter location={pathname}>
          <AppContent pages={prerenderPages} />
        </StaticRouter>
      </MDXProvider>
    </React.StrictMode>,
  );
}
