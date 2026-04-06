/**
 * ProduceIQ / Parse-hosted commodity API — wire your deployed scraper base URL.
 *
 * Env:
 *   PRODUCEIQ_API_BASE — e.g. https://api.parse.bot/scraper/{your_scraper_id}
 *   PRODUCEIQ_API_KEY  — X-API-Key for api.parse.bot (never commit real keys)
 *
 * Endpoint names (adjust paths to match your Parse task spec):
 *   get_current_prices, get_commodity_history, get_industry_index
 */

const base = () => process.env.PRODUCEIQ_API_BASE?.replace(/\/$/, "") ?? "";
const key = () => process.env.PRODUCEIQ_API_KEY ?? "";

export function produceiqConfigured(): boolean {
  return Boolean(base() && key());
}

async function postJson<T>(path: string, body?: Record<string, unknown>): Promise<T | null> {
  const b = base();
  const k = key();
  if (!b || !k) return null;
  const url = `${b}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": k,
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function getCurrentPrices(body?: Record<string, unknown>) {
  return postJson<unknown>("get_current_prices", body);
}

export async function getCommodityHistory(body?: Record<string, unknown>) {
  return postJson<unknown>("get_commodity_history", body);
}

export async function getIndustryIndex(body?: Record<string, unknown>) {
  return postJson<unknown>("get_industry_index", body);
}
