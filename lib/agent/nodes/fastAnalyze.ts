/**
 * Node 3: Single Gemini call — decision, summary, SWOT, risks, competitors.
 * Falls back to rule-based scoring if LLM times out.
 */

import { getStructuredLLM } from "@/lib/llm";
import { z } from "zod";
import type { AgentState, AgentStateUpdate, Verdict } from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const AnalysisSchema = z.object({
  sentimentScore: z.number().min(-1).max(1),
  sentimentSummary: z.string(),
  rubricScores: z.object({
    fundamentals: z.number().min(0).max(100),
    growth: z.number().min(0).max(100),
    sentiment: z.number().min(0).max(100),
    valuation: z.number().min(0).max(100),
    risk: z.number().min(0).max(100),
  }),
  verdict: z.enum(["BUY", "HOLD", "PASS"]),
  reasoning: z.array(z.string()).min(2).max(4),
  aiRecommendation: z.string(),
  businessOverview: z.string(),
  strengths: z.array(z.string()).min(2).max(3),
  weaknesses: z.array(z.string()).min(2).max(3),
  growthOpportunities: z.array(z.string()).min(2).max(3),
  risks: z.array(z.string()).min(2).max(4),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        ticker: z.string(),
        rating: z.enum(["BUY", "HOLD", "PASS"]),
      })
    )
    .min(2)
    .max(4),
  riskCategories: z.array(
    z.object({
      category: z.string(),
      level: z.enum(["LOW", "MEDIUM", "HIGH"]),
      description: z.string(),
    })
  ),
  articleSentiments: z
    .array(
      z.object({
        index: z.number(),
        sentiment: z.enum(["positive", "negative", "neutral"]),
      })
    )
    .optional(),
});

type AnalysisOutput = z.infer<typeof AnalysisSchema>;

function ruleBasedVerdict(f: AgentState["fundamentals"]): {
  verdict: Verdict;
  score: number;
  reasoning: string[];
} {
  let score = 42;
  const reasoning: string[] = [];

  if (f?.profitMargin != null) {
    const m = f.profitMargin * 100;
    score += Math.min(18, m * 0.65);
    reasoning.push(`Net profit margin of ${m.toFixed(1)}% reflects operational efficiency.`);
  }
  if (f?.revenueGrowthYoY != null) {
    const g = f.revenueGrowthYoY * 100;
    score += Math.min(16, Math.max(-8, g * 0.9));
    reasoning.push(
      `${g >= 0 ? "Revenue" : "Price"} growth of ${g >= 0 ? "+" : ""}${g.toFixed(1)}% signals ${g > 10 ? "strong" : "moderate"} momentum.`
    );
  }
  if (f?.return10Year != null) {
    const r10 = f.return10Year * 100;
    score += Math.min(12, r10 / 50);
    if (reasoning.length < 3)
      reasoning.push(`10-year return of ${r10.toFixed(0)}% shows long-term track record.`);
  }
  if (f?.return52Week != null) {
    const r52 = f.return52Week * 100;
    score += Math.min(8, r52 * 0.15);
  }
  if (f?.peRatio != null) {
    if (f.peRatio < 22) {
      score += 10;
      reasoning.push(`P/E of ${f.peRatio.toFixed(1)} suggests reasonable valuation.`);
    } else if (f.peRatio < 40) score += 4;
    else score -= 6;
  }
  if (f?.debtToEquity != null) {
    if (f.debtToEquity < 0.8) {
      score += 8;
      reasoning.push(`Conservative leverage with D/E of ${f.debtToEquity.toFixed(2)}.`);
    } else if (f.debtToEquity > 2) score -= 8;
  }
  if (f?.marketCapUSD != null && f.marketCapUSD > 50_000) {
    score += 4;
  }

  score = Math.round(Math.min(92, Math.max(28, score)));
  const verdict: Verdict = score >= 72 ? "BUY" : score >= 52 ? "HOLD" : "PASS";

  while (reasoning.length < 3) {
    if (f?.marketCapUSD)
      reasoning.push(`Market cap of $${(f.marketCapUSD / 1000).toFixed(1)}B indicates established scale.`);
    else reasoning.push("Analysis derived from verified public market data.");
    if (reasoning.length < 3) reasoning.push("12-month investment horizon recommended.");
  }

  return { verdict, score, reasoning: reasoning.slice(0, 4) };
}

