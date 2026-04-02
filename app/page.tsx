import Link from "next/link";
import Image from "next/image";
import { RotatingInstitutions } from "@/components/RotatingInstitutions";
import { createAdminClient } from "@/lib/supabase/admin";

async function teaserRows() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("username, avatar_url, elo")
      .order("elo", { ascending: false })
      .limit(10);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const top = await teaserRows();

  return (
    <div className="relative bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-plains-accent/5 via-transparent to-transparent" />
      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-plains-accent">Competitive prediction</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Predict the future.
              <span className="block text-plains-muted">Prove you&apos;re right.</span>
            </h1>
            <RotatingInstitutions />
            <p className="mt-6 text-plains-muted">
              Your IQ meets the real world. Blind picks, ELO swings, public leaderboard — Kalshi meets ranked
              mode. No money, just reputation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-plains-accent px-6 py-3 font-mono font-semibold text-plains-void shadow-glow hover:bg-plains-accentDim transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-plains-border px-6 py-3 font-medium hover:border-plains-accent/50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-lg border border-transparent px-6 py-3 font-medium text-plains-muted hover:text-foreground"
              >
                View leaderboard →
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md lg:mt-4">
            <div className="rounded-2xl border border-plains-border bg-plains-panel/60 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-plains-muted">Global top 10</p>
                <span className="text-[10px] text-plains-muted">Live preview</span>
              </div>
              <ul className="mt-4 space-y-2 blur-[3px] select-none pointer-events-none">
                {(top.length ? top : Array.from({ length: 8 }, (_, i) => ({ username: "████████", elo: 2400 - i * 40, avatar_url: null }))).map(
                  (row, i) => (
                    <li
                      key={`${row.username}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-plains-border/50 bg-plains-void/50 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-plains-muted w-6">#{i + 1}</span>
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-plains-border">
                        {row.avatar_url ? (
                          <Image src={row.avatar_url} alt="" fill className="object-cover" sizes="32px" />
                        ) : null}
                      </div>
                      <span className="flex-1 truncate text-sm">{row.username}</span>
                      <span className="font-mono text-sm text-plains-accent">{row.elo}</span>
                    </li>
                  )
                )}
              </ul>
              <p className="mt-4 text-center text-xs text-plains-muted">Sign up to see the full ladder unblurred.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
