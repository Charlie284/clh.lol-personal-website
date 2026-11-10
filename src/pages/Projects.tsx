import { useMemo, useRef, useState } from "react";
import { usePrerenderedSearchParams } from "../lib/usePrerenderedSearchParams";
import { AnimatePresence, motion } from "framer-motion";
import SharedCard from "../components/SharedCard";
import RouteMeta from "../components/RouteMeta";

import { projectsList } from "../data/projects";

const technologyOptions = Array.from(
  new Set(projectsList.flatMap((project) => project.technologies)),
).sort();
const categoryOptions = Array.from(
  new Set(projectsList.map((project) => project.category)),
).sort();
const statusOptions = Array.from(
  new Set(projectsList.map((project) => project.status)),
).sort();

export default function Projects() {
  const [searchParams, setSearchParams, filtersReady] = usePrerenderedSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const technology = technologyOptions.find((value) => value === searchParams.get("technology")) ?? "All";
  const category = categoryOptions.find((value) => value === searchParams.get("category")) ?? "All";
  const status = statusOptions.find((value) => value === searchParams.get("status")) ?? "All";
  const returnSearch = searchParams.toString();
  const projectsReturnTo = `/projects${returnSearch ? `?${returnSearch}` : ""}`;

  function updateFilter(name: "technology" | "category" | "status", value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value === "All") next.delete(name);
      else next.set(name, value);
      return next;
    }, { replace: true, preventScrollReset: true });
  }

  const filteredProjects = useMemo(
    () =>
      projectsList.filter(
        (project) =>
          (technology === "All" || project.technologies.includes(technology)) &&
          (category === "All" || project.category === category) &&
          (status === "All" || project.status === status),
      ),
    [category, status, technology],
  );

  const hasActiveFilters =
    technology !== "All" || category !== "All" || status !== "All";

  const resetFilters = () => {
    const firstFilter = filtersRef.current?.querySelector("select");
    const target = firstFilter?.getClientRects().length ? firstFilter : filtersTriggerRef.current;
    target?.focus({ preventScroll: true });
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const name of ["technology", "category", "status"]) next.delete(name);
      return next;
    }, { replace: true, preventScrollReset: true });
  };

  return (
    <div className="page-shell">
      <RouteMeta path="/projects" />
      <motion.header
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="page-intro"
      >
        <h1 className="page-title">
          Things I&rsquo;ve <span className="italic text-white/60">built.</span>
        </h1>
        <p className="page-lead mt-5">
          Apps, web tools, this site, and{" "}
          <span className="text-white not-italic">an old PC that became a server.</span>
        </p>
      </motion.header>

      <section
        aria-labelledby="project-filters-heading"
        className="mb-2 border-y border-white/10 py-3 sm:py-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 sm:mb-4">
          <div>
            <h2
              id="project-filters-heading"
              className="sr-only sm:not-sr-only sm:font-serif sm:text-xl sm:font-semibold sm:text-white"
            >
              Find a project
            </h2>
            <p
              aria-live="polite"
              className="text-sm text-white/65 sm:mt-2 sm:text-xs"
            >
              Showing {filteredProjects.length} of {projectsList.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              ref={filtersTriggerRef}
              disabled={!filtersReady}
              aria-expanded={filtersOpen}
              aria-controls="project-filter-fields"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-white underline decoration-white/30 underline-offset-4 sm:hidden"
            >
              {filtersOpen ? "Hide filters" : "Filter projects"}
              {hasActiveFilters && <span aria-label="active filters">({[technology, category, status].filter((value) => value !== "All").length})</span>}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`${hasActiveFilters ? "" : "hidden sm:invisible sm:block"} min-h-11 text-xs font-bold uppercase tracking-[0.14em] text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30`}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div ref={filtersRef} id="project-filter-fields" className={`${filtersOpen ? "grid" : "hidden"} mt-4 gap-3 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4`}>
          <ProjectFilter
            id="technology-filter"
            label="Technology"
            value={technology}
            disabled={!filtersReady}
            options={technologyOptions}
            allLabel="All technologies"
            onChange={(value) => updateFilter("technology", value)}
          />
          <ProjectFilter
            id="category-filter"
            label="Category"
            value={category}
            disabled={!filtersReady}
            options={categoryOptions}
            allLabel="All categories"
            onChange={(value) => updateFilter("category", value)}
          />
          <ProjectFilter
            id="status-filter"
            label="Status"
            value={status}
            disabled={!filtersReady}
            options={statusOptions}
            allLabel="All statuses"
            onChange={(value) => updateFilter("status", value)}
          />
        </div>
      </section>

      {filteredProjects.length > 0 ? (
        <motion.div
          layout
          className="divide-y divide-white/10"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((proj, idx) => (
              <motion.div
                layout
                key={proj.href ?? proj.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <SharedCard item={proj} projectsReturnTo={projectsReturnTo} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="border-b border-white/10 py-16 text-center">
          <h2 className="section-title">
            No matches
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base font-light italic leading-relaxed text-white/60 sm:text-lg">
            Those filters do not leave any projects. Clear one and try again.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-8 min-h-11 rounded-full border border-white/15 px-6 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectFilter({
  id,
  label,
  value,
  disabled,
  options,
  allLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  options: string[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="group flex min-w-0 flex-col gap-2"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
        {label}
      </span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-white/15 bg-[#070707] px-3 text-base text-white transition-colors hover:border-white/30"
      >
        <option value="All">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
