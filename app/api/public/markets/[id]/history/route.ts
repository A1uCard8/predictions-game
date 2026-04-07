import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const MAX_POINTS = 800;

/**
 * Time series of credit pools for charts (Kalshi / Polymarket-style).
 * GET /api/public/markets/:id/history?limit=500
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const marketId = params.id;
  if (!marketId) {
    return NextResponse.json({ error: "Missing market id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(MAX_POINTS, Math.max(1, Number(searchParams.get("limit")) || 400));

  try {
    const admin = createAdminClient();

    const { data: m, error: mErr } = await admin
      .from("markets")
      .select("id, total_yes_credits, total_no_credits, options")
      .eq("id", marketId)
      .maybeSingle();

    if (mErr || !m) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const opts = m.options as unknown;
    const binary = Array.isArray(opts) && opts.length === 2;

    const { data: snaps, error: sErr } = await admin
      .from("market_snapshots")
      .select("total_yes_credits, total_no_credits, created_at")
      .eq("market_id", marketId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (sErr) {
      return NextResponse.json({ error: sErr.message }, { status: 500 });
    }

    const rows = snaps ?? [];
    const lastTy = Number(m.total_yes_credits ?? 0);
    const lastTn = Number(m.total_no_credits ?? 0);

    const points =
      rows.length > 0
        ? rows.map((r) => ({
            t: r.created_at as string,
            total_yes_credits: Number(r.total_yes_credits),
            total_no_credits: Number(r.total_no_credits),
          }))
        : [];

    const lastT = points.length > 0 ? points[points.length - 1].t : null;
    const needTail =
      points.length === 0 ||
      points[points.length - 1].total_yes_credits !== lastTy ||
      points[points.length - 1].total_no_credits !== lastTn;

    if (needTail && binary) {
      points.push({
        t: new Date().toISOString(),
        total_yes_credits: lastTy,
        total_no_credits: lastTn,
      });
    }

    const totalPool = lastTy + lastTn;
    const yes_probability = totalPool > 0 ? lastTy / totalPool : 0.5;
    const no_probability = totalPool > 0 ? lastTn / totalPool : 0.5;

    return NextResponse.json({
      market_id: marketId,
      binary,
      totals: {
        total_yes_credits: lastTy,
        total_no_credits: lastTn,
        yes_probability,
        no_probability,
      },
      points,
      last_snapshot_at: lastT,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
