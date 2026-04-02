import { createAdminClient } from "@/lib/supabase/admin";
import { runValorantSync } from "@/lib/valorant-sync";
import { NextResponse } from "next/server";

/**
 * Vercel Cron: configure in vercel.json + set CRON_SECRET.
 * curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/valorant
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const report = await runValorantSync(admin);
    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
