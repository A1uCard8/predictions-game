import Link from "next/link";

type NavProps = {
  user?: { email?: string; id?: string } | null;
  profileUsername?: string | null;
};

export function Nav({ user, profileUsername }: NavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-plains-border/80 bg-plains-void/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-lg font-semibold tracking-tight text-plains-accent"
        >
          PLAINS
        </Link>
        <nav className="flex items-center gap-4 text-sm text-plains-muted">
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              {profileUsername && (
                <Link
                  href={`/profile/${encodeURIComponent(profileUsername)}`}
                  className="hover:text-foreground transition-colors"
                >
                  Profile
                </Link>
              )}
              <Link href="/settings" className="hover:text-foreground transition-colors">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-plains-accent/15 px-3 py-1.5 font-medium text-plains-accent hover:bg-plains-accent/25 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
