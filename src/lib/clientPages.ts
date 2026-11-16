import { lazy } from "react";
import type { AppPageComponents } from "../App";

export const clientPages: AppPageComponents = {
  Home: lazy(() => import("../pages/Home.tsx")),
  Projects: lazy(() => import("../pages/Projects.tsx")),
  BlogPage: lazy(() => import("../pages/BlogPage.tsx")),
  BlogPostPage: lazy(() => import("../pages/BlogPostPage.tsx")),
  Privacy: lazy(() => import("../pages/Privacy.tsx")),
  NewsletterConfirmed: lazy(() => import("../pages/NewsletterConfirmed.tsx")),
  NotFound: lazy(() => import("../pages/NotFound.tsx")),
  Server: lazy(() => import("../pages/projects/Server.tsx")),
  ThisWebsite: lazy(() => import("../pages/projects/ThisWebsite.tsx")),
  NewTrierBlock: lazy(() => import("../pages/projects/NewTrierBlock.tsx")),
  Startle: lazy(() => import("../pages/projects/Startle.tsx")),
};

// The first homepage is already HTML. Resolve its code before hydrating so
// the browser does not hydrate the shell, suspend, and traverse it again.
export async function prepareInitialPage() {
  const { default: Home } = await import("../pages/Home.tsx");
  clientPages.Home = Home;
}
