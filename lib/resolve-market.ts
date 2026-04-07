import type { SupabaseClient } from "@supabase/supabase-js";

type ResolveRpcResult = {
  ok?: boolean;
  updated?: number;
  error?: string;
};

/**
 * Resolves market: credit payouts, contrarian ELO (+ streak multipliers on wins), elo_history.
 * Backed by Postgres RPC `admin_resolve_market` (atomic). Idempotent if already resolved.
 */
export async function resolveMarket(
  admin: SupabaseClient,
  marketId: string,
  correctOption: string
): Promise<{ updated: number }> {
  const { data, error } = await admin.rpc("admin_resolve_market", {
    p_market_id: marketId,
    p_correct_option: correctOption,
  });

  if (error) throw new Error(error.message);

  const row = data as ResolveRpcResult | null;
  if (row && row.ok === false) {
    throw new Error(row.error ?? "Resolve failed");
  }

  return { updated: row?.updated ?? 0 };
}
