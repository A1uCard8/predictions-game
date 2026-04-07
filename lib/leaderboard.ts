import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_LEADER_MIN_PREDICTIONS } from "./constants";

export type LeaderRow = {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  elo: number;
  wins: number;
  total: number;
  winPct: number;
  credits?: number;
  currentStreak?: number;
  /** Win % on resolved picks where implied crowd on your side was &lt; 50% (minority / contrarian). */
  contrarianWinPct: number | null;
};

function winPct(wins: number, total: number) {
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

export async function getGlobalLeaderboard(
  admin: SupabaseClient
): Promise<LeaderRow[]> {
  const { data: users, error: uErr } = await admin
    .from("users")
    .select("id, username, avatar_url, elo, credits, current_streak")
    .order("elo", { ascending: false });
  if (uErr) throw uErr;

  const { data: preds, error: pErr } = await admin
    .from("predictions")
    .select("user_id, is_correct")
    .not("is_correct", "is", null);
  if (pErr) throw pErr;

  const { data: contrPreds, error: cErr } = await admin
    .from("predictions")
    .select("user_id, is_correct, pick_implied_p")
    .not("is_correct", "is", null)
    .not("pick_implied_p", "is", null);
  if (cErr) throw cErr;

  const stats = new Map<string, { wins: number; total: number }>();
  for (const p of preds ?? []) {
    const s = stats.get(p.user_id) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    stats.set(p.user_id, s);
  }

  const contrarian = new Map<string, { wins: number; total: number }>();
  for (const p of contrPreds ?? []) {
    const imp = p.pick_implied_p as number | null;
    if (imp == null || imp >= 0.5) continue;
    const s = contrarian.get(p.user_id) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    contrarian.set(p.user_id, s);
  }

  return (users ?? []).map((u, i) => {
    const s = stats.get(u.id) ?? { wins: 0, total: 0 };
    const c = contrarian.get(u.id);
    const cw = c?.wins ?? 0;
    const ct = c?.total ?? 0;
    return {
      rank: i + 1,
      user_id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      elo: u.elo,
      wins: s.wins,
      total: s.total,
      winPct: winPct(s.wins, s.total),
      credits: typeof u.credits === "number" ? u.credits : undefined,
      currentStreak: typeof u.current_streak === "number" ? u.current_streak : undefined,
      contrarianWinPct: ct > 0 ? winPct(cw, ct) : null,
    };
  });
}

export async function getCategoryLeaderboard(
  admin: SupabaseClient,
  category: string
): Promise<LeaderRow[]> {
  const { data: markets, error: mErr } = await admin
    .from("markets")
    .select("id")
    .eq("category", category)
    .eq("status", "resolved");
  if (mErr) throw mErr;
  const marketIds = new Set((markets ?? []).map((m) => m.id));
  if (marketIds.size === 0) return [];

  const { data: preds, error: pErr } = await admin
    .from("predictions")
    .select("user_id, is_correct, market_id, pick_implied_p")
    .not("is_correct", "is", null);
  if (pErr) throw pErr;

  const stats = new Map<string, { wins: number; total: number }>();
  for (const p of preds ?? []) {
    if (!marketIds.has(p.market_id)) continue;
    const s = stats.get(p.user_id) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    stats.set(p.user_id, s);
  }

  const eligible = Array.from(stats.entries()).filter(
    ([, s]) => s.total >= CATEGORY_LEADER_MIN_PREDICTIONS
  );
  if (eligible.length === 0) return [];

  const { data: users, error: uErr } = await admin
    .from("users")
    .select("id, username, avatar_url, elo, credits, current_streak");
  if (uErr) throw uErr;
  const byId = new Map((users ?? []).map((u) => [u.id, u]));

  const contrarian = new Map<string, { wins: number; total: number }>();
  for (const p of preds ?? []) {
    if (!marketIds.has(p.market_id)) continue;
    const imp = p.pick_implied_p as number | null | undefined;
    if (imp == null || imp >= 0.5) continue;
    const s = contrarian.get(p.user_id) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    contrarian.set(p.user_id, s);
  }

  const rows: LeaderRow[] = eligible
    .map(([userId, s]) => {
      const u = byId.get(userId);
      if (!u) return null;
      const c = contrarian.get(userId);
      const cw = c?.wins ?? 0;
      const ct = c?.total ?? 0;
      return {
        rank: 0,
        user_id: userId,
        username: u.username,
        avatar_url: u.avatar_url,
        elo: u.elo,
        wins: s.wins,
        total: s.total,
        winPct: winPct(s.wins, s.total),
        credits: typeof (u as { credits?: number }).credits === "number" ? (u as { credits?: number }).credits : undefined,
        currentStreak:
          typeof (u as { current_streak?: number }).current_streak === "number"
            ? (u as { current_streak?: number }).current_streak
            : undefined,
        contrarianWinPct: ct > 0 ? winPct(cw, ct) : null,
      };
    })
    .filter(Boolean) as LeaderRow[];

  rows.sort((a, b) => {
    const pa = a.winPct - b.winPct;
    if (pa !== 0) return b.winPct - a.winPct;
    return b.elo - a.elo;
  });

  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}

export async function getUserGlobalRank(
  admin: SupabaseClient,
  userId: string
): Promise<number | null> {
  const board = await getGlobalLeaderboard(admin);
  const row = board.find((r) => r.user_id === userId);
  return row?.rank ?? null;
}
