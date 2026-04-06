import type { MarketRow } from "./types";

export function marketImageUrl(market: Pick<MarketRow, "metadata" | "category">): string | null {
  const m = (market.metadata ?? {}) as Record<string, unknown>;
  const url = m.image_url ?? m.imageUrl ?? m.thumbnail;
  if (typeof url === "string" && url.startsWith("http")) return url;
  return null;
}

export function marketResolutionCriteria(
  market: Pick<MarketRow, "description" | "metadata">,
): string {
  const m = (market.metadata ?? {}) as Record<string, unknown>;
  const c = m.resolution_criteria ?? m.resolutionCriteria;
  if (typeof c === "string" && c.trim()) return c.trim();
  return market.description;
}

export function formatTimeRemaining(closeIso: string): string {
  const ms = new Date(closeIso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3600000);
  if (h < 48) return h <= 0 ? "<1h" : `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d left`;
}
