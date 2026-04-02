import { createAdminClient } from "@/lib/supabase/admin";
import { runValorantSync } from "@/lib/valorant-sync";
import { NextResponse } from "next/server";

function checkAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const header = request.headers.get("x-admin-password");
  return (header ?? "") === password;
}

/** Manual trigger: POST with header X-Admin-Password (same as other admin routes). */
export async function POST(request: Request) {
  if (!checkAdmin(request)) {
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
