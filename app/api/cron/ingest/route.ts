import { createAdminClient } from "@/lib/supabase/admin";
import { runFullIngest } from "@/lib/full-ingest";
import { NextResponse } from "next/server";

/**
 * Full pipeline: Valorant + NewsAPI + Yahoo finance/crypto (create + auto-resolve).
 * Vercel Cron: set path to /api/cron/ingest and CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const report = await runFullIngest(admin);
    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
