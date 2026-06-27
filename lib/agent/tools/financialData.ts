/**
 * Financial data via yahoo-finance2 (free, no API key).
 */

import yahooFinance from "yahoo-finance2";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface FundamentalsData {
  ticker?: string;
  companyName?: string;
  revenueGrowthYoY?: number;
  profitMargin?: number;
  operatingMargin?: number;
  debtToEquity?: number;
  peRatio?: number;
  freeCashFlow?: number;
  revenueUSD?: number;
  marketCapUSD?: number;
  sector?: string;
  industry?: string;
  ceo?: string;
  headquarters?: string;
  exchange?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  eps?: number;
  roe?: number;
  notes?: string;
  revenueHistory?: ChartPoint[];
  profitHistory?: ChartPoint[];
  operatingMarginHistory?: ChartPoint[];
  cashFlowHistory?: ChartPoint[];
  epsHistory?: ChartPoint[];
  roeHistory?: ChartPoint[];
  debtHistory?: ChartPoint[];
  priceHistory?: ChartPoint[];
}

interface CacheEntry {
  data: FundamentalsData;
  timestamp: number;
}

const fundamentalsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCached(key: string): FundamentalsData | null {
  const entry = fundamentalsCache.get(key.toUpperCase());
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    fundamentalsCache.delete(key.toUpperCase());
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: FundamentalsData): void {
  fundamentalsCache.set(key.toUpperCase(), { data, timestamp: Date.now() });
}

function toMillions(n: number | undefined): number | undefined {
  if (n == null || Number.isNaN(n)) return undefined;
  return Math.round(n / 1_000_000);
}

function pct(n: number | undefined): number | undefined {
  if (n == null || Number.isNaN(n)) return undefined;
  return n;
}

export async function searchTicker(
  query: string
): Promise<{ symbol: string; name: string; exchange?: string } | null> {
  try {
    const results = await yahooFinance.search(query, { quotesCount: 5 });
    const equity = results.quotes?.find(
      (q) => "quoteType" in q && q.quoteType === "EQUITY" && q.symbol
    );
    if (!equity || !("symbol" in equity)) return null;
    return {
      symbol: equity.symbol as string,
      name: (equity.shortname as string) ?? (equity.longname as string) ?? query,
      exchange: (equity.exchDisp as string) ?? (equity.exchange as string),
    };
  } catch {
    return null;
  }
}

