import type { CSSProperties } from "react";

export type TierId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "grandmaster"
  | "top500";

export type TierInfo = {
  id: TierId;
  label: string;
  min: number;
  max: number | null;
  /** Solid fallback (borders, SVG, non-gradient UIs) */
  color: string;
  /** Full CSS linear-gradient for badge / labels (Grandmaster, Top 500) */
  gradient?: string;
};

/** Hero-style spectrum: electric green → blue → purple → pink → orange → cyan → green */
export const GRANDMASTER_GRADIENT =
  "linear-gradient(90deg, #00ffb3 0%, #00a8ff 14%, #6366f1 28%, #a855f7 40%, #ec4899 50%, #fb923c 62%, #fbbf24 72%, #22d3ee 86%, #00ffb3 100%)";

/** Sunset into gold */
export const TOP500_GRADIENT =
  "linear-gradient(90deg, #7f1d1d 0%, #c2410c 18%, #ea580c 36%, #fb923c 52%, #fbbf24 68%, #fde047 84%, #fef9c3 100%)";

/** Base Top 500 tier (ELO threshold copied from `min` in `tierForElo` when applicable) */
export const TOP500_TIER_BASE: TierInfo = {
  id: "top500",
  label: "Top 500",
  min: 0,
  max: null,
  color: "#f59e0b",
  gradient: TOP500_GRADIENT,
};

export const TIERS: TierInfo[] = [
  { id: "bronze", label: "Bronze", min: 0, max: 999, color: "#b87333" },
  { id: "silver", label: "Silver", min: 1000, max: 1199, color: "#c0c0c0" },
  { id: "gold", label: "Gold", min: 1200, max: 1499, color: "#f5c542" },
  { id: "platinum", label: "Platinum", min: 1500, max: 1799, color: "#67e8f9" },
  { id: "diamond", label: "Diamond", min: 1800, max: 2099, color: "#a78bfa" },
  { id: "master", label: "Master", min: 2100, max: 2399, color: "#fb7185" },
  {
    id: "grandmaster",
    label: "Grandmaster",
    min: 2400,
    max: null,
    color: "#6366f1",
    gradient: GRANDMASTER_GRADIENT,
  },
];

/** Text clipped to tier gradient, or solid color */
export function tierLabelStyle(t: TierInfo): CSSProperties {
  if (t.gradient) {
    return {
      backgroundImage: t.gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }
  return { color: t.color };
}

export function tierForElo(elo: number, globalRank?: number | null): TierInfo {
  if (globalRank != null && globalRank > 0 && globalRank <= 500) {
    return { ...TOP500_TIER_BASE, min: elo };
  }
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    const cap = t.max ?? Infinity;
    if (elo >= t.min && elo <= cap) return t;
  }
  return TIERS[0];
}

/**
 * Progress toward the next rank tier (League-style ladder).
 * Top 500 badge is cosmetic; the bar uses raw ELO vs fixed tier thresholds.
 */
export function ladderProgress(elo: number): {
  current: TierInfo;
  next: TierInfo | null;
  progressToNext: number;
} {
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    const cap = t.max ?? Infinity;
    if (elo >= t.min && elo <= cap) {
      idx = i;
      break;
    }
  }
  const current = TIERS[idx];
  const next = idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  if (!next) return { current, next: null, progressToNext: 1 };
  const span = next.min - current.min;
  const progressToNext = span <= 0 ? 1 : Math.min(1, Math.max(0, (elo - current.min) / span));
  return { current, next, progressToNext };
}
