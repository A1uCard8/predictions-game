import { createAdminClient } from "@/lib/supabase/admin";

export type MarketPulsePayload = {
  counts: Record<string, number>;
  total: number;
  recent: { option: string; at: string }[];
  countsApproximate: boolean;
};

function sumCounts(obj: Record<string, number>) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

/** Server-only: full distribution via RPC when migration is applied; else capped sample + exact total. */
export async function getMarketPulse(marketId: string): Promise<MarketPulsePayload> {
  const admin = createAdminClient();
  const CAP = 2000;

  const { data: agg, error: rpcError } = await admin.rpc("market_option_counts", {
    p_market_id: marketId,
  });

  const counts: Record<string, number> = {};
  let countsApproximate = false;

  if (!rpcError && agg && typeof agg === "object" && !Array.isArray(agg)) {
    for (const [k, v] of Object.entries(agg as Record<string, unknown>)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) counts[k] = n;
    }
  } else {
    countsApproximate = true;
    const { data: preds } = await admin
      .from("predictions")
      .select("chosen_option")
      .eq("market_id", marketId)
      .order("created_at", { ascending: false })
      .limit(CAP);
    for (const row of preds ?? []) {
      const k = row.chosen_option as string;
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }

  const { count: headCount } = await admin
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("market_id", marketId);

  const total = headCount ?? sumCounts(counts);

  const { data: recentRows } = await admin
    .from("predictions")
    .select("chosen_option, created_at")
    .eq("market_id", marketId)
    .order("created_at", { ascending: false })
    .limit(24);

  const recent = (recentRows ?? []).map((r) => ({
    option: r.chosen_option as string,
    at: r.created_at as string,
  }));

  return { counts, total, recent, countsApproximate };
}
