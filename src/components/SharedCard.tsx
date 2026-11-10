import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

type SharedCardItem = {
  title: string;
  href?: string;
  img?: string;
  desc: string;
  badge: string;
  category: string;
  status: string;
  buttonText?: string;
  target?: string;
};

export default function SharedCard({ item, projectsReturnTo }: { item: SharedCardItem; projectsReturnTo?: string }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="mb-3 text-xs text-white/60">{item.category} / {item.status}</p>
        <h2 className="editorial-title transition-colors group-hover:text-white/80">
          {item.title}
        </h2>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-white/60">
          {item.badge}
        </p>
      </div>
      <div className="flex min-w-0 flex-col items-start">
        <p className="max-w-[60ch] text-base leading-relaxed text-white/70">{item.desc}</p>
        <span className={`mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${item.href ? "text-white underline decoration-white/25 underline-offset-4 group-hover:decoration-white" : "text-white/60"}`}>
          {item.buttonText || "Details"}
          {item.href && <ArrowUpRight size={16} aria-hidden="true" />}
        </span>
      </div>
      {item.img && (item.img === "/startle-app-icon.webp" ? (
        <span className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-white/10 bg-[#ff4a2f] p-5">
          {/* The icon artwork is a full-bleed square; mask it like a macOS app icon. */}
          <img
            src={item.img}
            alt=""
            width={512}
            height={512}
            loading="lazy"
            className="aspect-square h-full w-auto rounded-[22%]"
          />
        </span>
      ) : (
        <img
          src={item.img}
          alt=""
          width={320}
          height={200}
          loading="lazy"
          className="aspect-[16/10] w-full rounded-xl border border-white/10 object-cover object-top"
        />
      ))}
    </>
  );
  const className = `group grid gap-5 py-7 sm:py-8 md:gap-8 ${item.img ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_10rem]" : "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] md:pr-[12rem]"}`;

  if (!item.href) {
    return <article className={className}>{content}</article>;
  }

  return item.href.startsWith("/") ? (
    <Link to={item.href} state={projectsReturnTo ? { projectsReturnTo } : undefined} className={className}>{content}</Link>
  ) : (
    <a href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} className={className}>
      {content}
    </a>
  );
}
