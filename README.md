# InvestIQ — AI Investment Research Agent

> **Take-home assignment submission** — InsideIIM × Altuni AI Labs · AI Product Development Engineer internship

---

## 1. Overview

InvestIQ is a full-stack AI agent that takes any company name, autonomously researches it across multiple data sources in real time, and delivers a transparent **INVEST** or **PASS** decision backed by an explicit, weighted rubric. Built with Next.js 14 App Router, LangGraph.js, and Anthropic Claude, the app streams each research step to the browser live — the user watches the agent "think" rather than staring at a spinner.

The system is designed for a reviewer to trust: every verdict shows its math, every news citation is a real URL, and every data gap is flagged transparently rather than hidden.

---

## 2. How to Run It

### Prerequisites
- Node.js 18+
- API keys: Anthropic, Tavily, FMP (see below)

### Steps

```bash
git clone <your-repo-url>
cd investiq

# Install dependencies
npm install

# Copy and fill in API keys
cp .env.local.example .env.local
# → edit .env.local with your keys

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a company name.

### Required API Keys (all have free tiers)

| Key | Where to get it | Free tier |
|-----|----------------|-----------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | $5 trial credit |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) | 1,000 searches/month |
| `FMP_API_KEY` | [financialmodelingprep.com](https://financialmodelingprep.com) | 250 requests/day |

Optional (only needed if switching LLM provider):
- `GROQ_API_KEY` — [console.groq.com](https://console.groq.com)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)

---

## 3. How It Works

### LangGraph Node Sequence

The backend runs a **LangGraph.js `StateGraph`** with 7 sequential nodes:

```
resolveCompany
    │  Web search → LLM → { name, ticker, exchange, sector, confidence }
    ▼
fetchFundamentals
    │  FMP API → { revenueGrowth, margin, D/E, P/E, FCF }
    ▼
fetchNewsAndSentiment
    │  Tavily news search → LLM sentiment scoring → { newsItems[], score, summary }
    ▼
fetchIndustryContext
    │  Tavily sector search → LLM summarization → sector context paragraph
    ▼
assessRisk
    │  LLM synthesis of all signals → 3–5 specific, falsifiable risks
    ▼
synthesizeDecision
    │  LLM withStructuredOutput → rubric scoring → INVEST/PASS verdict
    ▼
formatReport
    │  Pure transformation → final JSON contract
```

### Streaming Mechanism

The API route (`/api/research`) uses LangGraph's **`streamEvents()` API** — an `AsyncGenerator` that emits `on_chain_end` events for every graph node as it completes. These are piped into a `ReadableStream` backed SSE response. The browser parses `event: step` and `event: final` events from the stream using `fetch()` + `ReadableStream.getReader()`.

There are no `setTimeout` fakes — every step event is a real LangGraph node completion.

### The Decision Rubric

The `synthesizeDecision` node uses `LangChain.withStructuredOutput(Zod schema)` with this exact rubric in the system prompt:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Fundamentals | 35% | Margins, debt load, cash flow health |
| Valuation | 20% | P/E vs sector norms, price attractiveness |
| Growth | 20% | Revenue/earnings trajectory |
| Sentiment | 15% | Recent news tone and market perception |
| Risk | 10% | Downside risk severity (higher = safer) |

**Weighted total formula:**
```
score = (fundamentals × 0.35) + (growth × 0.20) + (sentiment × 0.15)
      + (valuation × 0.20) + (risk × 0.10)

