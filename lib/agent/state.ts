/**
 * Shared AgentState for LangGraph nodes.
 */

import { Annotation } from "@langchain/langgraph";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ResolvedCompany {
  name: string;
  ticker?: string;
  exchange?: string;
  sector?: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  ceo?: string;
  headquarters?: string;
  wikipediaExtract?: string;
}

export interface Fundamentals {
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
  ceo?: string;
  headquarters?: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  notes?: string;
  revenueHistory?: ChartPoint[];
  profitHistory?: ChartPoint[];
  operatingMarginHistory?: ChartPoint[];
  cashFlowHistory?: ChartPoint[];
  epsHistory?: ChartPoint[];
  roeHistory?: ChartPoint[];
  debtHistory?: ChartPoint[];
  priceHistory?: ChartPoint[];
  priceChart10Y?: ChartPoint[];
  volumeHistory?: ChartPoint[];
  return52Week?: number;
  return1Year?: number;
  return10Year?: number;
  currentPrice?: number;
}

export interface NewsItem {
  headline: string;
  source: string;
  date: string;
  url: string;
  summary?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface RubricScores {
  fundamentals: number;
  growth: number;
  sentiment: number;
  valuation: number;
  risk: number;
}

export type Verdict = "BUY" | "HOLD" | "PASS";

export interface Decision {
  verdict: Verdict;
  confidence: number;
  reasoning: string[];
  rubricScores: RubricScores;
  weightedTotal: number;
  targetHorizon?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface CompetitorRow {
  name: string;
  ticker: string;
  marketCapUSD?: number;
  revenueUSD?: number;
  growth?: number;
  profitMargin?: number;
  peRatio?: number;
  rating?: Verdict;
}

export interface AISummary {
  businessOverview: string;
  strengths: string[];
  weaknesses: string[];
  growthOpportunities: string[];
  risks: string[];
  investmentThesis: string;
  finalRecommendation: string;
}

export interface RiskCategory {
  category: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

export const AgentStateAnnotation = Annotation.Root({
  companyNameRaw: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  resolvedCompany: Annotation<ResolvedCompany | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  fundamentals: Annotation<Fundamentals | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  news: Annotation<NewsItem[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  sentimentScore: Annotation<number | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  sentimentSummary: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  industryContext: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  risks: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  riskCategories: Annotation<RiskCategory[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  swot: Annotation<SWOT | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  competitors: Annotation<CompetitorRow[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  aiSummary: Annotation<AISummary | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  decision: Annotation<Decision | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  errors: Annotation<string[]>({
    reducer: (existing, next) => [...existing, ...next],
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = Partial<AgentState>;
