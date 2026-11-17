import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { setCookieConsentChoice } from "./newsletterPreferences";

const send = vi.fn<(url: URL, init: RequestInit) => Promise<void>>(() => Promise.resolve());

function payload(index = 0) {
  return JSON.parse(send.mock.calls[index][1].body as string);
}

describe("consent-gated interaction analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    send.mockClear();
    vi.stubGlobal("fetch", send);
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-project-token");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com");
    document.cookie = "clh_cookie_choice=; Path=/; Max-Age=0";
  });

  afterEach(() => {
    setCookieConsentChoice("deny");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    window.history.replaceState(null, "", "/");
  });

  it("drops unknown, legacy, and denied consent rather than replaying actions later", async () => {
    const analytics = await import("./analytics");
    analytics.trackProjectClick("/projects/startle");
    document.cookie = "clh_cookie_choice=allow; Path=/";
    analytics.trackNewsletterSubmission("home");
    setCookieConsentChoice("deny");
    analytics.trackProjectClick("/projects/server");
    expect(send).not.toHaveBeenCalled();

    setCookieConsentChoice("allow");
    expect(send).not.toHaveBeenCalled();
    analytics.trackNewsletterSubmission("blog");
    expect(send).toHaveBeenCalledTimes(1);
    expect(payload()).toMatchObject({ event: "newsletter_submitted", properties: {
      source: "blog", page_path: "/", $process_person_profile: false,
    } });
  });

  it("records only known projects and stops both events when consent is withdrawn", async () => {
    const analytics = await import("./analytics");
    setCookieConsentChoice("allow");
    analytics.trackProjectClick("mailto:private@example.com");
    expect(send).not.toHaveBeenCalled();
    analytics.trackProjectClick("/projects/startle");
    analytics.trackNewsletterSubmission("article");
    expect(payload()).toMatchObject({ event: "project_clicked", properties: {
      project_title: "Startle", project_href: "/projects/startle", page_path: "/",
    } });
    expect(payload().distinct_id).toBe(payload(1).distinct_id);
    expect(payload().distinct_id).toMatch(/^[0-9a-f-]{36}$/);

    setCookieConsentChoice("deny");
    analytics.trackProjectClick("/projects/startle");
    analytics.trackNewsletterSubmission("article");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("sends only explicit fields without queries, fragments, cookies or referrer headers", async () => {
    const analytics = await import("./analytics");
    setCookieConsentChoice("allow");
    window.history.replaceState(null, "", "/blog?email=private@example.com#private");
    analytics.trackNewsletterSubmission("blog");
    expect(send.mock.calls[0][0].href).toBe("https://us.i.posthog.com/i/v0/e/?ip=0");
    expect(send.mock.calls[0][1]).toMatchObject({
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true,
    });
    expect(payload().properties).toEqual({ source: "blog", page_path: "/blog", $process_person_profile: false });
    expect(Object.keys(payload()).sort()).toEqual(["api_key", "distinct_id", "event", "properties", "timestamp"]);
    expect(send.mock.calls[0][1].body).not.toMatch(/private|email|referrer|browser|session/);
  });

  it("does not send development traffic or unconfigured builds", async () => {
    const analytics = await import("./analytics");
    setCookieConsentChoice("allow");
    vi.stubEnv("PROD", false);
    analytics.trackNewsletterSubmission("home");
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "");
    analytics.trackNewsletterSubmission("home");
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps navigation and submission working when requests fail", async () => {
    const analytics = await import("./analytics");
    setCookieConsentChoice("allow");
    send.mockImplementationOnce(() => { throw new Error("Blocked"); });
    expect(() => analytics.trackProjectClick("/projects/startle")).not.toThrow();
    send.mockRejectedValueOnce(new Error("Offline"));
    expect(() => analytics.trackNewsletterSubmission("home")).not.toThrow();
    await Promise.resolve();
  });
});