export async function fastAnalyze(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany, fundamentals, news, companyNameRaw } = state;
  const name = resolvedCompany?.name ?? companyNameRaw;

  const metrics = [
    fundamentals?.revenueGrowthYoY != null
      ? `Revenue Growth: ${(fundamentals.revenueGrowthYoY * 100).toFixed(1)}%`
      : null,
    fundamentals?.profitMargin != null
      ? `Net Margin: ${(fundamentals.profitMargin * 100).toFixed(1)}%`
      : null,
    fundamentals?.peRatio != null ? `P/E: ${fundamentals.peRatio.toFixed(1)}` : null,
    fundamentals?.debtToEquity != null
      ? `D/E: ${fundamentals.debtToEquity.toFixed(2)}`
      : null,
    fundamentals?.marketCapUSD != null
      ? `Market Cap: $${fundamentals.marketCapUSD}M`
      : null,
    `Sector: ${fundamentals?.sector ?? resolvedCompany?.sector ?? "Unknown"}`,
  ]
    .filter(Boolean)
    .join(" | ");

  const headlines = (news ?? [])
    .slice(0, 4)
    .map((n, i) => `[${i}] ${n.headline}`)
    .join("\n");

  const fallback = ruleBasedVerdict(fundamentals);

  try {
    const llm = getStructuredLLM({ maxTokens: 2048 });
    const structured = llm.withStructuredOutput(AnalysisSchema, {
      name: "fast_analysis",
    });

    const result = (await Promise.race([
      structured.invoke([
        new SystemMessage(
          `Senior investment analyst. One JSON response. Be concise.
Score rubric: fundamentals 35%, growth 20%, sentiment 15%, valuation 20%, risk 10%.
BUY >=70, HOLD 50-69, PASS <50.
Name 3-4 sector competitors with tickers. Cite specific metrics in reasoning.`
        ),
        new HumanMessage(
          `Company: ${name} (${resolvedCompany?.ticker ?? "N/A"})\nMetrics: ${metrics}\nNews:\n${headlines || "None"}`
        ),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 18_000)
      ),
    ])) as AnalysisOutput;

    const updatedNews = [...(news ?? [])];
    result.articleSentiments?.forEach((s: { index: number; sentiment: "positive" | "negative" | "neutral" }) => {
      if (updatedNews[s.index]) updatedNews[s.index].sentiment = s.sentiment;
    });

    // Always use rule-based score when we have market data (reliable & differentiated)
    const computed = ruleBasedVerdict(fundamentals);
    const hasMarketData =
      fundamentals?.peRatio != null ||
      fundamentals?.profitMargin != null ||
      fundamentals?.return10Year != null;

    if (hasMarketData) {
      const rubric = {
        fundamentals: Math.min(95, computed.score + 5),
        growth: Math.min(
          95,
          50 + (fundamentals?.revenueGrowthYoY ?? fundamentals?.return1Year ?? 0) * 120
        ),
        sentiment: Math.round(50 + (result.sentimentScore ?? 0) * 35),
        valuation: fundamentals?.peRatio
          ? Math.min(95, Math.max(25, 80 - fundamentals.peRatio))
          : computed.score,
        risk: Math.min(90, Math.max(30, computed.score - 5)),
      };
      const weightedTotal =
        rubric.fundamentals * 0.35 +
        rubric.growth * 0.2 +
        rubric.sentiment * 0.15 +
        rubric.valuation * 0.2 +
        rubric.risk * 0.1;
      const finalScore = Math.round(weightedTotal);
      const verdict: Verdict =
        finalScore >= 72 ? "BUY" : finalScore >= 52 ? "HOLD" : "PASS";

      return {
        news: updatedNews,
        sentimentScore: result.sentimentScore,
        sentimentSummary: result.sentimentSummary,
        risks: result.risks,
        riskCategories: result.riskCategories,
        swot: result.swot,
        competitors: result.competitors.map((c) => ({
          name: c.name,
          ticker: c.ticker,
          rating: c.rating,
        })),
        aiSummary: {
          businessOverview: result.businessOverview,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          growthOpportunities: result.growthOpportunities,
          risks: result.risks,
          investmentThesis: result.aiRecommendation,
          finalRecommendation: `${verdict} — ${result.aiRecommendation}`,
        },
        decision: {
          verdict,
          confidence: finalScore,
          reasoning: [
            ...computed.reasoning.slice(0, 2),
            result.reasoning[0] ?? result.aiRecommendation.slice(0, 120),
          ],
          rubricScores: rubric,
          weightedTotal: finalScore,
          targetHorizon: "12 months",
          riskLevel:
            rubric.risk >= 65 ? "LOW" : rubric.risk >= 45 ? "MEDIUM" : "HIGH",
        },
      };
    }

    const rubric = result.rubricScores;
    const weightedTotal =
      rubric.fundamentals * 0.35 +
      rubric.growth * 0.2 +
      rubric.sentiment * 0.15 +
      rubric.valuation * 0.2 +
      rubric.risk * 0.1;

    const verdict: Verdict =
      weightedTotal >= 72 ? "BUY" : weightedTotal >= 52 ? "HOLD" : "PASS";

    return {
      news: updatedNews,
      sentimentScore: result.sentimentScore,
      sentimentSummary: result.sentimentSummary,
      risks: result.risks,
      riskCategories: result.riskCategories,
      swot: result.swot,
      competitors: result.competitors.map((c) => ({
        name: c.name,
        ticker: c.ticker,
        rating: c.rating,
      })),
      aiSummary: {
        businessOverview: result.businessOverview,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        growthOpportunities: result.growthOpportunities,
        risks: result.risks,
        investmentThesis: result.aiRecommendation,
        finalRecommendation: `${result.verdict} — ${result.aiRecommendation}`,
      },
      decision: {
        verdict: result.verdict ?? verdict,
        confidence: Math.round(weightedTotal),
        reasoning: result.reasoning,
        rubricScores: rubric,
        weightedTotal: Math.round(weightedTotal * 10) / 10,
        targetHorizon: "12 months",
        riskLevel:
          rubric.risk >= 70 ? "LOW" : rubric.risk >= 40 ? "MEDIUM" : "HIGH",
      },
    };
  } catch {
    return {
      sentimentScore: 0,
      sentimentSummary: "Mixed sentiment from available news sources.",
      risks: ["Market volatility may affect near-term performance."],
      riskCategories: [
        { category: "Market Risk", level: "MEDIUM", description: "Subject to broader market movements." },
        { category: "Valuation Risk", level: "MEDIUM", description: "Multiples may shift with earnings." },
      ],
      swot: {
        strengths: fallback.reasoning.slice(0, 2),
        weaknesses: ["Some metrics unavailable from public sources."],
        opportunities: ["Monitor sector trends for entry points."],
        threats: ["Competitive and macroeconomic headwinds."],
      },
      competitors: [
        { name: "Sector Peer A", ticker: "—", rating: "HOLD" as Verdict },
        { name: "Sector Peer B", ticker: "—", rating: "HOLD" as Verdict },
      ],
      aiSummary: {
        businessOverview: resolvedCompany?.description ?? `${name} — public company analysis.`,
        strengths: fallback.reasoning,
        weaknesses: ["Limited data for some metrics."],
        growthOpportunities: ["Sector recovery potential."],
        risks: ["Standard market risks apply."],
        investmentThesis: fallback.reasoning.join(" "),
        finalRecommendation: `${fallback.verdict} with ${fallback.score}/100 confidence. 12-month horizon.`,
      },
      decision: {
        verdict: fallback.verdict,
        confidence: fallback.score,
        reasoning: fallback.reasoning,
        rubricScores: {
          fundamentals: fallback.score,
          growth: fallback.score,
          sentiment: 50,
          valuation: fallback.score,
          risk: 55,
        },
        weightedTotal: fallback.score,
        targetHorizon: "12 months",
        riskLevel: "MEDIUM",
      },
    };
  }
}
