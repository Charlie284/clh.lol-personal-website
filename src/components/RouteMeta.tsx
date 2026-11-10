import { useEffect } from "react";
import { resolveMetadata, staticPageMetadata, type RouteMetadata } from "../lib/routeMetadata";

type RouteMetaProps = RouteMetadata | { path: keyof typeof staticPageMetadata };

function setMeta(selector: string, attribute: "name" | "property", value: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.content = content;
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

function setArticleStructuredData(data: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>("#route-structured-data");
  if (!element) {
    element = document.createElement("script");
    element.id = "route-structured-data";
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export default function RouteMeta(props: RouteMetaProps) {
  const route: RouteMetadata = "title" in props
    ? props : { path: props.path, ...staticPageMetadata[props.path] };
  const { title, description, path, type, image, noIndex, publishedTime, modifiedTime } = route;

  useEffect(() => {
    const metadata = resolveMetadata({ title, description, path, type, image, noIndex, publishedTime, modifiedTime });
    document.title = metadata.title;
    document.documentElement.lang = "en";

    for (const { attribute, key, content } of metadata.tags) {
      setMeta(`meta[${attribute}="${key}"]`, attribute, key, content);
    }

    if (metadata.structuredData) {
      setArticleStructuredData(metadata.structuredData);
    } else {
      removeMeta('meta[property="article:published_time"]');
      removeMeta('meta[property="article:modified_time"]');
      document.head.querySelector("#route-structured-data")?.remove();
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.canonicalUrl;
  }, [description, image, modifiedTime, noIndex, path, publishedTime, title, type]);

  return null;
}
