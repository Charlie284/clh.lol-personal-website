import type { BlogPostFrontmatter } from "./blog";

export const siteUrl = "https://clh.lol";

export type RouteMetadata = {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

export const staticPageMetadata = {
  "/": {
    title: "Charlie H",
    description: "Charlie is a student developer building a macOS app, websites, and a homelab.",
  },
  "/projects": {
    title: "Projects",
    description: "Apps, websites, small tools, and a homelab built by Charlie H.",
  },
  "/projects/thiswebsite": {
    title: "This Website",
    description: "How Charlie built this site with React, TypeScript, Framer Motion, and MDX.",
  },
  "/projects/new-trier-block": {
    title: "New Trier Block",
    description: "A case study of New Trier Block, a Flutter bell-schedule app with a period countdown, personal class schedules, and an iOS widget.",
  },
  "/projects/startle": {
    title: "Startle for macOS",
    description: "Startle is a local-first Mac app I am building to schedule videos without giving up privacy or an emergency stop.",
    image: "/startle-app-icon.png",
  },
  "/projects/server": {
    title: "Server Project",
    description: "A personal homelab built from repurposed hardware with Ubuntu Server, Docker Compose, Portainer, Jellyfin, and Homarr.",
  },
  "/blog": {
    title: "Blog",
    description: "Notes from Charlie about Linux, self-hosting, privacy, and building software.",
  },
  "/privacy": {
    title: "Privacy",
    description: "How newsletter subscriptions and basic site data are handled on clh.lol.",
  },
  "/newsletter-confirmed": {
    title: "Newsletter",
    description: "Confirm your newsletter subscription through Kit and choose whether to hide signup prompts in this browser.",
    noIndex: true,
  },
} satisfies Record<string, Omit<RouteMetadata, "path">>;

export const notFoundMetadata: RouteMetadata = {
  path: "/404",
  title: "Page Not Found",
  description: "That page is gone, but the rest of Charlie H's site is still here.",
  noIndex: true,
};

export const offlineMetadata: RouteMetadata = {
  path: "/offline",
  title: "Offline",
  description: "Previously visited pages may be available while you are offline.",
  noIndex: true,
};

export function getBlogMetadata(meta: BlogPostFrontmatter): RouteMetadata {
  return {
    path: `/blog/${meta.slug}`,
    title: meta.title,
    description: meta.description,
    type: "article",
    publishedTime: meta.date,
    modifiedTime: meta.updated ?? meta.date,
  };
}

type MetaTag = {
  attribute: "name" | "property";
  key: string;
  content: string;
};

// Both the HTML writer and the browser consume this description of the head.
export function resolveMetadata(route: RouteMetadata) {
  const title = route.title === "Charlie H"
    ? "Charlie H — Developer Portfolio"
    : `${route.title} — Charlie H`;
  const canonicalUrl = new URL(route.path, siteUrl).toString();
  const image = new URL(route.image ?? "/website-screenshot.png", siteUrl).toString();
  const tags: MetaTag[] = [
    { attribute: "name", key: "description", content: route.description },
    { attribute: "name", key: "robots", content: route.noIndex ? "noindex, nofollow" : "index, follow" },
    { attribute: "property", key: "og:type", content: route.type ?? "website" },
    { attribute: "property", key: "og:title", content: title },
    { attribute: "property", key: "og:description", content: route.description },
    { attribute: "property", key: "og:url", content: canonicalUrl },
    { attribute: "property", key: "og:image", content: image },
    { attribute: "name", key: "twitter:card", content: "summary_large_image" },
    { attribute: "name", key: "twitter:title", content: title },
    { attribute: "name", key: "twitter:description", content: route.description },
    { attribute: "name", key: "twitter:image", content: image },
  ];

  let structuredData: Record<string, unknown> | null = null;
  if (route.type === "article" && route.publishedTime) {
    const modifiedTime = route.modifiedTime ?? route.publishedTime;
    tags.push(
      { attribute: "property", key: "article:published_time", content: route.publishedTime },
      { attribute: "property", key: "article:modified_time", content: modifiedTime },
    );
    structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: route.title,
      description: route.description,
      image: [image],
      datePublished: route.publishedTime,
      dateModified: modifiedTime,
      author: { "@type": "Person", name: "Charlie H", url: siteUrl },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      url: canonicalUrl,
    };
  }

  return { title, canonicalUrl, tags, structuredData };
}
