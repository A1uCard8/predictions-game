"use client";

import { CATEGORIES } from "@/lib/constants";
import { useState } from "react";

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(CATEGORIES[0]);
  const [optA, setOptA] = useState("Yes");
  const [optB, setOptB] = useState("No");
  const [closeDate, setCloseDate] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");

  const [resolveMarketId, setResolveMarketId] = useState("");
  const [correctOption, setCorrectOption] = useState("");
  const [deleteMarketId, setDeleteMarketId] = useState("");

  async function createMarket(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const options = [optA.trim(), optB.trim()].filter(Boolean);
    if (options.length < 2) {
      setErr("Need at least two options");
      return;
    }
    const res = await fetch("/api/admin/markets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({
        title,
        description,
        category,
        options,
        close_date: new Date(closeDate).toISOString(),
        resolution_date: new Date(resolutionDate).toISOString(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Failed");
      return;
    }
    setMsg(`Market created: ${data.id}`);
  }

  async function valorantSync() {
    setErr(null);
    setMsg(null);
    setSyncLoading(true);
    const res = await fetch("/api/admin/valorant-sync", {
      method: "POST",
      headers: { "X-Admin-Password": password },
    });
    const data = await res.json().catch(() => ({}));
    setSyncLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Valorant sync failed");
      return;
    }
    setMsg(
      `Valorant sync: created ${data.created}, resolved ${data.resolved}, skipped ${data.skipped}` +
        (data.errors?.length ? ` — ${data.errors.join("; ")}` : "")
    );
  }

  async function fullIngest() {
    setErr(null);
    setMsg(null);
    setFullLoading(true);
    const res = await fetch("/api/admin/full-sync", {
      method: "POST",
      headers: { "X-Admin-Password": password },
    });
    const data = await res.json().catch(() => ({}));
    setFullLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Full ingest failed");
      return;
    }
    const v = data.valorant ?? {};
    const d = data.dome ?? {};
    const p = data.pokemon ?? {};
    const f = data.finance ?? {};
    const errAll = [...(v.errors ?? []), ...(d.errors ?? []), ...(p.errors ?? []), ...(f.errors ?? [])].filter(
      Boolean,
    );
    setMsg(
      `Full ingest — Valorant: +${v.created ?? 0} / resolved ${v.resolved ?? 0}. ` +
        `Dome: Polymarket +${d.polyCreated ?? 0}, Kalshi +${d.kalshiCreated ?? 0}, resolved ${d.resolved ?? 0}. ` +
        `Pokémon TCG: +${p.created ?? 0} / resolved ${p.resolved ?? 0}. ` +
        `Finance: +${f.created ?? 0} / resolved ${f.resolved ?? 0}.` +
        (errAll.length ? ` Errors: ${errAll.join("; ")}` : "")
    );
  }

  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/admin/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({
        market_id: resolveMarketId,
        correct_option: correctOption,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Failed");
      return;
    }
    setMsg(`Resolved. Updated ${data.updated} predictions.`);
  }

  async function deleteMarket(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const id = deleteMarketId.trim();
    if (!id) {
      setErr("Enter market UUID");
      return;
    }
    if (!window.confirm("Permanently delete this market and all its predictions?")) return;
    const res = await fetch("/api/admin/markets", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ market_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Delete failed");
      return;
    }
    setMsg(`Deleted: ${data.deleted ?? id}`);
    setDeleteMarketId("");
  }

  return (
    <div className="mt-8 space-y-10">
      <div>
        <label className="text-xs font-mono uppercase text-plains-muted">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-plains-border bg-plains-panel px-3 py-2 font-mono text-sm outline-none focus:border-plains-accent"
          autoComplete="off"
          placeholder="From ADMIN_PASSWORD env"
        />
      </div>

      {err && <p className="text-sm text-plains-danger">{err}</p>}
      {msg && <p className="text-sm text-plains-accent">{msg}</p>}

      <form onSubmit={createMarket} className="space-y-4 rounded-xl border border-plains-border bg-plains-panel/50 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Create market</h2>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[88px] w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
          className="w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Option 1"
            value={optA}
            onChange={(e) => setOptA(e.target.value)}
            className="rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
            required
          />
          <input
            placeholder="Option 2"
            value={optB}
            onChange={(e) => setOptB(e.target.value)}
            className="rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
            required
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs text-plains-muted">Close (local → stored UTC)</label>
            <input
              type="datetime-local"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs text-plains-muted">Resolution</label>
            <input
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
              required
            />
          </div>
        </div>
        <button type="submit" className="rounded-lg bg-plains-accent px-4 py-2 font-mono font-semibold text-plains-void">
          Create
        </button>
      </form>

      <form onSubmit={resolve} className="space-y-4 rounded-xl border border-plains-border bg-plains-panel/50 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Resolve market</h2>
        <input
          placeholder="Market UUID"
          value={resolveMarketId}
          onChange={(e) => setResolveMarketId(e.target.value)}
          className="w-full rounded-lg border border-plains-border bg-white px-3 py-2 font-mono text-sm outline-none"
          required
        />
        <input
          placeholder="Correct option (exact string)"
          value={correctOption}
          onChange={(e) => setCorrectOption(e.target.value)}
          className="w-full rounded-lg border border-plains-border bg-white px-3 py-2 outline-none"
          required
        />
        <button type="submit" className="rounded-lg border border-plains-accent/50 px-4 py-2 font-mono text-plains-accent hover:bg-plains-accent/10">
          Resolve & apply ELO
        </button>
      </form>

      <form onSubmit={deleteMarket} className="space-y-4 rounded-xl border border-plains-danger/30 bg-plains-panel/50 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-danger">Delete market</h2>
        <p className="text-xs text-plains-muted">
          Only <strong className="text-foreground">manual</strong> markets (created here, no external feed) can be deleted.
          Copy the market UUID from the URL <code className="text-plains-accent">/markets/&lt;uuid&gt;</code> or from
          Supabase.
        </p>
        <input
          placeholder="Market UUID to delete"
          value={deleteMarketId}
          onChange={(e) => setDeleteMarketId(e.target.value)}
          className="w-full rounded-lg border border-plains-border bg-white px-3 py-2 font-mono text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-plains-danger/60 px-4 py-2 font-mono text-sm text-plains-danger hover:bg-plains-danger/10"
        >
          Delete market
        </button>
      </form>

      <div className="space-y-3 rounded-xl border border-plains-border bg-plains-panel/50 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Live ingest (recommended)</h2>
        <p className="text-xs text-plains-muted">
          Runs <strong>Valorant</strong> (vlrggapi), <strong>Dome</strong> (Polymarket + Kalshi mirrors),{" "}
          <strong>Pokémon TCG</strong> (TCGdex price targets), and <strong>Yahoo chart</strong> daily stocks/crypto +
          optional monthly crypto. Set env: <code className="text-plains-accent">DOME_API_KEY</code>,{" "}
          <code className="text-plains-accent">VLRGGAPI_BASE_URL</code>, optional{" "}
          <code className="text-plains-accent">POKEMON_TCG_CARD_IDS</code>,{" "}
          <code className="text-plains-accent">AUTO_STOCK_SYMBOLS</code>, etc.
        </p>
        <button
          type="button"
          disabled={fullLoading || !password}
          onClick={fullIngest}
          className="rounded-lg bg-plains-accent px-4 py-2 font-mono text-sm font-semibold text-plains-void hover:bg-plains-accentDim disabled:opacity-40"
        >
          {fullLoading ? "Running…" : "Run full ingest now"}
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-plains-border bg-plains-panel/50 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Valorant only</h2>
        <p className="text-xs text-plains-muted">
          Same as before — only Esports from vlrggapi. Requires{" "}
          <code className="text-plains-accent">VLRGGAPI_BASE_URL</code>.
        </p>
        <button
          type="button"
          disabled={syncLoading || !password}
          onClick={valorantSync}
          className="rounded-lg bg-plains-accent/20 px-4 py-2 font-mono text-sm text-plains-accent hover:bg-plains-accent/30 disabled:opacity-40"
        >
          {syncLoading ? "Syncing…" : "Run Valorant sync only"}
        </button>
      </div>
    </div>
  );
}
