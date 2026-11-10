import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { GithubIcon } from "../components/icons/GithubIcon";
import NewsletterNotice from "../components/NewsletterNotice";
import NewsletterSignup from "../components/NewsletterSignup";
import RouteMeta from "../components/RouteMeta";
import { projectsList } from "../data/projects";
import {
  hasConfirmedNewsletterSubscription,
  subscribeToNewsletterPreference,
} from "../lib/newsletterPreferences";

const subscribeToHydration = () => () => {};

function useHydratedReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  // The prerender cannot know the browser's preference. Match its first
  // render before applying reduced motion, including conditional decoration.
  return React.useSyncExternalStore(subscribeToHydration, () => prefersReducedMotion, () => null);
}

const MagneticButton = ({
  children,
  to,
  className,
}: {
  children: React.ReactNode;
  to: string;
  className?: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [isMobile, setIsMobile] = React.useState(false);
  const prefersReducedMotion = useHydratedReducedMotion();

  React.useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const springConfig = prefersReducedMotion
    ? { stiffness: 1000, damping: 100, mass: 0.1 }
    : { stiffness: 150, damping: 15, mass: 0.1 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || prefersReducedMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * 0.35);
      y.set((e.clientY - centerY) * 0.35);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const magneticEnabled = !isMobile && !prefersReducedMotion;

  const content = (
    <>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: magneticEnabled ? mouseX : 0, y: magneticEnabled ? mouseY : 0 }}
        className={`relative z-10 ${className}`}
      >
        {children}
      </motion.div>
      {magneticEnabled && (
        <motion.div
          style={{ x: mouseX, y: mouseY }}
          className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </>
  );

  return to.startsWith("http") ? (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      data-snap="true"
      className="relative group"
    >
      {content}
    </a>
  ) : (
    <Link to={to} data-snap="true" className="relative group">
      {content}
    </Link>
  );
};

/* ---------- Hero name: per-letter depth + spotlight (no block tilt) ---------- */

const heroNameLetters = Array.from("Charlie");

function HeroLetter({
  letter,
  index,
  pointerX,
  interactive,
  prefersReducedMotion,
}: {
  letter: string;
  index: number;
  pointerX: MotionValue<number>;
  interactive: boolean;
  prefersReducedMotion: boolean | null;
}) {
  const normalizedIndex = index / (heroNameLetters.length - 1);
  const depth = Math.sin(normalizedIndex * Math.PI) * -60;
  const letterCenter = (index + 0.5) / heroNameLetters.length - 0.5;
  const scale = useTransform(pointerX, [-0.5, 0, 0.5], [0.94, 1, 1.06]);
  const baseBrightness = useTransform(pointerX, [-0.5, 0, 0.5], [0.7, 1.15, 0.7]);
  const spot = useTransform(pointerX, (position) =>
    Math.max(0, 1 - Math.abs(position - letterCenter) * 4),
  );
  const brightness = useTransform(
    [baseBrightness, spot],
    ([base, highlight]: number[]) => base + highlight * 0.5,
  );
  const filter = useTransform(brightness, (value) => `brightness(${value})`);

  return (
    <motion.span
      style={{
        z: depth,
        scale: interactive ? scale : 1,
        filter: interactive ? filter : "brightness(1)",
        transformStyle: "preserve-3d",
      }}
      initial={false}
      animate={{
        opacity: 1,
        y: 0,
        z: depth,
        rotateX: 0,
        filter: "blur(0px)",
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              default: {
                type: "spring",
                damping: 16,
                stiffness: 180,
                mass: 1,
                delay: 0.3 + index * 0.08,
              },
              filter: {
                duration: 0.4,
                delay: 0.3 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              },
            }
      }
      className="inline-block will-change-transform"
    >
      {letter}
    </motion.span>
  );
}

function HeroName({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = React.useState(false);

  // Pointer position relative to the hero name, normalized to [-0.5, 0.5].
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  React.useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isTouch || prefersReducedMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  const interactive = !isTouch && !prefersReducedMotion;

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="flex flex-col items-center select-none overflow-visible"
      style={{ perspective: 1000, zIndex: 10 }}
    >
      {/* "Hi, I'm" — quiet italic kicker, no tilt */}
      <motion.div
        style={{ fontVariationSettings: "'opsz' 40, 'SOFT' 50" }}
        className="font-hero text-[clamp(2rem,8vw,4.5rem)] italic text-white/55 leading-none mb-2"
      >
        <motion.span
          initial={false}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Hi, I&rsquo;m
        </motion.span>
      </motion.div>

      {/* "Charlie" — the star: per-letter 3D depth + cursor spotlight */}
      <motion.h1
        aria-label="Charlie"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100", fontWeight: 600 }}
        className="font-hero text-[clamp(3.5rem,15vw,12rem)] leading-[0.85] text-white relative"
      >
        <span className="flex items-baseline">
          {heroNameLetters.map((letter, index) => (
            <HeroLetter
              key={letter}
              letter={letter}
              index={index}
              pointerX={px}
              interactive={interactive}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </span>
      </motion.h1>
    </div>
  );
}

type FeaturedProject = {
  title: string;
  href: string;
  media?: {
    src: string;
    width: number;
    height: number;
    fit: "cover" | "contain";
    position?: "center" | "top";
    frameClassName?: string;
    inset?: boolean;
    zoom?: boolean;
  };
  previewLabel?: string;
  previewMeta?: string;
  kicker: string;
  summary: string;
  external?: boolean;
};

const projectPool: FeaturedProject[] = projectsList.map((project) => ({
  title: project.title,
  href: project.href,
  summary: project.desc,
  kicker: project.technologies.join(" / "),
  external: project.target === "_blank",
  previewMeta: `${project.category} · ${project.status}`,
  ...(project.img ? {
    media: {
      src: project.img,
      width: project.img === "/startle-app-icon.webp" ? 512 : 1440,
      height: project.img === "/startle-app-icon.webp" ? 512 : 1000,
      fit: "contain" as const,
      inset: project.img === "/startle-app-icon.webp",
    },
  } : {}),
}));

const featuredCount = 6;
const leadProject = projectPool.find((project) => project.href === "/projects/startle") ?? projectPool[0];
const otherProjects = projectPool.filter((project) => project !== leadProject);

const MotionLink = motion.create(Link);

function FeaturedWorkSection({
  featuredProjects,
  prefersReducedMotion,
}: {
  featuredProjects: FeaturedProject[];
  prefersReducedMotion: boolean | null;
}) {
  const [activeProject, setActiveProject] = React.useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const selectProject = (index: number) =>
    setActiveProject((index + featuredProjects.length) % featuredProjects.length);
  const project = featuredProjects[activeProject];

  React.useEffect(() => {
    const gallery = galleryRef.current;
    // Keep card focus with selection, but leave previous/next controls focused.
    if (gallery?.contains(document.activeElement) && document.activeElement?.matches(".coverflow-card")) {
      gallery.querySelector<HTMLAnchorElement>('[data-active="true"]')?.focus({ preventScroll: true });
    }
  }, [activeProject]);


  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = event.key === "ArrowRight" ? activeProject + 1
      : event.key === "ArrowLeft" ? activeProject - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? featuredProjects.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectProject(next);
  };

  return (
    <section className="relative z-10 border-y border-white/5 bg-[#030303] px-6 py-16 md:px-24 md:py-20">
      <div>
        <div className="mx-auto w-full max-w-[100rem]">
          <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55">
                Featured Work
              </p>
              <h2 className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] uppercase leading-[0.92] text-white">
                A few things I&rsquo;ve built.
              </h2>
            </div>
            <Link
              to="/projects"
              className="group inline-flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
            >
              All projects
              <ArrowUpRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div
            ref={galleryRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured projects"
            onKeyDown={handleGalleryKeyDown}
          >
            <div
              className="coverflow-stage"
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return;
                gesture.current = { x: event.clientX, y: event.clientY };
                swiped.current = false;
              }}
              onPointerCancel={() => { gesture.current = null; }}
              onPointerUp={(event) => {
                const start = gesture.current;
                gesture.current = null;
                if (!start) return;
                const dx = event.clientX - start.x;
                const dy = event.clientY - start.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                  swiped.current = true;
                  selectProject(activeProject + (dx < 0 ? 1 : -1));
                }
              }}
              onClickCapture={(event) => {
                if (swiped.current) {
                  event.preventDefault();
                  event.stopPropagation();
                  swiped.current = false;
                }
              }}
            >
              {featuredProjects.map((item, index) => {
                const count = featuredProjects.length;
                const offset = (index - activeProject + count + Math.floor(count / 2)) % count - Math.floor(count / 2);
                const selected = offset === 0;
                const visible = Math.abs(offset) <= 1;
                return (
                  <MotionLink
                    // Reinitialize motion values when the hydration shuffle moves a preview.
                    key={`${index}:${item.href}`}
                    to={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    aria-label={selected
                      ? `Open ${item.title} ${item.external ? "on GitHub" : "case study"}`
                      : `Select ${item.title}`}
                    aria-current={selected ? "true" : undefined}
                    aria-hidden={!visible}
                    tabIndex={visible ? 0 : -1}
                    data-active={selected}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onClick={(event) => {
                      if (!selected && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                        event.preventDefault();
                        selectProject(index);
                      }
                    }}
                    initial={false}
                    animate={{
                      x: `${offset * 68}%`,
                      scale: selected ? 1 : 0.76,
                      rotateY: prefersReducedMotion ? 0 : offset * -22,
                      opacity: selected ? 1 : visible ? 0.65 : 0,
                    }}
                    transition={prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 170, damping: 26 }}
                    style={{ zIndex: selected ? 3 : 1, pointerEvents: visible ? "auto" : "none" }}
                    className={`coverflow-card ${item.media?.frameClassName ?? "bg-[#101114]"}`}
                  >
                    {item.media?.inset ? (
                      <span className="flex h-full w-full items-center justify-center p-[12%]">
                        <img
                          src={item.media.src}
                          alt={`${item.title} preview`}
                          width={item.media.width}
                          height={item.media.height}
                          loading={selected ? "eager" : "lazy"}
                          decoding="async"
                          draggable={false}
                          className="aspect-square h-full w-auto max-w-full rounded-[22%] object-contain"
                        />
                      </span>
                    ) : item.media ? (
                      <img
                        src={item.media.src}
                        alt={`${item.title} preview`}
                        width={item.media.width}
                        height={item.media.height}
                        loading={selected ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between p-5 sm:p-8 md:p-10">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/85 sm:text-xs">{item.previewMeta}</p>
                        <p className="font-serif text-[clamp(1.35rem,3.5vw,3.5rem)] uppercase leading-tight [overflow-wrap:anywhere]">{item.title}</p>
                        <p className="text-xs text-white/85 sm:text-sm">{item.kicker}</p>
                      </div>
                    )}
                  </MotionLink>
                );
              })}
            </div>

            <div className="coverflow-details">
              <div aria-live="polite" aria-atomic="true" className="min-w-0">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/60">{project.kicker}</p>
                <h3 className="font-serif text-3xl uppercase leading-tight sm:text-4xl">
                  <Link to={project.href} target={project.external ? "_blank" : undefined} rel={project.external ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-3 hover:text-white/75">
                    {project.title}<ArrowUpRight size={24} aria-hidden="true" />
                  </Link>
                </h3>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">{project.summary}</p>
              </div>
              <div className="flex items-center gap-3 self-start" aria-label="Project controls">
                <button type="button" onClick={() => selectProject(activeProject - 1)} aria-label="Previous project" className="coverflow-arrow"><ArrowLeft size={20} /></button>
                <span className="min-w-12 text-center text-xs tabular-nums text-white/65">{String(activeProject + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}</span>
                <button type="button" onClick={() => selectProject(activeProject + 1)} aria-label="Next project" className="coverflow-arrow"><ArrowRight size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ExpertiseGroup = {
  id: string;
  label: string;
  tools: string[];
  blurb: string;
  project: string;
  href: string;
};

/* Hero — the headline responds to scroll, while the value proposition and
   primary actions stay visible from the initial viewport. */
function HeroSection({
  prefersReducedMotion,
  children,
  subContent,
}: {
  prefersReducedMotion: boolean | null;
  children: React.ReactNode;
  subContent: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  React.useEffect(() => {
    const check = () => setIsTouch(window.matchMedia("(max-width: 640px), (pointer: coarse)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showImmediately = Boolean(prefersReducedMotion || isTouch);

  // Headline stays put, just recedes slightly.
  const headlineY = useTransform(scrollYProgress, [0, 1], showImmediately ? [0, 0] : [0, -60]);
  const headlineScale = useTransform(scrollYProgress, [0, 1], showImmediately ? [1, 1] : [1, 0.92]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.8], showImmediately ? [1, 1] : [1, 0]);

  return (
    <div ref={ref} className="relative flex min-h-[min(42rem,85svh)] flex-col items-center justify-center overflow-visible px-6 pb-12 pt-28 md:px-24 md:pb-16 md:pt-32">
      {/* Headline — visible immediately, recedes on scroll */}
      <motion.div
        style={showImmediately ? { y: 0, scale: 1, opacity: 1 } : { y: headlineY, scale: headlineScale, opacity: headlineOpacity }}
        className="w-full max-w-[140rem] flex flex-col items-center will-change-transform overflow-visible"
      >
        {children}
      </motion.div>
      {/* The value proposition should not require a scroll to discover. */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-[140rem] flex-col items-center"
      >
        {subContent}
      </motion.div>
    </div>
  );
}

function PhilosophySection() {
  const paragraphs = [
    "I'm a student developer. I build small tools, websites, and a homelab from whatever hardware I have around.",
    "Away from the keyboard, I like rebuilding PCs, soldering, and taking electronics apart to see how they work.",
  ];
  return (
    <div className="mx-auto grid w-full max-w-[100rem] grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="w-full min-w-0 lg:contents">
        <h2 style={{ clipPath: "inset(0 0 0 0)" }} className="mb-8 font-serif text-[clamp(2.25rem,10vw,4.5rem)] text-white leading-[0.9] uppercase lg:mb-0">
          Software. Servers. <br /> <span className="italic">Still learning.</span>
        </h2>
        <div className="space-y-6 text-[clamp(1rem,1.6vw,1.25rem)] text-white/70 leading-relaxed font-light italic">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              style={{ opacity: 1, clipPath: "inset(0 0 0 0)", transform: "none" }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Capabilities tied to shipped artifacts instead of an undifferentiated tool wall. */
function SystemViewSection({
  expertiseCategories,
}: {
  expertiseCategories: ExpertiseGroup[];
}) {
  return (
    <section
      aria-labelledby="capabilities-heading"
      className="mx-auto w-full max-w-[100rem]"
    >
      <div
        style={{ opacity: 1, transform: "none" }}
        className="mb-12 grid gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] 2xl:items-end 2xl:gap-16"
      >
        <h2
          id="capabilities-heading"
          className="min-w-0 font-serif text-[clamp(2rem,6.5vw,6rem)] uppercase leading-[0.95] text-white"
        >
          What I work with
        </h2>
        <p className="w-full max-w-[65ch] text-lg leading-relaxed text-white/65">
          I mostly build native apps, websites, and the systems behind them. Each one below links to a real project.
        </p>
      </div>

      <div
        style={{ opacity: 1 }}
        className="divide-y divide-white/[0.08] border-y border-white/[0.08]"
      >
        {expertiseCategories.map((group) => (
          <Link
            key={group.id}
            to={group.href}
            className="group grid gap-5 py-8 sm:py-10 md:grid-cols-2 md:items-start md:gap-x-10 2xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_12rem] 2xl:items-center"
            aria-label={`Open ${group.project}`}
          >
            <h3 className="min-w-0 font-serif text-2xl uppercase leading-tight text-white sm:text-3xl">
              {group.label}
            </h3>
            <p className="max-w-[55ch] text-base leading-relaxed text-white/65">
              {group.blurb}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-white/65 transition-colors group-hover:border-white/15"
                >
                  {tool}
                </span>
              ))}
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 2xl:justify-self-end text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors group-hover:text-white">
              {group.project}
              <ArrowUpRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const faqItems = [
  {
    question: "Are you available for work?",
    answer:
      "It depends on school and whatever I am building at the time, but I am open to internships, part-time roles, and small contract projects. Email me and I will tell you honestly if I have room.",
  },
  {
    question: "What kind of work do you prefer?",
    answer:
      "I like software with a clear job to do: native apps, useful websites, developer tools, and self-hosted systems. The best projects let me think about both the interface and what is happening underneath it.",
  },
  {
    question: "Where are you based?",
    answer:
      "I am in the United States on Central Time. Remote work is the easiest fit, but I can make time-zone overlap work when a project needs it.",
  },
  {
    question: "How do you like to collaborate?",
    answer:
      "Give me a clear problem, direct feedback, and something real to test early. I am happy working through GitHub and written updates, with a call when talking is actually faster.",
  },
];

function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative z-10 scroll-mt-24 border-t border-white/[0.06] bg-[#050505] px-6 py-16 md:px-24 md:py-20"
    >
      <div className="mx-auto grid w-full max-w-[100rem] gap-16 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2
            id="faq-heading"
            className="font-serif text-[clamp(2.25rem,4vw,4rem)] uppercase leading-[1.05] text-white"
          >
            Good to
            <br />
            know.
          </h2>
          <p className="mt-8 max-w-sm text-base font-light italic leading-relaxed text-white/70 sm:text-lg">
            A few things you might want to know before emailing me.
          </p>
        </div>

        <dl className="border-t border-white/10">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="grid min-w-0 gap-3 border-b border-white/10 py-7 sm:py-8"
            >
              <dt className="font-hero text-xl font-semibold leading-snug text-white sm:text-2xl">
                {item.question}
              </dt>
              <dd className="max-w-[65ch] text-base font-light leading-relaxed text-white/70 sm:text-lg">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

type HomeProps = {
  newsletterNoticeEligible?: boolean;
  onNewsletterNoticeShown?: () => void;
};

export default function Home({
  newsletterNoticeEligible,
  onNewsletterNoticeShown,
}: HomeProps) {
  const prefersReducedMotion = useHydratedReducedMotion();
  const [showNewsletterSection, setShowNewsletterSection] = React.useState(true);

  React.useEffect(() => {
    const updateNewsletterSection = () => {
      setShowNewsletterSection(!hasConfirmedNewsletterSubscription());
    };

    updateNewsletterSection();
    return subscribeToNewsletterPreference(updateNewsletterSection);
  }, []);

  // Keep server markup and the first hydration render identical; shuffle only after mount.
  // The lead card stays fixed so the centered preview never swaps after load.
  const [featuredProjects, setFeaturedProjects] = React.useState(() => [leadProject, ...otherProjects.slice(0, featuredCount - 1)]);
  React.useEffect(() => {
    const shuffled = [...otherProjects];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    setFeaturedProjects([leadProject, ...shuffled.slice(0, featuredCount - 1)]);
  }, []);

  const expertiseCategories = [
    {
      id: "native-apps",
      label: "Native apps",
      blurb: "I build Mac apps that use the platform properly, keep data local, and fail without leaving the user stuck.",
      tools: ["Swift", "SwiftUI", "AppKit", "AVFoundation"],
      project: "Startle",
      href: "/projects/startle",
    },
    {
      id: "web-products",
      label: "Web products",
      blurb: "I build responsive websites with React, local content, accessible controls, and motion that still works on a phone.",
      tools: ["TypeScript", "React", "Vite", "MDX"],
      project: "This Website",
      href: "/projects/thiswebsite",
    },
    {
      id: "self-hosted-systems",
      label: "Self-hosted systems",
      blurb: "I turn spare hardware into private servers, run services in Docker, and fix them when an update breaks something.",
      tools: ["Linux", "Docker", "Compose", "Portainer"],
      project: "Server Project",
      href: "/projects/server",
    },
  ];

  return (
    <>
      <RouteMeta path="/" />
      {/* Hero — identity, value proposition, and primary work are visible at load. */}
      <HeroSection
        prefersReducedMotion={prefersReducedMotion}
        subContent={
          <div className="mt-8 flex w-full flex-col items-center gap-8 text-center md:mt-10">
            <p className="max-w-3xl text-lg font-light leading-tight tracking-tight text-white/65 sm:text-2xl md:text-3xl">
              Student developer making{" "}
              <span className="font-normal text-white">a macOS app</span>, websites, and{" "}
              <span className="whitespace-nowrap font-normal text-white">self-hosted tools.</span>
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <MagneticButton to="/projects/startle" className="rounded-full bg-white px-10 py-5 font-bold text-black transition-transform hover:scale-105 active:scale-95">
                <span className="relative z-10 text-xs uppercase tracking-[0.14em]">See Startle</span>
              </MagneticButton>
              <Link to="/projects" className="inline-flex min-h-11 items-center px-6 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white">
                All projects →
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a
                href="mailto:Charlie@clh.lol"
                aria-label="Email Charlie Harper"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white/70 transition-colors hover:text-white"
              >
                <Mail size={15} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/Charlie284/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Charlie284 on GitHub"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white/70 transition-colors hover:text-white"
              >
                <GithubIcon className="h-[15px] w-[15px]" />
              </a>
              <a
                href="https://x.com/Charlie_284"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Charlie_284 on X"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white/70 transition-colors hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden="true" focusable="false">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3l13.31 17.403Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/charlie-harper-ch/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Charlie Harper on LinkedIn"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white/70 transition-colors hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]" aria-hidden="true" focusable="false">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286h-.004ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
                </svg>
              </a>
            </div>
          </div>
        }
      >
        <div className="flex w-full flex-col items-center">
          <HeroName prefersReducedMotion={prefersReducedMotion} />
        </div>
      </HeroSection>

      {/* Project evidence follows the introduction directly. */}
      <FeaturedWorkSection featuredProjects={featuredProjects} prefersReducedMotion={prefersReducedMotion} />

      {/* Artifact-backed capabilities replace the undifferentiated tool wall. */}
      <section className="relative z-10 bg-[#020202] px-6 py-16 md:px-24 md:py-20" style={{ height: "auto" }}>
        <div className="px-0">
          <SystemViewSection expertiseCategories={expertiseCategories} />
        </div>
      </section>

      {/* Personal context now follows concrete work instead of delaying it. */}
      <section className="relative z-10 border-y border-white/5 bg-[#050505] px-6 py-16 md:px-24 md:py-20" style={{ height: "auto" }}>
        <div className="px-0">
          <div id="about" className="scroll-mt-24" />
          <PhilosophySection />
        </div>
      </section>

      <FaqSection />

      {showNewsletterSection && (
        <div
          id="newsletter"
          className="relative z-10 scroll-mt-24 border-t border-white/[0.06] bg-[#030303] px-6 py-24 md:px-24 md:py-24"
        >
          <NewsletterSignup
            source="home"
            className="mx-auto max-w-[100rem]"
          />
        </div>
      )}

      <NewsletterNotice
        initialIsVisible={newsletterNoticeEligible}
        onShown={onNewsletterNoticeShown}
      />
    </>
  );
}
