import { createAdminClient } from "@/lib/supabase/admin";
import { rollSeasonIfDue } from "@/lib/season-roll";
import { NextResponse } from "next/server";

/**
 * End-of-season archive + reset. Vercel Cron: /api/cron/season-roll + CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const report = await rollSeasonIfDue(admin);
    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Season roll failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
