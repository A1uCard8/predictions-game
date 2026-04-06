import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** Public top players by ELO (for homepage live leaderboard). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(25, Math.max(1, Number(searchParams.get("limit")) || 10));

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("users")
      .select("username, avatar_url, elo")
      .order("elo", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
