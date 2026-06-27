/**
 * Node 2: Parallel fetch — market data + GNews.
 */

import { fetchMarketData } from "@/lib/agent/tools/marketData";
import { fetchLatestCompanyNews } from "@/lib/agent/tools/gnews";
import type { AgentState, AgentStateUpdate, NewsItem } from "@/lib/agent/state";

function classifySentiment(text: string): NewsItem["sentiment"] {
  const lower = text.toLowerCase();
  if (/\b(record|beat|growth|profit|surge|rally|upgrade|strong|gain|positive)\b/.test(lower)) {
    return "positive";
  }
  if (/\b(drop|fall|miss|lawsuit|probe|risk|cut|weak|loss|decline|negative)\b/.test(lower)) {
    return "negative";
  }
  return "neutral";
}

export async function fetchAllParallel(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany, companyNameRaw } = state;
  const name = resolvedCompany?.name ?? companyNameRaw;
  const ticker = resolvedCompany?.ticker ?? companyNameRaw;

  const [market, articles] = await Promise.all([
    fetchMarketData(ticker).catch(() => null),
    fetchLatestCompanyNews(name, resolvedCompany?.ticker ?? ticker, { max: 6 }),
  ]);

  const news: NewsItem[] = articles.map((a) => ({
    headline: a.title,
    source: a.source?.name ?? "News",
    date: a.publishedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
    url: a.url,
    summary: a.description?.slice(0, 180),
    sentiment: classifySentiment(`${a.title} ${a.description ?? ""}`),
  }));

  const fundamentals = market
    ? {
        revenueGrowthYoY: market.revenueGrowthYoY,
        profitMargin: market.profitMargin,
        operatingMargin: market.operatingMargin,
        debtToEquity: market.debtToEquity,
        peRatio: market.peRatio,
        freeCashFlow: market.freeCashFlow,
        revenueUSD: market.revenueUSD,
        marketCapUSD: market.marketCapUSD,
        eps: market.eps,
        roe: market.roe,
        fiftyTwoWeekHigh: market.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: market.fiftyTwoWeekLow,
        return52Week: market.return52Week,
        return1Year: market.return1Year,
        return10Year: market.return10Year,
        currentPrice: market.currentPrice,
        ceo: market.ceo,
        headquarters: market.headquarters,
        exchange: market.exchange,
        sector: market.sector,
        industry: market.industry,
        priceChart10Y: market.priceChart10Y,
        priceHistory: market.priceChart10Y,
        revenueHistory: market.revenueHistory,
        profitHistory: market.profitHistory,
        volumeHistory: market.volumeHistory,
        notes: market.notes,
      }
    : { notes: "Limited public financial data available." };

  return {
    fundamentals,
    news,
    sentimentScore: 0,
    sentimentSummary: articles.length
      ? `${articles.length} recent articles collected.`
      : "Searching additional news sources.",
    industryContext: resolvedCompany?.wikipediaExtract?.slice(0, 300),
    resolvedCompany: resolvedCompany
      ? {
          ...resolvedCompany,
          name: market?.companyName ?? resolvedCompany.name,
          ticker: market?.ticker ?? resolvedCompany.ticker,
          sector: market?.sector ?? resolvedCompany.sector,
          exchange: market?.exchange ?? resolvedCompany.exchange,
        }
      : resolvedCompany,
  };
}
