import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "./constants";
import {
  domeConfigured,
  fetchDomeKalshiByTicker,
  fetchDomeKalshiMarkets,
  fetchDomePolymarketByCondition,
  fetchDomePolymarketMarkets,
  type DomeKalshiMarket,
  type DomePolymarketMarket,
} from "./dome-api";
import { resolveMarket } from "./resolve-market";

const SOURCE_POLY = "dome_polymarket" as const;
const SOURCE_KALSHI = "dome_kalshi" as const;

export type DomePolyMeta = {
  resolver: "dome_polymarket";
  condition_id: string;
  market_slug?: string;
};

export type DomeKalshiMeta = {
  resolver: "dome_kalshi";
  market_ticker: string;
};

export type DomeSyncReport = {
  polyCreated: number;
  kalshiCreated: number;
  resolved: number;
  skipped: number;
  errors: string[];
};

function numEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function categoryFromPolyTags(tags: string[] | undefined): Category {
  const blob = (tags ?? []).join(" ").toLowerCase();
  if (blob.includes("crypto") || blob.includes("bitcoin") || blob.includes("btc") || blob.includes("eth"))
    return "Finance/Markets";
  if (blob.includes("esport") || blob.includes("valorant") || blob.includes("csgo") || blob.includes("league"))
    return "Esports";
  if (
    blob.includes("nba") ||
    blob.includes("nfl") ||
    blob.includes("mlb") ||
    blob.includes("soccer") ||
    blob.includes("ufc") ||
    blob.includes("sport")
  )
    return "Sports";
  if (blob.includes("science") || blob.includes("tech") || blob.includes("ai "))
    return "Science/Tech";
  if (blob.includes("culture") || blob.includes("oscar") || blob.includes("movie"))
    return "Culture";
  if (blob.includes("geopol") || blob.includes("war ") || blob.includes("nato"))
    return "Geopolitics";
  return "Politics";
}

function predictionCloseAndResolution(endSec: number): { close: Date; resolution: Date } | null {
  const endMs = endSec * 1000;
  if (!Number.isFinite(endMs) || endMs <= Date.now() + 3_600_000) return null;

  const resolution = new Date(endMs);
  let closeMs = endMs - 3_600_000;
  const minClose = Date.now() + 1_200_000;
  if (closeMs < minClose) closeMs = minClose;
  if (closeMs >= endMs - 120_000) closeMs = endMs - 120_000;
  return { close: new Date(closeMs), resolution };
}

function kalshiSkip(m: DomeKalshiMarket): boolean {
  const t = m.market_ticker ?? "";
  if (!t) return true;
  if (t.includes("KXMV")) return true;
  const title = m.title ?? "";
  if (title.split(",").length > 4) return true;
  return false;
}

function mapKalshiResultToOption(result: string): "Yes" | "No" | null {
  const r = result.trim().toLowerCase();
  if (r === "yes") return "Yes";
  if (r === "no") return "No";
  return null;
}

function mapPolyWinner(m: DomePolymarketMarket, options: string[]): string | null {
  const ws = m.winning_side?.trim();
  if (!ws) return null;
  for (const o of options) {
    if (o.toLowerCase() === ws.toLowerCase()) return o;
  }
  const la = m.side_a?.label?.trim();
  const lb = m.side_b?.label?.trim();
  if (ws === "a" || ws === "A") return options.find((o) => la && o === la) ?? options[0] ?? null;
  if (ws === "b" || ws === "B") return options.find((o) => lb && o === lb) ?? options[1] ?? null;
  return null;
}

