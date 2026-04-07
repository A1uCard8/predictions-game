import type { SupabaseClient } from "@supabase/supabase-js";

export type HistoryPoint = {
  t: string;
  total_yes_credits: number;
  total_no_credits: number;
};

/** Server-side bootstrap for Polymarket-style charts (avoids empty first paint). */
export async function getMarketHistoryBootstrap(
  admin: SupabaseClient,
  marketId: string,
  limit = 400,
): Promise<{ points: HistoryPoint[]; yes: number; no: number }> {
  const { data: m } = await admin
    .from("markets")
    .select("total_yes_credits, total_no_credits")
    .eq("id", marketId)
    .maybeSingle();

  const ty = Number(m?.total_yes_credits ?? 0);
  const tn = Number(m?.total_no_credits ?? 0);

  const { data: snaps } = await admin
    .from("market_snapshots")
    .select("total_yes_credits, total_no_credits, created_at")
    .eq("market_id", marketId)
    .order("created_at", { ascending: true })
    .limit(limit);

  const points: HistoryPoint[] = (snaps ?? []).map((r) => ({
    t: r.created_at as string,
    total_yes_credits: Number(r.total_yes_credits),
    total_no_credits: Number(r.total_no_credits),
  }));

  return { points, yes: ty, no: tn };
}
