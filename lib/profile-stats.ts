/**
 * Profile analytics: Sharpe-style ratio on per-market ELO deltas (not financial advice).
 * p = sample mean / sample stdev of elo_change on resolved picks.
 */

export function netEloDelta(eloChanges: number[]): number {
  return eloChanges.reduce((a, b) => a + b, 0);
}

/** Sharpe-like: mean(elo_delta) / stdev(elo_delta). Null if &lt;2 samples or zero variance. */
export function eloSharpeRatio(eloChanges: number[]): number | null {
  const xs = eloChanges.filter((x) => typeof x === "number" && !Number.isNaN(x));
  if (xs.length < 2) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v =
    xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length > 1 ? xs.length - 1 : 1);
  const std = Math.sqrt(v);
  if (std < 1e-9) return null;
  return Math.round((mean / std) * 100) / 100;
}

export type ProfileBadge = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

export function deriveProfileBadges(input: {
  currentStreak: number;
  wins: number;
  resolved: number;
  winPct: number;
  globalRank: number | null;
  contrarianWins: number;
}): ProfileBadge[] {
  const out: ProfileBadge[] = [];
  if (input.currentStreak >= 5) {
    out.push({
      id: "streak",
      title: "Hot hand",
      subtitle: `${input.currentStreak} streak`,
      icon: "⚡",
    });
  }
  if (input.wins >= 10) {
    out.push({ id: "ten-w", title: "Double digits", subtitle: "10+ correct", icon: "✓" });
  }
  if (input.globalRank != null && input.globalRank <= 500) {
    out.push({ id: "top500", title: "Top 500", subtitle: "Global ladder", icon: "◆" });
  }
  if (input.winPct >= 60 && input.resolved >= 5) {
    out.push({ id: "sharp", title: "Sharpshooter", subtitle: "60%+ resolved", icon: "◎" });
  }
  if (input.contrarianWins >= 5) {
    out.push({
      id: "contrarian",
      title: "Against the crowd",
      subtitle: "5+ minority wins",
      icon: "⌁",
    });
  }
  if (input.resolved >= 25) {
    out.push({ id: "volume", title: "Battle-tested", subtitle: "25+ resolved", icon: "◇" });
  }
  return out;
}
