import Image from "next/image";
import Link from "next/link";
import type { LeaderRow } from "@/lib/leaderboard";
import { TierBadge } from "./TierBadge";

export function LeaderboardMeCard({
  row,
  globalRank,
}: {
  row: LeaderRow;
  globalRank: number;
}) {
  return (
    <div className="rounded-xl border border-plains-border bg-gradient-to-br from-plains-panel to-plains-mist/80 p-4 shadow-sm">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-plains-muted">You</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-plains-border bg-plains-containerHigh">
          {row.avatar_url ? (
            row.avatar_url.includes("supabase.co") ? (
              <Image src={row.avatar_url} alt="" fill className="object-cover" sizes="44px" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatar_url} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-plains-muted">
              {row.username.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${encodeURIComponent(row.username)}`}
            className="truncate font-headline text-sm font-bold text-plains-void hover:text-plains-primaryHi"
          >
            {row.username}
          </Link>
          <div className="mt-1">
            <TierBadge elo={row.elo} globalRank={globalRank} compact />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-plains-border/40 pt-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-plains-muted">Global</p>
          <p className="font-headline text-2xl font-black tabular-nums text-plains-primary">#{globalRank}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-wider text-plains-muted">ELO</p>
          <p className="font-headline text-xl font-bold tabular-nums text-plains-void">{row.elo}</p>
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] text-plains-muted">
        {row.winPct}% win · {row.total} resolved
      </p>
    </div>
  );
}
