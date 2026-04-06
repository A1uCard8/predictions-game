import { ladderProgress } from "@/lib/tiers";

export function RankProgress({ elo }: { elo: number }) {
  const { current, next, progressToNext } = ladderProgress(elo);

  return (
    <div className="rounded-xl border border-plains-border bg-plains-mist/50 p-4">
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-plains-muted">
        <span style={{ color: current.color }}>{current.label}</span>
        {next ? <span className="text-foreground/80">→ {next.label}</span> : <span>Peak tier</span>}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-plains-border/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-plains-accentDim to-plains-accent transition-all duration-500"
          style={{ width: `${Math.round(progressToNext * 100)}%` }}
        />
      </div>
      {next && (
        <p className="mt-2 font-mono text-[11px] text-plains-muted">
          {Math.round(progressToNext * 100)}% toward {next.label} ({next.min} ELO)
        </p>
      )}
    </div>
  );
}
