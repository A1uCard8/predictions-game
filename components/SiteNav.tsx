"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  user?: { email?: string; id?: string } | null;
  profileUsername?: string | null;
};

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
        active ? "text-plains-accent" : "text-plains-muted hover:text-foreground"
      }`}
    >
      <span
        className={`inline-block ${active ? "border-b-2 border-plains-accent pb-0.5" : ""}`}
      >
        {children}
      </span>
    </Link>
  );
}

export function SiteNav({ user, profileUsername }: Props) {
  const path = usePathname() ?? "";
  const marketsActive =
    path === "/" || path.startsWith("/dashboard") || path.startsWith("/markets");
  const leaderboardActive = path.startsWith("/leaderboard");
  const profileActive = path.startsWith("/profile") || path.startsWith("/settings");

  return (
    <header className="sticky top-0 z-50 border-b border-plains-border/60 bg-plains-sidebar/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="font-mono text-lg font-bold uppercase tracking-[0.15em] text-plains-accent"
        >
          Plains
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-6 sm:gap-10">
          <NavLink href="/dashboard" active={marketsActive}>
            Markets
          </NavLink>
          <NavLink href="/leaderboard" active={leaderboardActive}>
            Leaderboard
          </NavLink>
          {user ? (
            <NavLink
              href={profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : "/settings"}
              active={profileActive}
            >
              Portfolio
            </NavLink>
          ) : (
            <NavLink href="/login?next=/dashboard" active={false}>
              Portfolio
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href="/settings"
              className="hidden rounded-md border border-plains-border/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-plains-muted hover:border-plains-accent/40 hover:text-foreground sm:inline-block"
            >
              Settings
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold uppercase tracking-wider text-plains-muted hover:text-foreground"
            >
              Log in
            </Link>
          )}
          <Link
            href="/signup"
            className="rounded-md bg-gradient-to-b from-plains-accent to-plains-accentDim px-4 py-2 text-xs font-bold uppercase tracking-wider text-plains-void shadow-glow hover:opacity-95"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
