import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserGlobalRank } from "@/lib/leaderboard";
import { EloExplainPanel } from "@/components/EloExplainPanel";
import { MarketCard } from "@/components/MarketCard";
import { RankProgress } from "@/components/RankProgress";
import { TierBadge } from "@/components/TierBadge";
import { batchMarketPickStats } from "@/lib/market-stats";
import { redirect } from "next/navigation";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const catFilter = searchParams.category;
  const validCat = catFilter && CATEGORIES.includes(catFilter as (typeof CATEGORIES)[number]) ? catFilter : null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  const { data: myPreds } = await supabase
    .from("predictions")
    .select("market_id, chosen_option, is_correct")
    .eq("user_id", user.id);
  const predMarketIds = new Set((myPreds ?? []).map((p) => p.market_id));
  const resolvedPreds = (myPreds ?? []).filter((p) => p.is_correct !== null);
  const winCount = resolvedPreds.filter((p) => p.is_correct).length;
  const lossCount = resolvedPreds.filter((p) => p.is_correct === false).length;

  const { data: markets } = await supabase
    .from("markets")
    .select("*")
    .eq("status", "open")
    .gt("close_date", new Date().toISOString())
    .order("close_date", { ascending: true });

  let openList = (markets ?? []).filter((m) => !predMarketIds.has(m.id));
  if (validCat) openList = openList.filter((m) => m.category === validCat);

  const { data: activePreds } = await supabase
    .from("predictions")
    .select("market_id, chosen_option")
    .eq("user_id", user.id);
  const activeIds = Array.from(new Set((activePreds ?? []).map((p) => p.market_id)));
  const { data: activeMarkets } =
    activeIds.length > 0
      ? await supabase.from("markets").select("*").in("id", activeIds).neq("status", "resolved")
      : { data: [] as { id: string; title: string; status: string }[] };
  const activeMarketById = new Map((activeMarkets ?? []).map((m) => [m.id, m]));
  const active = (activePreds ?? []).filter((p) => activeMarketById.has(p.market_id));

  let rank: number | null = null;
  let deskStats = new Map<string, { count: number; topOption: string | null; topPct: number | null }>();
  try {
    const admin = createAdminClient();
    rank = await getUserGlobalRank(admin, user.id);
    deskStats = await batchMarketPickStats(
      admin,
      openList.map((m) => m.id),
    );
  } catch {
    rank = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 shrink-0 space-y-4">
          <div className="rounded-xl border border-plains-border bg-plains-panel p-4 shadow-sm">
            <p className="text-xs font-mono uppercase text-plains-muted">Your rank</p>
            <p className="mt-2 font-mono text-3xl text-plains-accent">{rank != null ? `#${rank}` : "—"}</p>
            <div className="mt-3">
              <TierBadge elo={profile?.elo ?? 1000} globalRank={rank} />
            </div>
            <p className="mt-4 font-mono text-sm text-plains-muted">
              ELO <span className="text-foreground">{profile?.elo ?? 1000}</span>
            </p>
            {typeof (profile as { credits?: number })?.credits === "number" && (
              <p className="mt-2 font-mono text-sm text-plains-muted">
                Credits{" "}
                <span className="font-bold tabular-nums text-foreground">
                  {(profile as { credits: number }).credits.toLocaleString()}
                </span>
                <span className="block text-[10px] text-plains-muted/90">Seasonal · not purchasable</span>
              </p>
            )}
            {typeof (profile as { current_streak?: number })?.current_streak === "number" &&
              (profile as { current_streak: number }).current_streak > 0 && (
                <p className="mt-2 font-mono text-sm text-plains-muted">
                  Streak{" "}
                  <span className="font-bold text-plains-accent">
                    {(profile as { current_streak: number }).current_streak}
                  </span>{" "}
                  <span className="text-[10px]">(ELO bonus on wins at 3+ / 5+)</span>
                </p>
              )}
            <div className="mt-4">
              <RankProgress elo={profile?.elo ?? 1000} />
            </div>
            <p className="mt-4 font-mono text-xs text-plains-muted">
              Match record{" "}
              <span className="text-plains-accent">{winCount}</span>W /{" "}
              <span className="text-plains-danger">{lossCount}</span>L · {resolvedPreds.length} resolved
            </p>
          </div>
          <EloExplainPanel />
          <div className="rounded-xl border border-plains-border bg-plains-panel p-4">
            <p className="text-xs font-mono uppercase text-plains-muted">Active predictions</p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {active.length === 0 && <li className="text-plains-muted">None awaiting resolution.</li>}
              {active.map((r) => {
                const m = activeMarketById.get(r.market_id)!;
                return (
                  <li key={r.market_id}>
                    <Link href={`/markets/${m.id}`} className="hover:text-plains-accent line-clamp-2">
                      {m.title}
                    </Link>
                    <span className="block text-xs text-plains-muted">Locked: {r.chosen_option}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Portfolio</h1>
              <p className="text-sm text-plains-muted">Open markets you haven&apos;t played · blind picks only.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/portfolio"
                className={`rounded-md px-2 py-1 text-xs font-mono ${!validCat ? "bg-plains-accent/20 text-plains-accent" : "text-plains-muted"}`}
              >
                All
              </Link>
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/portfolio?category=${encodeURIComponent(c)}`}
                  className={`rounded-md px-2 py-1 text-xs font-mono ${
                    validCat === c ? "bg-plains-accent/20 text-plains-accent" : "text-plains-muted hover:text-foreground"
                  }`}
                >
                  {c.split("/")[0]}
                </Link>
              ))}
            </div>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {openList.length === 0 && (
              <li className="col-span-full rounded-xl border border-dashed border-plains-border p-8 text-center text-plains-muted">
                No open markets in this filter. Check back soon.
              </li>
            )}
            {openList.map((m) => {
              const s = deskStats.get(m.id);
              return (
                <li key={m.id}>
                  <MarketCard
                    market={m}
                    pickCount={s?.count ?? 0}
                    topOption={s?.topOption}
                    topPct={s?.topPct}
                    compact
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
