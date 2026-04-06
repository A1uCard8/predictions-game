"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketRow } from "@/lib/types";
import { formatTimeRemaining, marketImageUrl } from "@/lib/market-display";

type Pulse = {
  counts: Record<string, number>;
  total: number;
  countsApproximate?: boolean;
  recent: { option: string; at: string }[];
};

export function HomeSpotlight({
  market,
  options,
  initialPulse,
}: {
  market: MarketRow;
  options: string[];
  initialPulse: Pulse | null;
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

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-plains-border/70 bg-white/88 shadow-[0_1px_0_rgba(15,20,25,0.04),0_20px_50px_-20px_rgba(15,20,25,0.1)] backdrop-blur-xl ring-1 ring-black/[0.03]">
      <div className="relative aspect-[21/9] max-h-48 w-full bg-plains-mist sm:aspect-[2.4/1] sm:max-h-56">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-plains-heaven to-white">
            <span className="font-mono text-5xl font-bold text-plains-accent/25">?</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plains-void/85 to-transparent px-4 pb-3 pt-16">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/80">{market.category}</span>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold text-white sm:text-xl">{market.title}</h2>
        </div>
        {market.status === "open" && (
          <span className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 font-mono text-[10px] font-semibold text-plains-void shadow">
            {timeLeft}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-plains-muted">Live picks</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-plains-void">
            {total.toLocaleString()}
            <span className="text-sm font-normal text-plains-muted"> locked</span>
          </p>
          {pulse?.countsApproximate ? (
            <p className="mt-1 text-[10px] text-plains-muted">Bar mix from recent activity sample.</p>
          ) : null}
        </div>

        <ul className="space-y-3">
          {options.map((opt) => {
            const c = counts[opt] ?? 0;
            const pct = denom > 0 ? Math.round((c / denom) * 1000) / 10 : 0;
            return (
              <li key={opt}>
                <div className="flex justify-between font-mono text-xs">
                  <span className="font-semibold text-plains-void">{opt}</span>
                  <span className="text-plains-muted">
                    {pct}% <span className="text-plains-muted/80">({c})</span>
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-plains-border/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-plains-accentDim to-plains-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Recent</p>
          <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {(pulse?.recent ?? []).length === 0 && (
              <span className="text-xs text-plains-muted">Waiting for picks…</span>
            )}
            {(pulse?.recent ?? []).map((r, i) => (
              <span
                key={`${r.at}-${i}`}
                className="rounded-md border border-plains-border bg-plains-mist/80 px-2 py-0.5 font-mono text-[10px] text-plains-void"
              >
                {r.option}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/markets/${market.id}`}
          className="btn-primary mt-auto w-full rounded-xl py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
        >
          Trade this market →
        </Link>
      </div>
    </div>
  );
}
