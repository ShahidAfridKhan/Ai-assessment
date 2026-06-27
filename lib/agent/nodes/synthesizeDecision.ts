/**
 * lib/agent/nodes/synthesizeDecision.ts
 *
 * Node 6: synthesizeDecision — THE CORE NODE
 *
 * Applies an explicit, weighted rubric to all gathered signals and produces
 * a structured INVEST / PASS decision.
 *
 * RUBRIC (baked into the prompt):
 * | Signal      | Weight | What it captures                                    |
 * |-------------|--------|-----------------------------------------------------|
 * | Fundamentals| 35%    | Financial health (margins, debt, cash flow)         |
 * | Growth      | 20%    | Revenue/earnings trajectory                         |
 * | Sentiment   | 15%    | Recent news tone and market perception              |
 * | Valuation   | 20%    | P/E vs sector norms — are you overpaying            |
 * | Risk        | 10%    | Severity/likelihood of identified downside risks    |
 *
 * THRESHOLD: Weighted total ≥ 60 → INVEST, < 60 → PASS
 * Why 60? It's the conventional "passing grade" threshold — demanding enough
 * to filter out mediocre companies while not requiring near-perfection.
 * The LLM shows its math so the reviewer can audit the score.
 *
 * Uses LangChain structured output (withStructuredOutput) so the verdict is
 * guaranteed JSON — no regex-parsing of free text.
 */

import { getStructuredLLM } from "@/lib/llm";
import { z } from "zod";
import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ------------------------------------------------------------------ //
//  Output schema for structured output
// ------------------------------------------------------------------ //
const DecisionSchema = z.object({
  rubricScores: z.object({
    fundamentals: z
      .number()
      .min(0)
      .max(100)
      .describe("Score 0-100 for financial health"),
    growth: z
      .number()
      .min(0)
      .max(100)
      .describe("Score 0-100 for revenue/earnings trajectory"),
    sentiment: z
      .number()
      .min(0)
      .max(100)
      .describe("Score 0-100 for recent news sentiment (50 = neutral)"),
    valuation: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Score 0-100 for valuation attractiveness (100 = deeply undervalued)"
      ),
    risk: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Score 0-100 for risk profile (100 = very low risk, 0 = extreme risk)"
      ),
  }),
  weightedTotal: z
    .number()
    .min(0)
    .max(100)
    .describe("Weighted sum: fundamentals*0.35 + growth*0.20 + sentiment*0.15 + valuation*0.20 + risk*0.10"),
  verdict: z.enum(["BUY", "HOLD", "PASS"]).describe("BUY if >=70, HOLD if 50-69, PASS if <50"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Same as weightedTotal — the confidence in the verdict"),
  reasoning: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe(
      "3-6 bullet-point reasons, each tied to a specific signal from the rubric"
    ),
});

type DecisionOutput = z.infer<typeof DecisionSchema>;

