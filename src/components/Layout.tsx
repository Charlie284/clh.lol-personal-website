import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
  MotionConfig,
} from "framer-motion";
import Nav from "./Nav";
import CommandPalette from "./CommandPalette";
import AskAI from "./AskAI";
import PageErrorBoundary from "./PageErrorBoundary";

const Cursor = lazy(() => import("./Cursor"));
const InteractiveDots = lazy(() => import("./InteractiveDots"));

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { scrollY, scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  // Scroll progress bar — spring-smoothed so it glides instead of jumping.
  const progressSpring = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [isMobile, setIsMobile] = useState(false);
  const [pointerEffectsEnabled, setPointerEffectsEnabled] = useState(false);
  const previousPathname = useRef<string | null>(null);

  const beamX = useTransform(scrollY, [0, 2000], ["-20%", "20%"]);

  // Scroll-linked hue shift: the ambient beams drift through a restrained
  // hue range (220 -> 280 -> 220) as the user scrolls. Black canvas stays
  // black; only the light layers shift. Disabled under reduced motion.
  const hueRange = prefersReducedMotion ? [220, 220, 220] : [220, 280, 220];
  const beamHue = useTransform(scrollY, [0, 1500, 3000], hueRange);
  const beamHue2 = useTransform(scrollY, [0, 1500, 3000], prefersReducedMotion ? [280, 280, 280] : [280, 220, 280]);

  const beamColor = useTransform(beamHue, (h) => `oklch(60% 0.06 ${h} / 0.05)`);
  const beamColor2 = useTransform(beamHue2, (h) => `oklch(65% 0.05 ${h} / 0.04)`);
  const beamY2 = useTransform(scrollY, [0, 2000], ["10%", "-10%"]);

  const spotlightX = useTransform(mouseX, (x) => x - 300);
  const spotlightY = useTransform(mouseY, (y) => y - 300);

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

  // Mouse move listener — throttled to one update per animation frame so
  // the radial-gradient spotlight (which resamples on every set) doesn't
  // run 200+ times/sec during fast mouse movement.
  useEffect(() => {
    if (isMobile) return;
    let pending = false;
    let lastEvent: MouseEvent | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      lastEvent = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (lastEvent) {
          mouseX.set(lastEvent.clientX);
          mouseY.set(lastEvent.clientY);
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, mouseX, mouseY]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020203] overflow-hidden text-white">
        {/* Primary ambient beam — drifts with scroll, hue shifts cool->warm->cool */}
        <motion.div
          style={{ x: beamX, background: beamColor }}
          className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] blur-[140px] -rotate-12"
        />

        {/* Secondary counter-drifting beam — opposite hue, opposite direction */}
        <motion.div
          style={{ y: beamY2, background: beamColor2 }}
          className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[50%] blur-[160px] rotate-[8deg]"
        />

        {pointerEffectsEnabled && location.pathname === "/" && (
          <PageErrorBoundary fallback={null}><Suspense fallback={null}><InteractiveDots /></Suspense></PageErrorBoundary>
        )}

        {!isMobile && (
          <motion.div
            className="absolute left-0 top-0 z-0 h-[600px] w-[600px] rounded-full will-change-transform"
            style={{
              x: spotlightX,
              y: spotlightY,
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
      <motion.div
        className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-white"
        style={{ scaleX: progressSpring }}
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
