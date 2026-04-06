import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

function CategoryIcon({ cat }: { cat: string }) {
  const common = "h-4 w-4 shrink-0 text-current";
  switch (cat) {
    case "Finance/Markets":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Politics":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3L4 9v12h16V9l-8-6z" strokeLinejoin="round" />
        </svg>
      );
    case "Geopolitics":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18" />
        </svg>
      );
    case "Sports":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" strokeLinejoin="round" />
        </svg>
      );
    case "Esports":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4M14 12h4M10 10v4" strokeLinecap="round" />
        </svg>
      );
    case "Science/Tech":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" strokeLinecap="round" />
        </svg>
      );
    case "Culture":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3c-4 3-7 7-7 11a7 7 0 0 0 14 0c0-4-3-8-7-11z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" strokeLinejoin="round" />
        </svg>
      );
  }
}

function categoryHref(cat: string) {
  return `/markets?category=${encodeURIComponent(cat)}`;
}

export function LandingSidebar() {
  return (
    <>
      {/* Mobile: horizontal strip */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-plains-border/40 bg-plains-sidebar px-3 py-2 md:hidden">
        <Link
          href="/markets"
          className="shrink-0 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-plains-muted hover:bg-plains-accent/10 hover:text-plains-accent"
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={categoryHref(c)}
            className="shrink-0 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-plains-muted hover:bg-plains-accent/10 hover:text-plains-accent"
          >
            {c.split("/")[0]}
          </Link>
        ))}
      </div>

      {/* Desktop sidebar */}
      <aside className="relative z-20 hidden w-52 shrink-0 flex-col border-r border-plains-border/50 bg-plains-sidebar py-8 pl-5 pr-3 md:flex lg:w-56">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-plains-accent">Categories</p>
          <p className="mt-1 text-xs italic text-plains-muted/90">browse the frontier</p>
        </div>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/markets"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-plains-muted transition-colors hover:bg-plains-accent/10 hover:text-plains-accent"
          >
            <span className="opacity-70">◇</span>
            All markets
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={categoryHref(c)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-plains-muted transition-colors hover:bg-plains-accent/10 hover:text-plains-accent"
            >
              <CategoryIcon cat={c} />
              <span className="leading-tight">{c.replace("/", " · ")}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
