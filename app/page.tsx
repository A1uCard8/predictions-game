import Link from "next/link";
import { HomeLeaderboardLive } from "@/components/HomeLeaderboardLive";
import { HomeSpotlight } from "@/components/HomeSpotlight";
import { MarketCard } from "@/components/MarketCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMarketHistoryBootstrap } from "@/lib/market-history";
import { getMarketPulse } from "@/lib/market-pulse";
import { loadOpenMarketsByActivity } from "@/lib/home-markets";
import type { MarketRow } from "@/lib/types";

const KISMET_LAST_ORDER_FLAG = "kismet-show-last-order-on-menu-for-repeat-buyer";

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
  const { sorted, stats } = await loadOpenMarketsByActivity();
  const spotlight = sorted[0] ?? null;
  const featured = spotlight ? sorted.filter((m) => m.id !== spotlight.id).slice(0, 6) : sorted.slice(0, 6);
  const showLastOrderTreatment = process.env.NEXT_PUBLIC_KISMET_EXPERIMENT === KISMET_LAST_ORDER_FLAG;

  const initialPulse = spotlight ? await getMarketPulse(spotlight.id) : null;

  let spotlightHistory: Awaited<ReturnType<typeof getMarketHistoryBootstrap>> | null = null;
  if (spotlight && marketOptions(spotlight).length === 2) {
    try {
      const admin = createAdminClient();
      spotlightHistory = await getMarketHistoryBootstrap(admin, spotlight.id);
    } catch {
      spotlightHistory = null;
    }
  }

  return (
    <div className="min-h-[calc(100dvh-6.5rem)] bg-plains-app">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-plains-muted">Trending</p>
            <h1 className="font-headline mt-1 text-xl font-bold tracking-tight text-plains-void sm:text-2xl">
              Top market right now
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/markets"
              className="rounded-full border border-plains-border bg-white px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-plains-void transition hover:border-plains-primary hover:text-plains-primaryHi"
            >
              All markets
            </Link>
            {!loggedIn ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-plains-muted transition hover:text-plains-void"
                >
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary rounded-full px-5 py-2 text-[10px]">
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                href="/portfolio"
                className="btn-primary rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
              >
                Portfolio
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(260px,300px)] lg:items-start">
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
                creditHistory={
                  marketOptions(spotlight).length === 2
                    ? (spotlightHistory ?? { points: [], yes: 0, no: 0 })
                    : undefined
                }
              />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-plains-border bg-white/80 p-10 text-center">
                <p className="font-headline font-semibold text-plains-void">No open markets yet.</p>
                <p className="mt-2 max-w-sm text-sm text-plains-muted">Check back soon.</p>
                <Link href="/markets" className="btn-primary mt-6 rounded-full px-6 py-2 text-[10px]">
                  Browse hub
                </Link>
              </div>
            )}
          </div>
          <aside className="min-h-[360px] lg:min-h-0">
            <HomeLeaderboardLive initial={top as { username: string; avatar_url: string | null; elo: number }[]} />
          </aside>
        </div>

        <section className="mt-12 border-t border-plains-border/20 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-headline text-lg font-bold text-plains-void sm:text-xl">More markets</h2>
              <p className="mt-1 text-sm text-plains-muted">High activity picks below.</p>
            </div>
            <Link
              href="/markets"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-plains-primaryHi transition hover:underline"
            >
              View all →
            </Link>
          </div>
          {showLastOrderTreatment ? (
            <div
              data-kismet-experiment={KISMET_LAST_ORDER_FLAG}
              className="mt-6 rounded-2xl border border-plains-border bg-white p-4 shadow-sm"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-plains-muted">Last order</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-plains-muted">
                  Repeat buyer? Your last order can be surfaced here so you can reorder it from the menu.
                </p>
                <Link href="/markets" className="btn-primary rounded-full px-5 py-2 text-[10px]">
                  Reorder
                </Link>
              </div>
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length === 0 ? (
              <p className="col-span-full rounded-xl border border-plains-border/40 bg-white py-12 text-center text-sm text-plains-muted">
                More markets soon.
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
    </div>
  );
}
