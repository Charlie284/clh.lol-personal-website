import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import RouteMeta from "../../components/RouteMeta";
import { usePrerenderedReturnTo } from "../../lib/usePrerenderedReturnTo";

const stack = ["Ubuntu Server", "Docker", "Docker Compose", "Portainer", "Jellyfin", "Homarr"];
const milestones = [
  {
    title: "Used the spare parts",
    body: "Moved parts from an upgraded PC into a dedicated server instead of leaving them in a box.",
  },
  {
    title: "Moved services to Docker",
    body: "Installed Ubuntu Server, Docker Compose, and Portainer so each service is easier to update or replace.",
  },
  {
    title: "Made it useful",
    body: "Added Jellyfin, Homarr, and other services I actually use on the home network.",
  },
];
const projectFacts = [
  ["Role", "Built and maintained by me"],
  ["Status", "Ongoing personal homelab"],
  ["Access", "Private local infrastructure"],
];

export default function Server() {
  const projectsReturnTo = usePrerenderedReturnTo("/projects");

  return (
    <div className="page-shell">
      <RouteMeta path="/projects/server" />
      <div className="w-full">
        <motion.header
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="page-intro grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-12"
        >
          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/60 sm:tracking-[0.35em]">
              Homelab / Infrastructure
            </p>
            <h1 className="page-title">
              Server Project
            </h1>
          </div>
          <p className="page-lead">
            An old PC running Ubuntu Server, Jellyfin, Homarr, and the other
            services I would rather host myself.
          </p>
        </motion.header>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="space-y-8">
            <div>
              <h2 className="mb-5 section-title">
                The setup
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  This started with old computer parts from a machine I had upgraded
                  over time. Rather than leave them in a box, I turned them into a
                  server and eventually rebuilt it around Ubuntu and Docker.
                </p>
                <p>
                  It is where I learned most of what I know about Linux maintenance,
                  containers, networking, and how easily one bad config can break an evening.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-5 section-title">
                How it is set up
              </h2>
              <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-white/70">
                <p>
                  Ubuntu Server runs on the machine. Docker Compose defines the
                  services, and I use Portainer to check and manage the containers.
                </p>
                <p>
                  The dashboard and admin tools stay on my home network. There is no
                  public demo because exposing Portainer to prove it exists would be a bad idea.
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-5 section-title">
                Milestones
              </h2>
              <div className="grid gap-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.title}
                    className="rounded-[1.25rem] border border-white/[0.06] bg-[#070707] p-5"
                  >
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white">
                      {milestone.title}
                    </h3>
                    <p className="text-white/60">{milestone.body}</p>
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
              <h2 className="mb-4 font-serif text-2xl uppercase">What I learned</h2>
              <p className="mb-6 text-sm leading-relaxed text-white/60 italic">
                Installing services is the quick part. Backups, updates, and fixing
                the thing I broke are the actual homelab.
              </p>
              <Link
                to={projectsReturnTo}
                className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
              >
                Back to work
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
