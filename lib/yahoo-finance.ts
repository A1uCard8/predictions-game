/**
 * Unofficial Yahoo Finance chart endpoint (same data family as yfinance).
 * No API key; be polite — suitable for low-frequency cron resolution.
 */

type YahooChartJson = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
        symbol?: string;
        currency?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: (number | null)[] }>;
      };
    }>;
    error?: { description?: string };
  };
};

const UA =
  "Mozilla/5.0 (compatible; PlainsBot/1.0; +https://github.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type YahooQuote = {
  symbol: string;
  price: number;
  previousClose: number;
  regularMarketTime?: number;
};

export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  const sym = encodeURIComponent(symbol.trim());
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=10d`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as YahooChartJson;
  const err = json.chart?.error?.description;
  if (err) return null;

  const result = json.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) return null;

  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  if (typeof price !== "number" || typeof prev !== "number") return null;

  return {
    symbol: meta.symbol ?? symbol,
    price,
    previousClose: prev,
    regularMarketTime: meta.regularMarketTime,
  };
}

/** Last daily bar close from quote history (fallback when session incomplete). */
export async function getLastDailyClose(symbol: string): Promise<number | null> {
  const sym = encodeURIComponent(symbol.trim());
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=30d`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as YahooChartJson;
  const result = json.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(closes)) return null;

  for (let i = closes.length - 1; i >= 0; i--) {
    const c = closes[i];
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return null;
}
