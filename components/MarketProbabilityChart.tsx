"use client";

import { useEffect, useMemo, useState } from "react";

type Point = {
  t: string;
  total_yes_credits: number;
  total_no_credits: number;
};

type Props = {
  marketId: string;
  optionA: string;
  optionB: string;
  colorA?: string;
  colorB?: string;
  /** Server-rendered initial series (optional). */
  initialPoints?: Point[];
  /** Implied probabilities from current pools (used when history is empty). */
  initialProbabilities?: { yes: number; no: number };
  pollMs?: number;
  className?: string;
  /** Taller chart + type scale for homepage trending card. */
  variant?: "default" | "hero";
};

function stepPath(
  pts: { x: number; y: number }[],
  w: number,
  h: number,
  pad: number,
): string {
  if (pts.length === 0) return "";
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const xDenom = Math.max(1, pts.length - 1);
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const px = pad + (innerW * pts[i].x) / xDenom;
    const py = pad + innerH * (1 - pts[i].y);
    if (i === 0) d += `M ${px} ${py}`;
    else {
      const prevX = pad + (innerW * pts[i - 1].x) / xDenom;
      d += ` L ${prevX} ${py} L ${px} ${py}`;
    }
  }
  return d;
}

export function MarketProbabilityChart({
  marketId,
  optionA,
  optionB,
  colorA = "#38bdf8",
  colorB = "#1d4ed8",
  initialPoints = [],
  initialProbabilities,
  pollMs = 12_000,
  className = "",
  variant = "default",
}: Props) {
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [liveProb, setLiveProb] = useState<{ yes: number; no: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/public/markets/${marketId}/history?limit=500`, { cache: "no-store" });
        const j = await res.json();
        if (cancelled || !j.points) return;
        setPoints(j.points as Point[]);
        if (j.totals) {
          setLiveProb({
            yes: j.totals.yes_probability,
            no: j.totals.no_probability,
          });
        }
      } catch {
        /* keep */
      }
    }
    void load();
    const id = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [marketId, pollMs]);

  const { seriesA, seriesB, lastA, lastB } = useMemo(() => {
    const list = points.length > 0 ? points : initialPoints;
    const a: { x: number; y: number }[] = [];
    const b: { x: number; y: number }[] = [];
    let la = 0.5;
    let lb = 0.5;
    if (list.length === 0 && initialProbabilities) {
      la = initialProbabilities.yes;
      lb = initialProbabilities.no;
      a.push({ x: 0, y: la });
      b.push({ x: 0, y: lb });
    } else {
      list.forEach((p, i) => {
        const ty = p.total_yes_credits;
        const tn = p.total_no_credits;
        const t = ty + tn;
        const pa = t > 0 ? ty / t : 0.5;
        const pb = t > 0 ? tn / t : 0.5;
        a.push({ x: i, y: pa });
        b.push({ x: i, y: pb });
        la = pa;
        lb = pb;
      });
    }
    if (liveProb) {
      la = liveProb.yes;
      lb = liveProb.no;
    }
    return { seriesA: a, seriesB: b, lastA: la, lastB: lb };
  }, [points, initialPoints, liveProb, initialProbabilities]);

  const w = 520;
  const h = variant === "hero" ? 260 : 200;
  const pad = variant === "hero" ? 14 : 12;
  const pathA = stepPath(seriesA, w, h, pad);
  const pathB = stepPath(seriesB, w, h, pad);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={`rounded-sm border border-plains-border/40 bg-white ${className}`}>
      <div
        className={`flex flex-wrap items-baseline justify-between gap-3 border-b border-plains-border/20 px-4 ${variant === "hero" ? "py-4" : "py-3"}`}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`rounded-full bg-sky-500 ${variant === "hero" ? "h-2.5 w-2.5" : "h-2 w-2"}`} aria-hidden />
          <p
            className={`font-headline font-black tabular-nums text-plains-void ${variant === "hero" ? "text-2xl sm:text-3xl" : "text-lg"}`}
          >
            {Math.round(lastA * 1000) / 10}%
            <span
              className={`ml-2 font-bold text-plains-muted ${variant === "hero" ? "text-base" : "text-sm"}`}
            >
              {optionA}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-baseline justify-end gap-2 text-right">
          <span className={`rounded-full bg-blue-800 ${variant === "hero" ? "h-2.5 w-2.5" : "h-2 w-2"}`} aria-hidden />
          <p
            className={`font-headline font-black tabular-nums text-plains-void ${variant === "hero" ? "text-2xl sm:text-3xl" : "text-lg"}`}
          >
            {Math.round(lastB * 1000) / 10}%
            <span
              className={`ml-2 font-bold text-plains-muted ${variant === "hero" ? "text-base" : "text-sm"}`}
            >
              {optionB}
            </span>
          </p>
        </div>
      </div>

      <div className="relative px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className={variant === "hero" ? "min-h-[220px] w-full sm:min-h-[260px]" : "h-48 w-full"}
          preserveAspectRatio="none"
          aria-label="Credit pool implied probability over time"
        >
          {yTicks.map((yt) => {
            const y = pad + (h - pad * 2) * (1 - yt);
            return (
              <g key={yt}>
                <line
                  x1={pad}
                  y1={y}
                  x2={w - pad}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 6"
                  className="text-plains-border/60"
                />
                <text x={w - pad + 2} y={y + 3} className="fill-plains-muted text-[9px] font-mono">
                  {Math.round(yt * 100)}%
                </text>
              </g>
            );
          })}
          {pathB && (
            <path d={pathB} fill="none" stroke={colorB} strokeWidth={2.2} vectorEffect="non-scaling-stroke" />
          )}
          {pathA && (
            <path d={pathA} fill="none" stroke={colorA} strokeWidth={2.2} vectorEffect="non-scaling-stroke" />
          )}
          {seriesA.length > 0 && (
            <circle
              cx={pad + ((w - pad * 2) * (seriesA.length - 1)) / Math.max(1, seriesA.length - 1)}
              cy={pad + (h - pad * 2) * (1 - lastA)}
              r={4}
              fill={colorA}
              className="drop-shadow-sm"
            />
          )}
          {seriesB.length > 0 && (
            <circle
              cx={pad + ((w - pad * 2) * (seriesB.length - 1)) / Math.max(1, seriesB.length - 1)}
              cy={pad + (h - pad * 2) * (1 - lastB)}
              r={4}
              fill={colorB}
              className="drop-shadow-sm"
            />
          )}
        </svg>
        <p className="px-2 pb-2 font-mono text-[9px] text-plains-muted">
          Implied probability from credit pools — not real money; resets each season.
        </p>
      </div>
    </div>
  );
}
