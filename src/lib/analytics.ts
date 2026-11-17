import { projectsList } from "../data/projects";
import { hasCookieConsent } from "./newsletterPreferences";

export type NewsletterSource = "home" | "blog" | "article";

type AnalyticsEvent =
  | { name: "project_clicked"; properties: { project_title: string; project_href: string } }
  | { name: "newsletter_submitted"; properties: { source: NewsletterSource } };

let distinctId: string | undefined;

function capture(event: AnalyticsEvent) {
  if (!import.meta.env.PROD || !hasCookieConsent()) return;
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (!token || !host) return;

  try {
    distinctId ??= crypto.randomUUID();
    // A direct capture request keeps automatic collection out of the site.
    // keepalive lets the native Kit POST or a project link navigate immediately.
    void fetch(new URL("/i/v0/e/?ip=0", host), {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      keepalive: true,
      body: JSON.stringify({
        api_key: token,
        distinct_id: distinctId,
        event: event.name,
        timestamp: new Date().toISOString(),
        properties: {
          ...event.properties,
          page_path: window.location.pathname,
          $process_person_profile: false,
        },
      }),
    }).catch(() => {});
  } catch {
    // Analytics must never prevent a project opening or a newsletter submission.
  }
}

export function trackProjectClick(href: string) {
  const project = projectsList.find((item) => item.href === href);
  if (!project) return;
  capture({ name: "project_clicked", properties: { project_title: project.title, project_href: project.href } });
}

export function trackNewsletterSubmission(source: NewsletterSource) {
  capture({ name: "newsletter_submitted", properties: { source } });
}
