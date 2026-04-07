import { tierForElo, tierLabelStyle, type TierInfo } from "@/lib/tiers";
import { TierIcon } from "./TierIcon";

function TierLabel({ t, children }: { t: TierInfo; children: React.ReactNode }) {
  return (
    <span className="font-bold" style={tierLabelStyle(t)}>
      {children}
    </span>
  );
}

export function TierBadge({
  elo,
  globalRank,
  compact,
}: {
  elo: number;
  globalRank?: number | null;
  compact?: boolean;
}) {
  const t = tierForElo(elo, globalRank);
  const pad = compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  const body = (
    <>
      <TierIcon id={t.id} />
      <TierLabel t={t}>{t.label}</TierLabel>
    </>
  );

  if (t.gradient) {
    return (
      <span className="inline-block rounded p-[2px]" style={{ background: t.gradient }}>
        <span
          className={`inline-flex items-center gap-1 rounded bg-plains-panel font-mono font-semibold ${pad}`}
        >
          {body}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-mono font-semibold ${pad}`}
      style={{
        borderColor: t.color,
        color: t.color,
        backgroundColor: `${t.color}14`,
      }}
    >
      {body}
    </span>
  );
}
