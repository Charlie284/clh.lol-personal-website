import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import RouteMeta from "../components/RouteMeta";
import {
  type CookieConsentChoice,
  getCookieConsentChoice,
  hasConfirmedNewsletterSubscription,
  markNewsletterSubscriptionConfirmed,
  subscribeToNewsletterPreference,
} from "../lib/newsletterPreferences";

export default function NewsletterConfirmed() {
  const [isRemembered, setIsRemembered] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<CookieConsentChoice | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusAfterSave = useRef(false);

  useEffect(() => {
    const update = () => {
      setIsRemembered(hasConfirmedNewsletterSubscription());
      setCookieChoice(getCookieConsentChoice());
    };
    update();
    return subscribeToNewsletterPreference(update);
  }, []);

  useEffect(() => {
    if (isRemembered && focusAfterSave.current) {
      focusAfterSave.current = false;
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [isRemembered]);

  function hideSignupPrompts() {
    focusAfterSave.current = true;
    if (!markNewsletterSubscriptionConfirmed()) focusAfterSave.current = false;
  }

  return (
    <section className="page-shell flex items-center">
      <RouteMeta path="/newsletter-confirmed" />

      <div className="mx-auto w-full max-w-3xl border-y border-white/10 py-14 sm:py-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-white/55">
          Still Learning
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="page-title mt-5">
          {isRemembered ? "Signup prompts are hidden." : "Thanks for reading."}
        </h1>
        <p className="mt-7 max-w-2xl text-lg font-light italic leading-relaxed text-white/70 sm:text-xl">
          {isRemembered
            ? "Your choice is saved for this browser. It does not change your subscription with Kit."
            : "Confirm your subscription using the link Kit emailed you. If you’ve already done that, you can hide signup prompts in this browser."}
        </p>
        <p
          aria-live="polite"
          className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55"
        >
          {isRemembered
            ? "I’ll stop showing newsletter prompts in this browser."
            : cookieChoice === "allow"
              ? "Cookies are allowed, so I can save this choice here."
              : cookieChoice === "deny"
                ? "You declined preference cookies, so I can’t save this choice here."
                : "Allow preference cookies if you’d like me to save this choice here."}
          {!isRemembered && cookieChoice !== "allow" && (
            <> <Link to="/privacy" className="text-white underline decoration-white/30 underline-offset-4">Change cookie choices</Link>.</>
          )}
        </p>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {!isRemembered && (
            <button
              type="button"
              disabled={cookieChoice !== "allow"}
              onClick={hideSignupPrompts}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
            >
              Hide signup prompts
            </button>
          )}
          <Link
            to="/"
            className="inline-flex min-h-12 items-center text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
          >
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
