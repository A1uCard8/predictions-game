"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { estimatedPayoutOnWin, isBinaryMarket } from "@/lib/betting";
import { MIN_WAGER_CREDITS } from "@/lib/constants";

type Props = {
  marketId: string;
  options: string[];
  locked: boolean;
  chosen?: string | null;
  creditsBalance: number;
  totalYesCredits: number;
  totalNoCredits: number;
};

export function MarketPredictForm({
  marketId,
  options,
  locked,
  chosen,
  creditsBalance,
  totalYesCredits,
  totalNoCredits,
}: Props) {
  const router = useRouter();
  const binary = isBinaryMarket(options);
  const [selected, setSelected] = useState<string | null>(chosen ?? null);
  const [wager, setWager] = useState(MIN_WAGER_CREDITS);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pickFirst = selected === options[0];
  const estimate =
    binary && selected
      ? estimatedPayoutOnWin(wager, totalYesCredits, totalNoCredits, pickFirst)
      : null;

  const maxWager = useMemo(() => Math.max(0, creditsBalance), [creditsBalance]);

  async function submit() {
    if (!selected || locked) return;
    if (binary && wager < MIN_WAGER_CREDITS) {
      setErr(`Minimum wager is ${MIN_WAGER_CREDITS} credits`);
      return;
    }
    if (binary && wager > maxWager) {
      setErr("Insufficient credits");
      return;
    }
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market_id: marketId,
        chosen_option: selected,
        credits: binary ? Math.floor(wager) : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not submit");
      return;
    }
    setConfirmOpen(false);
    router.refresh();
  }

  if (locked && chosen) {
    return (
      <div className="bg-plains-primary/10 p-5">
        <p className="font-mono text-sm font-bold text-plains-primaryHi">Prediction locked in</p>
        <p className="mt-2 font-headline text-lg font-bold text-plains-void">You chose: {chosen}</p>
        <p className="mt-2 font-mono text-xs text-plains-muted">
          One pick per market — credits stay locked until resolution; ELO updates from contrarian skill + streak
          multipliers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-headline text-sm font-bold text-plains-void">Lock your pick</p>
        {binary && (
          <p className="font-mono text-[11px] text-plains-muted">
            Balance:{" "}
            <span className="font-bold tabular-nums text-plains-void">{creditsBalance.toLocaleString()}</span> credits
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSelected(opt)}
            className={`rounded-sm px-4 py-3.5 text-left font-headline text-sm font-bold transition-all ${
              selected === opt
                ? "bg-gradient-to-br from-plains-primary to-plains-primaryHi text-white shadow-glow"
                : "bg-plains-containerHigh text-plains-void hover:bg-plains-containerHighest"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {binary && selected && (
        <div className="space-y-2 rounded-sm border border-plains-border/40 bg-plains-panel p-4">
          <label className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-plains-muted">
            <span>Wager (credits)</span>
            <span className="tabular-nums text-plains-void">
              {Math.min(wager, maxWager)} / {maxWager}
            </span>
          </label>
          <input
            type="range"
            min={MIN_WAGER_CREDITS}
            max={Math.max(MIN_WAGER_CREDITS, maxWager)}
            step={5}
            value={Math.min(Math.max(wager, MIN_WAGER_CREDITS), Math.max(MIN_WAGER_CREDITS, maxWager))}
            onChange={(e) => setWager(Number(e.target.value))}
            className="w-full accent-plains-primary"
          />
          <p className="font-mono text-[11px] leading-relaxed text-plains-muted">
            If you win, you reclaim your stake plus a proportional share of the losing pool (parimutuel).{" "}
            <span className="font-semibold text-plains-void">
              Est. return if correct (no new bets): {estimate?.toLocaleString() ?? "—"} credits
            </span>
          </p>
        </div>
      )}

      {!binary && (
        <p className="font-mono text-[11px] text-plains-muted">
          Multi-outcome markets use picks only (no credit pool). ELO still uses crowd contrarian weighting at resolve.
        </p>
      )}

      {err && <p className="text-sm font-medium text-plains-danger">{err}</p>}

      <button
        type="button"
        disabled={!selected || loading || (binary && maxWager < MIN_WAGER_CREDITS)}
        onClick={() => {
          if (binary) setConfirmOpen(true);
          else void submit();
        }}
        className="btn-primary w-full py-3.5 text-xs disabled:opacity-40"
      >
        {loading ? "Submitting…" : binary ? "Review & confirm" : "Submit prediction"}
      </button>

      {confirmOpen && binary && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-plains-void/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md border border-plains-border bg-plains-panel p-6 shadow-glow">
            <p className="font-headline text-base font-bold text-plains-void">Confirm wager</p>
            <ul className="mt-3 space-y-2 font-mono text-xs text-plains-muted">
              <li>
                <span className="text-plains-outline">Side:</span>{" "}
                <span className="font-bold text-plains-void">{selected}</span>
              </li>
              <li>
                <span className="text-plains-outline">Wager:</span>{" "}
                <span className="font-bold text-plains-void">{Math.floor(wager).toLocaleString()} credits</span>
              </li>
              <li>
                <span className="text-plains-outline">Est. return if correct:</span>{" "}
                <span className="font-bold text-plains-accent">{estimate?.toLocaleString() ?? "—"} credits</span>
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-plains-muted">
              Credits are locked until this market resolves. You cannot withdraw or purchase credits.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1 py-2.5 text-[10px] font-bold uppercase"
                onClick={() => setConfirmOpen(false)}
              >
                Back
              </button>
              <button type="button" className="btn-primary flex-1 py-2.5 text-[10px] font-bold uppercase" onClick={() => void submit()}>
                {loading ? "…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
