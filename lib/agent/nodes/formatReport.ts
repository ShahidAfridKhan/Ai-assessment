/**
 * Node 7: formatReport — assembles FinalReport for SSE.
 */

import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";
import type { ChartPoint, Verdict } from "@/lib/agent/state";

export interface FinalReport {
  company: {
    name: string;
    ticker?: string;
    exchange?: string;
    sector?: string;
    industry?: string;
    description?: string;
    confidence: string;
    ceo?: string;
    headquarters?: string;
  };
  decision: {
    verdict: Verdict;
    confidence: number;
    reasoning: string[];
    weightedTotal: number;
    targetHorizon?: string;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  };
  rubricScores: {
    fundamentals: number;
    growth: number;
    sentiment: number;
    valuation: number;
    risk: number;
  };
  fundamentals: {
    revenueGrowthYoY?: number;
    profitMargin?: number;
    operatingMargin?: number;
    debtToEquity?: number;
    peRatio?: number;
    freeCashFlow?: number;
    revenueUSD?: number;
    marketCapUSD?: number;
    eps?: number;
    roe?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    return52Week?: number;
    return1Year?: number;
    return10Year?: number;
    currentPrice?: number;
    notes?: string;
    priceChart10Y?: ChartPoint[];
    priceHistory?: ChartPoint[];
    revenueHistory?: ChartPoint[];
    profitHistory?: ChartPoint[];
    volumeHistory?: ChartPoint[];
  };
  news: Array<{
    headline: string;
    source: string;
    url: string;
    date: string;
    summary?: string;
    sentiment?: "positive" | "negative" | "neutral";
  }>;
  sentimentScore?: number;
  sentimentSummary?: string;
  industryContext?: string;
  risks: string[];
  riskCategories: Array<{
    category: string;
    level: "LOW" | "MEDIUM" | "HIGH";
    description: string;
  }>;
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitors: Array<{
    name: string;
    ticker: string;
    marketCapUSD?: number;
    revenueUSD?: number;
    growth?: number;
    profitMargin?: number;
    peRatio?: number;
    rating?: Verdict;
  }>;
  aiSummary?: {
    businessOverview: string;
    strengths: string[];
    weaknesses: string[];
    growthOpportunities: string[];
    risks: string[];
    investmentThesis: string;
    finalRecommendation: string;
  };
  dataLimitations: string[];
}

export async function formatReport(
  state: AgentState
): Promise<AgentStateUpdate & { __finalReport?: FinalReport }> {
  const {
    resolvedCompany,
    fundamentals,
    news,
    sentimentScore,
    sentimentSummary,
    industryContext,
    risks,
    riskCategories,
    swot,
    competitors,
    aiSummary,
    decision,
    errors,
    companyNameRaw,
  } = state;

  const report: FinalReport = {
    company: {
      name: resolvedCompany?.name ?? companyNameRaw,
      ticker: resolvedCompany?.ticker,
      exchange: fundamentals?.exchange ?? resolvedCompany?.exchange,
      sector: fundamentals?.sector ?? resolvedCompany?.sector,
      industry: fundamentals?.industry,
      description: resolvedCompany?.description,
      confidence: resolvedCompany?.confidence ?? "medium",
      ceo: fundamentals?.ceo ?? resolvedCompany?.ceo,
      headquarters: fundamentals?.headquarters ?? resolvedCompany?.headquarters,
    },
    decision: {
      verdict: decision?.verdict ?? "HOLD",
      confidence: decision?.confidence ?? 50,
      reasoning: decision?.reasoning ?? [
        "Analysis generated from available public data sources.",
      ],
      weightedTotal: decision?.weightedTotal ?? 50,
      targetHorizon: decision?.targetHorizon ?? "12 months",
      riskLevel: decision?.riskLevel ?? "MEDIUM",
    },
    rubricScores: decision?.rubricScores ?? {
      fundamentals: 50,
      growth: 50,
      sentiment: 50,
      valuation: 50,
      risk: 50,
    },
    fundamentals: {
      revenueGrowthYoY: fundamentals?.revenueGrowthYoY,
      profitMargin: fundamentals?.profitMargin,
      operatingMargin: fundamentals?.operatingMargin,
      debtToEquity: fundamentals?.debtToEquity,
      peRatio: fundamentals?.peRatio,
      freeCashFlow: fundamentals?.freeCashFlow,
      revenueUSD: fundamentals?.revenueUSD,
      marketCapUSD: fundamentals?.marketCapUSD,
      eps: fundamentals?.eps,
      roe: fundamentals?.roe,
      fiftyTwoWeekHigh: fundamentals?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: fundamentals?.fiftyTwoWeekLow,
      return52Week: fundamentals?.return52Week,
      return1Year: fundamentals?.return1Year,
      return10Year: fundamentals?.return10Year,
      currentPrice: fundamentals?.currentPrice,
      notes: fundamentals?.notes,
      priceChart10Y: fundamentals?.priceChart10Y,
      priceHistory: fundamentals?.priceChart10Y ?? fundamentals?.priceHistory,
      revenueHistory: fundamentals?.revenueHistory,
      profitHistory: fundamentals?.profitHistory,
      volumeHistory: fundamentals?.volumeHistory,
    },
    news: (news ?? [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((n) => ({
        headline: n.headline,
        source: n.source,
        url: n.url,
        date: n.date,
        summary: n.summary,
        sentiment: n.sentiment,
      })),
    sentimentScore,
    sentimentSummary,
    industryContext,
    risks: risks ?? [],
    riskCategories: riskCategories ?? [],
    swot,
    competitors: competitors ?? [],
    aiSummary,
    dataLimitations: [],
  };

  return { __finalReport: report } as AgentStateUpdate & {
    __finalReport: FinalReport;
  };
}
