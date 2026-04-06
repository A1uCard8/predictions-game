"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  marketId: string;
  options: string[];
  locked: boolean;
  chosen?: string | null;
};

export function MarketPredictForm({ marketId, options, locked, chosen }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(chosen ?? null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!selected || locked) return;
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market_id: marketId, chosen_option: selected }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not submit");
      return;
    }
    router.refresh();
  }

  if (locked && chosen) {
    return (
      <div className="rounded-lg border border-plains-accent/40 bg-plains-accent/5 p-4">
        <p className="font-mono text-sm text-plains-accent">Prediction locked in</p>
        <p className="mt-1 text-foreground">You chose: {chosen}</p>
        <p className="mt-2 text-xs text-plains-muted">No consensus or crowd data shown — skill only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSelected(opt)}
            className={`rounded-lg border px-4 py-3 text-left font-medium transition-all hover:border-plains-accent/60 ${
              selected === opt
                ? "border-plains-accent bg-plains-accent/10 text-plains-accent"
                : "border-plains-border bg-plains-panel text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {err && <p className="text-sm text-plains-danger">{err}</p>}
      <button
        type="button"
        disabled={!selected || loading}
        onClick={submit}
        className="btn-primary w-full py-3 disabled:opacity-40"
      >
        {loading ? "Submitting…" : "Submit prediction"}
      </button>
    </div>
  );
}