async function ingestPolymarketPage(
  admin: SupabaseClient,
  report: DomeSyncReport,
  pagination_key: string | undefined,
  limit: number,
  min_volume: number,
): Promise<string | undefined> {
  const data = await fetchDomePolymarketMarkets({
    status: "open",
    limit,
    min_volume,
    pagination_key,
  });

  for (const m of data.markets ?? []) {
    const cid = m.condition_id?.trim();
    const title = m.title?.trim();
    const a = m.side_a?.label?.trim();
    const b = m.side_b?.label?.trim();
    if (!cid || !title || !a || !b || a === b) {
      report.skipped++;
      continue;
    }
    const end = m.end_time ?? 0;
    const bounds = predictionCloseAndResolution(end);
    if (!bounds) {
      report.skipped++;
      continue;
    }

    const { data: exists } = await admin
      .from("markets")
      .select("id")
      .eq("external_source", SOURCE_POLY)
      .eq("external_id", cid)
      .maybeSingle();
    if (exists) continue;

    const options = [a, b];
    const desc = [
      m.description?.trim(),
      m.resolution_source && `Resolution source: ${m.resolution_source}`,
      `Mirrors live Polymarket liquidity via Dome. Resolves when Dome reports this market closed with a winning side.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const meta: DomePolyMeta = { resolver: "dome_polymarket", condition_id: cid, market_slug: m.market_slug };
    const { error } = await admin.from("markets").insert({
      title: `Polymarket: ${title.slice(0, 200)}`,
      description: desc.slice(0, 8000) || "Polymarket market (Dome).",
      category: categoryFromPolyTags(m.tags),
      options,
      close_date: bounds.close.toISOString(),
      resolution_date: bounds.resolution.toISOString(),
      status: "open",
      external_source: SOURCE_POLY,
      external_id: cid,
      metadata: {
        ...meta,
        resolution_criteria:
          (m.description?.trim() && m.description.trim().slice(0, 4000)) ||
          "Resolves to the outcome designated by Polymarket / Dome (winning_side) when the market closes.",
        image_url: m.image,
      } as unknown as Record<string, unknown>,
    });

    if (error) {
      if (error.code === "23505") {
        report.skipped++;
        continue;
      }
      report.errors.push(`poly insert ${cid}: ${error.message}`);
      continue;
    }
    report.polyCreated++;
  }

  return data.pagination?.has_more ? data.pagination.pagination_key : undefined;
}

async function ingestKalshiPage(
  admin: SupabaseClient,
  report: DomeSyncReport,
  pagination_key: string | undefined,
  limit: number,
  min_volume: number,
): Promise<string | undefined> {
  const data = await fetchDomeKalshiMarkets({
    status: "open",
    limit,
    min_volume,
    pagination_key,
  });

  for (const m of data.markets ?? []) {
    if (kalshiSkip(m)) {
      report.skipped++;
      continue;
    }
    const ticker = m.market_ticker!.trim();
    const title = m.title?.trim();
    if (!title) {
      report.skipped++;
      continue;
    }
    const end = m.end_time ?? m.close_time ?? 0;
    const bounds = predictionCloseAndResolution(typeof end === "number" ? end : 0);
    if (!bounds) {
      report.skipped++;
      continue;
    }

    const { data: exists } = await admin
      .from("markets")
      .select("id")
      .eq("external_source", SOURCE_KALSHI)
      .eq("external_id", ticker)
      .maybeSingle();
    if (exists) continue;

    const meta: DomeKalshiMeta = { resolver: "dome_kalshi", market_ticker: ticker };
    const { error } = await admin.from("markets").insert({
      title: `Kalshi: ${title.slice(0, 200)}`,
      description: [
        `Kalshi market \`${ticker}\` (event ${m.event_ticker ?? "—"}).`,
        "Binary contract mirrored via Dome. Resolves Yes/No per Kalshi settlement as reported by Dome.",
      ].join("\n"),
      category: "Finance/Markets",
      options: ["Yes", "No"],
      close_date: bounds.close.toISOString(),
      resolution_date: bounds.resolution.toISOString(),
      status: "open",
      external_source: SOURCE_KALSHI,
      external_id: ticker,
      metadata: {
        ...meta,
        resolution_criteria: "Resolves per Kalshi official settlement; Plains uses Dome's reported result (yes/no).",
      } as unknown as Record<string, unknown>,
    });

    if (error) {
      if (error.code === "23505") {
        report.skipped++;
        continue;
      }
      report.errors.push(`kalshi insert ${ticker}: ${error.message}`);
      continue;
    }
    report.kalshiCreated++;
  }

  return data.pagination?.has_more ? data.pagination.pagination_key : undefined;
}