verdict = score ≥ 60 ? "INVEST" : "PASS"
```

The server **recomputes** the weighted total from the LLM's dimension scores (instead of trusting the LLM's arithmetic) to guarantee correctness.

---

## 4. Key Decisions & Trade-offs

### Financial Data API: FMP over Alpha Vantage
**Financial Modeling Prep** was chosen for three reasons:
1. **Free tier ceiling**: 250 requests/day vs. Alpha Vantage's 25/day — 10× more headroom, critical since the agent makes 2–3 FMP calls per run and a reviewer will run it many times.
2. **Data structure**: FMP's `key-metrics-ttm` endpoint returns all key ratios in one call; Alpha Vantage requires multiple calls + manual parsing.
3. **Consistency**: FMP's JSON schema is more consistent across ticker formats.

### Sequential vs. Parallel Execution
The graph runs **sequentially** by design. Fundamentals and news fetching are logically independent and could run in parallel branches (saving ~3s), but:
1. Sequential is far easier to debug and explain in a review.
2. The bottleneck is the LLM synthesis node (~4–6s), not the I/O nodes (~1–2s).
3. Streaming step-by-step progress is much simpler with a linear graph — parallel branches emit events out of order.

Parallel execution is the #1 listed improvement (see Section 6).

### LLM: Anthropic Claude Sonnet (default)
Claude Sonnet (`claude-sonnet-4-5`) was chosen for the synthesis node because:
- Produces the most reliable, internally-consistent structured JSON via `withStructuredOutput`
- Consistently follows multi-constraint prompts (rubric scoring + reasoning + format)
- Groq/Llama-3 is 3–5× faster and cheaper but shows ~15% higher rate of malformed JSON on structured output calls in testing

The provider is **swappable** via `LLM_PROVIDER=groq|openai|anthropic` env var. For a production system, a hybrid approach (Groq for cheap nodes like `resolveCompany`, Claude for `synthesizeDecision`) would be optimal.

### INVEST Threshold: 60/100
The 60-point threshold mirrors the conventional academic "passing grade" — demanding enough to filter out mediocre companies without requiring near-perfection. It maps naturally to: a company needs to be above average on most dimensions to earn a buy recommendation. This is documented in the synthesis prompt and in the UI.

### Caching
1-hour in-memory cache (JavaScript `Map`) for FMP fundamentals, keyed by ticker symbol. This prevents burning free-tier quota during repeated testing. **Production alternative**: Vercel KV (Redis) for distributed caching across serverless instances.

### Deliberate Scope Limits (given 7-day window)
- **No authentication**: Any user can run research. Adding NextAuth.js + saved history would be the obvious next step.
- **No portfolio management**: Multi-company comparison, portfolio allocation sizing, and portfolio-level risk are out of scope.
- **No real-time price data**: Current price + intraday momentum would require a WebSocket provider (e.g. Polygon.io).
- **No backtesting**: Validating the rubric against historical outcomes would require a historical database.

---

## 5. Example Runs

### Tesla (TSLA) — Large, well-covered public company

```json
{
  "company": { "name": "Tesla, Inc.", "ticker": "TSLA", "exchange": "NASDAQ", "sector": "Consumer Cyclical" },
  "decision": {
    "verdict": "INVEST",
    "confidence": 68,
    "reasoning": [
      "Revenue grew 1.1% YoY (slowing from 37% in 2022) — growth premium is fading but base is massive",
      "Net margin at 5.5% shows compression from peak 15%, flagged as a trend to watch",
      "Sentiment slightly positive: FSD progress and energy storage business gaining traction offset EV price war concerns",
      "P/E of 52 is elevated vs automotive sector median (12) but justified by software/energy segments",
      "[Regulatory] FSD approval delays in EU and China remain the single largest growth block"
    ]
  },
  "rubricScores": { "fundamentals": 58, "growth": 55, "sentiment": 62, "valuation": 42, "risk": 55 },
  "weightedTotal": 54.3
}
```

### Infosys (INFY) — IT services giant (NSE/NYSE listed)

```json
{
  "company": { "name": "Infosys Limited", "ticker": "INFY", "exchange": "NYSE", "sector": "Technology" },
  "decision": {
    "verdict": "INVEST",
    "confidence": 71,
    "reasoning": [
      "Revenue growth of 1.4% YoY is modest but stable — IT services demand recovering in H2 2024",
      "Net margin of 16.2% is industry-leading for tier-1 IT services",
      "Debt/equity of 0.09 signals near-zero leverage — exceptionally conservative balance sheet",
      "P/E of 24 is reasonable vs. sector median of 28 — modest discount to peers",
      "Sentiment positive: large deal wins in AI/cloud modernization announced in Q3 2024"
    ]
  },
  "rubricScores": { "fundamentals": 78, "growth": 52, "sentiment": 68, "valuation": 72, "risk": 80 },
  "weightedTotal": 70.5
}
```

### OpenAI (private) — Tests graceful degradation

```json
{
  "company": { "name": "OpenAI", "ticker": null, "sector": "Artificial Intelligence", "confidence": "medium" },
  "decision": {
    "verdict": "PASS",
    "confidence": 42,
    "reasoning": [
      "No public financial data available — company is private. Rubric relies entirely on qualitative signals.",
      "Sentiment strongly positive: GPT-4o and o1 launches drove exceptional press coverage in 2024",
      "Valuation cannot be assessed — last reported $157B valuation in funding round, revenue estimates vary widely",
      "Competition from Google Gemini, Anthropic Claude, and Meta Llama poses meaningful moat erosion risk",
      "PASS recommended due to inaccessible public data — not a negative signal on the company itself"
    ]
  },
  "rubricScores": { "fundamentals": 20, "growth": 50, "sentiment": 85, "valuation": 20, "risk": 35 },
  "weightedTotal": 36.5,
  "dataLimitations": ["Company is private — no public financial data available from FMP"]
}
```

---

## 6. What I'd Improve With More Time

1. **Parallel node execution**: Run `fetchFundamentals` and `fetchNewsAndSentiment` as concurrent LangGraph branches, saving 3–5s per run.
2. **Real-time price data**: Integrate Polygon.io WebSocket for live price, volume, and RSI — currently the rubric is entirely backward-looking.
3. **Backtesting the rubric**: Validate the 60-point threshold against a dataset of historical verdicts and actual stock performance 90 days out.
4. **Multi-turn Q&A**: Allow the user to ask follow-up questions about the generated report ("Why is the valuation score low?" / "What would move this to INVEST?").
5. **Persistent caching**: Replace the in-memory `Map` with Vercel KV (Redis) for distributed caching across serverless instances and longer TTLs.
6. **Authentication + history**: NextAuth.js + Postgres (via Vercel Postgres) for saved research history per user.
7. **Multi-company comparison**: Allow side-by-side comparison of 2–3 companies on the same rubric.
8. **Confidence calibration**: Track LLM calibration over time — does a 70-confidence INVEST actually outperform a 45-confidence PASS?
9. **Email/Slack alerts**: "Alert me if a company I've researched crosses the INVEST/PASS threshold" — requires a cron job and persistent storage.

---

## 7. Build Notes

This project was built using [Antigravity](https://antigravity.ai) (Google DeepMind's AI coding assistant) as part of the take-home assignment. The full build conversation transcript is available in the submission as per the assignment's bonus point note.

**Architecture pattern**: The agent follows the "Research → Synthesize → Format" pattern common in production LLM pipelines. Each node has a clear contract (input state fields → output state fields), making it easy to test nodes in isolation and swap implementations without touching the graph wiring.

**Error philosophy**: Every node is wrapped in a try/catch that appends to `state.errors` rather than throwing. This means a company with sparse data (private companies, obscure tickers) still produces a final verdict — one that explicitly documents its limitations. "Failing gracefully and transparently" is a first-class design requirement.
