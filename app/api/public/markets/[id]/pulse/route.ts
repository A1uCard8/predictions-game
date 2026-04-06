import { getMarketPulse } from "@/lib/market-pulse";
import { NextResponse } from "next/server";

/** Aggregate pick counts + recent choices for live homepage pulse (no usernames). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const marketId = params.id;
  if (!marketId) {
    return NextResponse.json({ error: "Missing market id" }, { status: 400 });
  }

  try {
    const { counts, total, recent, countsApproximate } = await getMarketPulse(marketId);
    return NextResponse.json({
      counts,
      total,
      countsApproximate,
      recent,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
