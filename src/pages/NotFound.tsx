import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import RouteMeta from "../components/RouteMeta";
import { notFoundMetadata } from "../lib/routeMetadata";

const destinations = [
  {
    to: "/projects",
    label: "Browse projects",
    detail: "Apps, web tools, and a homelab",
  },
  {
    to: "/blog",
    label: "Read the blog",
    detail: "Notes on software, privacy, and self-hosting",
  },
];

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="page-shell flex items-center">
      <RouteMeta {...notFoundMetadata} path={location.pathname} />

      <div className="mx-auto grid w-full max-w-[96rem] gap-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-end lg:gap-12">
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          aria-labelledby="not-found-heading"
        >
          <p
            aria-hidden="true"
            className="mb-6 font-hero text-7xl leading-none text-white/40"
          >
            404
          </p>
          <h1
            id="not-found-heading"
            className="page-title"
          >
            Took a wrong turn.
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-light italic leading-relaxed text-white/70 sm:text-xl">
            That page is gone, or I moved it and forgot to leave a sign.
            Everything else is still here.
          </p>
          <Link
            to="/"
            className="group mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-white px-8 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Go home
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        </motion.section>

        <motion.nav
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Useful pages"
          className="border-t border-white/10"
        >
          {destinations.map((destination) => (
            <Link
              key={destination.to}
              to={destination.to}
              className="group flex min-h-28 items-center justify-between gap-6 border-b border-white/10 py-7 transition-colors hover:border-white/25"
            >
              <span>
                <span className="block font-hero text-2xl leading-snug text-white">
                  {destination.label}
                </span>
                <span className="mt-3 block max-w-sm text-sm font-light leading-relaxed text-white/60 sm:text-base">
                  {destination.detail}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-white/55 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                strokeWidth={1.5}
              />
            </Link>
          ))}
        </motion.nav>
      </div>
    </div>
  );
}
