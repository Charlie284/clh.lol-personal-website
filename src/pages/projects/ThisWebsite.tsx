import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import RouteMeta from "../../components/RouteMeta";
import { usePrerenderedReturnTo } from "../../lib/usePrerenderedReturnTo";

const stack = ["React", "TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "MDX"];
const outcomes = [
  "Split each route into its own chunk and kept the blog in local MDX files.",
  "Built the hero, navigation, cards, and page transitions instead of using a template.",
  "Made the layout work from small phone screens up to wide desktops.",
];
const projectFacts = [
  ["Role", "Design and code"],
  ["Status", "Ongoing personal project"],
  ["Content", "Local, version-controlled MDX"],
];

export default function ThisWebsite() {
  const projectsReturnTo = usePrerenderedReturnTo("/projects");

  return (
    <div className="page-shell">
      <RouteMeta path="/projects/thiswebsite" />
      <div className="w-full">
        <motion.header
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="page-intro grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12"
        >
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/60 sm:tracking-[0.35em]">
              Portfolio / Blog
            </p>
            <h1 className="page-title">
              This Website
            </h1>
          </div>
          <p className="page-lead">
            My portfolio, blog, and place to try ideas that would be unnecessary
            anywhere else.
          </p>
        </motion.header>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-[#070707]"
        >
          <img
            src="/website-screenshot.webp"
            alt="Current homepage with the Hi, I'm Charlie hero"
            width={1440}
            height={1000}
            loading="eager"
            className="aspect-video w-full object-cover object-top"
          />
        </motion.div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="space-y-8">
            <div>
              <h2 className="mb-5 section-title">
                Why I built it
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  I needed one place for my projects and notes. A plain profile page
                  would have worked, but I wanted the site itself to be one of the projects.
                </p>
                <p>
                  This is the latest of several versions. Each rebuild has been an excuse
                  to learn something, remove old mistakes, and probably add too much motion.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-5 section-title">
                How it works
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  Vite builds the React app. React Router splits the main pages into
                  separate chunks, and the blog posts are MDX files stored with the code.
                </p>
                <p>
                  Shared components handle navigation, metadata, reduced-motion settings,
                  and keyboard controls. The command palette is there because I use it.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-5 section-title">
                What it does
              </h2>
              <div className="grid gap-3">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome}
                    className="rounded-[1.25rem] border border-white/[0.06] bg-[#070707] p-5 text-white/60"
                  >
                    {outcome}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/55">
                Project facts
              </h2>
              <dl className="space-y-3 text-sm">
                {projectFacts.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 border-b border-white/[0.06] pb-3">
                    <dt className="text-white/55">{label}</dt>
                    <dd className="text-right text-white/75">{value}</dd>
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
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/[0.06] bg-[#070707] p-6">
              <h2 className="mb-4 font-serif text-2xl uppercase">Next</h2>
              <p className="mb-6 text-sm leading-relaxed text-white/60 italic">
                Next on the list: better screenshots and more project pages.
              </p>
              <div className="flex flex-wrap gap-5">
                <a href="https://clh.lol/" className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 transition-colors hover:text-white">
                  Live site <ArrowUpRight size={15} strokeWidth={1.8} />
                </a>
                <a href="https://github.com/Charlie284/clh.lol-personal-website" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 transition-colors hover:text-white">
                  Source <ArrowUpRight size={15} strokeWidth={1.8} />
                </a>
                <Link to={projectsReturnTo} className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 transition-colors hover:text-white">
                  All work <ArrowUpRight size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
