import { tierForElo, type TierInfo } from "@/lib/tiers";

export function TierBadge({
  elo,
  globalRank,
  compact,
}: {
  elo: number;
  globalRank?: number | null;
  compact?: boolean;
}) {
  const t: TierInfo = tierForElo(elo, globalRank);
  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-semibold ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
      style={{
        borderColor: t.color,
        color: t.color,
        backgroundColor: `${t.color}14`,
      }}
    >
      {t.label}
    </span>
  );
}
