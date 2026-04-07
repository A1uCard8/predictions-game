import Image from "next/image";
import Link from "next/link";
import type { LeaderRow } from "@/lib/leaderboard";
import { TierBadge } from "./TierBadge";

type Props = {
  rows: LeaderRow[];
  highlightUserId?: string | null;
  globalRanks?: Map<string, number>;
};

export function LeaderboardTable({ rows, highlightUserId, globalRanks }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-plains-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-plains-border bg-plains-panel/80 font-mono text-xs uppercase tracking-wider text-plains-muted">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3 text-right">ELO</th>
            <th className="px-4 py-3 text-right">Win %</th>
            <th className="px-4 py-3 text-right">Contrarian</th>
            <th className="px-4 py-3 text-right">Streak</th>
            <th className="px-4 py-3 text-right">Predictions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isMe = highlightUserId && r.user_id === highlightUserId;
            const gr = globalRanks?.get(r.user_id);
            return (
              <tr
                key={r.user_id}
                className={`border-b border-plains-border/60 transition-colors hover:bg-plains-mist/80 ${
                  isMe ? "bg-plains-accent/10" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ${
                      r.rank === 1
                        ? "bg-amber-100 text-amber-900"
                        : r.rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : r.rank === 3
                            ? "bg-orange-100 text-orange-950"
                            : "text-plains-muted"
                    }`}
                  >
                    #{r.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/profile/${encodeURIComponent(r.username)}`}
                    className="flex items-center gap-3 hover:text-plains-accent"
                  >
                    <span className="relative h-9 w-9 overflow-hidden rounded-full border border-plains-border bg-plains-panel">
                      {r.avatar_url ? (
                        <Image
                          src={r.avatar_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-plains-muted">
                          {r.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="font-medium">{r.username}</span>
                    {isMe && (
                      <span className="rounded bg-plains-accent/20 px-1.5 py-0.5 text-[10px] font-mono text-plains-accent">
                        You
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <TierBadge elo={r.elo} globalRank={gr ?? null} compact />
                </td>
                <td className="px-4 py-3 text-right font-mono text-plains-accent">{r.elo}</td>
                <td className="px-4 py-3 text-right font-mono">{r.winPct}%</td>
                <td className="px-4 py-3 text-right font-mono text-plains-muted">
                  {r.contrarianWinPct != null ? `${r.contrarianWinPct}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-plains-muted">
                  {r.currentStreak != null ? r.currentStreak : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-plains-muted">{r.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-8 text-center text-plains-muted">No players yet. Be the first.</p>
      )}
    </div>
  );
}
