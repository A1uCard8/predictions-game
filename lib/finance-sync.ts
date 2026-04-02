import type { SupabaseClient } from "@supabase/supabase-js";
import { getLastDailyClose, getYahooQuote } from "./yahoo-finance";
import { resolveMarket } from "./resolve-market";

const SOURCE = "yahoo" as const;

export type YahooDailyMeta = {
  resolver: "yahoo_daily_close";
  symbol: string;
  strike: number;
  basis: "ny_calendar" | "utc_day";
};

export type YahooMonthlyMeta = {
  resolver: "yahoo_monthly_close";
  symbol: string;
  strike: number;
  periodEnd: string;
};

export type FinanceSyncReport = {
  created: number;
  resolved: number;
  skipped: number;
  errors: string[];
};

function parseSymbols(envVal: string | undefined, fallback: string): string[] {
  return (envVal ?? fallback)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function isNyWeekday(): boolean {
  const d = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
  return d !== "Sat" && d !== "Sun";
}

function nyYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function utcYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtStrike(n: number, crypto: boolean): string {
  if (crypto && n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

/** ~4pm US liquidity: 21:00 UTC is a rough same-day anchor; tune cron to morning US. */
function defaultSessionResolutionBounds(): { close: Date; resolve: Date } | null {
  const resolveAt = new Date();
  resolveAt.setUTCHours(21, 0, 0, 0);
  if (resolveAt.getTime() <= Date.now()) {
    return null;
  }
  const closeAt = new Date(resolveAt.getTime() - 2 * 3600_000);
  if (closeAt.getTime() <= Date.now()) {
    return null;
  }
  return { close: closeAt, resolve: resolveAt };
}

function utcEndOfDayBounds(): { close: Date; resolve: Date } | null {
  const resolveAt = new Date();
  resolveAt.setUTCHours(23, 55, 0, 0);
  if (resolveAt.getTime() <= Date.now()) return null;
  const closeAt = new Date(resolveAt.getTime() - 2 * 3600_000);
  if (closeAt.getTime() <= Date.now()) return null;
  return { close: closeAt, resolve: resolveAt };
}

export async function createDailyFinanceMarkets(admin: SupabaseClient): Promise<FinanceSyncReport> {
  const report: FinanceSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };

  const stocks = parseSymbols(process.env.AUTO_STOCK_SYMBOLS, "AAPL,MSFT,GOOGL");
  const crypto = parseSymbols(process.env.AUTO_CRYPTO_SYMBOLS, "BTC-USD,ETH-USD");

  const boundsNy = defaultSessionResolutionBounds();
  const boundsUtc = utcEndOfDayBounds();

  if (isNyWeekday() && boundsNy) {
    const day = nyYmd();
    for (const sym of stocks) {
      const extId = `yahoo-daily-ny-${sym}-${day}`;
      const { data: exists } = await admin
        .from("markets")
        .select("id")
        .eq("external_source", SOURCE)
        .eq("external_id", extId)
        .maybeSingle();
      if (exists) continue;

      const q = await getYahooQuote(sym);
      if (!q) {
        report.skipped++;
        continue;
      }

      const strike = q.previousClose;
      const meta: YahooDailyMeta = {
        resolver: "yahoo_daily_close",
        symbol: sym,
        strike,
        basis: "ny_calendar",
      };

      const { error } = await admin.from("markets").insert({
        title: `Finance: Will ${sym} close above $${fmtStrike(strike, false)} (prior close) ${day} (NY)?`,
        description: `Auto market via Yahoo chart data (same family as yfinance). Strike = prior session close at creation. Resolves after ~21:00 UTC.`,
        category: "Finance/Markets",
        options: ["Yes", "No"],
        close_date: boundsNy.close.toISOString(),
        resolution_date: boundsNy.resolve.toISOString(),
        status: "open",
        external_source: SOURCE,
        external_id: extId,
        metadata: meta as unknown as Record<string, unknown>,
      });

      if (error) {
        if (error.code === "23505") {
          report.skipped++;
          continue;
        }
        report.errors.push(`${sym}: ${error.message}`);
        continue;
      }
      report.created++;
    }
  } else if (!isNyWeekday()) {
    report.skipped += stocks.length;
  }

  if (boundsUtc) {
    const day = utcYmd();
    for (const sym of crypto) {
      const extId = `yahoo-daily-utc-${sym}-${day}`;
      const { data: exists } = await admin
        .from("markets")
        .select("id")
        .eq("external_source", SOURCE)
        .eq("external_id", extId)
        .maybeSingle();
      if (exists) continue;

      const q = await getYahooQuote(sym);
      if (!q) {
        report.skipped++;
        continue;
      }

      const strike = q.previousClose;
      const meta: YahooDailyMeta = {
        resolver: "yahoo_daily_close",
        symbol: sym,
        strike,
        basis: "utc_day",
      };

      const isCrypto = true;
      const { error } = await admin.from("markets").insert({
        title: `Crypto: Will ${sym} finish above $${fmtStrike(strike, isCrypto)} (prior close) on ${day} (UTC)?`,
        description: `Auto market via Yahoo chart. Prior close at creation = strike. Resolves late UTC day.`,
        category: "Finance/Markets",
        options: ["Yes", "No"],
        close_date: boundsUtc.close.toISOString(),
        resolution_date: boundsUtc.resolve.toISOString(),
        status: "open",
        external_source: SOURCE,
        external_id: extId,
        metadata: meta as unknown as Record<string, unknown>,
      });

      if (error) {
        if (error.code === "23505") {
          report.skipped++;
          continue;
        }
        report.errors.push(`${sym}: ${error.message}`);
        continue;
      }
      report.created++;
    }
  }

  return report;
}

export async function createMonthlyCryptoMarkets(admin: SupabaseClient): Promise<FinanceSyncReport> {
  const report: FinanceSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };
  const raw = process.env.AUTO_MONTHLY_CRYPTO?.trim();
  if (!raw) return report;

  const symbols = parseSymbols(raw, "");
  if (symbols.length === 0) return report;

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const ym = `${y}-${String(m + 1).padStart(2, "0")}`;

  if (now.getUTCDate() > 5) {
    report.skipped += symbols.length;
    return report;
  }

  const last = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

  for (const sym of symbols) {
    const extId = `yahoo-monthly-${sym}-${ym}`;
    const { data: exists } = await admin
      .from("markets")
      .select("id")
      .eq("external_source", SOURCE)
      .eq("external_id", extId)
      .maybeSingle();
    if (exists) continue;

    const q = await getYahooQuote(sym);
    if (!q) {
      report.skipped++;
      continue;
    }

    let strike: number;
    if (sym.includes("BTC")) {
      strike = Math.round((q.price * 1.03) / 500) * 500;
    } else if (sym.includes("ETH")) {
      strike = Math.round((q.price * 1.03) / 50) * 50;
    } else {
      strike = Math.round(q.price * 1.03 * 100) / 100;
    }

    const meta: YahooMonthlyMeta = {
      resolver: "yahoo_monthly_close",
      symbol: sym,
      strike,
      periodEnd: last.toISOString(),
    };

    const { error } = await admin.from("markets").insert({
      title: `Crypto: Will ${sym} end ${ym} above $${fmtStrike(strike, true)}?`,
      description: `Monthly auto market. Target is ~3% above spot when created (first week of month). Resolves after month end.`,
      category: "Finance/Markets",
      options: ["Yes", "No"],
      close_date: last.toISOString(),
      resolution_date: new Date(last.getTime() + 36 * 3600_000).toISOString(),
      status: "open",
      external_source: SOURCE,
      external_id: extId,
      metadata: meta as unknown as Record<string, unknown>,
    });

    if (error) {
      if (error.code === "23505") {
        report.skipped++;
        continue;
      }
      report.errors.push(`${sym}: ${error.message}`);
      continue;
    }
    report.created++;
  }

  return report;
}

export async function resolveYahooFinanceMarkets(admin: SupabaseClient): Promise<FinanceSyncReport> {
  const report: FinanceSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };
  const now = new Date().toISOString();

  const { data: rows, error } = await admin
    .from("markets")
    .select("id, metadata")
    .eq("status", "open")
    .lte("resolution_date", now);

  if (error) {
    report.errors.push(error.message);
    return report;
  }

  for (const row of rows ?? []) {
    const meta = row.metadata as YahooDailyMeta | YahooMonthlyMeta | null;
    if (!meta) continue;
    if (meta.resolver !== "yahoo_daily_close" && meta.resolver !== "yahoo_monthly_close") continue;

    const sym = meta.symbol;
    const closePx =
      (await getLastDailyClose(sym)) ?? (await getYahooQuote(sym))?.price ?? null;

    if (closePx == null || Number.isNaN(closePx)) {
      report.errors.push(`No price for ${sym} (market ${row.id})`);
      continue;
    }

    const yes = closePx > meta.strike;
    const correct = yes ? "Yes" : "No";

    try {
      await resolveMarket(admin, row.id, correct);
      report.resolved++;
    } catch (e) {
      report.errors.push(`resolve ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return report;
}

export async function runFinanceSync(admin: SupabaseClient): Promise<FinanceSyncReport> {
  const a = await createDailyFinanceMarkets(admin);
  const b = await createMonthlyCryptoMarkets(admin);
  const c = await resolveYahooFinanceMarkets(admin);
  return {
    created: a.created + b.created,
    resolved: c.resolved,
    skipped: a.skipped + b.skipped + c.skipped,
    errors: [...a.errors, ...b.errors, ...c.errors],
  };
}
