/**
 * Wikipedia REST API — free company profiles, no API key required.
 */

export interface WikipediaSummary {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: string;
}

export async function fetchWikipediaSummary(
  query: string
): Promise<WikipediaSummary | null> {
  const encoded = encodeURIComponent(query.replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.type === "disambiguation") return null;
    return {
      title: data.title,
      description: data.description,
      extract: data.extract ?? "",
      thumbnail: data.thumbnail?.source,
    };
  } catch {
    return null;
  }
}

export async function searchWikipediaTitle(query: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as [string, string[]];
    return data[1]?.[0] ?? null;
  } catch {
    return null;
  }
}
