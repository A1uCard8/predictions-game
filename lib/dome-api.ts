/**
 * Dome unified prediction-market data (Polymarket + Kalshi).
 * @see https://docs.domeapi.io/
 *
 * Auth: set `DOME_API_KEY` (dashboard.domeapi.io). Sent as Authorization: Bearer …
 */

const DOME_BASE = "https://api.domeapi.io/v1";

export type DomePagination = {
  limit?: number;
  total?: number;
  has_more?: boolean;
  pagination_key?: string;
};

export type DomePolymarketSide = { id?: string; label?: string };

export type DomePolymarketMarket = {
  market_slug?: string;
  condition_id?: string;
  title?: string;
  description?: string | null;
  resolution_source?: string;
  image?: string;
  tags?: string[];
  start_time?: number;
  end_time?: number;
  close_time?: number | null;
  completed_time?: number | null;
  status?: "open" | "closed";
  side_a?: DomePolymarketSide;
  side_b?: DomePolymarketSide;
  winning_side?: string | null;
  volume_total?: number;
};

export type DomeKalshiMarket = {
  market_ticker?: string;
  event_ticker?: string;
  title?: string;
  start_time?: number;
  end_time?: number;
  close_time?: number | null;
  status?: "open" | "closed";
  result?: string | null;
  volume?: number;
  volume_24h?: number;
};

export type DomePolymarketMarketsResponse = {
  markets?: DomePolymarketMarket[];
  pagination?: DomePagination;
};

export type DomeKalshiMarketsResponse = {
  markets?: DomeKalshiMarket[];
  pagination?: DomePagination;
};

function domeApiKey(): string | null {
  const k = process.env.DOME_API_KEY?.trim();
  return k || null;
}

export function domeConfigured(): boolean {
  return !!domeApiKey();
}

async function domeGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const key = domeApiKey();
  if (!key) throw new Error("DOME_API_KEY not set");

  const u = new URL(`${DOME_BASE}${path}`);
  for (const [name, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    u.searchParams.set(name, String(v));
  }

  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Dome ${path} ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

export async function fetchDomePolymarketMarkets(opts: {
  status: "open" | "closed";
  limit: number;
  min_volume?: number;
  pagination_key?: string;
}): Promise<DomePolymarketMarketsResponse> {
  return domeGet<DomePolymarketMarketsResponse>("/polymarket/markets", {
    status: opts.status,
    limit: opts.limit,
    min_volume: opts.min_volume,
    pagination_key: opts.pagination_key,
  }) as Promise<DomePolymarketMarketsResponse>;
}

export async function fetchDomeKalshiMarkets(opts: {
  status: "open" | "closed";
  limit: number;
  min_volume?: number;
  pagination_key?: string;
}): Promise<DomeKalshiMarketsResponse> {
  return domeGet<DomeKalshiMarketsResponse>("/kalshi/markets", {
    status: opts.status,
    limit: opts.limit,
    min_volume: opts.min_volume,
    pagination_key: opts.pagination_key,
  }) as Promise<DomeKalshiMarketsResponse>;
}

/** Single Polymarket market by condition id (for resolution checks). */
export async function fetchDomePolymarketByCondition(
  conditionId: string,
  status: "open" | "closed",
): Promise<DomePolymarketMarket | null> {
  const key = domeApiKey();
  if (!key) throw new Error("DOME_API_KEY not set");
  const u = new URL(`${DOME_BASE}/polymarket/markets`);
  u.searchParams.set("status", status);
  u.searchParams.set("limit", "10");
  u.searchParams.append("condition_id", conditionId);
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as DomePolymarketMarketsResponse;
  const m = j.markets?.find((x) => x.condition_id === conditionId) ?? j.markets?.[0];
  return m ?? null;
}

/** Single Kalshi market by ticker (for resolution checks). */
export async function fetchDomeKalshiByTicker(
  marketTicker: string,
  status: "open" | "closed",
): Promise<DomeKalshiMarket | null> {
  const key = domeApiKey();
  if (!key) throw new Error("DOME_API_KEY not set");
  const u = new URL(`${DOME_BASE}/kalshi/markets`);
  u.searchParams.set("status", status);
  u.searchParams.set("limit", "10");
  u.searchParams.append("market_ticker", marketTicker);
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as DomeKalshiMarketsResponse;
  const m = j.markets?.find((x) => x.market_ticker === marketTicker) ?? j.markets?.[0];
  return m ?? null;
}
