/**
 * Node: generateInsights — SWOT, competitors, AI summary, risk categories.
 */

import { getLLM } from "@/lib/llm";
import { fetchCompetitorMetrics } from "@/lib/agent/tools/financialData";
import type {
  AgentState,
  AgentStateUpdate,
  CompetitorRow,
  RiskCategory,
  SWOT,
  AISummary,
  Verdict,
} from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const SECTOR_COMPETITORS: Record<string, string[]> = {
  automotive: ["TSLA", "BYDDY", "RIVN", "LCID"],
  technology: ["AAPL", "MSFT", "GOOGL", "META"],
  default: ["AAPL", "MSFT", "GOOGL", "AMZN"],
};

function verdictFromScore(score: number): Verdict {
  if (score >= 70) return "BUY";
  if (score >= 50) return "HOLD";
  return "PASS";
}

export async function generateInsights(
  state: AgentState
): Promise<AgentStateUpdate> {
  const {
    resolvedCompany,
    fundamentals,
    news,
    sentimentSummary,
    industryContext,
    risks,
    decision,
    companyNameRaw,
  } = state;

  const companyName = resolvedCompany?.name ?? companyNameRaw;
  const sector = (fundamentals?.sector ?? resolvedCompany?.sector ?? "").toLowerCase();

  let competitorTickers = SECTOR_COMPETITORS.default;
  if (sector.includes("auto") || sector.includes("vehicle")) {
    competitorTickers = SECTOR_COMPETITORS.automotive;
  } else if (sector.includes("tech") || sector.includes("software")) {
    competitorTickers = SECTOR_COMPETITORS.technology;
  }

  if (resolvedCompany?.ticker) {
    competitorTickers = competitorTickers.filter(
      (t) => t !== resolvedCompany.ticker?.toUpperCase()
    );
    competitorTickers = [resolvedCompany.ticker, ...competitorTickers.slice(0, 3)];
  }

  let competitors: CompetitorRow[] = [];
  try {
    const metrics = await fetchCompetitorMetrics(competitorTickers.slice(0, 4));
    competitors = metrics.map((m) => ({
      ...m,
      rating: verdictFromScore(
        (m.growth ?? 0) * 100 + (m.profitMargin ?? 0) * 50 + 50
      ),
    }));
  } catch {
    competitors = competitorTickers.slice(0, 4).map((t) => ({
      name: t,
      ticker: t,
      rating: "HOLD" as Verdict,
    }));
  }

  const contextBlock = [
    `Company: ${companyName} (${resolvedCompany?.ticker ?? "N/A"})`,
    `Sector: ${fundamentals?.sector ?? "Unknown"}`,
    fundamentals?.revenueGrowthYoY != null
      ? `Revenue Growth: ${(fundamentals.revenueGrowthYoY * 100).toFixed(1)}%`
      : null,
    fundamentals?.profitMargin != null
      ? `Profit Margin: ${(fundamentals.profitMargin * 100).toFixed(1)}%`
      : null,
    fundamentals?.peRatio != null ? `P/E: ${fundamentals.peRatio.toFixed(1)}` : null,
    `Sentiment: ${sentimentSummary ?? "Neutral"}`,
    `Industry: ${industryContext ?? "N/A"}`,
    `Risks: ${(risks ?? []).join("; ")}`,
    `Verdict: ${decision?.verdict ?? "HOLD"} (${decision?.weightedTotal ?? 50}/100)`,
    `Headlines: ${(news ?? []).slice(0, 3).map((n) => n.headline).join(" | ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  let swot: SWOT | undefined;
  let aiSummary: AISummary | undefined;
  let riskCategories: RiskCategory[] = [];

  try {
    const llm = getLLM({ temperature: 0.2 });
    const response = await llm.invoke([
      new SystemMessage(
        `You are a senior investment analyst. Return JSON only:
{
  "swot": {"strengths":["..."],"weaknesses":["..."],"opportunities":["..."],"threats":["..."]},
  "aiSummary": {
    "businessOverview":"...",
    "strengths":["..."],
    "weaknesses":["..."],
    "growthOpportunities":["..."],
    "risks":["..."],
    "investmentThesis":"...",
    "finalRecommendation":"..."
  },
  "riskCategories": [
    {"category":"Business Risk","level":"LOW"|"MEDIUM"|"HIGH","description":"..."},
    {"category":"Financial Risk","level":"...","description":"..."},
    {"category":"Market Risk","level":"...","description":"..."},
    {"category":"Valuation Risk","level":"...","description":"..."},
    {"category":"Competition Risk","level":"...","description":"..."}
  ]
}
Each array: 2-4 specific items. Be concrete, cite metrics when available.`
      ),
      new HumanMessage(contextBlock),
    ]);

    const text =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      swot = parsed.swot;
      aiSummary = parsed.aiSummary;
      riskCategories = parsed.riskCategories ?? [];
    }
  } catch {
    swot = {
      strengths: ["Established market presence"],
      weaknesses: ["Limited data availability for some metrics"],
      opportunities: ["Sector growth potential"],
      threats: ["Competitive and macroeconomic pressures"],
    };
    aiSummary = {
      businessOverview:
        resolvedCompany?.description ??
        `${companyName} operates in the ${fundamentals?.sector ?? "public"} markets.`,
      strengths: ["Public company with available market data"],
      weaknesses: ["Some financial metrics unavailable"],
      growthOpportunities: ["Monitor sector trends for entry points"],
      risks: risks?.slice(0, 3) ?? ["Market volatility"],
      investmentThesis:
        decision?.reasoning?.[0] ??
        "Analysis based on available public financial and news data.",
      finalRecommendation: `${decision?.verdict ?? "HOLD"} with ${decision?.confidence ?? 50}% confidence.`,
    };
    riskCategories = [
      {
        category: "Business Risk",
        level: "MEDIUM",
        description: "Standard business cycle exposure.",
      },
      {
        category: "Financial Risk",
        level: "MEDIUM",
        description: "Leverage and liquidity should be monitored.",
      },
      {
        category: "Market Risk",
        level: "MEDIUM",
        description: "Subject to broader market movements.",
      },
      {
        category: "Valuation Risk",
        level: "MEDIUM",
        description: "P/E and growth expectations may shift.",
      },
      {
        category: "Competition Risk",
        level: "MEDIUM",
        description: "Competitive dynamics in sector.",
      },
    ];
  }

  return { swot, aiSummary, competitors, riskCategories };
}
