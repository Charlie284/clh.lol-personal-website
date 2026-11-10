import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import RouteMeta from "../../components/RouteMeta";
import { usePrerenderedReturnTo } from "../../lib/usePrerenderedReturnTo";

const decisions = [
  {
    title: "Separate the bell from the class",
    body: "Two half-blocks can share the same start and end time. The countdown follows that shared time window, while a personal schedule determines which class to show. Keeping those jobs separate lets the same bell schedule work for different students.",
  },
  {
    title: "Keep the schedule when a refresh fails",
    body: "New schedule data merges into a saved cache. A failed request leaves the cached days available and records the refresh error. Looking at another month also preserves the days already loaded.",
  },
  {
    title: "Give the widget its own copy",
    body: "The iOS widget runs separately from the Flutter app. A native bridge passes upcoming schedule data into a shared App Group cache, where the widget can read it for its timeline. Campus and Early Bird preferences travel across that bridge too.",
  },
];

const facts = [
  ["Platform", "iOS and Android"],
  ["Stack", "Flutter, Dart, Cubit"],
  ["Native widget", "Swift / iOS"],
  ["Status", "In progress"],
  ["Source", "Private repository"],
];

export default function NewTrierBlock() {
  const projectsReturnTo = usePrerenderedReturnTo("/projects");

  return (
    <div className="page-shell">
      <RouteMeta path="/projects/new-trier-block" />
      <motion.header
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="page-intro grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12"
      >
        <div>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 sm:tracking-[0.35em]">
            iOS and Android / In progress
          </p>
          <h1 className="page-title">New Trier Block</h1>
        </div>
        <p className="page-lead">
          Which period is it, and how much time is left? A bell-schedule app
          for New Trier students, parents, and teachers.
        </p>
      </motion.header>

      <figure className="mb-12 grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start md:gap-16">
        <a href="/project-previews/new-trier-day-detail.png" target="_blank" rel="noopener noreferrer" aria-label="View the New Trier Block day schedule at full size" className="mx-auto block w-full max-w-72 overflow-hidden rounded-xl border border-white/10 md:order-2">
          <img
            src="/project-previews/new-trier-day-detail.webp"
            alt="New Trier Block’s Future View showing the Winnetka campus bell times for a sample Anchor Day"
            width={576}
            height={1247}
            className="h-auto w-full"
          />
        </a>
        <figcaption className="max-w-[55ch] md:order-1">
          <h2 className="section-title">The schedule, one day at a time</h2>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            Day color carries through the screen. The campus selector and bell
            times stay together, with alternating rows to make each period easier to follow.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Development preview using bundled sample schedule data.
          </p>
          <a href="/project-previews/new-trier-day-detail.png" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm text-white underline decoration-white/30 underline-offset-4">View full size ↗</a>
        </figcaption>
      </figure>

      <div className="grid gap-12 border-t border-white/10 pt-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div className="space-y-14">
          <section aria-labelledby="nt-block-problem">
            <h2 id="nt-block-problem" className="section-title">One school day, several schedules</h2>
            <div className="mt-5 max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
              <p>
                A countdown needs the right schedule behind it. Campus, day color,
                and overlapping half-blocks affect what a student needs to see.
                The app brings the current period and remaining time to the main
                screen, with a calendar for looking ahead.
              </p>
              <p>
                Personal class schedules add the student&apos;s courses to the
                school&apos;s bell times. Flutter provides the shared interface on
                iOS and Android; Cubits manage schedule data, personal schedules,
                and the ticking countdown independently.
              </p>
            </div>
          </section>

          <section aria-labelledby="nt-block-decisions">
            <h2 id="nt-block-decisions" className="section-title">The decisions behind the screen</h2>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {decisions.map((decision) => (
                <article key={decision.title} className="py-7">
                  <h3 className="font-serif text-xl font-semibold text-white">{decision.title}</h3>
                  <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-white/70">{decision.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="nt-block-timing">
            <h2 id="nt-block-timing" className="section-title">Testing the moment a period ends</h2>
            <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-white/70">
              The countdown accepts an injectable clock. Tests can set the time
              to an exact bell boundary and check the transition without waiting
              for a real school day. This keeps timing logic testable separately
              from the interface and schedule feed.
            </p>
          </section>
        </div>

        <aside className="space-y-8">
          <div>
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/55">Project facts</h2>
            <dl className="space-y-3 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-white/10 pb-3">
                  <dt className="text-white/55">{label}</dt>
                  <dd className="text-right text-white/75">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            This case study covers the implementation in progress. The source
            is private, and there is no public download linked here.
          </p>
          <Link to={projectsReturnTo} className="inline-flex min-h-11 items-center text-sm text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            Back to projects
          </Link>
        </aside>
      </div>
    </div>
  );
}
