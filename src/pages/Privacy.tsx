import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RouteMeta from "../components/RouteMeta";
import {
  type CookieConsentChoice,
  getCookieConsentChoice,
  setCookieConsentChoice,
  subscribeToCookieConsent,
} from "../lib/newsletterPreferences";

export default function Privacy() {
  const [cookieChoice, setCookieChoice] = useState<CookieConsentChoice | null>(null);

  useEffect(() => {
    const updateCookieChoice = () => {
      setCookieChoice(getCookieConsentChoice());
    };

    updateCookieChoice();
    return subscribeToCookieConsent(updateCookieChoice);
  }, []);

  function updateCookieChoice(choice: CookieConsentChoice) {
    setCookieConsentChoice(choice);
    setCookieChoice(choice);
  }

  return (
    <div className="page-shell">
      <RouteMeta path="/privacy" />

      <article className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-5 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-white"
        >
          ← Back home
        </Link>

        <header className="mb-8 border-b border-white/10 pb-8">
          <h1 className="page-title">
            Privacy
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-light italic leading-relaxed text-white/70 sm:text-xl">
            What this site collects, what it does not, and why.
          </p>
        </header>

        <div className="blog-prose">
          <h2>Newsletter</h2>
          <p>
            If you sign up for Still Learning, I send your email address to Kit.
            Kit uses it to confirm your subscription and deliver new posts. I do
            not sell your address or add it to unrelated lists.
          </p>

          <h2>Confirmation and unsubscribing</h2>
          <p>
            Kit asks you to confirm new subscriptions by email. Every message
            has an unsubscribe link, and you can leave whenever you want.
          </p>

          <h2>Delivery information</h2>
          <p>
            Kit may record deliveries, opens, and link clicks. I use that
            information to see whether messages arrive and whether anyone finds
            them useful.
          </p>

          <h2>Site analytics</h2>
          <p>
            I use Cloudflare Web Analytics for broad numbers such as page visits,
            referring sites, browser and device categories, approximate country,
            and page performance. It does not use analytics cookies, advertising
            identifiers, or cross-site tracking. It does not build a personal
            profile of you.
          </p>
          <p>
            Cloudflare processes the technical information needed to produce
            those aggregate reports. I use the reports to see which pages people
            read and to catch performance problems.
          </p>

          <h2>Newsletter preference cookies</h2>
          <p>
            If you allow cookies, I use two first-party cookies to avoid showing
            the same newsletter prompts over and over. One remembers the date of
            your latest visit, so the small notice can return after you have been
            away for at least 90 days. The other remembers your choice to hide
            signup prompts in this browser. You can save that choice on the
            confirmation page. Opening or closing
            the form, or getting an error, does not set that preference.
          </p>
          <p>
            Those cookies only control what the site shows you. They are not
            used for advertising. They can last up to 400 days and refresh when
            you visit again. If you clear them or switch browsers or devices,
            the prompts may come back.
          </p>
          <p>
            One separate necessary cookie remembers whether you chose Allow
            cookies or No thanks, so I do not ask on every visit. It can also
            last up to 400 days. Choosing No thanks removes the two newsletter
            preference cookies.
          </p>

          <div className="not-prose mt-6 border-t border-white/10 pt-6">
            <p aria-live="polite" className="text-sm text-white/70">
              Current choice: {cookieChoice === "allow" ? "Cookies allowed" : cookieChoice === "deny" ? "Cookies declined" : "Not chosen"}.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => updateCookieChoice("deny")}
                disabled={cookieChoice === "deny"}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Decline cookies
              </button>
              <button
                type="button"
                onClick={() => updateCookieChoice("allow")}
                disabled={cookieChoice === "allow"}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Allow cookies
              </button>
            </div>
          </div>

          <h2>Retention and deletion</h2>
          <p>
            Kit keeps subscriber information while you are subscribed and as
            needed to honor an unsubscribe request. If you want your newsletter
            data deleted, email{" "}
            <a href="mailto:Charlie@clh.lol">Charlie@clh.lol</a>.
          </p>

          <h2>Other site data</h2>
          <p>
            This site does not ask you to create an account, enter payment
            information, or fill out a profile. Normal hosting and security logs
            may keep basic request information to keep the site reliable and
            prevent abuse.
          </p>

          <p>
            I last updated this page on October 12, 2026. I will update it if the
            site starts collecting anything meaningfully different.
          </p>
        </div>
      </article>
    </div>
  );
}
