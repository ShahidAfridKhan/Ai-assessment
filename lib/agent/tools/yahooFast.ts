/**
 * Fast fundamentals — single Yahoo call, essential modules only.
 */

import yahooFinance from "yahoo-finance2";
import type { FundamentalsData } from "./financialData";

const cache = new Map<string, { data: FundamentalsData; ts: number }>();
const TTL = 30 * 60 * 1000;

export async function fetchFundamentalsFast(ticker: string): Promise<FundamentalsData> {
  const key = ticker.toUpperCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const result: FundamentalsData = { ticker: key };

  try {
    const summary = (await yahooFinance.quoteSummary(ticker, {
      modules: ["assetProfile", "financialData", "summaryDetail", "defaultKeyStatistics"],
    })) as Record<string, Record<string, unknown>>;

    const profile = summary.assetProfile as {
      longName?: string;
      sector?: string;
      industry?: string;
      companyOfficers?: Array<{ name?: string }>;
      city?: string;
      country?: string;
      exchange?: string;
    };
    const financial = summary.financialData as {
      profitMargins?: number;
      operatingMargins?: number;
      debtToEquity?: number;
      freeCashflow?: number;
      returnOnEquity?: number;
      revenueGrowth?: number;
      totalRevenue?: number;
    };
    const stats = summary.defaultKeyStatistics as { trailingPE?: number; trailingEps?: number };
    const detail = summary.summaryDetail as {
      marketCap?: number;
      trailingPE?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      regularMarketPrice?: number;
    };

    result.companyName = profile?.longName ?? ticker;
    result.sector = profile?.sector;
    result.industry = profile?.industry;
    result.ceo = profile?.companyOfficers?.[0]?.name;
    result.headquarters = profile?.city
      ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
      : profile?.country;
    result.exchange = profile?.exchange;
    result.marketCapUSD = detail?.marketCap
      ? Math.round(detail.marketCap / 1_000_000)
      : undefined;
    result.peRatio = stats?.trailingPE ?? detail?.trailingPE;
    result.profitMargin = financial?.profitMargins;
    result.operatingMargin = financial?.operatingMargins;
    result.debtToEquity = financial?.debtToEquity;
    result.freeCashFlow = financial?.freeCashflow
      ? Math.round(financial.freeCashflow / 1_000_000)
      : undefined;
    result.revenueGrowthYoY = financial?.revenueGrowth;
    result.revenueUSD = financial?.totalRevenue
      ? Math.round(financial.totalRevenue / 1_000_000)
      : undefined;
    result.eps = stats?.trailingEps;
    result.roe = financial?.returnOnEquity;
    result.fiftyTwoWeekHigh = detail?.fiftyTwoWeekHigh;
    result.fiftyTwoWeekLow = detail?.fiftyTwoWeekLow;

    if (
      detail?.regularMarketPrice &&
      detail?.fiftyTwoWeekLow &&
      detail.fiftyTwoWeekLow > 0
    ) {
      result.priceHistory = [
        {
          label: "52W",
          value: Math.round(
            ((detail.regularMarketPrice - detail.fiftyTwoWeekLow) /
              detail.fiftyTwoWeekLow) *
              100
          ),
        },
      ];
    }
  } catch {
    result.notes = "Partial data from public sources.";
  }

  cache.set(key, { data: result, ts: Date.now() });
  return result;
}
