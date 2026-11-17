const cookieConsentCookie = "clh_cookie_choice";
const newsletterConfirmationCookie = "clh_newsletter_subscription_confirmed";
const legacyNewsletterSignupCookie = "clh_newsletter_signup_submitted";
const newsletterLastVisitCookie = "clh_newsletter_last_visit";
const cookieLifetimeSeconds = 400 * 24 * 60 * 60;

export const newsletterReturnWindowMs = 90 * 24 * 60 * 60 * 1000;
export const newsletterPreferenceEvent = "newsletter-preference-change";
export const cookieConsentEvent = "cookie-consent-change";

export type CookieConsentChoice = "allow" | "deny";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    // Invalid stored values must not prevent the page from rendering.
    return null;
  }
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${cookieLifetimeSeconds}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function dispatchPreferenceEvent(name: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new window.Event(name));
  }
}

export function getCookieConsentChoice(): CookieConsentChoice | null {
  const choice = readCookie(cookieConsentCookie);
  // The original grant explicitly excluded analytics. Renew it before using
  // the expanded choice; an existing refusal still means no.
  if (choice === "allow-v2") return "allow";
  return choice === "deny" ? "deny" : null;
}

export function hasCookieConsent() {
  return getCookieConsentChoice() === "allow";
}

export function setCookieConsentChoice(
  choice: CookieConsentChoice,
  now = Date.now(),
) {
  writeCookie(cookieConsentCookie, choice === "allow" ? "allow-v2" : "deny");

  if (choice === "allow") {
    deleteCookie(legacyNewsletterSignupCookie);
    recordNewsletterVisit(now);
  } else {
    deleteCookie(newsletterConfirmationCookie);
    deleteCookie(legacyNewsletterSignupCookie);
    deleteCookie(newsletterLastVisitCookie);
  }

  dispatchPreferenceEvent(cookieConsentEvent);
  dispatchPreferenceEvent(newsletterPreferenceEvent);
}

export function subscribeToCookieConsent(listener: EventListener) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(cookieConsentEvent, listener);
  return () => window.removeEventListener(cookieConsentEvent, listener);
}

export function hasConfirmedNewsletterSubscription() {
  if (!hasCookieConsent()) return false;
  return readCookie(newsletterConfirmationCookie) === "1";
}

export function shouldShowNewsletterNotice(now = Date.now()) {
  if (!hasCookieConsent()) return false;
  if (hasConfirmedNewsletterSubscription()) return false;

  const lastVisit = Number(readCookie(newsletterLastVisitCookie));
  if (!Number.isFinite(lastVisit) || lastVisit <= 0) return true;

  return now - lastVisit >= newsletterReturnWindowMs;
}

export function recordNewsletterVisit(now = Date.now()) {
  if (!hasCookieConsent()) return;

  writeCookie(newsletterLastVisitCookie, String(now));

  if (hasConfirmedNewsletterSubscription()) {
    writeCookie(newsletterConfirmationCookie, "1");
  }
}

export function dismissNewsletterNotice() {
  recordNewsletterVisit();
}

// This saves the visitor's prompt preference, not proof of a Kit subscription.
export function markNewsletterSubscriptionConfirmed(notifyPage = true) {
  if (!hasCookieConsent()) return false;

  deleteCookie(legacyNewsletterSignupCookie);
  writeCookie(newsletterConfirmationCookie, "1");

  if (notifyPage) dispatchPreferenceEvent(newsletterPreferenceEvent);
  return true;
}

export function subscribeToNewsletterPreference(listener: EventListener) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(newsletterPreferenceEvent, listener);
  return () => window.removeEventListener(newsletterPreferenceEvent, listener);
}
