import { ArrowUpRight, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  dismissNewsletterNotice,
  hasConfirmedNewsletterSubscription,
  hasCookieConsent,
  shouldShowNewsletterNotice,
} from "../lib/newsletterPreferences";
import { newsletterFormAction } from "./NewsletterSignup";

type NoticeView = "summary" | "form";

type NewsletterNoticeProps = {
  initialIsVisible?: boolean;
  onShown?: () => void;
};

export default function NewsletterNotice({
  initialIsVisible,
  onShown,
}: NewsletterNoticeProps) {
  const [isVisible, setIsVisible] = useState(
    () =>
      hasCookieConsent() &&
      !hasConfirmedNewsletterSubscription() &&
      (initialIsVisible ?? shouldShowNewsletterNotice()),
  );
  const [view, setView] = useState<NoticeView>("summary");
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (isVisible) onShown?.();
  }, [isVisible, onShown]);

  function dismiss() {
    dismissNewsletterNotice();
    setIsVisible(false);
  }

  if (!isMounted || !isVisible || typeof document === "undefined") return null;

  return createPortal(
    <aside
      aria-labelledby="newsletter-notice-heading"
      className="fixed bottom-20 left-5 right-5 z-[100] rounded-[1.5rem] border border-white/10 bg-[#050505] p-4 sm:bottom-5 sm:right-auto sm:w-[25rem] sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 sm:flex">
          <Mail aria-hidden="true" size={18} strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h2
            id="newsletter-notice-heading"
            className="font-hero text-xl font-semibold leading-snug text-white"
          >
            Notes by email.
          </h2>
          <p className="mt-1 text-sm font-light leading-relaxed text-white/65">
            <span className="sm:hidden">Occasional notes by email.</span>
            <span className="hidden sm:inline">
              New posts about what I am building, breaking, and learning.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss newsletter notice"
          className="flex h-11 w-11 shrink-0 items-center justify-center !rounded-full text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
      </div>

      {view === "summary" && (
        <button
          type="button"
          onClick={() => setView("form")}
          className="group mt-4 inline-flex min-h-11 w-full items-center justify-center gap-3 !rounded-full bg-white px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          Get new posts
          <ArrowUpRight
            aria-hidden="true"
            size={14}
            strokeWidth={1.8}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </button>
      )}

      {view === "form" && (
        <form
          action={newsletterFormAction}
          method="post"
          data-newsletter-source="notice"
          className="mt-4"
        >
          <label htmlFor="newsletter-notice-email" className="sr-only">
            Email address
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="newsletter-notice-email"
              name="email_address"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 min-w-0 flex-1 !rounded-full border border-white/15 bg-black/50 px-5 text-sm text-white placeholder:text-white/55 transition-colors hover:border-white/25 focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center !rounded-full bg-white px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign me up
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            Kit will send you a confirmation email. You can unsubscribe anytime.
          </p>
        </form>
      )}
    </aside>,
    document.body,
  );
}
