import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchSteamAnalystPrices,
  normalizeMarketLabel,
  steamAnalystConfigured,
  steamanalystReferenceUsd,
  type SteamAnalystItem,
} from "./steamanalyst";
import { resolveMarket } from "./resolve-market";

const SOURCE = "steamanalyst" as const;

export type Cs2SteamMeta = {
  resolver: "steamanalyst_price_target";
  market_name: string;
  strike_usd: number;
  reference_usd_at_create: number;
};

export type Cs2SteamSyncReport = {
  /** False when `STEAMANALYST_API_KEY` is missing — no CS2 markets will be created. */
  steamanalystConfigured: boolean;
  created: number;
  resolved: number;
  skipped: number;
  errors: string[];
  /** How many rows SteamAnalyst returned after parsing (for debugging). */
  apiItemCount: number;
  /** Seeds that had no matching row in the feed (exact or fuzzy). */
  unmatchedSeeds: string[];
};

function numEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

const DEFAULT_MARKET_NAMES = [
  "★ Karambit | Fade (Factory New)",
  "★ M9 Bayonet | Doppler (Factory New)",
  "★ Butterfly Knife | Marble Fade (Factory New)",
  "★ Sport Gloves | Pandora's Box (Field-Tested)",
  "★ Specialist Gloves | Crimson Kimono (Field-Tested)",
  "AWP | Dragon Lore (Field-Tested)",
  "★ Bayonet | Gamma Doppler (Factory New)",
  "M4A4 | Howl (Minimal Wear)",
  "AK-47 | Wild Lotus (Field-Tested)",
  "★ Skeleton Knife | Fade (Factory New)",
];

function seedNames(): string[] {
  const raw = process.env.CS2_SKIN_MARKET_NAMES?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_MARKET_NAMES;
}

function slugId(marketName: string, strike: number, resolutionDay: string) {
  const base = `${marketName}|${strike}|${resolutionDay}`.toLowerCase().replace(/\s+/g, " ");
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return `sa_${Math.abs(h).toString(16)}`;
}

function indexByMarketName(rows: SteamAnalystItem[]): Map<string, SteamAnalystItem> {
  const m = new Map<string, SteamAnalystItem>();
  for (const r of rows) {
    const name = r.market_name?.trim();
    if (!name) continue;
    m.set(name.toLowerCase(), r);
    m.set(normalizeMarketLabel(name), r);
  }
  return m;
}

/** Exact (case-insensitive) then normalized, then substring match on normalized labels. */
function findRowForSeed(all: SteamAnalystItem[], byLower: Map<string, SteamAnalystItem>, seed: string): SteamAnalystItem | null {
  const t = seed.trim();
  if (!t) return null;
  const exact = byLower.get(t.toLowerCase());
  if (exact?.market_name) return exact;
  const normSeed = normalizeMarketLabel(t);
  const normHit = byLower.get(normSeed);
  if (normHit?.market_name) return normHit;
  for (const r of all) {
    const n = r.market_name?.trim();
    if (!n) continue;
    if (normalizeMarketLabel(n) === normSeed) return r;
  }

  const seedParts = normSeed.split("|").map((s) => s.trim()).filter(Boolean);
  if (seedParts.length >= 2) {
    const [weapon, skinWear] = seedParts;
    const skinToken = skinWear.replace(/\([^)]+\)\s*$/, "").trim();
    for (const r of all) {
      const n = r.market_name?.trim();
      if (!n) continue;
      const nr = normalizeMarketLabel(n);
      if (nr.includes(weapon) && nr.includes(skinToken)) return r;
    }
  }

  return null;
}

async function insertCs2Market(
  admin: SupabaseClient,
  row: SteamAnalystItem,
  seedLabel: string,
  targetPct: number,
  horizonDays: number,
  minRef: number,
  resolutionYmd: string,
  close: Date,
  resolution: Date,
  report: Cs2SteamSyncReport,
): Promise<boolean> {
  const ref = steamanalystReferenceUsd(row);
  if (ref == null || ref < minRef) {
    report.skipped++;
    return false;
  }

  const marketName = row.market_name!.trim();
  const strike = Math.round(ref * (1 + targetPct / 100) * 100) / 100;
  const extId = slugId(seedLabel || marketName, strike, resolutionYmd);

  const meta: Cs2SteamMeta = {
    resolver: "steamanalyst_price_target",
    market_name: marketName,
    strike_usd: strike,
    reference_usd_at_create: ref,
  };

  const title = `CS2: Will ${marketName} SteamAnalyst ref. price reach ≥ $${strike.toFixed(2)} USD by ${resolutionYmd}?`;
  const desc = [
    `Uses SteamAnalyst (7-day average where available; safe price if manipulation flag).`,
    `Reference at creation: **$${ref.toFixed(2)}** → target **$${strike.toFixed(2)}** (+${targetPct}% challenge, ~${horizonDays} days).`,
    `**Yes** if that reference is **≥ $${strike.toFixed(2)}** at resolution.`,
    `**No** otherwise.`,
  ].join("\n\n");

  const crit = [
    `Resolution: SteamAnalyst API for \`${marketName}\`, same reference rules as at creation (7d avg, or safe_price if manipulation).`,
    `Yes if value ≥ ${strike} USD.`,
  ].join(" ");

  const { error } = await admin.from("markets").insert({
    title: title.slice(0, 500),
    description: desc.slice(0, 8000),
    category: "CS2",
    options: ["Yes", "No"],
    close_date: close.toISOString(),
    resolution_date: resolution.toISOString(),
    status: "open",
    external_source: SOURCE,
    external_id: extId,
    metadata: {
      ...meta,
      resolution_criteria: crit,
      image_url: row.img ?? null,
      steamanalyst_link: row.link ?? null,
    } as unknown as Record<string, unknown>,
  });

  if (error) {
    if (error.code === "23505") {
      report.skipped++;
      return false;
    }
    report.errors.push(`cs2 insert ${marketName}: ${error.message}`);
    return false;
  }
  report.created++;
  return true;
}

