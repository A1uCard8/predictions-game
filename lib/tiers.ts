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
  color: string;
};

export const TIERS: TierInfo[] = [
  { id: "bronze", label: "Bronze", min: 0, max: 999, color: "#b87333" },
  { id: "silver", label: "Silver", min: 1000, max: 1199, color: "#c0c0c0" },
  { id: "gold", label: "Gold", min: 1200, max: 1499, color: "#f5c542" },
  { id: "platinum", label: "Platinum", min: 1500, max: 1799, color: "#67e8f9" },
  { id: "diamond", label: "Diamond", min: 1800, max: 2099, color: "#a78bfa" },
  { id: "master", label: "Master", min: 2100, max: 2399, color: "#fb7185" },
  { id: "grandmaster", label: "Grandmaster", min: 2400, max: null, color: "#8ACC16" },
];

export function tierForElo(elo: number, globalRank?: number | null): TierInfo {
  if (globalRank != null && globalRank > 0 && globalRank <= 500) {
    return {
      id: "top500",
      label: "Top 500",
      min: elo,
      max: null,
      color: "#ffd700",
    };
  }
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    const cap = t.max ?? Infinity;
    if (elo >= t.min && elo <= cap) return t;
  }
  return TIERS[0];
}
