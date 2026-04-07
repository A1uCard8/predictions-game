/**
 * SteamAnalyst CS2 skin pricing API
 * Docs: https://www.steamanalyst.com/api-info https://www.steamanalyst.com/api-doc
 *
 * Env: STEAMANALYST_API_KEY
 */

const BASE = "https://api.steamanalyst.com";

export type SteamAnalystItem = {
  market_name?: string;
  /** Some responses use `name` instead of `market_name`. */
  name?: string;
  market_hash_name?: string;
  avg_price_7_days?: string;
  avg_price_7_days_raw?: number;
  avg_price_30_days_raw?: number;
  /** Older / summary field in some examples */
  avg_price?: string | number;
  suggested_amount_avg_raw?: number;
  suggested_amount_min_raw?: number;
  safe_price_raw?: number;
  current_price?: string;
  ongoing_price_manipulation?: string | number;
  img?: string;
  link?: string;
  rarity?: string;
};

function key() {
  return process.env.STEAMANALYST_API_KEY?.trim() ?? "";
}

export function steamAnalystConfigured(): boolean {
  return key().length > 0;
}

/** Normalize for fuzzy compare (star variants, spacing). */
export function normalizeMarketLabel(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\u2605/g, "*")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ");
}

function coalesceName(row: SteamAnalystItem): string {
  const n = row.market_name ?? row.name ?? row.market_hash_name;
  return typeof n === "string" ? n.trim() : "";
}

/** Ensure `market_name` is set for downstream code. */
export function normalizeSteamRow(row: SteamAnalystItem): SteamAnalystItem {
  const market_name = coalesceName(row) || undefined;
  return { ...row, market_name };
}

function parseMoney(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

/** Prefer 7d average; rare items may only have suggested_*; respect manipulation → safe_price. */
export function steamanalystReferenceUsd(row: SteamAnalystItem): number | null {
  const manip = String(row.ongoing_price_manipulation ?? "0") === "1";
  if (manip && row.safe_price_raw != null && Number.isFinite(row.safe_price_raw)) {
    return row.safe_price_raw;
  }
  const cands = [
    row.avg_price_7_days_raw,
    parseMoney(row.avg_price_7_days),
    parseMoney(row.avg_price),
    row.suggested_amount_min_raw,
    row.suggested_amount_avg_raw,
  ];
  for (const v of cands) {
    if (v != null && Number.isFinite(v) && v > 0) return v;
  }
  return null;
}

function extractItems(data: unknown): SteamAnalystItem[] {
  if (Array.isArray(data)) return data.map((x) => normalizeSteamRow(x as SteamAnalystItem));
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  for (const k of ["data", "items", "prices", "results", "list"]) {
    const v = o[k];
    if (Array.isArray(v)) return v.map((x) => normalizeSteamRow(x as SteamAnalystItem));
  }
  if ("market_name" in o || "name" in o || "market_hash_name" in o) {
    return [normalizeSteamRow(data as SteamAnalystItem)];
  }
  return [];
}

export async function fetchSteamAnalystPrices(): Promise<SteamAnalystItem[]> {
  const k = key();
  if (!k) return [];

  const urls = [
    `${BASE}/v2/prices?apikey=${encodeURIComponent(k)}`,
    `${BASE}/v2/${encodeURIComponent(k)}`,
  ];

  let lastStatus = "";
  let lastBody = "";
  for (const url of urls) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      lastStatus = String(res.status);
      lastBody = await res.text().catch(() => "");
      try {
        const j = JSON.parse(lastBody) as { success?: boolean; error?: { code?: string; message?: string } };
        if (j?.error?.message) {
          lastBody = `${j.error.code ?? "error"}: ${j.error.message}`;
        }
      } catch {
        /* keep raw body */
      }
      continue;
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      continue;
    }
    const items = extractItems(data);
    if (items.length > 0) return items;
  }

  const hint =
    lastStatus === "401" || lastStatus === "403"
      ? " (invalid or missing API key, or plan does not include this endpoint)"
      : "";
  throw new Error(
    `SteamAnalyst: no item list (last HTTP ${lastStatus || "?"}${lastBody ? `: ${lastBody.slice(0, 120)}` : ""})${hint}`,
  );
}
