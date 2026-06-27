/**
 * lib/agent/nodes/assessRisk.ts
 *
 * Node 5: assessRisk
 *
 * Takes fundamentals + news + industry context and asks the LLM to identify
 * 3–5 specific, falsifiable risks. Each risk must be:
 * - Specific to THIS company (not generic boilerplate)
 * - Falsifiable — a concrete claim that could be proven right or wrong
 * - Categorized (Regulatory / Competitive / Financial / Macro / Operational)
 *
 * Example of BAD risk: "Market risk exists"
 * Example of GOOD risk: "Tesla's FSD regulatory approval in Europe remains blocked;
 *   a delay past Q3 2025 would eliminate a key growth segment."
 */

import { getLLM } from "@/lib/llm";
import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function assessRisk(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany, fundamentals, sentimentSummary, industryContext, news } =
    state;

  const companyName = resolvedCompany?.name ?? state.companyNameRaw;

  try {
    const llm = getLLM({ temperature: 0.1 });

    // Build context for the LLM
    const fundamentalsSummary = fundamentals
      ? [
          fundamentals.revenueGrowthYoY !== undefined
            ? `Revenue Growth YoY: ${(fundamentals.revenueGrowthYoY * 100).toFixed(1)}%`
            : null,
          fundamentals.profitMargin !== undefined
            ? `Net Profit Margin: ${(fundamentals.profitMargin * 100).toFixed(1)}%`
            : null,
          fundamentals.debtToEquity !== undefined
            ? `Debt/Equity: ${fundamentals.debtToEquity.toFixed(2)}`
            : null,
          fundamentals.peRatio !== undefined
            ? `P/E Ratio: ${fundamentals.peRatio.toFixed(1)}`
            : null,
          fundamentals.notes ? `Data notes: ${fundamentals.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "No financial data available.";

    const recentHeadlines = (news ?? [])
      .slice(0, 5)
      .map((n) => `- ${n.headline}`)
      .join("\n");

    const systemPrompt = `You are a risk analyst for an investment research firm. Identify 3 to 5 specific, 
falsifiable risks for this company.

RULES for each risk:
1. Must be specific to THIS company — no generic "market risk exists" platitudes
2. Must be falsifiable — a concrete claim about what could go wrong and when
3. Must cite a specific mechanism (regulatory, competitive, financial, macro, operational)
4. Format: "[Category] Risk statement" — one sentence, max 30 words

Return a JSON array of strings:
["[Category] Specific risk statement one", "[Category] Specific risk statement two", ...]

Return ONLY the JSON array, no markdown.`;

    const userMessage = `Company: ${companyName}
Sector: ${resolvedCompany?.sector ?? "Unknown"}
Ticker: ${resolvedCompany?.ticker ?? "Private/Unknown"}

Financial Fundamentals:
${fundamentalsSummary}

Sentiment Summary:
${sentimentSummary ?? "Not available"}

Industry Context:
${industryContext ?? "Not available"}

Recent Headlines:
${recentHeadlines || "No recent headlines"}

Identify 3–5 specific, falsifiable risks.`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    const responseText =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("LLM returned non-JSON risk response");

    const risks: string[] = JSON.parse(jsonMatch[0]);

    // Validate — ensure we have an array of strings
    if (!Array.isArray(risks) || risks.some((r) => typeof r !== "string")) {
      throw new Error("Invalid risk format from LLM");
    }

    return { risks: risks.slice(0, 5) };
  } catch (error) {
    // Fallback: return a single generic error risk so the UI never shows an empty list
    return {
      risks: [
        `[Data] Insufficient information available to assess specific risks for ${companyName}. Proceed with caution.`,
      ],
      errors: [`assessRisk: ${(error as Error).message}`],
    };
  }
}
