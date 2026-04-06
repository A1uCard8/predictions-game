import Link from "next/link";
import { MarketCard } from "@/components/MarketCard";
import { CATEGORIES } from "@/lib/constants";
import { batchMarketPickStats } from "@/lib/market-stats";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketRow } from "@/lib/types";

type Search = {
  q?: string;
  category?: string;
  tab?: string;
};

function normQ(q: string | undefined) {
  return (q ?? "").trim().toLowerCase();
}

export default async function MarketsPage({ searchParams }: { searchParams: Search }) {
  const qRaw = searchParams.q ?? "";
  const q = normQ(qRaw);
  const cat =
    searchParams.category && CATEGORIES.includes(searchParams.category as (typeof CATEGORIES)[number])
      ? searchParams.category
      : null;
  const tab = searchParams.tab === "resolved" || searchParams.tab === "new" ? searchParams.tab : "open";

  let openMarkets: MarketRow[] = [];
  let resolvedMarkets: MarketRow[] = [];
  let newMarkets: MarketRow[] = [];

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    if (tab === "resolved") {
      const { data } = await admin
        .from("markets")
        .select("*")
        .eq("status", "resolved")
        .order("resolution_date", { ascending: false })
        .limit(48);
      resolvedMarkets = (data ?? []) as MarketRow[];
    } else if (tab === "new") {
      const { data } = await admin
        .from("markets")
        .select("*")
        .eq("status", "open")
        .gt("close_date", now)
        .order("created_at", { ascending: false })
        .limit(48);
      newMarkets = (data ?? []) as MarketRow[];
    } else {
      const { data } = await admin
        .from("markets")
        .select("*")
        .eq("status", "open")
        .gt("close_date", now)
        .order("close_date", { ascending: true })
        .limit(80);
      openMarkets = (data ?? []) as MarketRow[];
    }
  } catch {
    openMarkets = [];
  }

  let list: MarketRow[] =
    tab === "resolved" ? resolvedMarkets : tab === "new" ? newMarkets : openMarkets;

  if (cat) list = list.filter((m) => m.category === cat);
  if (q) {
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }

  let stats = new Map<string, { count: number; topOption: string | null; topPct: number | null }>();
  try {
    const admin = createAdminClient();
    stats = await batchMarketPickStats(
      admin,
      list.map((m) => m.id),
    );
    if (tab === "open" && !q && !cat) {
      list = [...list].sort((a, b) => {
        const ca = stats.get(a.id)?.count ?? 0;
        const cb = stats.get(b.id)?.count ?? 0;
        if (cb !== ca) return cb - ca;
        return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
      });
    }
  } catch {
    stats = new Map();
  }

  const tabCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-mono transition ${
      active ? "bg-plains-accent/20 font-semibold text-plains-accent" : "text-plains-muted hover:bg-plains-mist"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-plains-void">Markets</h1>
          <p className="mt-1 text-sm text-plains-muted">
            Discover, filter, and jump in. Open lists default to <strong className="text-foreground">trending</strong>{" "}
            (most picks).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-ghost inline-flex w-fit items-center px-4 py-2 text-sm font-mono font-semibold uppercase tracking-wide"
        >
          Your desk →
        </Link>
      </div>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" action="/markets" method="get">
        <input type="hidden" name="tab" value={tab} />
        {cat ? <input type="hidden" name="category" value={cat} /> : null}
        <input
          name="q"
          defaultValue={qRaw}
          placeholder="Search markets…"
          className="w-full rounded-xl border border-plains-border bg-plains-panel px-4 py-2.5 text-sm outline-none transition focus:border-plains-accent sm:max-w-md"
        />
        <button
          type="submit"
          className="rounded-xl border border-plains-border bg-plains-mist px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-plains-void transition hover:border-plains-accent/40"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-plains-border pb-4">
        <Link href="/markets" className={tabCls(tab === "open")}>
          Trending / open
        </Link>
        <Link href="/markets?tab=new" className={tabCls(tab === "new")}>
          New
        </Link>
        <Link href="/markets?tab=resolved" className={tabCls(tab === "resolved")}>
          Recently resolved
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/markets${tab !== "open" ? `?tab=${tab}` : ""}`}
          className={`rounded-md px-2 py-1 text-xs font-mono ${!cat ? "bg-plains-accent/15 text-plains-accent" : "text-plains-muted hover:text-foreground"}`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => {
          const qs = new URLSearchParams();
          if (tab !== "open") qs.set("tab", tab);
          qs.set("category", c);
          if (qRaw) qs.set("q", qRaw);
          return (
            <Link
              key={c}
              href={`/markets?${qs.toString()}`}
              className={`rounded-md px-2 py-1 text-xs font-mono ${
                cat === c ? "bg-plains-accent/15 text-plains-accent" : "text-plains-muted hover:text-foreground"
              }`}
            >
              {c.split("/")[0]}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-plains-border py-16 text-center text-plains-muted">
            No markets match. Try another tab or search.
          </p>
        )}
        {list.map((m) => {
          const s = stats.get(m.id);
          return (
            <MarketCard
              key={m.id}
              market={m}
              pickCount={s?.count ?? 0}
              topOption={s?.topOption}
              topPct={s?.topPct}
            />
          );
        })}
      </div>
    </div>
  );
}
