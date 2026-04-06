import Image from "next/image";
import Link from "next/link";
import type { MarketRow } from "@/lib/types";
import { formatTimeRemaining, marketImageUrl } from "@/lib/market-display";

type Props = {
  market: MarketRow;
  pickCount?: number;
  topOption?: string | null;
  topPct?: number | null;
  compact?: boolean;
};

export function MarketCard({ market, pickCount = 0, topOption, topPct, compact }: Props) {
  const img = marketImageUrl(market);
  const timeLeft = formatTimeRemaining(market.close_date);
  const showCrowd = topPct != null && topOption && market.status === "open";

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-plains-border/80 bg-white shadow-[0_1px_0_rgba(15,20,25,0.03),0_12px_32px_-16px_rgba(15,20,25,0.08)] ring-1 ring-black/[0.02] transition-all hover:border-plains-accent/40 hover:shadow-lg active:scale-[0.995]"
    >
      <div
        className={`relative w-full overflow-hidden bg-plains-mist ${compact ? "h-28" : "h-36 sm:h-40"}`}
      >
        {img ? (
          img.includes("supabase.co") ? (
            <Image
              src={img}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width:640px) 100vw, 400px"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-plains-mist via-white to-plains-heaven">
            <span className="font-mono text-4xl font-bold text-plains-accent/30" aria-hidden>
              ?
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-plains-void/75 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
          {market.category}
        </div>
        {market.status === "open" && (
          <div className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-plains-void shadow-sm">
            {timeLeft}
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
        <h3
          className={`font-semibold leading-snug text-plains-void group-hover:text-plains-accentDim ${compact ? "line-clamp-2 text-sm" : "line-clamp-2 text-base"}`}
        >
          {market.title}
        </h3>
        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm text-plains-muted">{market.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          {showCrowd ? (
            <span className="font-mono text-xs text-plains-muted">
              Crowd lean: <span className="text-foreground">{topPct}%</span>{" "}
              <span className="text-plains-muted">{topOption}</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-plains-muted">
              {pickCount > 0 ? `${pickCount} picks` : "Be first to predict"}
            </span>
          )}
          <span className="rounded-md border border-plains-border bg-plains-mist/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-plains-muted transition group-hover:border-plains-accent/30">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
