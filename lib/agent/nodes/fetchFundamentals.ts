/**
 * Node 2: fetchFundamentals — Yahoo Finance data.
 */

import { fetchFundamentals as fetchFromYahoo } from "@/lib/agent/tools/financialData";
import type { AgentState, AgentStateUpdate } from "@/lib/agent/state";

export async function fetchFundamentals(
  state: AgentState
): Promise<AgentStateUpdate> {
  const { resolvedCompany } = state;

  if (!resolvedCompany?.ticker) {
    return {
      fundamentals: {
        notes:
          "Limited public information available. Analysis will use qualitative sources.",
      },
    };
  }

  try {
    const data = await fetchFromYahoo(resolvedCompany.ticker);

    return {
      fundamentals: {
        revenueGrowthYoY: data.revenueGrowthYoY,
        profitMargin: data.profitMargin,
        operatingMargin: data.operatingMargin,
        debtToEquity: data.debtToEquity,
        peRatio: data.peRatio,
        freeCashFlow: data.freeCashFlow,
        revenueUSD: data.revenueUSD,
        marketCapUSD: data.marketCapUSD,
        eps: data.eps,
        roe: data.roe,
        fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: data.fiftyTwoWeekLow,
        ceo: data.ceo,
        headquarters: data.headquarters,
        exchange: data.exchange,
        sector: data.sector,
        industry: data.industry,
        revenueHistory: data.revenueHistory,
        profitHistory: data.profitHistory,
        operatingMarginHistory: data.operatingMarginHistory,
        cashFlowHistory: data.cashFlowHistory,
        epsHistory: data.epsHistory,
        roeHistory: data.roeHistory,
        debtHistory: data.debtHistory,
        priceHistory: data.priceHistory,
        notes: data.notes,
      },
      resolvedCompany: {
        ...resolvedCompany,
        sector: data.sector ?? resolvedCompany.sector,
        ceo: data.ceo ?? resolvedCompany.ceo,
        headquarters: data.headquarters ?? resolvedCompany.headquarters,
        exchange: data.exchange ?? resolvedCompany.exchange,
      },
    };
  } catch {
    return {
      fundamentals: {
        notes: "Searching additional sources for financial data.",
      },
    };
  }
}
