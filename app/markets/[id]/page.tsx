import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketPredictForm } from "@/components/MarketPredictForm";
import { MarketProbabilityChart } from "@/components/MarketProbabilityChart";
import { isBinaryMarket } from "@/lib/betting";
import { getMarketHistoryBootstrap } from "@/lib/market-history";
import { batchMarketPickStats } from "@/lib/market-stats";
import { marketImageUrl, marketResolutionCriteria, formatTimeRemaining } from "@/lib/market-display";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MarketRow } from "@/lib/types";

type ActivityRow = {
  created_at: string;
  chosen_option: string;
  username: string;
};

function formatPickCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default async function MarketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: market } = await supabase.from("markets").select("*").eq("id", params.id).single();

  if (!market) notFound();

  const m = market as MarketRow;
  const options = m.options as string[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let chosen: string | null = null;
  let creditsBalance = 0;
  if (user) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("chosen_option")
      .eq("market_id", m.id)
      .eq("user_id", user.id)
      .maybeSingle();
    chosen = pred?.chosen_option ?? null;

    const { data: urow } = await supabase.from("users").select("credits").eq("id", user.id).maybeSingle();
    if (typeof urow?.credits === "number") creditsBalance = urow.credits;
  }

  const closedByTime = Date.now() >= new Date(m.close_date).getTime();
  const canPredict = !!user && m.status === "open" && !closedByTime && !chosen;

  let activity: ActivityRow[] = [];
  let pickStats = { count: 0, topOption: null as string | null, topPct: null as number | null };
  const dist: { option: string; pct: number; count: number }[] = [];

  try {
    const admin = createAdminClient();
    pickStats = (await batchMarketPickStats(admin, [m.id])).get(m.id) ?? pickStats;

    const { data: allChoices } = await admin.from("predictions").select("chosen_option").eq("market_id", m.id);

    const { data: preds } = await admin
      .from("predictions")
      .select("created_at, chosen_option, user_id")
      .eq("market_id", m.id)
      .order("created_at", { ascending: false })
      .limit(40);

    const userIds = Array.from(new Set((preds ?? []).map((p) => p.user_id as string)));
    let userMap = new Map<string, string>();
    if (userIds.length) {
      const { data: users } = await admin.from("users").select("id, username").in("id", userIds);
      userMap = new Map((users ?? []).map((u) => [u.id as string, u.username as string]));
    }

    activity = (preds ?? []).map((p) => ({
      created_at: p.created_at as string,
      chosen_option: p.chosen_option as string,
      username: userMap.get(p.user_id as string) ?? "player",
    }));

    const byOpt = new Map<string, number>();
    for (const o of options) byOpt.set(o, 0);
    for (const p of allChoices ?? []) {
      const k = p.chosen_option as string;
      byOpt.set(k, (byOpt.get(k) ?? 0) + 1);
    }
    const total = Math.max(pickStats.count, (allChoices ?? []).length);
    for (const o of options) {
      const c = byOpt.get(o) ?? 0;
      dist.push({
        option: o,
        count: c,
        pct: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
      });
    }
  } catch {
    activity = [];
  }

  const binary = isBinaryMarket(options);
  const ty = Number(m.total_yes_credits ?? 0);
  const tn = Number(m.total_no_credits ?? 0);
  let historyBoot: Awaited<ReturnType<typeof getMarketHistoryBootstrap>> | null = null;
  if (binary) {
    try {
      const admin = createAdminClient();
      historyBoot = await getMarketHistoryBootstrap(admin, m.id);
    } catch {
      historyBoot = null;
    }
  }
  const poolTotal = ty + tn;
  const yesProbBoot = poolTotal > 0 ? ty / poolTotal : 0.5;
  const noProbBoot = poolTotal > 0 ? tn / poolTotal : 0.5;

  const criteria = marketResolutionCriteria(m);
  const img = marketImageUrl(m);
  const timeLeft = formatTimeRemaining(m.close_date);

  const yesOpt = options.find((o) => /^yes$/i.test(o.trim()));
  const chancePct =
    binary && poolTotal > 0
      ? Math.round(yesProbBoot * 1000) / 10
      : yesOpt && pickStats.count > 0
        ? dist.find((d) => d.option === yesOpt)?.pct ?? null
        : options.length === 2
          ? dist[0]?.pct ?? null
          : pickStats.topPct;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap gap-4 font-mono text-[10px] font-bold uppercase tracking-wide text-plains-muted">
        <Link href="/markets" className="transition hover:text-plains-primaryHi">
          ← Markets
        </Link>
        <span className="text-plains-border">/</span>
        <span className="truncate text-plains-outline">{m.category}</span>
        {user ? (
          <Link href="/portfolio" className="ml-auto transition hover:text-plains-primaryHi">
            Portfolio
          </Link>
        ) : null}
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-plains-border bg-plains-container sm:h-20 sm:w-20">
              {img ? (
                img.includes("supabase.co") ? (
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" priority />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-2xl text-plains-primary/20">?</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-muted">
                {m.category} · {m.status}
                {m.status === "open" && (
                  <>
                    {" "}
                    · <span className="text-plains-primary">{timeLeft}</span>
                  </>
                )}
              </p>
              <h1 className="font-headline mt-2 text-2xl font-bold leading-tight tracking-tight text-plains-void sm:text-3xl">
                {m.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-plains-muted">{m.description}</p>
            </div>
          </div>

          {binary && m.status === "open" && (
            <section className="overflow-hidden rounded-xl border border-plains-border/50 bg-white shadow-sm">
              <MarketProbabilityChart
                marketId={m.id}
                optionA={options[0]}
                optionB={options[1]}
                initialPoints={historyBoot?.points ?? []}
                initialProbabilities={{ yes: yesProbBoot, no: noProbBoot }}
              />
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-plains-border bg-plains-panel p-5">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">
                Resolution
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-plains-muted">{criteria}</p>
              {m.status === "resolved" && m.correct_option && (
                <p className="mt-4 rounded-md bg-plains-primary/10 px-3 py-2 font-mono text-sm font-bold text-plains-primary">
                  Outcome: {m.correct_option}
                </p>
              )}
            </section>
            <section className="rounded-xl border border-plains-border bg-plains-panel p-5">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">Timeline</h2>
              <ul className="mt-3 space-y-2 text-sm text-plains-muted">
                <li>
                  <span className="font-mono text-[9px] uppercase text-plains-outline">Closes</span>{" "}
                  {new Date(m.close_date).toLocaleString()}
                </li>
                <li>
                  <span className="font-mono text-[9px] uppercase text-plains-outline">Resolves</span>{" "}
                  {new Date(m.resolution_date).toLocaleString()}
                </li>
              </ul>
            </section>
          </div>

          {m.status === "open" && pickStats.count > 0 && (
            <section className="rounded-xl border border-plains-border bg-plains-panel p-5">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">
                Pick distribution
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 font-mono text-xs">
                  {dist
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((row, i) => (
                      <div
                        key={row.option}
                        className={`flex justify-between ${i === 0 ? "font-bold text-plains-primary" : "text-plains-secondary/90"}`}
                      >
                        <span className="truncate pr-2">{row.option}</span>
                        <span>{formatPickCount(row.count)}</span>
                      </div>
                    ))}
                </div>
                <ul className="space-y-2">
                  {dist.map((row, i) => (
                    <li key={row.option}>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="font-medium text-plains-void">{row.option}</span>
                        <span className="text-plains-muted">{row.pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-plains-containerHigh">
                        <div
                          className={`h-full rounded-full ${
                            i % 2 === 0
                              ? "bg-gradient-to-r from-plains-primary/80 to-plains-primaryHi"
                              : "bg-plains-secondary/70"
                          }`}
                          style={{ width: `${Math.min(100, row.pct)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-plains-border bg-plains-panel p-5">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">Activity</h2>
            <ul className="mt-3 max-h-64 space-y-[1px] overflow-y-auto">
              {activity.length === 0 && (
                <li className="py-4 text-center text-sm text-plains-muted">No picks yet.</li>
              )}
              {activity.map((a, i) => (
                <li
                  key={`${a.created_at}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-plains-border/10 py-2 text-sm last:border-0"
                >
                  <span className="font-headline font-bold text-plains-void">{a.username}</span>
                  <span className="text-plains-muted">
                    → <span className="text-plains-void">{a.chosen_option}</span>
                  </span>
                  <span className="w-full font-mono text-[9px] text-plains-muted sm:w-auto">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="mt-8 space-y-4 lg:sticky lg:top-24 lg:mt-0">
          <div className="rounded-xl border border-plains-border bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4 border-b border-plains-border/15 pb-4">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-plains-muted">Chance</p>
                <p className="font-headline mt-1 text-2xl font-black tabular-nums text-plains-primary">
                  {chancePct != null ? `${chancePct}%` : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-plains-muted">Pool</p>
                <p className="font-headline mt-1 text-xl font-bold tabular-nums text-plains-void">
                  {poolTotal > 0 ? `${poolTotal.toLocaleString()} CR` : "—"}
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-plains-muted">Credits staked</p>
              </div>
            </div>
            <div className="pt-4">
              {!user && (
                <p className="text-sm text-plains-muted">
                  <Link href="/login" className="font-bold text-plains-primaryHi hover:underline">
                    Log in
                  </Link>{" "}
                  to lock a pick.
                </p>
              )}
              {user && m.status !== "open" && (
                <p className="text-sm text-plains-muted">This market is closed to new picks.</p>
              )}
              {user && closedByTime && m.status === "open" && !chosen && (
                <p className="text-sm font-medium text-plains-danger">Close date passed — no new picks.</p>
              )}
              {user && (canPredict || chosen) && (
                <MarketPredictForm
                  marketId={m.id}
                  options={options}
                  locked={!!chosen || !canPredict}
                  chosen={chosen}
                  creditsBalance={creditsBalance}
                  totalYesCredits={ty}
                  totalNoCredits={tn}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
