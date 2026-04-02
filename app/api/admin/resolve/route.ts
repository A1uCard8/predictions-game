import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMarket } from "@/lib/resolve-market";
import { NextResponse } from "next/server";

function checkAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const header = request.headers.get("x-admin-password");
  return (header ?? "") === password;
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { market_id?: string; correct_option?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { market_id, correct_option } = body;
  if (!market_id || !correct_option) {
    return NextResponse.json({ error: "market_id and correct_option required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await resolveMarket(admin, market_id, correct_option);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
