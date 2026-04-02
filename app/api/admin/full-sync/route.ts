import { createAdminClient } from "@/lib/supabase/admin";
import { runFullIngest } from "@/lib/full-ingest";
import { NextResponse } from "next/server";

function checkAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return (request.headers.get("x-admin-password") ?? "") === password;
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
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
