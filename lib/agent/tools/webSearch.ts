/**
 * lib/agent/tools/webSearch.ts
 *
 * Wraps the Tavily Search API as a LangChain DynamicStructuredTool.
 *
 * WHY TAVILY: Tavily is purpose-built for LLM agents — it returns clean,
 * pre-extracted text content (not raw HTML), respects robot policies,
 * and provides published-date metadata critical for news freshness checks.
 * Free tier: 1,000 searches/month — sufficient for a take-home with caching.
 *
 * Alternative: SerpAPI (more search engines, but raw HTML parsing needed).
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/** Shape of a single Tavily search result */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

// ------------------------------------------------------------------ //
//  Input schema (Zod) — keeps tool definition LangChain-idiomatic
// ------------------------------------------------------------------ //
const webSearchInputSchema = z.object({
  query: z.string().describe("The search query to run"),
  maxResults: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum number of results to return (1-10)"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .default("basic")
    .describe("Search depth — use 'advanced' for richer content extraction"),
  topic: z
    .enum(["general", "news"])
    .optional()
    .default("general")
    .describe("Topic filter — use 'news' for recent news queries"),
});

type WebSearchInput = z.infer<typeof webSearchInputSchema>;

// ------------------------------------------------------------------ //
//  Core Tavily API call
// ------------------------------------------------------------------ //
async function callTavily(input: WebSearchInput): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to .env.local to enable web search."
    );
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: input.query,
      max_results: Math.min(input.maxResults ?? 5, 10),
      search_depth: input.searchDepth ?? "basic",
      topic: input.topic ?? "general",
      include_raw_content: false,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Tavily API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    results: Array<{
      title: string;
      url: string;
      content: string;
      published_date?: string;
      score?: number;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.published_date,
    score: r.score,
  }));
}

// ------------------------------------------------------------------ //
//  LangChain Tool export
// ------------------------------------------------------------------ //
export const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description:
    "Search the web for current information. Use for company research, news, financial data, and industry context. Returns a list of results with title, URL, and content snippet.",
  schema: webSearchInputSchema,
  func: async (input: WebSearchInput): Promise<string> => {
    const results = await callTavily(input);
    if (results.length === 0) return "No results found for the given query.";
    return JSON.stringify(results, null, 2);
  },
});

/**
 * Convenience function: search and return typed results directly
 * (used by graph nodes that need structured data, not raw string output).
 */
export async function searchWeb(
  query: string,
  options?: {
    maxResults?: number;
    topic?: "general" | "news";
    searchDepth?: "basic" | "advanced";
  }
): Promise<SearchResult[]> {
  return callTavily({
    query,
    maxResults: options?.maxResults ?? 5,
    topic: options?.topic ?? "general",
    searchDepth: options?.searchDepth ?? "basic",
  });
}
