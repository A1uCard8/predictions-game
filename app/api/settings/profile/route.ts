import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { username?: string; avatar_url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: { username?: string; avatar_url?: string | null } = {};
  if (body.username !== undefined) {
    const u = body.username.trim();
    if (u.length < 3 || u.length > 24) {
      return NextResponse.json({ error: "Username 3–24 characters" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) {
      return NextResponse.json({ error: "Username: letters, numbers, underscore only" }, { status: 400 });
    }
    updates.username = u;
  }
  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
