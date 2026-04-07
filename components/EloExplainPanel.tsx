import { CATEGORY_LEADER_MIN_PREDICTIONS, ELO_LOSS, ELO_WIN } from "@/lib/constants";
import { TIERS, TOP500_TIER_BASE, tierLabelStyle } from "@/lib/tiers";

export function EloExplainPanel() {
  return (
    <details className="group rounded-xl border border-plains-border bg-plains-panel/90 shadow-sm open:shadow-md">
      <summary className="cursor-pointer list-none px-4 py-3 font-mono text-xs uppercase tracking-wider text-plains-muted transition marker:content-none hover:text-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="text-plains-accent group-open:rotate-90 transition">▸</span>
          How ELO & ranks work
        </span>
      </summary>
      <div className="space-y-4 border-t border-plains-border px-4 py-4 text-sm leading-relaxed text-plains-muted">
        <p>
          <strong className="text-foreground">Blind predictions.</strong> You lock one option before resolution.
          On <strong className="text-foreground">two-outcome</strong> markets you stake <strong>credits</strong> (seasonal
          points, not money); pools set implied probabilities for the live chart. At resolve, ELO moves by a{" "}
          <strong>contrarian</strong> formula (bigger reward when the crowd leaned the other way), with{" "}
          <strong>streak multipliers</strong> on wins (1.2× from 3, 1.5× from 5). Legacy flat ±ELO constants were{" "}
          <span className="font-mono text-plains-muted">±{ELO_WIN}/{ELO_LOSS}</span> — the live server uses pool-weighted
          K.
        </p>
        <p>
          <strong className="text-foreground">Leaderboard.</strong> Global order is by ELO. Category boards use win
          rate with at least {CATEGORY_LEADER_MIN_PREDICTIONS} resolved picks in that category.
        </p>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Rank tiers</p>
          <ul className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-2">
            {TIERS.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 rounded-md bg-plains-mist/80 px-2 py-1">
                <span style={tierLabelStyle(t)}>{t.label}</span>
                <span className="text-plains-muted">
                  {t.max == null ? `${t.min}+` : `${t.min}–${t.max}`}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-2 rounded-md bg-plains-mist/80 px-2 py-1">
              <span style={tierLabelStyle(TOP500_TIER_BASE)}>{TOP500_TIER_BASE.label}</span>
              <span className="text-plains-muted">Global rank 1–500</span>
            </li>
          </ul>
          <p className="mt-2 text-xs italic">
            Finish in the global top 500 for a seasonal Top 500 crest on your badge.
          </p>
        </div>
      </div>
    </details>
  );
}
