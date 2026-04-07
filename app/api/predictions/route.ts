import { createClient } from "@/lib/supabase/server";
import { MIN_WAGER_CREDITS } from "@/lib/constants";
import { isBinaryMarket } from "@/lib/betting";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { market_id?: string; chosen_option?: string; credits?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { market_id, chosen_option, credits: creditsRaw } = body;
  if (!market_id || !chosen_option) {
    return NextResponse.json({ error: "market_id and chosen_option required" }, { status: 400 });
  }

  const { data: market, error: mErr } = await supabase
    .from("markets")
    .select("id, status, options, close_date")
    .eq("id", market_id)
    .single();

  if (mErr || !market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  if (market.status !== "open") {
    return NextResponse.json({ error: "Market is not open" }, { status: 400 });
  }

  const close = new Date(market.close_date as string).getTime();
  if (Date.now() >= close) {
    return NextResponse.json({ error: "Market has closed" }, { status: 400 });
  }

  const options = market.options as string[];
  if (!Array.isArray(options) || !options.includes(chosen_option)) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("market_id", market_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already predicted" }, { status: 409 });
  }

  const binary = isBinaryMarket(options);

  if (binary) {
    const credits = Number(creditsRaw);
    if (!Number.isFinite(credits) || credits < MIN_WAGER_CREDITS) {
      return NextResponse.json(
        { error: `Credits required (min ${MIN_WAGER_CREDITS}) for two-outcome markets` },
        { status: 400 },
      );
    }
    const wager = Math.floor(credits);
    const { data: rpcData, error: rpcErr } = await supabase.rpc("place_prediction_bet", {
      p_market_id: market_id,
      p_chosen_option: chosen_option,
      p_credits: wager,
    });
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }
    const res = rpcData as { ok?: boolean; error?: string } | null;
    if (!res?.ok) {
      return NextResponse.json({ error: res?.error ?? "Bet failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (creditsRaw != null && Number(creditsRaw) !== 0) {
    return NextResponse.json({ error: "Credits apply only to two-outcome markets" }, { status: 400 });
  }

  const { error: ins } = await supabase.from("predictions").insert({
    user_id: user.id,
    market_id,
    chosen_option,
    credits_wagered: 0,
  });

  if (ins) {
    return NextResponse.json({ error: ins.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
