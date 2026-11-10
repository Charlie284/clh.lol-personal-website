import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import RouteMeta from "../../components/RouteMeta";
import { usePrerenderedReturnTo } from "../../lib/usePrerenderedReturnTo";

const stack = ["Swift", "SwiftUI", "AppKit", "AVFoundation", "Swift concurrency"];

const safeguards = [
  {
    title: "The emergency stop has to work",
    body: "Startle will not enable scheduled playback unless the global emergency shortcut registers first. Escape closes the current video. Command–Option–Shift–Escape closes it and turns future scares off.",
  },
  {
    title: "It checks twice",
    body: "The app checks active hours, cooldowns, daily limits, pauses, excluded apps, and system activity when it schedules a scare. Then it checks everything again right before playback.",
  },
  {
    title: "macOS does not reveal everything",
    body: "macOS does not always expose Focus state or third-party screen sharing reliably. The app says that plainly instead of pretending those checks are foolproof.",
  },
];

const playbackFlow = [
  { title: "Pick the timing", detail: "Choose fixed intervals, random intervals, or chance-based checks, then limit them to certain days and hours.", file: "ScheduleEngine.swift", path: "StartleCore/ScheduleEngine.swift" },
  { title: "Check before playing", detail: "The scheduler checks pauses, cooldowns, limits, and system activity. It runs one last safety check before the window appears.", file: "ScareCoordinator.swift", path: "StartleCore/ScareCoordinator.swift" },
  { title: "Make it easy to stop", detail: "Escape closes the video. The emergency shortcut closes it and disables future scares. Startle records the result locally.", file: "AppState.swift", path: "StartleApp/AppState.swift" },
];

const projectFacts = [
  ["Role", "Product, design, and engineering"],
  ["Platform", "macOS 14 or later"],
  ["Status", "Pre-release / unsigned preview"],
  ["Data", "Local settings and selected media"],
];

export default function Startle() {
  const projectsReturnTo = usePrerenderedReturnTo("/projects");

  return (
    <div className="page-shell">
      <RouteMeta path="/projects/startle" />

      <div className="w-full">
        <motion.header
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="page-intro grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12"
        >
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6842] sm:tracking-[0.35em]">
              Native macOS / Pre-release
            </p>
            <h1 className="page-title">
              Startle
            </h1>
          </div>
          <p className="page-lead">
            A menu bar app that plays local videos on a schedule. The hard part
            was not the timer. It was making every interruption safe and easy to stop.
          </p>
        </motion.header>

        <motion.figure
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <a href="/project-previews/startle-dashboard.png" target="_blank" rel="noopener noreferrer" aria-label="View the Startle dashboard screenshot at full size" className="block overflow-hidden rounded-xl border border-white/10">
            <img
              src="/project-previews/startle-dashboard.webp"
              alt="Startle’s macOS dashboard with playback disabled, scheduling controls, and local activity counts"
              width={2100}
              height={1440}
              loading="eager"
              className="aspect-[2100/880] h-auto w-full object-cover object-top"
            />
          </a>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm leading-relaxed text-white/65">
            <span>The dashboard keeps playback status and the pause controls together.</span>
            <a href="/project-previews/startle-dashboard.png" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-white underline decoration-white/30 underline-offset-4">View full size ↗</a>
          </figcaption>
        </motion.figure>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://github.com/Charlie284/Startle" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-white/90">
            Source code <ArrowUpRight size={15} strokeWidth={1.8} />
          </a>
          <a href="https://github.com/Charlie284/Startle/releases" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-white/30 hover:bg-white/[0.04]">
            Unsigned previews <ArrowUpRight size={15} strokeWidth={1.8} />
          </a>
        </div>

        <section aria-labelledby="startle-flow" className="mt-16 border-y border-white/10 py-10 sm:mt-20">
          <h2 id="startle-flow" className="section-title">What happens after you set a schedule</h2>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-white/70">Here is how one scheduled scare moves through the app. Each step links to the code that handles it.</p>
          <ol className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-10">
            {playbackFlow.map((step, index) => (
              <li key={step.file} className="flex flex-col border-t border-white/10 pt-6">
                <span className="text-sm font-bold text-[#ff6842]" aria-hidden="true">0{index + 1}</span>
                <h3 className="mt-3 font-serif text-xl uppercase leading-tight">{step.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-white/70">{step.detail}</p>
                <a href={`https://github.com/Charlie284/Startle/blob/main/Sources/${step.path}`} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white">
                  {step.file} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-16">
            <section aria-labelledby="startle-problem">
              <h2 id="startle-problem" className="mb-6 section-title">
                Why it got complicated
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  Startle plays videos you choose from your own Mac. It supports
                  random, fixed, and chance-based schedules, active windows, cooldowns,
                  daily limits, and temporary pauses.
                </p>
                <p>
                  The app is supposed to interrupt you, which makes control the whole
                  problem. Every scare needs an obvious way out, and the app should skip
                  playback when the signals macOS provides say it is a bad time.
                </p>
              </div>
            </section>

            <section aria-labelledby="startle-safeguards">
              <h2 id="startle-safeguards" className="mb-8 section-title">
                How I keep it under control
              </h2>
              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {safeguards.map((safeguard) => (
                  <article key={safeguard.title} className="grid gap-4 py-7 sm:py-9 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-8">
                    <h3 className="font-serif text-xl font-semibold leading-snug text-white">
                      {safeguard.title}
                    </h3>
                    <p className="max-w-[65ch] leading-relaxed text-white/65">
                      {safeguard.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="startle-privacy">
              <h2 id="startle-privacy" className="mb-6 section-title">
                Local by design
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  Your videos stay where you put them. Startle keeps security-scoped
                  bookmarks, settings, and a limited activity history on your Mac. It does
                  not copy or upload media, and it has no analytics, ads, or telemetry.
                </p>
                <p>
                  Startle is still pre-release. You can build it from source or try an unsigned
                  preview, but I am not calling it a trusted download until the packaged app is
                  signed with Developer ID, notarized, and tested as a package.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-10 lg:sticky lg:top-32 lg:self-start">
            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/55">
                Project facts
              </h2>
              <dl className="space-y-3 text-sm">
                {projectFacts.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 border-b border-white/[0.06] pb-3">
                    <dt className="text-white/55">{label}</dt>
                    <dd className="text-right text-white/80">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/55">
                Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-7">
              <p className="mb-6 text-sm italic leading-relaxed text-white/60">
                Safety checks reduce risk; they do not replace consent or judgment.
              </p>
              <Link to={projectsReturnTo} className="inline-flex min-h-11 items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/65 transition-colors hover:text-white">
                All projects <ArrowUpRight size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
