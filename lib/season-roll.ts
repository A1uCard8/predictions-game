import type { SupabaseClient } from "@supabase/supabase-js";
import { ELO_START, SEASON_STARTING_CREDITS } from "./constants";

export type SeasonRollReport = {
  rolled: boolean;
  previousSeasonId?: string;
  newSeasonId?: string;
  usersArchived?: number;
  message?: string;
};

/**
 * If the active season's end_at is past, archive leaderboards into user_season_history,
 * reset credits / ELO / streak, and start the next season window.
 */
export async function rollSeasonIfDue(admin: SupabaseClient): Promise<SeasonRollReport> {
  const { data: active, error: sErr } = await admin
    .from("seasons")
    .select("id, slug, end_at")
    .eq("is_active", true)
    .maybeSingle();

  if (sErr) throw sErr;
  if (!active?.id) {
    return { rolled: false, message: "No active season row" };
  }

  const end = new Date(active.end_at as string).getTime();
  if (Date.now() < end) {
    return { rolled: false, message: "Season still active" };
  }

  const { data: users, error: uErr } = await admin
    .from("users")
    .select("id, elo")
    .order("elo", { ascending: false });
  if (uErr) throw uErr;

  const list = users ?? [];
  let rank = 0;
  for (const u of list) {
    rank += 1;
    const { error: hErr } = await admin.from("user_season_history").insert({
      user_id: u.id,
      season_id: active.id,
      final_elo: u.elo,
      final_rank: rank,
      badge: rank <= 500 ? "top500" : null,
    });
    if (hErr) throw hErr;
  }

  const { error: offErr } = await admin.from("seasons").update({ is_active: false }).eq("id", active.id);
  if (offErr) throw offErr;

  const start = new Date();
  const nextEnd = new Date(start);
  nextEnd.setMonth(nextEnd.getMonth() + 2);

  const slug = `season-${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
  const { data: inserted, error: iErr } = await admin
    .from("seasons")
    .insert({
      slug,
      start_at: start.toISOString(),
      end_at: nextEnd.toISOString(),
      is_active: true,
    })
    .select("id")
    .single();
  if (iErr) throw iErr;

  const { error: resetErr } = await admin
    .from("users")
    .update({
      elo: ELO_START,
      credits: SEASON_STARTING_CREDITS,
      current_streak: 0,
    })
    .not("id", "is", null);
  if (resetErr) throw resetErr;

  return {
    rolled: true,
    previousSeasonId: active.id,
    newSeasonId: inserted?.id as string,
    usersArchived: list.length,
  };
}
