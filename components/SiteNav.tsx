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
  profileCredits?: number | null;
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
      className={`shrink-0 font-headline text-xs font-bold uppercase tracking-wide transition-colors ${
        active ? "text-plains-primaryHi" : "text-plains-muted hover:text-plains-void"
      }`}
    >
      <span className={`inline-block ${active ? "border-b-2 border-plains-primaryHi pb-0.5" : ""}`}>
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
    <div className="flex h-10 items-center gap-1 overflow-x-auto border-t border-plains-border/15 bg-plains-heaven px-4 scrollbar-hide sm:px-6 lg:px-10">
      {CATEGORIES.map((c) => {
        const href = `/markets?category=${encodeURIComponent(c)}`;
        const active = path.startsWith("/markets") && categoryFilter === c;
        return (
          <Link
            key={c}
            href={href}
            className={`shrink-0 rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold transition sm:text-[11px] ${
              active
                ? "bg-plains-primary text-white"
                : "text-plains-muted hover:bg-plains-panel hover:text-plains-void"
            }`}
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}

export function SiteNav({ user, profileUsername, profileAvatarUrl, profileCredits }: Props) {
  const path = usePathname() ?? "";
  const marketsActive = path.startsWith("/markets");
  const leaderboardActive = path.startsWith("/leaderboard");
  const portfolioActive = path.startsWith("/portfolio");
  const profileActive = path.startsWith("/profile") || path.startsWith("/settings");

  return (
    <header className="sticky top-0 z-50 border-b border-plains-border/15 bg-plains-canvas/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 rounded-sm outline-none ring-plains-primaryHi focus-visible:ring-2">
          <PlainsLogo />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto scrollbar-hide sm:gap-8">
          <NavLink href="/markets" active={marketsActive}>
            Markets
          </NavLink>
          <NavLink href="/leaderboard" active={leaderboardActive}>
            Leaderboard
          </NavLink>
          {user ? (
            <NavLink href="/portfolio" active={portfolioActive}>
              Portfolio
            </NavLink>
          ) : null}
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
          {user && profileCredits != null ? (
            <span
              className="hidden rounded-sm border border-plains-border/60 bg-plains-panel px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-plains-void sm:inline-block"
              title="Seasonal credits — not purchasable"
            >
              {profileCredits.toLocaleString()} <span className="text-plains-muted">CR</span>
            </span>
          ) : null}
          {user ? (
            <UserMenu email={user.email} username={profileUsername ?? null} avatarUrl={profileAvatarUrl ?? null} />
          ) : (
            <>
              <Link
                href="/login"
                className="font-headline text-xs font-bold uppercase tracking-wide text-plains-muted transition hover:text-plains-void"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-4 py-2 text-[10px]">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <Suspense
        fallback={<div className="h-10 border-t border-plains-border/15 bg-plains-heaven px-4 sm:px-6 lg:px-10" />}
      >
        <CategoryNavRow />
      </Suspense>
    </header>
  );
}
