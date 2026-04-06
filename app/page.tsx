import Image from "next/image";
import Link from "next/link";
import { HomeLeaderboardLive } from "@/components/HomeLeaderboardLive";
import { HomeSpotlight } from "@/components/HomeSpotlight";
import { MarketCard } from "@/components/MarketCard";
import { RotatingInstitutions } from "@/components/RotatingInstitutions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMarketPulse } from "@/lib/market-pulse";
import { loadOpenMarketsByActivity } from "@/lib/home-markets";
import type { MarketRow } from "@/lib/types";

function marketOptions(m: MarketRow): string[] {
  const o = m.options;
  if (!Array.isArray(o)) return [];
  return o.filter((x): x is string => typeof x === "string");
}

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
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    loggedIn = Boolean(data.user);
  } catch {
    loggedIn = false;
  }

  const top = await teaserRows();
  const openCount = await openMarketStats();
  const { sorted, stats } = await loadOpenMarketsByActivity();
  const spotlight = sorted[0] ?? null;
  const featured = spotlight ? sorted.filter((m) => m.id !== spotlight.id).slice(0, 6) : sorted.slice(0, 6);

  const initialPulse = spotlight ? await getMarketPulse(spotlight.id) : null;

  return (
    <div className="relative flex min-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden bg-[#f4f6fa]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0">
          <Image
            src="/yellow.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.34]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/72 to-white/92" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-plains-accent/[0.06]" />
        <div className="landing-hud-grid absolute inset-0 opacity-[0.14]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-plains-border/60 bg-white/78 px-6 py-12 shadow-[0_1px_0_rgba(15,20,25,0.04),0_24px_48px_-12px_rgba(15,20,25,0.08)] backdrop-blur-xl sm:px-12 sm:py-14 ring-1 ring-black/[0.03]">
          <div className="text-center">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-plains-muted">
              Plains
            </p>
            <h1 className="home-display mt-3 text-balance text-4xl text-plains-void sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Competitive Prediction Markets
            </h1>
            <div className="mx-auto mt-5 flex max-w-xl justify-center">
              <RotatingInstitutions tone="light" compact />
            </div>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/markets"
                className="btn-primary rounded-xl px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
              >
                Browse markets
              </Link>
              {!loggedIn ? (
                <>
                  <Link
                    href="/signup"
                    className="btn-ghost rounded-xl border-plains-border/90 bg-white/90 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    className="text-[11px] font-semibold uppercase tracking-[0.1em] text-plains-muted transition hover:text-plains-void"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="btn-ghost rounded-xl border-plains-border/90 bg-white/90 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm"
                >
                  My History
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_minmax(260px,320px)] lg:items-stretch lg:gap-6">
          <div className="min-w-0">
            {spotlight ? (
              <HomeSpotlight
                market={spotlight}
                options={marketOptions(spotlight)}
                initialPulse={
                  initialPulse
                    ? {
                        counts: initialPulse.counts,
                        total: initialPulse.total,
                        countsApproximate: initialPulse.countsApproximate,
                        recent: initialPulse.recent,
                      }
                    : null
                }
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-plains-border/80 bg-white/85 p-8 text-center shadow-[0_1px_0_rgba(15,20,25,0.04),0_16px_40px_-16px_rgba(15,20,25,0.07)] backdrop-blur-xl ring-1 ring-black/[0.02]">
                <p className="text-sm font-semibold tracking-tight text-plains-void">No open markets yet.</p>
                <p className="mt-2 text-xs leading-relaxed text-plains-muted">Check back soon or create one from the desk.</p>
                <Link href="/markets" className="btn-primary mt-6 px-6 py-2 text-xs uppercase tracking-wider">
                  Markets hub
                </Link>
              </div>
            )}
          </div>
          <div className="min-h-[420px] lg:min-h-0">
            <HomeLeaderboardLive initial={top as { username: string; avatar_url: string | null; elo: number }[]} />
          </div>
        </div>

        <section className="relative z-10 mx-auto mt-12 w-full max-w-6xl pb-10 sm:mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="home-section-title text-xl text-plains-void sm:text-2xl">Trending markets</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-plains-muted">Most player activity right now.</p>
            </div>
            <Link
              href="/markets"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-plains-accent transition hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-plains-border/80 bg-white/75 py-12 text-center text-sm text-plains-muted backdrop-blur-md ring-1 ring-black/[0.02]">
                More markets loading soon.
              </p>
            ) : (
              featured.map((m) => {
                const s = stats.get(m.id);
                return (
                  <MarketCard
                    key={m.id}
                    market={m}
                    pickCount={s?.count ?? 0}
                    topOption={s?.topOption}
                    topPct={s?.topPct}
                    compact
                  />
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-6 right-5 z-20 hidden sm:block md:right-8">
        <div className="flex items-stretch overflow-hidden rounded-xl border border-plains-border/80 bg-white/92 shadow-[0_8px_30px_-8px_rgba(15,20,25,0.12)] backdrop-blur-md ring-1 ring-black/[0.03]">
          <div className="w-1 bg-gradient-to-b from-plains-accent to-plains-accentDim" aria-hidden />
          <div className="px-4 py-3.5">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-plains-accent">Open markets</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-plains-void">
              {openCount != null ? openCount.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
