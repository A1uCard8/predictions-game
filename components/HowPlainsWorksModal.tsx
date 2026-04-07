"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";
import { CATEGORY_LEADER_MIN_PREDICTIONS, ELO_LOSS, ELO_WIN } from "@/lib/constants";
import { TIERS, TOP500_TIER_BASE, tierLabelStyle } from "@/lib/tiers";

export function HowPlainsWorksTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-plains-void/45 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={id}
              className="relative z-10 flex max-h-[min(88dvh,calc(100svh-2rem))] w-full max-w-lg flex-col overflow-hidden bg-plains-panel shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-6">
                <h2 id={id} className="font-headline text-xl font-bold tracking-tight text-plains-void">
                  How Plains works
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-plains-muted">
                  <p>
                    <strong className="text-foreground">What Plains is.</strong> A{" "}
                    <strong className="text-foreground">competitive prediction market</strong> for real-world questions:
                    you commit to an outcome before it resolves, see how conviction moves in the aggregate (charts on
                    two-outcome markets), and climb a global skill ladder — <strong className="text-foreground">no real</strong>{" "}
                    money, <strong className="text-foreground">no withdrawals</strong>; reputation and seasonal credits
                    only.
                  </p>
                  <p>
                    <strong className="text-foreground">Pick once.</strong> Each open market lets you lock{" "}
                    <strong className="text-foreground">one</strong> option before it closes. No edits — blind skill
                    only.
                  </p>
                  <p>
                    <strong className="text-foreground">Climb ELO.</strong> Two-outcome markets use{" "}
                    <strong className="text-foreground">seasonal credits</strong> (pool-based chart). At resolve, ELO
                    moves by a <strong>contrarian</strong> formula (bigger wins when the crowd leaned away from you) plus{" "}
                    <strong>streak bonuses</strong> on correct calls. Flat ±{ELO_WIN}/{ELO_LOSS} was the old MVP default.
                  </p>
                  <p>
                    <strong className="text-foreground">Leaderboard.</strong> Global rank is by ELO. Category boards use
                    win % with at least {CATEGORY_LEADER_MIN_PREDICTIONS} resolved picks in that category.
                  </p>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Rank tiers</p>
                    <ul className="mt-2 grid gap-1 font-mono text-[11px] sm:grid-cols-2">
                      {TIERS.map((t) => (
                        <li key={t.id} className="flex justify-between gap-2 bg-plains-mist px-2 py-1.5">
                          <span style={tierLabelStyle(t)}>{t.label}</span>
                          <span className="text-plains-muted">
                            {t.max == null ? `${t.min}+` : `${t.min}–${t.max}`}
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-2 bg-plains-mist px-2 py-1.5">
                        <span style={tierLabelStyle(TOP500_TIER_BASE)}>{TOP500_TIER_BASE.label}</span>
                        <span className="text-plains-muted">Global rank 1–500</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs italic">
                    No real money — reputation only. Have fun and prove your read on the world.
                  </p>
                </div>
              </div>
              <div className="shrink-0 border-t border-plains-border/15 bg-plains-panel px-6 py-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full py-2.5 text-xs uppercase tracking-wider"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-sm bg-plains-mist px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-plains-muted transition hover:bg-plains-containerHigh hover:text-plains-void ${className}`}
      >
        How it works
      </button>
      {modal}
    </>
  );
}