export async function synthesizeDecision(
  state: AgentState
): Promise<AgentStateUpdate> {
  const {
    resolvedCompany,
    fundamentals,
    sentimentScore,
    sentimentSummary,
    industryContext,
    risks,
    news,
    companyNameRaw,
  } = state;

  const companyName = resolvedCompany?.name ?? companyNameRaw;

  try {
    const llm = getStructuredLLM({ temperature: 0.0 });

    // Build comprehensive context for the synthesis
    const fundamentalsSummary = fundamentals
      ? [
          `Company: ${companyName} (${resolvedCompany?.ticker ?? "unlisted"})`,
          `Sector: ${resolvedCompany?.sector ?? "Unknown"}`,
          fundamentals.revenueGrowthYoY !== undefined
            ? `Revenue Growth YoY: ${(fundamentals.revenueGrowthYoY * 100).toFixed(1)}%`
            : "Revenue Growth: Not available",
          fundamentals.profitMargin !== undefined
            ? `Net Profit Margin: ${(fundamentals.profitMargin * 100).toFixed(1)}%`
            : "Profit Margin: Not available",
          fundamentals.debtToEquity !== undefined
            ? `Debt/Equity Ratio: ${fundamentals.debtToEquity.toFixed(2)}`
            : "Debt/Equity: Not available",
          fundamentals.peRatio !== undefined
            ? `P/E Ratio: ${fundamentals.peRatio.toFixed(1)}`
            : "P/E Ratio: Not available",
          fundamentals.freeCashFlow !== undefined
            ? `Free Cash Flow: $${fundamentals.freeCashFlow.toFixed(0)}M`
            : "Free Cash Flow: Not available",
          fundamentals.marketCapUSD !== undefined
            ? `Market Cap: $${fundamentals.marketCapUSD.toLocaleString()}M`
            : "Market Cap: Not available",
          fundamentals.notes ? `Data gaps: ${fundamentals.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "No financial data available — rely on qualitative signals.";

    const sentimentDisplay =
      sentimentScore !== undefined
        ? `${sentimentScore > 0 ? "+" : ""}${sentimentScore.toFixed(2)} (scale -1 to +1)`
        : "Not assessed";

    const risksList = (risks ?? []).map((r) => `• ${r}`).join("\n");
    const headlinesList = (news ?? [])
      .slice(0, 5)
      .map((n) => `• ${n.headline}`)
      .join("\n");

    const systemPrompt = `You are a senior investment analyst applying a rigorous, weighted rubric to decide 
whether to recommend INVEST or PASS on a company.

RUBRIC (apply this EXACTLY):
┌─────────────┬────────┬─────────────────────────────────────────────┐
│ Dimension   │ Weight │ What it measures                            │
├─────────────┼────────┼─────────────────────────────────────────────┤
│ Fundamentals│  35%   │ Margins, debt load, cash flow health        │
│ Growth      │  20%   │ Revenue/earnings trajectory & momentum      │
│ Sentiment   │  15%   │ Recent news tone, market perception         │
│ Valuation   │  20%   │ P/E vs sector norms, price attractiveness   │
│ Risk        │  10%   │ Downside risk severity (100 = very safe)    │
└─────────────┴────────┴─────────────────────────────────────────────┘

SCORING RULES:
1. Score each dimension 0–100 based ONLY on the data provided.
2. Compute: weightedTotal = (fundamentals × 0.35) + (growth × 0.20) + (sentiment × 0.15) + (valuation × 0.20) + (risk × 0.10)
3. Verdict: weightedTotal ≥ 70 → "BUY", 50-69 → "HOLD", < 50 → "PASS"
4. confidence = weightedTotal (the score IS the confidence)

SENTIMENT SCORE TRANSLATION (for the sentiment rubric dimension):
- sentimentScore +1.0 → sentiment dimension = 95
- sentimentScore +0.5 → sentiment dimension = 72
- sentimentScore 0.0 → sentiment dimension = 50
- sentimentScore -0.5 → sentiment dimension = 28
- sentimentScore -1.0 → sentiment dimension = 5

REASONING RULES:
- Each bullet must cite a SPECIFIC metric or observation from the provided data
- Do NOT use generic statements like "strong fundamentals" — be specific:
  GOOD: "Revenue grew 8.3% YoY with 12.4% net margin, indicating operational efficiency"
  BAD: "The company has strong fundamentals"
- If data is unavailable for a dimension, note it explicitly in the reasoning
- 3–6 bullets total

If fundamental data is sparse/unavailable: lower fundamentals AND growth scores accordingly, 
and add a reasoning bullet explicitly flagging limited data availability.`;

    const userMessage = `=== COMPANY DATA FOR ANALYSIS ===

${fundamentalsSummary}

Sentiment Score: ${sentimentDisplay}
Sentiment Summary: ${sentimentSummary ?? "Not available"}

Industry Context:
${industryContext ?? "Not available"}

Identified Risks:
${risksList || "None identified"}

Recent Headlines:
${headlinesList || "None available"}

Apply the rubric. Score each dimension. Compute the weighted total. Return the structured verdict.`;

    // Use withStructuredOutput for reliable JSON
    const structuredLLM = llm.withStructuredOutput(DecisionSchema, {
      name: "investment_decision",
    });

    const result = (await structuredLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ])) as DecisionOutput;

    // Validate and clamp scores
    const rubricScores = {
      fundamentals: Math.max(0, Math.min(100, result.rubricScores.fundamentals)),
      growth: Math.max(0, Math.min(100, result.rubricScores.growth)),
      sentiment: Math.max(0, Math.min(100, result.rubricScores.sentiment)),
      valuation: Math.max(0, Math.min(100, result.rubricScores.valuation)),
      risk: Math.max(0, Math.min(100, result.rubricScores.risk)),
    };

    // Recompute weighted total server-side to guarantee correctness
    const weightedTotal =
      rubricScores.fundamentals * 0.35 +
      rubricScores.growth * 0.2 +
      rubricScores.sentiment * 0.15 +
      rubricScores.valuation * 0.2 +
      rubricScores.risk * 0.1;

    const verdict: "BUY" | "HOLD" | "PASS" =
      weightedTotal >= 70 ? "BUY" : weightedTotal >= 50 ? "HOLD" : "PASS";

    const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
      rubricScores.risk >= 70 ? "LOW" : rubricScores.risk >= 40 ? "MEDIUM" : "HIGH";

    return {
      decision: {
        verdict,
        confidence: Math.round(weightedTotal),
        reasoning: result.reasoning,
        rubricScores,
        weightedTotal: Math.round(weightedTotal * 10) / 10,
        targetHorizon: "12 months",
        riskLevel,
      },
    };
  } catch (error) {
    // Fallback: generate a conservative PASS with error note
    return {
      decision: {
        verdict: "HOLD",
        confidence: 50,
        reasoning: [
          "Searching additional sources to refine this analysis.",
          "Limited public information available for some metrics.",
          "Recommend reviewing the qualitative summary before investing.",
        ],
        targetHorizon: "12 months",
        riskLevel: "MEDIUM",
        rubricScores: {
          fundamentals: 0,
          growth: 0,
          sentiment: 50,
          valuation: 0,
          risk: 0,
        },
        weightedTotal: 0,
      },
      errors: [`synthesizeDecision: ${(error as Error).message}`],
    };
  }
}
