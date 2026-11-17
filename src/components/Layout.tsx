import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MotionConfig, useReducedMotion } from "framer-motion";
import Nav from "./Nav";
import CommandPalette from "./CommandPalette";
import AskAI from "./AskAI";
import PageErrorBoundary from "./PageErrorBoundary";

const Cursor = lazy(() => import("./Cursor"));
const InteractiveDots = lazy(() => import("./InteractiveDots"));

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const primaryBeam = useRef<HTMLDivElement>(null);
  const secondaryBeam = useRef<HTMLDivElement>(null);
  const spotlight = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [pointerEffectsEnabled, setPointerEffectsEnabled] = useState(false);
  const previousPathname = useRef<string | null>(null);

  // Check mobile status once on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
      // Optional chunks must be fetched under worker control to survive offline reloads.
      const canCacheEffects = !import.meta.env.PROD ||
        !("serviceWorker" in navigator) || Boolean(navigator.serviceWorker.controller);
      setPointerEffectsEnabled(
        canCacheEffects && window.matchMedia("(pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    navigator.serviceWorker?.addEventListener("controllerchange", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      navigator.serviceWorker?.removeEventListener("controllerchange", checkMobile);
    };
  }, []);

  // A shared fragment must win over the usual page reset. Lazy routes and
  // article content can mount after navigation, so wait for their target.
  useEffect(() => {
    const pathnameChanged = previousPathname.current !== location.pathname;
    previousPathname.current = location.pathname;
    if (!location.hash) {
      if (pathnameChanged) window.scrollTo(0, 0);
      return;
    }

    let targetId: string;
    try {
      targetId = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }

    const scrollToFragment = () => {
      const target = document.getElementById(targetId);
      if (!target || (target.id !== "main-content" && !target.closest('[data-route-ready="true"]'))) return false;
      target.scrollIntoView({ block: "start", behavior: "instant" });
      return true;
    };

    if (scrollToFragment()) return;
    const main = document.getElementById("main-content");
    if (!main) return;
    const observer = new MutationObserver(() => {
      if (scrollToFragment()) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-route-ready"] });
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  // Native transforms keep decoration out of the startup animation bundle.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const progress = Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      if (progressBar.current) progressBar.current.style.transform = `scaleX(${progress})`;
      const drift = prefersReducedMotion ? 0 : Math.min(1, y / 2000);
      const hue = prefersReducedMotion ? 220 : 220 + Math.max(0, 1 - Math.abs(y - 1500) / 1500) * 60;
      if (primaryBeam.current) {
        primaryBeam.current.style.transform = `translateX(${-20 + drift * 40}%) rotate(-12deg)`;
        primaryBeam.current.style.background = `oklch(60% 0.06 ${hue} / 0.05)`;
      }
      if (secondaryBeam.current) {
        secondaryBeam.current.style.transform = `translateY(${10 - drift * 20}%) rotate(8deg)`;
        secondaryBeam.current.style.background = `oklch(65% 0.05 ${500 - hue} / 0.04)`;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;
    let frame = 0;
    const position = { x: -300, y: -300 };
    const update = () => {
      frame = 0;
      if (spotlight.current) spotlight.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    };
    const move = (event: MouseEvent) => {
      position.x = event.clientX - 300;
      position.y = event.clientY - 300;
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", move);
    };
  }, [isMobile, prefersReducedMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020203] overflow-hidden text-white">
        {/* Primary ambient beam — drifts with scroll, hue shifts cool->warm->cool */}
        <div
          ref={primaryBeam}
          style={{ transform: "translateX(-20%) rotate(-12deg)", background: "oklch(60% 0.06 220 / 0.05)" }}
          className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] blur-[140px] -rotate-12"
        />

        {/* Secondary counter-drifting beam — opposite hue, opposite direction */}
        <div
          ref={secondaryBeam}
          style={{ transform: "translateY(10%) rotate(8deg)", background: "oklch(65% 0.05 280 / 0.04)" }}
          className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[50%] blur-[160px] rotate-[8deg]"
        />

        {pointerEffectsEnabled && location.pathname === "/" && (
          <PageErrorBoundary fallback={null}><Suspense fallback={null}><InteractiveDots /></Suspense></PageErrorBoundary>
        )}

        {!isMobile && (
          <div
            ref={spotlight}
            className="absolute left-0 top-0 z-0 h-[600px] w-[600px] rounded-full will-change-transform"
            style={{
              transform: "translate(-300px, -300px)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.06), transparent 40%)",
            }}
          />
        )}

        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
      </div>

      <a
        href="#main-content"
        className="skip-link fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      {pointerEffectsEnabled && <PageErrorBoundary fallback={null}><Suspense fallback={null}><Cursor /></Suspense></PageErrorBoundary>}
      <Nav />

      {/* Scroll progress bar — thin white line at the very top */}
      <div
        ref={progressBar}
        className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-white"
        style={{ transform: "scaleX(0)", transition: "transform 100ms ease-out" }}
        aria-hidden="true"
      />

      <AskAI />
      <CommandPalette />

      <main id="main-content" tabIndex={-1} className="relative">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 pb-24 pt-8 sm:px-8 md:px-24">
        <div className="mx-auto flex w-full max-w-[100rem] items-center justify-between gap-6">
          <img
            src="/signature.svg"
            alt="Charlie H."
            loading="lazy"
            decoding="async"
            width={820}
            height={340}
            className="h-auto w-28 shrink-0 select-none opacity-80 sm:w-36"
            draggable={false}
          />
          <Link
            to="/privacy"
            className="inline-flex min-h-11 items-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
          >
            Privacy and cookie choices
          </Link>
        </div>
      </footer>
    </MotionConfig>
  );
}
