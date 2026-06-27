/**
 * Reliable market data — Yahoo Chart API (prices) + Twelve Data (fundamentals).
 * Yahoo quoteSummary is rate-limited; chart endpoint works without auth.
 */

export interface ChartPoint {
  label: string;
  value: number;
}

export interface MarketData {
  ticker: string;
  companyName: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  ceo?: string;
  headquarters?: string;
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
  return52Week?: number;
  return1Year?: number;
  return10Year?: number;
  currentPrice?: number;
  priceChart10Y?: ChartPoint[];
  priceHistory?: ChartPoint[];
  revenueHistory?: ChartPoint[];
  profitHistory?: ChartPoint[];
  volumeHistory?: ChartPoint[];
  notes?: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

const KNOWN_TICKERS: Record<string, string> = {
  apple: "AAPL",
  tesla: "TSLA",
  nvidia: "NVDA",
  microsoft: "MSFT",
  google: "GOOGL",
  alphabet: "GOOGL",
  amazon: "AMZN",
  meta: "META",
  facebook: "META",
  netflix: "NFLX",
  amd: "AMD",
  intel: "INTC",
  infosys: "INFY",
  tata: "TCS.NS",
  "tata motors": "TATAMOTORS.NS",
  reliance: "RELIANCE.NS",
  walmart: "WMT",
  jpmorgan: "JPM",
  "jp morgan": "JPM",
  berkshire: "BRK-B",
  cocacola: "KO",
  "coca cola": "KO",
  disney: "DIS",
  paypal: "PYPL",
  uber: "UBER",
  airbnb: "ABNB",
  coinbase: "COIN",
  palantir: "PLTR",
  salesforce: "CRM",
  adobe: "ADBE",
  spotify: "SPOT",
};

const cache = new Map<string, { data: MarketData; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export function resolveTickerSymbol(input: string): string {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  if (KNOWN_TICKERS[lower]) return KNOWN_TICKERS[lower];
  if (/^[A-Z0-9.\-]{1,12}$/i.test(raw)) return raw.toUpperCase();
  for (const [name, sym] of Object.entries(KNOWN_TICKERS)) {
    if (lower.includes(name) || name.includes(lower)) return sym;
  }
  return raw.toUpperCase().replace(/\s+/g, "");
}

async function fetchYahooChart(ticker: string): Promise<{
  meta: Record<string, number | string>;
  timestamps: number[];
  closes: number[];
  volumes: number[];
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=10y`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const q = result.indicators?.quote?.[0];
    const closes = (q?.close as number[])?.filter((c) => c != null) ?? [];
    const volumes = (q?.volume as number[])?.filter((v) => v != null) ?? [];
    const timestamps = (result.timestamp as number[]) ?? [];
    return { meta: result.meta, timestamps, closes, volumes };
  } catch {
    return null;
  }
}

async function searchYahooSymbol(query: string): Promise<{ symbol: string; companyName?: string } | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const quote = Array.isArray(json?.quotes) ? json.quotes[0] : null;
    if (!quote?.symbol) return null;
    return {
      symbol: quote.symbol,
      companyName: quote.shortname ?? quote.longname ?? quote.symbol,
    };
  } catch {
    return null;
  }
}

async function fetchTwelveDataStats(ticker: string): Promise<Partial<MarketData> | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
    });
    const json = await res.json();
    if (!json?.statistics) return null;

    const v = json.statistics.valuations_metrics ?? {};
    const f = json.statistics.financials ?? {};
    const b = f.balance_sheet ?? {};
    const i = f.income_statement ?? {};
    const profile = json.meta ?? {};

    const debtRaw = b.total_debt_to_equity_mrq;
    const debtToEquity =
      debtRaw != null ? (debtRaw > 10 ? debtRaw / 100 : debtRaw) : undefined;

    return {
      companyName: profile.name,
      peRatio: v.trailing_pe,
      marketCapUSD: v.market_capitalization
        ? Math.round(v.market_capitalization / 1_000_000)
        : undefined,
      profitMargin: f.profit_margin,
      operatingMargin: f.operating_margin,
      revenueGrowthYoY: i.quarterly_revenue_growth,
      debtToEquity,
      eps: i.diluted_eps_ttm,
      roe: f.return_on_equity_ttm,
      revenueUSD: i.revenue_ttm
        ? Math.round(i.revenue_ttm / 1_000_000)
        : undefined,
      sector: profile.sector,
      industry: profile.industry,
    };
  } catch {
    return null;
  }
}

function buildPriceChart(
  timestamps: number[],
  closes: number[]
): ChartPoint[] {
  return closes.map((close, i) => ({
    label: timestamps[i]
      ? new Date(timestamps[i] * 1000).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        })
      : String(i),
    value: Math.round(close * 100) / 100,
  }));
}

export async function fetchMarketData(query: string): Promise<MarketData> {
  const initialTicker = resolveTickerSymbol(query);
  const searchResult = await searchYahooSymbol(query).catch(() => null);
  const ticker = searchResult?.symbol ?? initialTicker;
  const cacheKey = ticker.toUpperCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const [chart, stats] = await Promise.all([
    fetchYahooChart(ticker),
    fetchTwelveDataStats(ticker),
  ]);

  const result: MarketData = {
    ticker: cacheKey,
    companyName: searchResult?.companyName ?? query,
  };

  if (chart && chart.closes.length > 0) {
    const { meta, closes, timestamps, volumes } = chart;
    const price = (meta.regularMarketPrice as number) ?? closes[closes.length - 1];
    const hi52 = meta.fiftyTwoWeekHigh as number | undefined;
    const lo52 = meta.fiftyTwoWeekLow as number | undefined;
    const first = closes[0];
    const last = closes[closes.length - 1];

    result.companyName =
      (meta.longName as string) ??
      (meta.shortName as string) ??
      stats?.companyName ??
      searchResult?.companyName ??
      query;
    result.exchange = meta.fullExchangeName as string | undefined;
    result.currentPrice = price;
    result.fiftyTwoWeekHigh = hi52;
    result.fiftyTwoWeekLow = lo52;
    result.priceChart10Y = buildPriceChart(timestamps, closes);
    result.priceHistory = buildPriceChart(
      timestamps.slice(-8),
      closes.slice(-8)
    );
    result.return10Year = first > 0 ? (last - first) / first : undefined;
    result.return52Week =
      lo52 && lo52 > 0 ? (price - lo52) / lo52 : undefined;

    const yearAgoIdx = Math.max(0, closes.length - 13);
    const yearAgo = closes[yearAgoIdx];
    if (yearAgo > 0) result.return1Year = (last - yearAgo) / yearAgo;

    result.revenueHistory = result.priceChart10Y;
    result.profitHistory = closes.slice(-8).map((c, i) => {
      const timestamp = timestamps[Math.max(0, timestamps.length - 8 + i)];
      return {
        label: timestamp
          ? new Date(timestamp * 1000).toLocaleDateString("en-US", {
              month: "short",
            })
          : `M${i + 1}`,
        value: Math.round(c),
      };
    });
    result.volumeHistory = volumes.slice(-12).map((v, i) => {
      const timestamp = timestamps[Math.max(0, timestamps.length - 12 + i)];
      return {
        label: timestamp
          ? new Date(timestamp * 1000).toLocaleDateString("en-US", {
              month: "short",
            })
          : `M${i + 1}`,
        value: Math.round(v / 1_000_000),
      };
    });
  }

  if (stats) {
    Object.assign(result, {
      ...stats,
      companyName: stats.companyName ?? result.companyName,
    });
  }

  if (!result.revenueGrowthYoY && result.return1Year != null) {
    result.revenueGrowthYoY = result.return1Year;
  }

  if (!result.marketCapUSD && result.currentPrice) {
    result.notes = "Market cap from extended data sources when available.";
  }

  if (!chart && !stats) {
    result.notes = "Limited data — verify ticker symbol.";
  }

  cache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

export async function searchTicker(
  query: string
): Promise<{ symbol: string; name: string; exchange?: string } | null> {
  const data = await fetchMarketData(query);
  if (!data.priceChart10Y?.length && !data.peRatio) return null;
  return {
    symbol: data.ticker,
    name: data.companyName,
    exchange: data.exchange,
  };
}
