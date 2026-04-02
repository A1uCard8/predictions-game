import type { SupabaseClient } from "@supabase/supabase-js";
import { ELO_LOSS, ELO_WIN } from "./constants";

/**
 * Marks market resolved, updates each prediction and user ELO, writes elo_history.
 * Idempotent: if already resolved, no-op.
 */
export async function resolveMarket(
  admin: SupabaseClient,
  marketId: string,
  correctOption: string
): Promise<{ updated: number }> {
  const { data: market, error: mErr } = await admin
    .from("markets")
    .select("id, status, options")
    .eq("id", marketId)
    .single();

  if (mErr || !market) throw new Error("Market not found");
  if (market.status === "resolved") return { updated: 0 };

  const options = market.options as string[];
  if (!Array.isArray(options) || !options.includes(correctOption)) {
    throw new Error("Correct option must be one of the market options");
  }

  const { data: preds, error: pErr } = await admin
    .from("predictions")
    .select("id, user_id, chosen_option")
    .eq("market_id", marketId);

  if (pErr) throw pErr;

  let count = 0;
  for (const p of preds ?? []) {
    const correct = p.chosen_option === correctOption;
    const eloChange = correct ? ELO_WIN : -ELO_LOSS;

    const { data: userRow } = await admin
      .from("users")
      .select("elo")
      .eq("id", p.user_id)
      .single();

    const prev = userRow?.elo ?? 1000;
    const newElo = Math.max(0, prev + eloChange);

    const { error: uPred } = await admin
      .from("predictions")
      .update({ is_correct: correct, elo_change: eloChange })
      .eq("id", p.id);
    if (uPred) throw uPred;

    const { error: uUser } = await admin
      .from("users")
      .update({ elo: newElo })
      .eq("id", p.user_id);
    if (uUser) throw uUser;

    const { error: hErr } = await admin.from("elo_history").insert({
      user_id: p.user_id,
      elo_after: newElo,
      market_id: marketId,
    });
    if (hErr) throw hErr;
    count++;
  }

  const { error: fin } = await admin
    .from("markets")
    .update({ status: "resolved", correct_option: correctOption })
    .eq("id", marketId);
  if (fin) throw fin;

  return { updated: count };
}
