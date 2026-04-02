const BASE = "https://newsapi.org/v2";

export type NewsArticle = {
  title: string | null;
  description: string | null;
  url: string | null;
  publishedAt: string | null;
  source?: { name?: string };
};

type TopHeadlinesResponse = {
  status: string;
  articles?: NewsArticle[];
  message?: string;
};

type EverythingResponse = {
  status: string;
  articles?: NewsArticle[];
  totalResults?: number;
  message?: string;
};

export function getNewsApiKey(): string | null {
  const k = process.env.NEWS_API_KEY?.trim();
  return k || null;
}

export async function fetchTopHeadlines(params: {
  country?: string;
  pageSize?: number;
  category?: string;
}): Promise<NewsArticle[]> {
  const key = getNewsApiKey();
  if (!key) return [];

  const url = new URL(`${BASE}/top-headlines`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("country", params.country ?? "us");
  url.searchParams.set("pageSize", String(params.pageSize ?? 12));
  if (params.category) url.searchParams.set("category", params.category);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as TopHeadlinesResponse;
  if (json.status !== "ok" || !Array.isArray(json.articles)) {
    throw new Error(json.message ?? `NewsAPI top-headlines: ${res.status}`);
  }
  return json.articles;
}

export async function fetchEverything(params: {
  q: string;
  from?: string;
  pageSize?: number;
}): Promise<NewsArticle[]> {
  const key = getNewsApiKey();
  if (!key) return [];

  const url = new URL(`${BASE}/everything`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("q", params.q);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(params.pageSize ?? 30));
  url.searchParams.set("language", "en");
  if (params.from) url.searchParams.set("from", params.from);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as EverythingResponse;
  if (json.status !== "ok" || !Array.isArray(json.articles)) {
    throw new Error(json.message ?? `NewsAPI everything: ${res.status}`);
  }
  return json.articles;
}
