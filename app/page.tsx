import Link from "next/link";
import Image from "next/image";
import { LandingSidebar } from "@/components/LandingSidebar";
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

async function openMarketStats() {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("markets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    return count ?? 0;
  } catch {
    return null;
  }
}

export default async function Home() {
  const top = await teaserRows();
  const openCount = await openMarketStats();

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-plains-void md:flex-row">
      <LandingSidebar />

      <div className="relative flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1 flex-col">
        {/* Background photo + overlays */}
        <div className="absolute inset-0">
          <Image
            src="/plainimage.jpg"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="landing-hud-grid absolute inset-0" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/25"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-plains-accent">
              Competitive prediction
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Predict the future.
              <span className="mt-1 block text-plains-accent">Prove you&apos;re right.</span>
            </h1>
            <RotatingInstitutions tone="hero" />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-plains-muted sm:text-base">
              Your IQ meets the real world. Blind picks, ELO swings, public leaderboard — ranked mode for
              real events. No money, just reputation.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-gradient-to-b from-plains-accent to-plains-accentDim px-7 py-3 font-mono text-sm font-bold uppercase tracking-wider text-plains-void shadow-glow hover:opacity-95"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-white/25 bg-black/30 px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm hover:border-white/45"
              >
                Log in
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-md px-5 py-3 text-sm font-medium uppercase tracking-wide text-plains-muted hover:text-white"
              >
                Leaderboard →
              </Link>
            </div>
          </div>

          <div className="mt-12 w-full max-w-sm lg:mt-0 lg:ml-8">
            <div className="rounded-xl border border-plains-accent/20 bg-black/55 p-4 shadow-glow backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-plains-accent">
                  Global top 10
                </p>
                <span className="text-[10px] text-plains-muted">Preview</span>
              </div>
              <ul className="mt-3 space-y-2 blur-[2.5px] select-none pointer-events-none">
                {(top.length
                  ? top
                  : Array.from({ length: 8 }, (_, i) => ({
                      username: "████████",
                      elo: 2400 - i * 40,
                      avatar_url: null as string | null,
                    }))
                ).map((row, i) => (
                  <li
                    key={`${row.username}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                  >
                    <span className="w-6 font-mono text-[10px] text-plains-muted">#{i + 1}</span>
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-plains-border/50">
                      {row.avatar_url ? (
                        <Image src={row.avatar_url} alt="" fill className="object-cover" sizes="32px" />
                      ) : null}
                    </div>
                    <span className="flex-1 truncate text-sm text-white/90">{row.username}</span>
                    <span className="font-mono text-sm text-plains-accent">{row.elo}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-[11px] text-plains-muted">
                Sign up to see the full ladder unblurred.
              </p>
            </div>
          </div>
        </div>

        {/* HUD-style stat */}
        <div className="pointer-events-none absolute bottom-6 right-5 z-20 hidden sm:block md:right-8">
          <div className="flex items-stretch overflow-hidden rounded-md border border-plains-accent/25 bg-black/70 shadow-glow backdrop-blur-md">
            <div className="w-1 bg-plains-accent" aria-hidden />
            <div className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-plains-accent">
                Open markets
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                {openCount != null ? openCount.toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