async function resolveDomeMarkets(admin: SupabaseClient, report: DomeSyncReport): Promise<void> {
  const now = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("markets")
    .select("id, options, metadata")
    .eq("status", "open")
    .lte("resolution_date", now)
    .in("external_source", [SOURCE_POLY, SOURCE_KALSHI]);

  if (error) {
    report.errors.push(`dome resolve query: ${error.message}`);
    return;
  }

  for (const row of rows ?? []) {
    const meta = row.metadata as DomePolyMeta | DomeKalshiMeta | null;
    if (!meta?.resolver) continue;

    try {
      if (meta.resolver === "dome_polymarket") {
        const fresh =
          (await fetchDomePolymarketByCondition(meta.condition_id, "closed")) ??
          (await fetchDomePolymarketByCondition(meta.condition_id, "open"));

        if (!fresh || fresh.status !== "closed") {
          report.skipped++;
          continue;
        }
        const options = row.options as string[];
        const correct = mapPolyWinner(fresh, options);
        if (!correct) {
          report.errors.push(`poly ${meta.condition_id}: no winning_side`);
          continue;
        }
        await resolveMarket(admin, row.id, correct);
        report.resolved++;
      } else if (meta.resolver === "dome_kalshi") {
        const fresh =
          (await fetchDomeKalshiByTicker(meta.market_ticker, "closed")) ??
          (await fetchDomeKalshiByTicker(meta.market_ticker, "open"));

        if (!fresh) {
          report.skipped++;
          continue;
        }
        const r = fresh.result;
        const settled =
          fresh.status === "closed" || (r != null && String(r).trim() !== "");
        if (!settled) {
          report.skipped++;
          continue;
        }
        if (r == null || !String(r).trim()) {
          report.skipped++;
          continue;
        }
        const correct = mapKalshiResultToOption(String(r));
        if (!correct) {
          report.errors.push(`kalshi ${meta.market_ticker}: bad result ${r}`);
          continue;
        }
        await resolveMarket(admin, row.id, correct);
        report.resolved++;
      }
    } catch (e) {
      report.errors.push(`dome resolve ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

/**
 * Pulls trending open markets from Polymarket + Kalshi via Dome, then resolves due Dome mirrors.
 */
export async function runDomeSync(admin: SupabaseClient): Promise<DomeSyncReport> {
  const report: DomeSyncReport = {
    polyCreated: 0,
    kalshiCreated: 0,
    resolved: 0,
    skipped: 0,
    errors: [],
  };

  if (!domeConfigured()) {
    report.errors.push("DOME_API_KEY not set — skipping Dome ingest");
    await resolveDomeMarkets(admin, report);
    return report;
  }

  const limit = Math.min(100, Math.max(1, numEnv("DOME_INGEST_LIMIT", 40)));
  const pages = Math.min(10, Math.max(1, numEnv("DOME_INGEST_PAGES", 2)));
  const polyMinVol = numEnv("DOME_POLY_MIN_VOLUME", 25_000);
  const kalshiMinVol = numEnv("DOME_KALSHI_MIN_VOLUME", 5_000);

  try {
    let polyKey: string | undefined;
    for (let p = 0; p < pages; p++) {
      polyKey = await ingestPolymarketPage(admin, report, polyKey, limit, polyMinVol);
      if (!polyKey) break;
    }
  } catch (e) {
    report.errors.push(`Dome Polymarket: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    let ksKey: string | undefined;
    for (let p = 0; p < pages; p++) {
      ksKey = await ingestKalshiPage(admin, report, ksKey, limit, kalshiMinVol);
      if (!ksKey) break;
    }
  } catch (e) {
    report.errors.push(`Dome Kalshi: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    await resolveDomeMarkets(admin, report);
  } catch (e) {
    report.errors.push(`Dome resolve: ${e instanceof Error ? e.message : String(e)}`);
  }

  return report;
}
