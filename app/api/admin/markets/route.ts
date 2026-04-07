import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";
import { NextResponse } from "next/server";

function checkAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const header = request.headers.get("x-admin-password");
  const auth = header ?? "";
  return auth === password;
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    category?: string;
    options?: string[];
    close_date?: string;
    resolution_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, category, options, close_date, resolution_date } = body;
  if (!title?.trim() || !description?.trim() || !category || !options?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!close_date || !resolution_date) {
    return NextResponse.json({ error: "close_date and resolution_date required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("markets")
    .insert({
      title: title.trim(),
      description: description.trim(),
      category,
      options,
      close_date,
      resolution_date,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

/**
 * Delete a manually created market (no external_source). Cascades predictions; elo_history.market_id → null.
 * Refuses synced rows (yahoo, vlr, dome, etc.) so ingest markets are not removed by mistake.
 */
export async function DELETE(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { market_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const marketId = body.market_id?.trim();
  if (!marketId) {
    return NextResponse.json({ error: "market_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("markets")
    .select("id, external_source, title")
    .eq("id", marketId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (row.external_source != null) {
    return NextResponse.json(
      {
        error:
          "This market is tied to an external feed (external_source is set). Delete only manual markets from the admin panel, or run SQL in Supabase if you must remove a synced row.",
      },
      { status: 400 },
    );
  }

  const { error: delErr } = await admin.from("markets").delete().eq("id", marketId);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: row.title });
}
