import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Briefcase, BookOpen } from "lucide-react";

const navItems = [
  { name: "Home", to: "/", icon: Home },
  { name: "Projects", to: "/projects", icon: Briefcase },
  { name: "Blog", to: "/blog", icon: BookOpen },
];

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-4 pointer-events-none md:pt-6">
      <nav aria-label="Main navigation" className="pointer-events-auto flex max-w-full gap-1 rounded-[1.5rem] border border-white/[0.08] bg-[#020202]/95 p-1.5 backdrop-blur-md">
        {navItems.map(({ name, to, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              aria-label={name}
              className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 sm:min-w-16 sm:px-3 transition-colors ${active ? "text-white" : "text-white/70 hover:text-white"}`}
            >
              {active && (
                <motion.span layoutId="active-pill" className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.06]" transition={{ duration: 0.2 }} />
              )}
              <Icon size={18} strokeWidth={1.5} className="relative" aria-hidden="true" />
              <span className="relative text-xs font-bold uppercase tracking-[0.06em]">{name}</span>
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
