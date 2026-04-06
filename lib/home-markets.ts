import { batchMarketPickStats } from "@/lib/market-stats";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketRow } from "@/lib/types";

const POOL = 150;

/** Open markets sorted by prediction count (desc), then close date. */
export async function loadOpenMarketsByActivity(): Promise<{
  sorted: MarketRow[];
  stats: Map<string, { count: number; topOption: string | null; topPct: number | null }>;
}> {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data } = await admin
      .from("markets")
      .select("*")
      .eq("status", "open")
      .gt("close_date", now)
      .order("close_date", { ascending: true })
      .limit(POOL);

    const rows = (data ?? []) as MarketRow[];
    const stats = await batchMarketPickStats(
      admin,
      rows.map((m) => m.id),
    );
    const sorted = [...rows].sort((a, b) => {
      const ca = stats.get(a.id)?.count ?? 0;
      const cb = stats.get(b.id)?.count ?? 0;
      if (cb !== ca) return cb - ca;
      return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
    });
    return { sorted, stats };
  } catch {
    return { sorted: [], stats: new Map() };
  }
}
