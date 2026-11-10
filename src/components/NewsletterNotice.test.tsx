import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasConfirmedNewsletterSubscription,
  markNewsletterSubscriptionConfirmed,
  newsletterReturnWindowMs,
  recordNewsletterVisit,
  setCookieConsentChoice,
} from "../lib/newsletterPreferences";
import NewsletterNotice from "./NewsletterNotice";

function clearNewsletterCookies() {
  document.cookie = "clh_cookie_choice=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_signup_submitted=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_subscription_confirmed=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_last_visit=; Path=/; Max-Age=0";
}

describe("NewsletterNotice", () => {
  beforeEach(() => {
    clearNewsletterCookies();
    setCookieConsentChoice("allow");
    document.cookie = "clh_newsletter_last_visit=; Path=/; Max-Age=0";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearNewsletterCookies();
  });

  it("opens the signup form inside the notice", () => {
    render(<NewsletterNotice />);
    fireEvent.click(screen.getByRole("button", { name: "Get new posts" }));

    const email = screen.getByLabelText("Email address");
    const form = email.closest("form");

    expect(email).toBeEnabled();
    expect(form).toHaveAttribute(
      "action",
      "https://app.kit.com/forms/9788220/subscriptions",
    );
    expect(form).toHaveAttribute("method", "post");
    expect(form).not.toHaveAttribute("target");
  });

  it("remains visible across React's development remount", () => {
    const firstRender = render(<NewsletterNotice />);
    firstRender.unmount();

    render(<NewsletterNotice />);

    expect(
      screen.getByRole("button", { name: "Get new posts" }),
    ).toBeInTheDocument();
  });

  it("does not hide future prompts when a submission is started", () => {
    render(<NewsletterNotice />);
    fireEvent.click(screen.getByRole("button", { name: "Get new posts" }));

    const form = screen.getByLabelText("Email address").closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(hasConfirmedNewsletterSubscription()).toBe(false);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("stays hidden during the 90-day return window after dismissal", () => {
    const firstRender = render(<NewsletterNotice />);
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss newsletter notice" }),
    );
    firstRender.unmount();

    render(<NewsletterNotice />);

    expect(
      screen.queryByRole("button", { name: "Get new posts" }),
    ).not.toBeInTheDocument();
  });

  it("returns after the visitor has been away for 90 days", () => {
    const previousVisit = Date.UTC(2026, 0, 1);
    recordNewsletterVisit(previousVisit);
    vi.spyOn(Date, "now").mockReturnValue(
      previousVisit + newsletterReturnWindowMs,
    );

    render(<NewsletterNotice />);

    expect(
      screen.getByRole("button", { name: "Get new posts" }),
    ).toBeInTheDocument();
  });

  it("does not render when a confirmed-subscription preference exists", () => {
    markNewsletterSubscriptionConfirmed();

    render(<NewsletterNotice />);

    expect(
      screen.queryByRole("button", { name: "Get new posts" }),
    ).not.toBeInTheDocument();
  });

  it("honors a saved subscription choice over eligibility captured earlier in the visit", () => {
    markNewsletterSubscriptionConfirmed();
    const onShown = vi.fn();

    render(<NewsletterNotice initialIsVisible onShown={onShown} />);

    expect(screen.queryByRole("button", { name: "Get new posts" })).not.toBeInTheDocument();
    expect(onShown).not.toHaveBeenCalled();
  });

  it("does not render before cookies are allowed", () => {
    setCookieConsentChoice("deny");

    render(<NewsletterNotice initialIsVisible />);

    expect(
      screen.queryByRole("button", { name: "Get new posts" }),
    ).not.toBeInTheDocument();
  });
});