export async function runCs2SteamAnalystSync(admin: SupabaseClient): Promise<Cs2SteamSyncReport> {
  const configured = steamAnalystConfigured();
  const report: Cs2SteamSyncReport = {
    steamanalystConfigured: configured,
    created: 0,
    resolved: 0,
    skipped: 0,
    errors: [],
    apiItemCount: 0,
    unmatchedSeeds: [],
  };

  if (!configured) {
    report.errors.push(
      "cs2: STEAMANALYST_API_KEY is not set — CS2 markets are skipped. Add the key to .env.local (and Vercel env) then run ingest.",
    );
    return report;
  }

  let all: SteamAnalystItem[] = [];
  try {
    all = await fetchSteamAnalystPrices();
  } catch (e) {
    report.errors.push(`cs2 prices: ${e instanceof Error ? e.message : String(e)}`);
    return report;
  }

  report.apiItemCount = all.length;
  if (all.length === 0) {
    report.errors.push("cs2: SteamAnalyst returned zero items — check API key and plan limits.");
    return report;
  }

  const maxCreate = Math.max(0, Math.min(24, numEnv("CS2_MAX_MARKETS_PER_RUN", 8)));
  const targetPct = numEnv("CS2_TARGET_PCT", 4);
  const horizonDays = Math.max(7, Math.min(56, numEnv("CS2_HORIZON_DAYS", 28)));
  const minRef = numEnv("CS2_MIN_REFERENCE_USD", 50);

  const now = new Date();
  const close = new Date(now.getTime() + horizonDays * 86400000);
  const resolution = new Date(close);
  const resolutionYmd = resolution.toISOString().slice(0, 10);

  const byLower = indexByMarketName(all);
  const names = seedNames();
  const usedMarketKeys = new Set<string>();
  let createdThisRun = 0;

  for (const seed of names) {
    if (createdThisRun >= maxCreate) break;
    const row = findRowForSeed(all, byLower, seed);
    if (!row?.market_name) {
      report.unmatchedSeeds.push(seed);
      report.skipped++;
      continue;
    }
    const key = row.market_name.trim().toLowerCase();
    if (usedMarketKeys.has(key)) continue;
    const ok = await insertCs2Market(
      admin,
      row,
      seed,
      targetPct,
      horizonDays,
      minRef,
      resolutionYmd,
      close,
      resolution,
      report,
    );
    if (ok) {
      usedMarketKeys.add(key);
      createdThisRun++;
    }
  }

  /* If seeds matched nothing (or env list is wrong), still create markets from the most expensive liquid rows. */
  if (createdThisRun < maxCreate && all.length > 0) {
    const ranked = all
      .filter((r) => r.market_name?.trim())
      .map((r) => ({ r, ref: steamanalystReferenceUsd(r) }))
      .filter((x): x is { r: SteamAnalystItem; ref: number } => x.ref != null && x.ref >= minRef)
      .sort((a, b) => b.ref - a.ref);

    for (const { r } of ranked) {
      if (createdThisRun >= maxCreate) break;
      const key = r.market_name!.trim().toLowerCase();
      if (usedMarketKeys.has(key)) continue;
      const ok = await insertCs2Market(
        admin,
        r,
        r.market_name!,
        targetPct,
        horizonDays,
        minRef,
        resolutionYmd,
        close,
        resolution,
        report,
      );
      if (ok) {
        usedMarketKeys.add(key);
        createdThisRun++;
      }
    }
    if (createdThisRun > 0 && report.unmatchedSeeds.length > 0) {
      report.errors.push(
        `cs2: filled ${createdThisRun} from top-priced API rows (seed names did not match; set CS2_SKIN_MARKET_NAMES or rely on fallback).`,
      );
    }
  }

  if (createdThisRun === 0 && report.created === 0) {
    report.errors.push(
      `cs2: no markets created (min ref $${minRef}, try lowering CS2_MIN_REFERENCE_USD or check unmatched seeds vs API names).`,
    );
  }

  await resolveCs2Markets(admin, report);
  return report;
}

async function resolveCs2Markets(admin: SupabaseClient, report: Cs2SteamSyncReport): Promise<void> {
  const now = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("markets")
    .select("id, metadata")
    .eq("status", "open")
    .eq("external_source", SOURCE)
    .lte("resolution_date", now);

  if (error) {
    report.errors.push(`cs2 resolve query: ${error.message}`);
    return;
  }

  if (!rows?.length) return;

  let all: SteamAnalystItem[] = [];
  try {
    all = await fetchSteamAnalystPrices();
  } catch (e) {
    report.errors.push(`cs2 resolve prices: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  const byLower = indexByMarketName(all);

  for (const row of rows) {
    const meta = row.metadata as Cs2SteamMeta | null;
    if (!meta || meta.resolver !== "steamanalyst_price_target") continue;

    try {
      const item =
        byLower.get(meta.market_name.trim().toLowerCase()) ??
        findRowForSeed(all, byLower, meta.market_name);
      if (!item) {
        report.errors.push(`cs2 resolve ${row.id}: item not in API`);
        report.skipped++;
        continue;
      }
      const px = steamanalystReferenceUsd(item);
      if (px == null) {
        report.skipped++;
        continue;
      }
      const yes = px >= meta.strike_usd;
      await resolveMarket(admin, row.id, yes ? "Yes" : "No");
      report.resolved++;
    } catch (e) {
      report.errors.push(`cs2 resolve ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
