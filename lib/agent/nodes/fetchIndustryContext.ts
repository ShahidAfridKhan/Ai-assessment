/**
 * Node 4: fetchIndustryContext — Wikipedia + Gemini (no paid search).
 */

import { getLLM } from "@/lib/llm";
import { fetchWikipediaSummary } from "@/lib/agent/tools/wikipedia";
import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function fetchIndustryContext(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany, companyNameRaw, fundamentals } = state;
  const companyName = resolvedCompany?.name ?? companyNameRaw;
  const sector =
    fundamentals?.sector ?? resolvedCompany?.sector ?? "technology";

  try {
    const wiki = await fetchWikipediaSummary(`${sector} industry`);
    const companyWiki = resolvedCompany?.wikipediaExtract ?? "";

    const llm = getLLM({ temperature: 0.1 });
    const response = await llm.invoke([
      new SystemMessage(
        `Summarize industry context in 3-5 sentences. Cover trends, competitors, and macro factors. Plain text only.`
      ),
      new HumanMessage(
        `Company: ${companyName}\nSector: ${sector}\n\nCompany context:\n${companyWiki}\n\nIndustry wiki:\n${wiki?.extract ?? "Limited industry data."}`
      ),
    ]);

    const summary =
      typeof response.content === "string"
        ? response.content.trim()
        : "Industry context synthesized from public sources.";

    return { industryContext: summary };
  } catch {
    return {
      industryContext:
        "Limited public information available for industry context.",
    };
  }
}
