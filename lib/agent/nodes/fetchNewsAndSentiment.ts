/**
 * Node 3: fetchNewsAndSentiment — GNews API + Gemini sentiment.
 */

import { getLLM } from "@/lib/llm";
import { fetchGNews } from "@/lib/agent/tools/gnews";
import type { AgentState, AgentStateUpdate, NewsItem } from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function fetchNewsAndSentiment(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany, companyNameRaw } = state;
  const companyName = resolvedCompany?.name ?? companyNameRaw;

  try {
    const articles = await fetchGNews(`${companyName} stock earnings`, {
      max: 8,
    });

    if (articles.length === 0) {
      return {
        news: [],
        sentimentScore: 0,
        sentimentSummary:
          "Limited public news available. Generating report using verified public data.",
      };
    }

    const newsItems: NewsItem[] = articles.map((a) => ({
      headline: a.title,
      source: a.source?.name ?? "News",
      date: a.publishedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      url: a.url,
      summary: a.description?.slice(0, 200),
      sentiment: "neutral" as const,
    }));

    const llm = getLLM({ temperature: 0.0 });
    const newsContext = articles
      .slice(0, 6)
      .map((a) => `Headline: ${a.title}\nSummary: ${a.description?.slice(0, 200)}`)
      .join("\n\n---\n\n");

    const response = await llm.invoke([
      new SystemMessage(
        `Analyze news sentiment. Return JSON only:
{"sentimentScore":<-1 to 1>,"sentimentSummary":"<2-3 sentences>","articleSentiments":[{"index":0,"sentiment":"positive"|"negative"|"neutral"}]}`
      ),
      new HumanMessage(`Company: ${companyName}\n\n${newsContext}`),
    ]);

    const text =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const sentiments = parsed.articleSentiments as
        | Array<{ index: number; sentiment: "positive" | "negative" | "neutral" }>
        | undefined;

      if (sentiments) {
        sentiments.forEach((s) => {
          if (newsItems[s.index]) {
            newsItems[s.index].sentiment = s.sentiment;
          }
        });
      }

      return {
        news: newsItems,
        sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore ?? 0)),
        sentimentSummary: parsed.sentimentSummary ?? "Mixed market sentiment.",
      };
    }

    return {
      news: newsItems,
      sentimentScore: 0,
      sentimentSummary: "News collected — sentiment analysis in progress.",
    };
  } catch {
    return {
      news: [],
      sentimentScore: 0,
      sentimentSummary: "Searching additional news sources.",
    };
  }
}
