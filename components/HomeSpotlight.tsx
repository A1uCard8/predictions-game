"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HistoryPoint } from "@/lib/market-history";
import type { MarketRow } from "@/lib/types";
import { formatTimeRemaining, marketImageUrl } from "@/lib/market-display";
import { MarketProbabilityChart } from "./MarketProbabilityChart";

type Pulse = {
  counts: Record<string, number>;
  total: number;
  countsApproximate?: boolean;
  recent: { option: string; at: string }[];
};

const dotColors = [
  "bg-sky-400",
  "bg-blue-700",
  "bg-amber-400",
  "bg-orange-500",
  "bg-violet-500",
  "bg-emerald-500",
];

function optionBarClass(option: string, i: number): string {
  const o = option.trim().toLowerCase();
  if (o === "yes" || o === "y")
    return "bg-gradient-to-r from-plains-primary to-plains-primaryHi";
  if (o === "no" || o === "n") return "bg-plains-secondary/90";
  return i % 2 === 0
    ? "bg-gradient-to-r from-plains-primary/80 to-plains-primaryHi/90"
    : "bg-plains-secondary/75";
}

export function HomeSpotlight({
  market,
  options,
  initialPulse,
  creditHistory,
}: {
  market: MarketRow;
  options: string[];
  initialPulse: Pulse | null;
  creditHistory?: { points: HistoryPoint[]; yes: number; no: number } | null;
}) {
  const [pulse, setPulse] = useState<Pulse | null>(initialPulse);
  const img = marketImageUrl(market);
  const timeLeft = formatTimeRemaining(market.close_date);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/public/markets/${market.id}/pulse`, { cache: "no-store" });
        const j = await res.json();
        if (!cancelled && j.counts) setPulse(j);
      } catch {
        /* keep */
      }
    }
    void tick();
    const id = setInterval(tick, 8_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [market.id]);

  const total = pulse?.total ?? 0;
  const counts = pulse?.counts ?? {};
  const distSum = options.reduce((s, opt) => s + (counts[opt] ?? 0), 0);
  const denom =
    pulse?.countsApproximate && distSum > 0 ? distSum : Math.max(total, distSum, 1);

  const yesNo = options.length === 2;
  const ty = creditHistory?.yes ?? 0;
  const tn = creditHistory?.no ?? 0;
  const poolTotal = ty + tn;

  function pickStatsPct(opts: string[], c: Record<string, number>, d: number): number {
    if (d <= 0 || !opts.length) return 0;
    let max = 0;
    for (const o of opts) max = Math.max(max, c[o] ?? 0);
    return Math.round(((max / d) * 1000) / 10);
  }

  const yesOption = options.find((o) => /^yes$/i.test(o.trim()));
  const yesShare =
    yesOption && denom > 0 ? Math.round((((counts[yesOption] ?? 0) / denom) * 1000) / 10) : null;
  const topLeanPct = yesShare != null ? yesShare : pickStatsPct(options, counts, denom);

  return (
    <article className="overflow-hidden rounded-2xl border border-plains-border/50 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)]">
      {/* Header — Polymarket-style */}
      <div className="flex flex-wrap items-start gap-4 border-b border-plains-border/15 p-4 sm:p-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-plains-container sm:h-16 sm:w-16">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center font-mono text-lg text-plains-primary/25">?</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-plains-muted">
            Trending · {market.category}
          </p>
          <h2 className="font-headline mt-1 text-lg font-bold leading-snug tracking-tight text-plains-void sm:text-xl">
            {market.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-plains-muted">
            {market.status === "open" && <span className="font-semibold text-plains-primary">{timeLeft}</span>}
            {yesNo && poolTotal > 0 && (
              <span className="tabular-nums">{poolTotal.toLocaleString()} credits in pool</span>
            )}
            <span className="tabular-nums">{total.toLocaleString()} picks</span>
          </div>
        </div>
        <Link
          href={`/markets/${market.id}`}
          className="btn-primary shrink-0 px-5 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider sm:py-3"
        >
          Open
        </Link>
      </div>

      {/* Hero chart — Kalshi / Polymarket focal */}
      {yesNo && market.status === "open" && (
        <div className="border-b border-plains-border/10 bg-white px-2 py-3 sm:px-4 sm:py-4">
          <MarketProbabilityChart
            marketId={market.id}
            optionA={options[0]}
            optionB={options[1]}
            initialPoints={creditHistory?.points ?? []}
            initialProbabilities={{
              yes: poolTotal > 0 ? ty / poolTotal : 0.5,
              no: poolTotal > 0 ? tn / poolTotal : 0.5,
            }}
            className="border-0 shadow-none"
            variant="hero"
          />
        </div>
      )}

      {!yesNo && market.status === "open" && (
        <div className="border-b border-plains-border/10 px-5 py-8 text-center">
          <p className="font-headline text-4xl font-black tabular-nums text-plains-primary">{topLeanPct}%</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-plains-muted">Top lean · pick share</p>
        </div>
      )}

      <div className="grid gap-px bg-plains-border/15 sm:grid-cols-2">
        <div className="bg-white p-4 sm:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">Outcomes</p>
          <ul className="mt-3 space-y-2.5">
            {options.slice(0, 6).map((opt, i) => {
              const c = counts[opt] ?? 0;
              const pct = denom > 0 ? Math.round((c / denom) * 1000) / 10 : 0;
              return (
                <li key={opt} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotColors[i % dotColors.length]}`} aria-hidden />
                    <span className="truncate font-headline text-sm font-bold text-plains-void">{opt}</span>
                  </span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-plains-void">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">Depth</p>
          <ul className="mt-3 space-y-2">
            {options.map((opt, i) => {
              const c = counts[opt] ?? 0;
              const pct = denom > 0 ? Math.round((c / denom) * 1000) / 10 : 0;
              return (
                <li key={opt}>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="truncate text-plains-void">{opt}</span>
                    <span className="text-plains-muted">{c}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-plains-containerHigh">
                    <div
                      className={`h-full rounded-full ${optionBarClass(opt, i)}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {pulse?.countsApproximate ? (
        <p className="border-t border-plains-border/10 px-4 py-2 font-mono text-[9px] text-plains-muted">
          Distribution may be sampled from recent activity.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-plains-border/10 px-4 py-3 sm:px-5">
        <p className="font-mono text-[10px] text-plains-muted">
          Ends {new Date(market.close_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-plains-muted">Plains</span>
      </div>
    </article>
  );
}
