/**
 * GNews API — free-tier news for company research.
 * https://gnews.io/
 */

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: { name: string; url: string };
}

export async function fetchGNews(
  query: string,
  options?: { max?: number; lang?: string; sortBy?: "publishedAt" | "relevance" }
): Promise<GNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const max = options?.max ?? 8;
  const lang = options?.lang ?? "en";
  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("lang", lang);
  url.searchParams.set("max", String(Math.min(max, 10)));
  url.searchParams.set("sortby", options?.sortBy ?? "publishedAt");
  url.searchParams.set("token", apiKey);

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { articles?: GNewsArticle[] };
    return data.articles ?? [];
  } catch {
    return [];
  }
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function readTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

async function fetchGoogleNewsRss(query: string, max: number): Promise<GNewsArticle[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 AlphaLensAI/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
      .slice(0, max)
      .map((item) => {
        const body = item[1];
        const title = readTag(body, "title");
        const source = readTag(body, "source") || "Google News";
        const publishedAt = new Date(readTag(body, "pubDate") || Date.now()).toISOString();
        return {
          title,
          description: readTag(body, "description"),
          content: "",
          url: readTag(body, "link"),
          publishedAt,
          source: { name: source, url: "" },
        };
      })
      .filter((article) => article.title && article.url);
  } catch {
    return [];
  }
}

export async function fetchLatestCompanyNews(
  companyName: string,
  ticker?: string,
  options?: { max?: number }
): Promise<GNewsArticle[]> {
  const max = options?.max ?? 8;
  const queries = [
    `"${companyName}" stock`,
    `"${companyName}" earnings`,
    ticker ? `${ticker} stock news` : "",
  ].filter(Boolean);

  const seen = new Set<string>();
  const articles: GNewsArticle[] = [];

  const gnewsBatches = await Promise.all(
    queries.map((query) => fetchGNews(query, { max, sortBy: "publishedAt" }))
  );

  for (const batch of gnewsBatches) {
    for (const article of batch) {
      const key = article.url || article.title;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      articles.push(article);
      if (articles.length >= max) break;
    }
    if (articles.length >= max) break;
  }

  if (!articles.length) {
    const rssBatches = await Promise.all(
      queries.slice(0, 2).map((query) => fetchGoogleNewsRss(query, max))
    );
    for (const batch of rssBatches) {
      for (const article of batch) {
        const key = article.url || article.title;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        articles.push(article);
        if (articles.length >= max) break;
      }
      if (articles.length >= max) break;
    }
  }

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
