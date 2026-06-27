/**
 * Node 1: Resolve company via market data lookup.
 */

import { fetchMarketData, resolveTickerSymbol } from "@/lib/agent/tools/marketData";
import { fetchWikipediaSummary } from "@/lib/agent/tools/wikipedia";
import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";

export async function resolveCompany(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { companyNameRaw } = state;
  const ticker = resolveTickerSymbol(companyNameRaw);

  try {
    const data = await fetchMarketData(companyNameRaw);
    const wiki = await fetchWikipediaSummary(data.companyName).catch(() => null);

    if (data.priceChart10Y?.length || data.peRatio != null) {
      return {
        resolvedCompany: {
          name: data.companyName,
          ticker: data.ticker,
          exchange: data.exchange,
          sector: data.sector,
          description: wiki?.extract?.slice(0, 200) ?? undefined,
          confidence: "high",
          wikipediaExtract: wiki?.extract,
        },
      };
    }
  } catch {
    // fall through
  }

  const wiki = await fetchWikipediaSummary(companyNameRaw).catch(() => null);
  if (wiki) {
    return {
      resolvedCompany: {
        name: wiki.title,
        ticker,
        description: wiki.extract.slice(0, 200),
        confidence: "medium",
        wikipediaExtract: wiki.extract,
      },
    };
  }

  return {
    resolvedCompany: {
      name: companyNameRaw,
      ticker,
      confidence: "low",
      description: "Generating report using verified public data.",
    },
  };
}
