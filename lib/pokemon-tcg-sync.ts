import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMarket } from "./resolve-market";

const SOURCE = "tcgdex" as const;
const API_BASE = "https://api.tcgdex.net/v2";

/** How we read a reference price at creation and again at resolution. */
export type TcgdexPriceBasis =
  | "tcgp_holo_market"
  | "tcgp_normal_market"
  | "tcgp_holo_mid"
  | "tcgp_normal_mid"
  | "cm_trend";

export type TcgdexPriceMeta = {
  resolver: "tcgdex_price_floor";
  card_id: string;
  basis: TcgdexPriceBasis;
  strike: number;
  currency: "USD" | "EUR";
  spot_at_create: number;
};

export type PokemonTcgSyncReport = {
  created: number;
  resolved: number;
  skipped: number;
  errors: string[];
};

type TcgPricing = {
  tcgplayer?: {
    updated?: string;
    unit?: string;
    holo?: { marketPrice?: number; midPrice?: number; lowPrice?: number };
    normal?: { marketPrice?: number; midPrice?: number; lowPrice?: number };
    reverse?: { marketPrice?: number; midPrice?: number };
  };
  cardmarket?: {
    unit?: string;
    trend?: number;
    avg?: number;
    low?: number;
  };
};

type TcgCardJson = {
  id?: string;
  name?: string;
  image?: string;
  pricing?: TcgPricing;
};

/** Chase / high-liquidity IDs on TCGdex (Cardmarket EUR and/or TCGplayer USD). Override with POKEMON_TCG_CARD_IDS. */
const DEFAULT_HIGH_VALUE_CARD_IDS: string[] = [
  "base1-4",
  "base1-15",
  "gym2-2",
  "pl4-1",
  "dp3-3",
  "sm7.5-3",
  "sm12-241",
];

function numEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function parseCardIds(): string[] {
  const raw = process.env.POKEMON_TCG_CARD_IDS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_HIGH_VALUE_CARD_IDS];
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function fetchTcgdexCard(cardId: string): Promise<TcgCardJson | null> {
  const res = await fetch(`${API_BASE}/en/cards/${encodeURIComponent(cardId)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const j = (await res.json()) as TcgCardJson & { status?: number; type?: string };
  if (j.status === 404 || j.type?.includes("not-found")) return null;
  return j;
}

function cardImageUrl(card: TcgCardJson): string | null {
  const base = card.image?.trim();
  if (!base) return null;
  if (base.endsWith(".png") || base.endsWith(".webp")) return base;
  return `${base.replace(/\/$/, "")}/high.webp`;
}

/**
 * Pick the strongest available price point (TCGplayer USD preferred, then Cardmarket trend EUR).
 */
export function pickReferencePrice(pricing: TcgPricing | undefined): {
  amount: number;
  currency: "USD" | "EUR";
  basis: TcgdexPriceBasis;
} | null {
  if (!pricing) return null;
  const tp = pricing.tcgplayer;
  if (tp?.holo?.marketPrice != null && tp.holo.marketPrice > 0) {
    return { amount: tp.holo.marketPrice, currency: "USD", basis: "tcgp_holo_market" };
  }
  if (tp?.normal?.marketPrice != null && tp.normal.marketPrice > 0) {
    return { amount: tp.normal.marketPrice, currency: "USD", basis: "tcgp_normal_market" };
  }
  if (tp?.holo?.midPrice != null && tp.holo.midPrice > 0) {
    return { amount: tp.holo.midPrice, currency: "USD", basis: "tcgp_holo_mid" };
  }
  if (tp?.normal?.midPrice != null && tp.normal.midPrice > 0) {
    return { amount: tp.normal.midPrice, currency: "USD", basis: "tcgp_normal_mid" };
  }
  const cm = pricing.cardmarket;
  if (cm?.trend != null && cm.trend > 0) {
    return { amount: cm.trend, currency: "EUR", basis: "cm_trend" };
  }
  if (cm?.avg != null && cm.avg > 0) {
    return { amount: cm.avg, currency: "EUR", basis: "cm_trend" };
  }
  return null;
}

function priceAtBasis(card: TcgCardJson, basis: TcgdexPriceBasis): number | null {
  const p = card.pricing;
  if (!p) return null;
  const tp = p.tcgplayer;
  const cm = p.cardmarket;
  switch (basis) {
    case "tcgp_holo_market":
      return tp?.holo?.marketPrice ?? null;
    case "tcgp_normal_market":
      return tp?.normal?.marketPrice ?? null;
    case "tcgp_holo_mid":
      return tp?.holo?.midPrice ?? null;
    case "tcgp_normal_mid":
      return tp?.normal?.midPrice ?? null;
    case "cm_trend":
      return cm?.trend ?? cm?.avg ?? null;
    default:
      return null;
  }
}

function fmtMoney(amount: number, currency: "USD" | "EUR"): string {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `€${amount.toFixed(2)}`;
}

export async function runPokemonTcgSync(admin: SupabaseClient): Promise<PokemonTcgSyncReport> {
  const report: PokemonTcgSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };

  const ids = parseCardIds();
  const maxCreate = Math.max(0, Math.min(20, numEnv("POKEMON_TCG_MAX_MARKETS_PER_RUN", 6)));
  const minSpotUsd = numEnv("POKEMON_TCG_MIN_SPOT_USD", 5);
  const minSpotEur = numEnv("POKEMON_TCG_MIN_SPOT_EUR", 5);
  const targetPct = numEnv("POKEMON_TCG_TARGET_PCT", 5);
  const horizonDays = Math.max(7, Math.min(90, numEnv("POKEMON_TCG_HORIZON_DAYS", 30)));

  type Scored = { card: TcgCardJson; ref: NonNullable<ReturnType<typeof pickReferencePrice>> };
  const scored: Scored[] = [];

  for (const id of ids) {
    const card = await fetchTcgdexCard(id);
    if (!card?.id || !card.name) {
      report.skipped++;
      continue;
    }
    const ref = pickReferencePrice(card.pricing);
    if (!ref) {
      report.skipped++;
      continue;
    }
    if (ref.currency === "USD" && ref.amount < minSpotUsd) {
      report.skipped++;
      continue;
    }
    if (ref.currency === "EUR" && ref.amount < minSpotEur) {
      report.skipped++;
      continue;
    }
    scored.push({ card, ref });
  }

  scored.sort((a, b) => b.ref.amount - a.ref.amount);
  const top = scored.slice(0, maxCreate);

  const now = Date.now();
  const resolution = new Date(now + horizonDays * 86400000);
  const close = new Date(now + Math.max(1, horizonDays - 2) * 86400000);
  const resolutionYmd = resolution.toISOString().slice(0, 10);

  for (const { card, ref } of top) {
    const cid = card.id!;
    const extId = `tcgdex-${cid}-${resolutionYmd}`;

    const { data: exists } = await admin
      .from("markets")
      .select("id")
      .eq("external_source", SOURCE)
      .eq("external_id", extId)
      .maybeSingle();
    if (exists) continue;

    const strike = roundMoney(ref.amount * (1 + targetPct / 100));
    if (strike <= ref.amount) {
      report.skipped++;
      continue;
    }

    const meta: TcgdexPriceMeta = {
      resolver: "tcgdex_price_floor",
      card_id: cid,
      basis: ref.basis,
      strike,
      currency: ref.currency,
      spot_at_create: ref.amount,
    };

    const sym = fmtMoney(strike, ref.currency);
    const spotSym = fmtMoney(ref.amount, ref.currency);
    const title = `Pokémon TCG: Will ${card.name} (${cid}) reach ≥ ${sym} (${ref.currency}) by ${resolutionYmd}?`;
    const desc = [
      `Uses TCGdex market data (TCGplayer / Cardmarket).`,
      `Snapshot at creation: ${spotSym} via basis **${ref.basis}**.`,
      `**Yes** if the same basis is **≥ ${sym}** when this market resolves (typically ${horizonDays} days).`,
      `**No** otherwise.`,
    ].join("\n\n");

    const crit = [
      `Resolution uses TCGdex JSON for card \`${cid}\`, field basis \`${ref.basis}\`, compared to strike ${strike} ${ref.currency}.`,
      `If the basis is missing at resolution, the market should be voided manually (admin).`,
    ].join(" ");

    const { error } = await admin.from("markets").insert({
      title: title.slice(0, 500),
      description: desc.slice(0, 8000),
      category: "Pokemon Cards",
      options: ["Yes", "No"],
      close_date: close.toISOString(),
      resolution_date: resolution.toISOString(),
      status: "open",
      external_source: SOURCE,
      external_id: extId,
      metadata: {
        ...meta,
        resolution_criteria: crit,
        image_url: cardImageUrl(card),
      } as unknown as Record<string, unknown>,
    });

    if (error) {
      if (error.code === "23505") {
        report.skipped++;
        continue;
      }
      report.errors.push(`tcg insert ${cid}: ${error.message}`);
      continue;
    }
    report.created++;
  }

  await resolveTcgdexMarkets(admin, report);
  return report;
}

async function resolveTcgdexMarkets(admin: SupabaseClient, report: PokemonTcgSyncReport): Promise<void> {
  const now = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("markets")
    .select("id, metadata")
    .eq("status", "open")
    .eq("external_source", SOURCE)
    .lte("resolution_date", now);

  if (error) {
    report.errors.push(`tcg resolve query: ${error.message}`);
    return;
  }

  for (const row of rows ?? []) {
    const meta = row.metadata as TcgdexPriceMeta | null;
    if (!meta || meta.resolver !== "tcgdex_price_floor") continue;

    try {
      const card = await fetchTcgdexCard(meta.card_id);
      if (!card) {
        report.errors.push(`tcg resolve ${row.id}: could not fetch card`);
        continue;
      }
      const px = priceAtBasis(card, meta.basis);
      if (px == null || Number.isNaN(px)) {
        report.skipped++;
        continue;
      }
      const yes = px >= meta.strike;
      await resolveMarket(admin, row.id, yes ? "Yes" : "No");
      report.resolved++;
    } catch (e) {
      report.errors.push(`tcg resolve ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
