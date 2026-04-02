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
