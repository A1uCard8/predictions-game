import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEverything, fetchTopHeadlines, getNewsApiKey } from "./newsapi";
import { resolveMarket } from "./resolve-market";
import type { Category } from "./constants";

const SOURCE = "newsapi" as const;

export type NewsFollowupMeta = {
  resolver: "newsapi_followup";
  seedUrl: string;
  seedPublishedAt: string;
  searchQuery: string;
  minArticles: number;
};

export type NewsSyncReport = {
  created: number;
  resolved: number;
  skipped: number;
  errors: string[];
};

/** Web Crypto (no Node `crypto`) — safe when bundled with `instrumentation.ts` on Vercel. */
async function hashExternalId(url: string): Promise<string> {
  const data = new TextEncoder().encode(url);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

/** Short query from headline for NewsAPI `everything` (not too strict). */
function buildSearchQuery(title: string): string {
  const words = title
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2)
    .slice(0, 5);
  return words.length ? words.join(" ") : title.slice(0, 80);
}

const NEWS_BUCKETS: { category: string; plainsCategory: Category }[] = [
  { category: "business", plainsCategory: "Finance/Markets" },
  { category: "technology", plainsCategory: "Science/Tech" },
  { category: "general", plainsCategory: "Politics" },
];

export async function createNewsMarkets(admin: SupabaseClient): Promise<NewsSyncReport> {
  const report: NewsSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };

  if (!getNewsApiKey()) {
    report.errors.push("NEWS_API_KEY not set");
    return report;
  }

  for (const bucket of NEWS_BUCKETS) {
    let articles: Awaited<ReturnType<typeof fetchTopHeadlines>> = [];
    try {
      articles = await fetchTopHeadlines({
        country: process.env.NEWSAPI_COUNTRY ?? "us",
        category: bucket.category,
        pageSize: Number(process.env.NEWS_HEADLINES_PER_CATEGORY ?? "4") || 4,
      });
    } catch (e) {
      report.errors.push(
        `${bucket.category}: ${e instanceof Error ? e.message : String(e)}`
      );
      continue;
    }

    for (const a of articles) {
      const title = a.title?.trim();
      const url = a.url?.trim();
      const publishedAt = a.publishedAt;
      if (!title || !url || !publishedAt) {
        report.skipped++;
        continue;
      }

      const extId = await hashExternalId(url);
      const { data: exists } = await admin
        .from("markets")
        .select("id")
        .eq("external_source", SOURCE)
        .eq("external_id", extId)
        .maybeSingle();

      if (exists) continue;

      const searchQuery = buildSearchQuery(title);
      if (searchQuery.length < 4) {
        report.skipped++;
        continue;
      }

      const seedTime = new Date(publishedAt);
      const close = new Date(seedTime.getTime() + 48 * 3600_000);
      const resolution = new Date(seedTime.getTime() + 72 * 3600_000);

      const shortTitle = title.length > 90 ? `${title.slice(0, 87)}…` : title;
      const meta: NewsFollowupMeta = {
        resolver: "newsapi_followup",
        seedUrl: url,
        seedPublishedAt: publishedAt,
        searchQuery,
        minArticles: Number(process.env.NEWS_FOLLOWUP_MIN_ARTICLES ?? "2") || 2,
      };

      const desc = [
        a.description?.trim(),
        `Seed: ${url}`,
        `Auto search query: ${searchQuery}`,
        `Resolves Yes if enough distinct follow-up English articles appear (see metadata).`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error } = await admin.from("markets").insert({
        title: `News: further coverage — “${shortTitle}”?`,
        description: desc,
        category: bucket.plainsCategory,
        options: ["Yes", "No"],
        close_date: close.toISOString(),
        resolution_date: resolution.toISOString(),
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
        report.errors.push(`insert news ${extId}: ${error.message}`);
        continue;
      }
      report.created++;
    }
  }

  return report;
}

export async function resolveNewsFollowupMarkets(admin: SupabaseClient): Promise<NewsSyncReport> {
  const report: NewsSyncReport = { created: 0, resolved: 0, skipped: 0, errors: [] };
  const key = getNewsApiKey();
  if (!key) {
    report.errors.push("NEWS_API_KEY not set");
    return report;
  }

  const now = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("markets")
    .select("id, status, metadata, resolution_date")
    .eq("status", "open")
    .lte("resolution_date", now);

  if (error) {
    report.errors.push(error.message);
    return report;
  }

  for (const row of rows ?? []) {
    const meta = row.metadata as NewsFollowupMeta | null;
    if (!meta || meta.resolver !== "newsapi_followup") continue;

    const fromDay = meta.seedPublishedAt.slice(0, 10);

    let articles: Awaited<ReturnType<typeof fetchEverything>> = [];
    try {
      articles = await fetchEverything({
        q: meta.searchQuery,
        from: fromDay,
        pageSize: 40,
      });
    } catch (e) {
      report.errors.push(`news resolve ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const seedTime = new Date(meta.seedPublishedAt).getTime();
    const seedUrlNorm = meta.seedUrl.split("?")[0];

    const distinctFollowups = articles.filter((a) => {
      const u = a.url?.split("?")[0];
      if (!u || u === seedUrlNorm) return false;
      const t = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      return t > seedTime;
    });

    const correct = distinctFollowups.length >= meta.minArticles ? "Yes" : "No";

    try {
      await resolveMarket(admin, row.id, correct);
      report.resolved++;
    } catch (e) {
      report.errors.push(`resolve news ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return report;
}

export async function runNewsSync(admin: SupabaseClient): Promise<NewsSyncReport> {
  const createdPart = await createNewsMarkets(admin);
  const resolvedPart = await resolveNewsFollowupMarkets(admin);
  return {
    created: createdPart.created,
    resolved: resolvedPart.resolved,
    skipped: createdPart.skipped + resolvedPart.skipped,
    errors: [...createdPart.errors, ...resolvedPart.errors],
  };
}
