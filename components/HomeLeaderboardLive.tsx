"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = { username: string; avatar_url: string | null; elo: number };

export function HomeLeaderboardLive({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/public/leaderboard/top?limit=10", { cache: "no-store" });
        const j = await res.json();
        if (!cancelled && Array.isArray(j.rows)) setRows(j.rows);
      } catch {
        /* keep last */
      }
    }
    const id = setInterval(tick, 12_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-plains-mist p-4 shadow-stitch transition-colors hover:bg-plains-panel sm:p-5">
      <div className="flex items-center justify-between border-b border-plains-border/15 pb-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-plains-secondary">Global top 10</p>
        <Link
          href="/leaderboard"
          className="font-mono text-[10px] font-bold tracking-tight text-plains-muted transition hover:text-plains-primaryHi"
        >
          Full ladder →
        </Link>
      </div>
      <ul className="mt-3 flex-1 space-y-[1px] bg-plains-border/10">
        {rows.length === 0 && (
          <li className="bg-plains-mist py-6 text-center text-sm text-plains-muted">No players yet — be first.</li>
        )}
        {rows.map((row, i) => (
          <li
            key={`${row.username}-${i}`}
            className="flex items-center gap-3 bg-plains-mist px-3 py-2.5 transition hover:bg-plains-panel"
          >
            <span className="w-6 font-mono text-[10px] font-bold text-plains-muted">#{i + 1}</span>
            <div className="relative h-8 w-8 shrink-0 overflow-hidden bg-plains-containerHigh">
              {row.avatar_url ? (
                row.avatar_url.includes("supabase.co") ? (
                  <Image src={row.avatar_url} alt="" fill className="object-cover" sizes="32px" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.avatar_url} alt="" className="h-full w-full object-cover" />
                )
              ) : (
                <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-bold text-plains-muted">
                  {row.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <Link
              href={`/profile/${encodeURIComponent(row.username)}`}
              className="min-w-0 flex-1 truncate font-headline text-sm font-bold tracking-tight text-plains-void hover:text-plains-primaryHi"
            >
              {row.username}
            </Link>
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-plains-secondary">{row.elo}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center font-mono text-[10px] text-plains-muted">Updates every ~12s</p>
    </div>
  );
}
