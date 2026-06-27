/**
 * Fast 3-step research pipeline — target <15s total.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation } from "@/lib/agent/state";
import { resolveCompany } from "@/lib/agent/nodes/resolveCompany";
import { fetchAllParallel } from "@/lib/agent/nodes/fetchAllParallel";
import { fastAnalyze } from "@/lib/agent/nodes/fastAnalyze";
import { formatReport, type FinalReport } from "@/lib/agent/nodes/formatReport";

export const NODE_LABELS: Record<string, string> = {
  resolveCompany: "Finding Company",
  fetchAllParallel: "Collecting Financial Data",
  fastAnalyze: "Generating AI Report",
  formatReport: "Finalizing Report",
};

export const finalReportStore = new Map<string, FinalReport>();

function buildGraph() {
  const formatReportWrapper = async (
    state: typeof AgentStateAnnotation.State
  ): Promise<Partial<typeof AgentStateAnnotation.State>> => {
    const result = await formatReport(state);
    const sideChannel = result as { __finalReport?: FinalReport };
    if (sideChannel.__finalReport) {
      finalReportStore.set(state.companyNameRaw, sideChannel.__finalReport);
    }
    return {};
  };

  return new StateGraph(AgentStateAnnotation)
    .addNode("resolveCompany", resolveCompany)
    .addNode("fetchAllParallel", fetchAllParallel)
    .addNode("fastAnalyze", fastAnalyze)
    .addNode("formatReport", formatReportWrapper)
    .addEdge(START, "resolveCompany")
    .addEdge("resolveCompany", "fetchAllParallel")
    .addEdge("fetchAllParallel", "fastAnalyze")
    .addEdge("fastAnalyze", "formatReport")
    .addEdge("formatReport", END)
    .compile();
}

export const investmentGraph = buildGraph();