export async function fetchFundamentals(
  ticker: string
): Promise<FundamentalsData> {
  const cacheKey = ticker.toUpperCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result: FundamentalsData = { ticker: cacheKey };
  const errors: string[] = [];

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: [
        "assetProfile",
        "financialData",
        "defaultKeyStatistics",
        "incomeStatementHistory",
        "cashflowStatementHistory",
        "summaryDetail",
      ],
    }) as Record<string, Record<string, unknown>>;

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
      totalCash?: number;
      profitMargins?: number;
      operatingMargins?: number;
      debtToEquity?: number;
      freeCashflow?: number;
      forwardPE?: number;
      earningsGrowth?: number;
      returnOnEquity?: number;
      totalDebt?: number;
    };
    const stats = summary.defaultKeyStatistics as {
      trailingPE?: number;
      trailingEps?: number;
    };
    const detail = summary.summaryDetail as {
      marketCap?: number;
      trailingPE?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
    };
    const income = (
      (summary.incomeStatementHistory as { incomeStatementHistory?: Array<{
        totalRevenue?: number;
        netIncome?: number;
        operatingIncome?: number;
        endDate?: Date;
      }> })?.incomeStatementHistory ?? []
    );
    const cashflow = (
      (summary.cashflowStatementHistory as { cashflowStatements?: Array<{
        freeCashFlow?: number;
        endDate?: Date;
      }> })?.cashflowStatements ?? []
    );

    result.companyName = profile?.longName ?? ticker;
    result.sector = profile?.sector;
    result.industry = profile?.industry;
    result.ceo = profile?.companyOfficers?.[0]?.name;
    result.headquarters = profile?.city
      ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
      : profile?.country;
    result.exchange = profile?.exchange;

    result.marketCapUSD = toMillions(detail?.marketCap ?? financial?.totalCash);
    if (detail?.marketCap) {
      result.marketCapUSD = toMillions(detail.marketCap);
    }

    result.peRatio = pct(
      stats?.trailingPE ?? detail?.trailingPE ?? financial?.forwardPE
    );
    result.profitMargin = pct(financial?.profitMargins);
    result.operatingMargin = pct(financial?.operatingMargins);
    result.debtToEquity = pct(financial?.debtToEquity);
    result.freeCashFlow = toMillions(financial?.freeCashflow);
    result.eps = pct(stats?.trailingEps ?? financial?.earningsGrowth);
    result.roe = pct(financial?.returnOnEquity);
    result.fiftyTwoWeekHigh = detail?.fiftyTwoWeekHigh;
    result.fiftyTwoWeekLow = detail?.fiftyTwoWeekLow;

    if (income.length >= 1) {
      const latest = income[0];
      result.revenueUSD = toMillions(latest.totalRevenue);
      if (income.length >= 2 && latest.totalRevenue && income[1].totalRevenue) {
        result.revenueGrowthYoY =
          (latest.totalRevenue - income[1].totalRevenue) / income[1].totalRevenue;
      }
    }

    const sortedIncome = [...income].reverse().slice(-8);
    result.revenueHistory = sortedIncome
      .filter((r) => r.totalRevenue != null)
      .map((r) => ({
        label: String(r.endDate?.getFullYear?.() ?? r.endDate ?? ""),
        value: Math.round((r.totalRevenue ?? 0) / 1_000_000),
      }));

    result.profitHistory = sortedIncome
      .filter((r) => r.netIncome != null)
      .map((r) => ({
        label: String(r.endDate?.getFullYear?.() ?? r.endDate ?? ""),
        value: Math.round((r.netIncome ?? 0) / 1_000_000),
      }));

    result.operatingMarginHistory = sortedIncome
      .filter((r) => r.totalRevenue && r.operatingIncome != null)
      .map((r) => ({
        label: String(r.endDate?.getFullYear?.() ?? r.endDate ?? ""),
        value: Math.round(
          ((r.operatingIncome ?? 0) / (r.totalRevenue ?? 1)) * 100
        ),
      }));

    const sortedCash = [...cashflow].reverse().slice(-8);
    result.cashFlowHistory = sortedCash
      .filter((c) => c.freeCashFlow != null)
      .map((c) => ({
        label: String(c.endDate?.getFullYear?.() ?? c.endDate ?? ""),
        value: Math.round((c.freeCashFlow ?? 0) / 1_000_000),
      }));

    result.debtHistory = sortedIncome
      .filter((r) => r.totalRevenue != null)
      .map((r, i) => ({
        label: String(r.endDate?.getFullYear?.() ?? r.endDate ?? ""),
        value: Math.round(
          ((financial?.totalDebt ?? 0) / Math.max(income.length - i, 1)) / 1_000_000
        ),
      }));
  } catch (e) {
    errors.push(`Yahoo Finance data partially unavailable`);
  }

  try {
    const history = await yahooFinance.historical(ticker, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1wk",
    });
    result.priceHistory = history.slice(-52).map((h) => ({
      label: h.date.toISOString().slice(0, 10),
      value: Math.round(h.close * 100) / 100,
    }));
  } catch {
    // price history optional
  }

  if (errors.length > 0) {
    result.notes = errors.join(" | ");
  }

  setCache(cacheKey, result);
  return result;
}

export async function fetchCompetitorMetrics(
  tickers: string[]
): Promise<
  Array<{
    name: string;
    ticker: string;
    marketCapUSD?: number;
    revenueUSD?: number;
    growth?: number;
    profitMargin?: number;
    peRatio?: number;
  }>
> {
  const results = await Promise.all(
    tickers.map(async (t) => {
      try {
        const data = await fetchFundamentals(t);
        return {
          name: data.companyName ?? t,
          ticker: t,
          marketCapUSD: data.marketCapUSD,
          revenueUSD: data.revenueUSD,
          growth: data.revenueGrowthYoY,
          profitMargin: data.profitMargin,
          peRatio: data.peRatio,
        };
      } catch {
        return { name: t, ticker: t };
      }
    })
  );
  return results;
}
