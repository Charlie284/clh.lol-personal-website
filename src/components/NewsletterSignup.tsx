import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackNewsletterSubmission, type NewsletterSource } from "../lib/analytics";
import {
  hasConfirmedNewsletterSubscription,
  subscribeToNewsletterPreference,
} from "../lib/newsletterPreferences";

type NewsletterSignupProps = {
  className?: string;
  source: NewsletterSource;
};

export const newsletterFormAction =
  "https://app.kit.com/forms/9788220/subscriptions";

export default function NewsletterSignup({
  className = "",
  source,
}: NewsletterSignupProps) {
  const [isHidden, setIsHidden] = useState(false);
  const headingId = `newsletter-${source}-heading`;
  const emailId = `newsletter-${source}-email`;

  useEffect(() => {
    const updateVisibility = () => {
      setIsHidden(hasConfirmedNewsletterSubscription());
    };

    updateVisibility();
    return subscribeToNewsletterPreference(updateVisibility);
  }, []);

  if (isHidden) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={`newsletter-signup overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#050505] ${className}`}
    >
      <div className="newsletter-layout grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div>
          <h2
            id={headingId}
            className="max-w-2xl font-hero text-[clamp(2rem,4vw,3rem)] leading-[1.1] text-white"
          >
            Still learning.
          </h2>
          <p className="mt-6 max-w-2xl text-base font-light italic leading-relaxed text-white/70 sm:text-lg">
            Every so often, I write about something I built, broke, or finally
            figured out.
          </p>
        </div>

        <div>
          <form
            action={newsletterFormAction}
            method="post"
            data-newsletter-source={source}
            onSubmit={(event) => {
              if (event.currentTarget.checkValidity()) trackNewsletterSubmission(source);
            }}
          >
            <label
              htmlFor={emailId}
              className="mb-3 block text-[10px] font-bold uppercase tracking-[0.28em] text-white/70"
            >
              Email address
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                id={emailId}
                name="email_address"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                required
                className="min-h-14 min-w-0 flex-[1_1_14rem] rounded-full border border-white/15 bg-black/50 px-6 text-base text-white placeholder:text-white/55 transition-colors hover:border-white/25 focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              />
              <button
                type="submit"
                className="group inline-flex min-h-14 max-w-full flex-[1_1_auto] items-center justify-center gap-3 rounded-full bg-white px-7 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Send me new posts
                <ArrowUpRight
                  aria-hidden="true"
                  size={15}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Kit will send a confirmation email first. I do not have a posting
            schedule, and you can unsubscribe anytime. Read the{" "}
            <Link
              to="/privacy"
              className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
            >
              privacy note
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
