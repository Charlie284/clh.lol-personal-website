import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCookieConsentChoice,
  hasConfirmedNewsletterSubscription,
  markNewsletterSubscriptionConfirmed,
  newsletterReturnWindowMs,
  recordNewsletterVisit,
  setCookieConsentChoice,
  shouldShowNewsletterNotice,
} from "./newsletterPreferences";

const newsletterCookies = [
  "clh_cookie_choice",
  "clh_newsletter_signup_submitted",
  "clh_newsletter_subscription_confirmed",
  "clh_newsletter_last_visit",
];

function clearNewsletterCookies() {
  newsletterCookies.forEach((name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

describe("newsletter preferences", () => {
  beforeEach(() => {
    clearNewsletterCookies();
  });

  afterEach(() => {
    clearNewsletterCookies();
    vi.restoreAllMocks();
  });

  it("ignores malformed encoded preference cookies", () => {
    document.cookie = "clh_cookie_choice=%E0%A4%A; Path=/";
    expect(getCookieConsentChoice()).toBeNull();

    setCookieConsentChoice("allow");
    document.cookie = "clh_newsletter_subscription_confirmed=%; Path=/";
    document.cookie = "clh_newsletter_last_visit=%; Path=/";
    expect(hasConfirmedNewsletterSubscription()).toBe(false);
    expect(shouldShowNewsletterNotice()).toBe(true);
  });

  it("does not write or use newsletter cookies before consent", () => {
    recordNewsletterVisit(Date.UTC(2026, 0, 1));
    markNewsletterSubscriptionConfirmed();

    expect(getCookieConsentChoice()).toBeNull();
    expect(hasConfirmedNewsletterSubscription()).toBe(false);
    expect(shouldShowNewsletterNotice()).toBe(false);
    expect(document.cookie).not.toContain("clh_newsletter_last_visit");
  });

  it("requires renewed consent for the earlier newsletter-only grant", () => {
    document.cookie = "clh_cookie_choice=allow; Path=/";
    expect(getCookieConsentChoice()).toBeNull();

    setCookieConsentChoice("allow");
    expect(getCookieConsentChoice()).toBe("allow");
    expect(document.cookie).toContain("clh_cookie_choice=allow-v2");

    document.cookie = "clh_cookie_choice=deny; Path=/";
    expect(getCookieConsentChoice()).toBe("deny");
  });

  it("waits until 90 days have passed since the previous visit", () => {
    const firstVisit = Date.UTC(2026, 0, 1);
    setCookieConsentChoice("allow", firstVisit);

    expect(
      shouldShowNewsletterNotice(
        firstVisit + newsletterReturnWindowMs - 1,
      ),
    ).toBe(false);
    expect(
      shouldShowNewsletterNotice(firstVisit + newsletterReturnWindowMs),
    ).toBe(true);
  });

  it("keeps the notice hidden after a subscription was confirmed", () => {
    setCookieConsentChoice("allow");
    markNewsletterSubscriptionConfirmed();

    expect(hasConfirmedNewsletterSubscription()).toBe(true);
    expect(
      shouldShowNewsletterNotice(Date.now() + newsletterReturnWindowMs * 2),
    ).toBe(false);
  });

  it("clears newsletter preferences when cookies are declined", () => {
    setCookieConsentChoice("allow");
    markNewsletterSubscriptionConfirmed();

    setCookieConsentChoice("deny");

    expect(getCookieConsentChoice()).toBe("deny");
    expect(document.cookie).not.toContain("clh_newsletter_signup_submitted");
    expect(document.cookie).not.toContain(
      "clh_newsletter_subscription_confirmed",
    );
    expect(document.cookie).not.toContain("clh_newsletter_last_visit");
  });

  it("does not trust the legacy submitted-form cookie", () => {
    setCookieConsentChoice("allow");
    document.cookie = "clh_newsletter_signup_submitted=1; Path=/";

    expect(hasConfirmedNewsletterSubscription()).toBe(false);
  });
});
