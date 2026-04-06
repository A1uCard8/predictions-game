import type { SupabaseClient } from "@supabase/supabase-js";

export type MarketPickStats = {
  count: number;
  topOption: string | null;
  topPct: number | null;
};

/**
 * Batch aggregate picks for many markets (server-side, service role).
 */
export async function batchMarketPickStats(
  admin: SupabaseClient,
  marketIds: string[],
): Promise<Map<string, MarketPickStats>> {
  const map = new Map<string, MarketPickStats>();
  for (const id of marketIds) map.set(id, { count: 0, topOption: null, topPct: null });
  if (marketIds.length === 0) return map;

  const { data: preds } = await admin
    .from("predictions")
    .select("market_id, chosen_option")
    .in("market_id", marketIds);

  const tallies = new Map<string, Map<string, number>>();
  for (const id of marketIds) tallies.set(id, new Map());

  for (const row of preds ?? []) {
    const mid = row.market_id as string;
    const opt = row.chosen_option as string;
    const t = tallies.get(mid);
    if (!t) continue;
    t.set(opt, (t.get(opt) ?? 0) + 1);
  }

  for (const id of marketIds) {
    const t = tallies.get(id)!;
    let count = 0;
    for (const n of t.values()) count += n;
    let topOption: string | null = null;
    let topN = 0;
    for (const [opt, n] of t) {
      if (n > topN) {
        topN = n;
        topOption = opt;
      }
    }
    const topPct = count > 0 && topOption ? Math.round((topN / count) * 1000) / 10 : null;
    map.set(id, { count, topOption, topPct });
  }

  return map;
}
