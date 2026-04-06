"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HowPlainsWorksTrigger } from "@/components/HowPlainsWorksModal";
import { UserMenu } from "@/components/UserMenu";
import { CATEGORIES } from "@/lib/constants";
import { PlainsLogo } from "./PlainsLogo";

type Props = {
  user?: { email?: string; id?: string } | null;
  profileUsername?: string | null;
  profileAvatarUrl?: string | null;
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
      className={`shrink-0 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
        active ? "text-plains-accent" : "text-plains-muted hover:text-plains-void"
      }`}
    >
      <span className={`inline-block ${active ? "border-b-2 border-plains-accent pb-0.5" : ""}`}>
        {children}
      </span>
    </Link>
  );
}

function CategoryNavRow() {
  const path = usePathname() ?? "";
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  return (
    <div className="flex h-10 items-center gap-1 overflow-x-auto border-t border-plains-border/80 px-4 scrollbar-hide sm:px-6 lg:px-10">
      {CATEGORIES.map((c) => {
        const href = `/markets?category=${encodeURIComponent(c)}`;
        const active = path.startsWith("/markets") && categoryFilter === c;
        return (
          <Link
            key={c}
            href={href}
            className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition sm:text-[11px] ${
              active ? "bg-plains-mist text-plains-accent" : "text-plains-muted hover:bg-plains-mist hover:text-plains-void"
            }`}
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}

export function SiteNav({ user, profileUsername, profileAvatarUrl }: Props) {
  const path = usePathname() ?? "";
  const marketsHubActive = path.startsWith("/markets");
  const leaderboardActive = path.startsWith("/leaderboard");
  const profileActive = path.startsWith("/profile") || path.startsWith("/settings");
  const homeActive = path === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-plains-border bg-plains-sidebar/90 shadow-sm backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 rounded-md outline-none ring-plains-accent focus-visible:ring-2">
          <PlainsLogo />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto scrollbar-hide sm:gap-8">
          <NavLink href="/" active={homeActive}>
            Home
          </NavLink>
          <NavLink href="/markets" active={marketsHubActive}>
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
              Profile
            </NavLink>
          ) : null}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HowPlainsWorksTrigger />
          {user ? (
            <UserMenu email={user.email} username={profileUsername ?? null} avatarUrl={profileAvatarUrl ?? null} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-wider text-plains-muted transition hover:text-plains-void"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="h-10 border-t border-plains-border/80 bg-plains-sidebar/90 px-4 sm:px-6 lg:px-10" />
        }
      >
        <CategoryNavRow />
      </Suspense>
    </header>
  );
}
