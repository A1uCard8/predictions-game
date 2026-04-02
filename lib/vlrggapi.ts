/**
 * Client for [vlrggapi](https://github.com/axsddlr/vlrggapi) — unofficial VLR.gg JSON API.
 * Self-host recommended: public Vercel tier is often over quota.
 */

export type VlrMatchSegment = Record<string, string | undefined>;

export type V2MatchEnvelope = {
  status?: string;
  data?: {
    status?: number;
    segments?: VlrMatchSegment[];
  };
};

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function extractVlrMatchId(matchPage: string | undefined | null): string | null {
  if (!matchPage || typeof matchPage !== "string") return null;
  const s = matchPage.trim();
  const abs = s.startsWith("http") ? s : `https://www.vlr.gg${s.startsWith("/") ? "" : "/"}${s}`;
  const m = abs.match(/vlr\.gg\/(\d{4,})/i);
  if (m) return m[1];
  const rel = s.match(/^\/(\d{4,})\b/);
  return rel ? rel[1] : null;
}

export function parseMatchStartTime(seg: VlrMatchSegment): Date | null {
  const raw = seg.unix_timestamp;
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isNaN(n) && n > 1_000_000_000 && n < 10_000_000_000) {
    return new Date(n * 1000);
  }
  if (!Number.isNaN(n) && n > 10_000_000_000_000) {
    return new Date(n);
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}

export async function fetchV2Matches(
  baseUrl: string,
  query: "upcoming" | "results",
  numPages = 1
): Promise<VlrMatchSegment[]> {
  const base = normalizeBaseUrl(baseUrl);
  const url = new URL(`${base}/v2/match`);
  url.searchParams.set("q", query);
  url.searchParams.set("num_pages", String(numPages));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`vlrggapi ${query} HTTP ${res.status}`);
  }

  const json = (await res.json()) as V2MatchEnvelope;
  const segments = json?.data?.segments;
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments;
}
