import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  type CookieConsentChoice,
  getCookieConsentChoice,
  setCookieConsentChoice,
  subscribeToCookieConsent,
} from "../lib/newsletterPreferences";

export default function CookieConsent() {
  const [choice, setChoice] = useState(getCookieConsentChoice);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(
    () =>
      subscribeToCookieConsent(() => {
        setChoice(getCookieConsentChoice());
      }),
    [],
  );

  function choose(nextChoice: CookieConsentChoice) {
    setCookieConsentChoice(nextChoice);
    setChoice(nextChoice);
  }

  if (!isMounted || choice !== null || typeof document === "undefined") return null;

  return createPortal(
    <section
      aria-labelledby="cookie-consent-heading"
      className="fixed bottom-4 left-4 right-4 z-[130] mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-[#050505] p-4 sm:bottom-5 sm:left-5 sm:right-5 sm:p-5"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end md:gap-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 sm:flex">
            <Cookie aria-hidden="true" size={18} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h2
              id="cookie-consent-heading"
              className="text-base font-semibold leading-snug text-white"
            >
              Can I remember this browser?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Allow cookies to remember newsletter preferences and send project
              clicks and newsletter form submissions to PostHog. No email
              addresses, session recordings, or tracking across sites.
            </p>
            <Link
              to="/privacy"
              className="mt-2 inline-flex min-h-8 items-center text-xs text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              See exactly what they store
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => choose("deny")}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => choose("allow")}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            Allow cookies
          </button>
        </div>
      </div>
    </section>,
    document.body,
  );
}
