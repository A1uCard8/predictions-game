import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractVlrMatchId,
  fetchV2Matches,
  parseMatchStartTime,
  type VlrMatchSegment,
} from "./vlrggapi";
import { resolveMarket } from "./resolve-market";

const SOURCE = "vlr" as const;
const CATEGORY = "Esports";

export type ValorantSyncReport = {
  created: number;
  resolved: number;
  skipped: number;
  errors: string[];
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseLeadingInt(v: unknown): number {
  if (v === undefined || v === null) return NaN;
  const m = String(v).trim().match(/^\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

/**
 * Map API winner name to the exact option string stored on the market.
 */
function pickWinningOption(
  options: string[],
  apiTeam1: string,
  apiTeam2: string,
  winnerName: string
): string | null {
  const w = norm(winnerName);
  for (const o of options) {
    if (norm(o) === w) return o;
  }
  const t1 = norm(apiTeam1);
  const t2 = norm(apiTeam2);
  if (w === t1 && options[0]) return options[0];
  if (w === t2 && options[1]) return options[1];
  for (const o of options) {
    const no = norm(o);
    if (no && (w.includes(no) || no.includes(w))) return o;
  }
  return null;
}

function describeUpcoming(seg: VlrMatchSegment, matchId: string): string {
  const lines = [
    seg.match_event && `Event: ${seg.match_event}`,
    seg.match_series && `Series: ${seg.match_series}`,
    `VLR match id: ${matchId}`,
    seg.match_page && `Source: ${seg.match_page.startsWith("http") ? seg.match_page : `https://www.vlr.gg${seg.match_page}`}`,
  ].filter(Boolean);
  return lines.join("\n") || `Valorant pro match ${matchId}`;
}

export async function runValorantSync(admin: SupabaseClient): Promise<ValorantSyncReport> {
  const report: ValorantSyncReport = {
    created: 0,
    resolved: 0,
    skipped: 0,
    errors: [],
  };

  const base = process.env.VLRGGAPI_BASE_URL?.trim();
  if (!base) {
    report.errors.push("VLRGGAPI_BASE_URL is not set");
    return report;
  }

  let upcoming: VlrMatchSegment[] = [];
  let results: VlrMatchSegment[] = [];

  try {
    upcoming = await fetchV2Matches(base, "upcoming", Number(process.env.VLR_SYNC_UPCOMING_PAGES ?? "1") || 1);
  } catch (e) {
    report.errors.push(`upcoming: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    results = await fetchV2Matches(base, "results", Number(process.env.VLR_SYNC_RESULTS_PAGES ?? "2") || 2);
  } catch (e) {
    report.errors.push(`results: ${e instanceof Error ? e.message : String(e)}`);
  }

  const now = Date.now();

  for (const seg of upcoming) {
    const team1 = seg.team1?.trim();
    const team2 = seg.team2?.trim();
    const matchPage = seg.match_page;
    const matchId = extractVlrMatchId(matchPage);

    if (!team1 || !team2 || !matchId) {
      report.skipped++;
      continue;
    }

    const { data: existing } = await admin
      .from("markets")
      .select("id")
      .eq("external_source", SOURCE)
      .eq("external_id", matchId)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const start = parseMatchStartTime(seg) ?? new Date(now + 3_600_000);
    if (start.getTime() <= now) {
      report.skipped++;
      continue;
    }

    const closeMs = start.getTime();
    const close = new Date(closeMs);
    const resolution = new Date(closeMs + 6 * 3600_000);

    const title = `Valorant: ${team1} vs ${team2} — winner?`;

    const { error } = await admin.from("markets").insert({
      title,
      description: describeUpcoming(seg, matchId),
      category: CATEGORY,
      options: [team1, team2],
      close_date: close.toISOString(),
      resolution_date: resolution.toISOString(),
      status: "open",
      external_source: SOURCE,
      external_id: matchId,
    });

    if (error) {
      if (error.code === "23505") {
        report.skipped++;
        continue;
      }
      report.errors.push(`insert ${matchId}: ${error.message}`);
      continue;
    }
    report.created++;
  }

  for (const seg of results) {
    const team1 = seg.team1?.trim();
    const team2 = seg.team2?.trim();
    const matchPage = seg.match_page;
    const matchId = extractVlrMatchId(matchPage);

    if (!team1 || !team2 || !matchId) {
      report.skipped++;
      continue;
    }

    const s1 = parseLeadingInt(seg.score1);
    const s2 = parseLeadingInt(seg.score2);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 === s2) {
      report.skipped++;
      continue;
    }

    const winnerName = s1 > s2 ? team1 : team2;

    const { data: market } = await admin
      .from("markets")
      .select("id, status, options")
      .eq("external_source", SOURCE)
      .eq("external_id", matchId)
      .maybeSingle();

    if (!market || market.status === "resolved") {
      continue;
    }

    const options = market.options as string[];
    if (!Array.isArray(options) || options.length < 2) {
      report.errors.push(`market ${market.id} bad options`);
      continue;
    }

    const correct = pickWinningOption(options, team1, team2, winnerName);
    if (!correct) {
      report.errors.push(`Could not map winner "${winnerName}" for match ${matchId}`);
      continue;
    }

    try {
      await resolveMarket(admin, market.id, correct);
      report.resolved++;
    } catch (e) {
      report.errors.push(`resolve ${matchId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return report;
}
