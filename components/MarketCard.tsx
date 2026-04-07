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

/** Decorative mini-bars: height hints from crowd lean (not a financial chart). */
function CrowdSpark({ pct }: { pct: number }) {
  const p = Math.min(100, Math.max(0, pct));
  const h = [0.2, 0.35, 0.3, 0.45, 0.6, 0.55, 0.85].map((base) => Math.min(1, base * (0.5 + p / 100)));
  return (
    <div className="flex h-12 w-full items-end gap-0.5">
      {h.map((rel, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-plains-primary/30 to-plains-primaryHi"
          style={{ height: `${rel * 100}%`, opacity: 0.35 + (i / h.length) * 0.5 }}
        />
      ))}
    </div>
  );
}

export function MarketCard({ market, pickCount = 0, topOption, topPct, compact }: Props) {
  const img = marketImageUrl(market);
  const timeLeft = formatTimeRemaining(market.close_date);
  const showCrowd = topPct != null && topOption && market.status === "open";

  return (
    <Link
      href={`/markets/${market.id}`}
      className="group flex flex-col overflow-hidden bg-plains-mist shadow-stitch transition-all hover:bg-plains-panel active:scale-[0.995]"
    >
      <div className={`relative w-full overflow-hidden bg-plains-containerHighest ${compact ? "h-28" : "h-36 sm:h-40"}`}>
        {img ? (
          img.includes("supabase.co") ? (
            <Image
              src={img}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width:640px) 100vw, 400px"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-plains-container">
            <span className="font-mono text-4xl font-bold text-plains-primary/25" aria-hidden>
              ?
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 bg-plains-void/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {market.category}
        </div>
        {market.status === "open" && (
          <div className="absolute right-2 top-2 bg-plains-panel px-2 py-0.5 font-mono text-[10px] font-bold text-plains-void">
            {timeLeft}
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        <h3
          className={`font-headline font-bold leading-snug tracking-tight text-plains-void group-hover:text-plains-primaryHi ${compact ? "line-clamp-2 text-sm" : "line-clamp-2 text-base"}`}
        >
          {market.title}
        </h3>
        {!compact && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-plains-muted">{market.description}</p>}

        {showCrowd && !compact && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-outline">
                Crowd lean
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-headline text-2xl font-black tabular-nums tracking-tighter text-plains-primary">
                  {topPct}%
                </span>
                <span className="font-mono text-[10px] font-bold text-plains-muted">{topOption}</span>
              </div>
            </div>
            <CrowdSpark pct={topPct} />
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          {showCrowd && compact && (
            <span className="font-mono text-xs text-plains-muted">
              Lean <span className="font-bold text-plains-primary">{topPct}%</span> {topOption}
            </span>
          )}
          {!showCrowd && (
            <span className="font-mono text-xs text-plains-muted">
              {pickCount > 0 ? `${pickCount} picks` : "Be first to predict"}
            </span>
          )}
          {showCrowd && !compact && (
            <span className="font-mono text-xs text-plains-muted">{pickCount > 0 ? `${pickCount} picks` : ""}</span>
          )}
          <span className="bg-plains-containerHigh px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-plains-muted transition group-hover:bg-plains-primary group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
