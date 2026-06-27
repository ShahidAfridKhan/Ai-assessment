<div align="center">

# 📊 AlphaLens AI

### Research Smarter. Invest Better.

**An autonomous AI agent that researches any public company in real time — fundamentals, news, sentiment, and risk — and streams back a transparent, math-backed BUY / HOLD / PASS verdict.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--assessment--eight--eta.vercel.app-ffe17c?style=for-the-badge&logo=vercel&logoColor=black)](https://ai-assessment-eight-eta.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![LangGraph.js](https://img.shields.io/badge/LangGraph.js-StateGraph-1C3C3C?style=flat-square)](https://langchain-ai.github.io/langgraphjs/)
[![Gemini](https://img.shields.io/badge/LLM-Gemini%202.5%20Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

[**🚀 Try it live**](https://ai-assessment-eight-eta.vercel.app/research) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [How the Verdict Is Computed](#-the-decision-engine)

</div>

---

## 📖 Overview

Type a company name — `Tesla`, `Infosys`, `Zomato`, `Reliance Industries` — and AlphaLens AI autonomously:

1. **Resolves** it to a real, listed ticker
2. **Collects** live price history, financial ratios, and recent news **in parallel**
3. **Reasons** over the combined signal with an LLM, scored against an explicit 5-factor rubric
4. **Streams** every step to the browser over Server-Sent Events, so you watch the agent work instead of staring at a spinner

The output is a full research dashboard: a 0–100 investment score, a BUY/HOLD/PASS call, a SWOT breakdown, categorized risks, sector competitors, and 10-year price/return charts — all rendered in a distinctive **neo-brutalist** UI (hard black shadows, yellow accents, dark forest-green background).

The whole pipeline targets **under 15 seconds** end-to-end, and runs on **free-tier APIs only** — no paid keys are required to get a working demo.

> Built as a take-home submission for the **InsideIIM × Altuni AI Labs — AI Product Development Engineer** internship assessment.

---

## ✨ Features

| | |
|---|---|
| 🤖 **Autonomous Research Agent** | A LangGraph.js `StateGraph` resolves the company, fetches data, and synthesizes a verdict with no manual steps |
| 📡 **Real-Time Streaming** | Server-Sent Events push live step updates (`Finding Company` → `Collecting Financial Data` → `Generating AI Report` → `Finalizing Report`) to the UI as they actually complete — no fake timers |
| 🎯 **Transparent Scoring** | Every verdict shows its rubric math: 5 weighted dimensions combine into one auditable 0–100 score |
| 📈 **Market Data** | 10-year price history, 52-week high/low, returns (1Y/52W/10Y), P/E, margins, debt/equity, EPS, ROE |
| 📰 **News & Sentiment** | Recent headlines pulled from live sources with automatic positive/negative/neutral classification |
| 🧠 **SWOT + Risk Categorization** | LLM-generated strengths, weaknesses, opportunities, threats, plus 3–5 risks tagged by severity (LOW/MEDIUM/HIGH) |
| 🏢 **Competitor Benchmarking** | 2–4 sector peers surfaced with their own ratings for context |
| 🌍 **Global Ticker Support** | Works for US tickers and NSE-listed Indian stocks (`Tata Motors`, `Reliance`, `Infosys`, etc.) out of the box |
| 🛡️ **Graceful Degradation** | If the LLM call times out or a data source fails, a deterministic rule-based scorer kicks in — the agent never crashes, it just degrades transparently |
| 🆓 **Zero-Config Friendly** | Price data (Yahoo Finance) and news (Google News RSS) work with **no API key at all**; Gemini, GNews, and TwelveData are optional upgrades |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Agent Orchestration:** [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) `StateGraph` + `@langchain/core`
- **LLM:** Google Gemini 2.5 Flash by default — swappable to Anthropic Claude, Groq (Llama 3.3), or OpenAI via one env var
- **Structured Output:** Zod schemas enforced through `withStructuredOutput`
- **Styling:** Tailwind CSS — hand-built **neo-brutalist** design system (`lib/design.ts`): hard 4px black shadows, `#ffe17c` yellow accent, `#171e19` forest-green background
- **Animation:** Framer Motion
- **Charts:** Hand-rolled inline SVG line charts (no charting library dependency)
- **Data Sources:** Yahoo Finance Chart API, Twelve Data, GNews API, Google News RSS, Wikipedia REST API
- **Streaming:** Native `ReadableStream` + Server-Sent Events (no socket library)
- **Deployment:** Vercel

---

## 🏗️ Architecture

### Agent Pipeline

The production graph (`lib/agent/graph.ts`) is a lean **4-node pipeline** purpose-built for speed — the agent is designed to feel instant, not just "eventually correct":

```
START
  │
  ▼
┌─────────────────────┐   Resolve company name → ticker via Yahoo
│   resolveCompany     │   symbol search + Wikipedia summary for context
└──────────┬───────────┘
           ▼
┌─────────────────────┐   Promise.all() — market data (Yahoo + Twelve Data)
│   fetchAllParallel    │   and news (GNews / Google News RSS) fetched
└──────────┬───────────┘   concurrently, not sequentially
           ▼
┌─────────────────────┐   Single structured-output LLM call → rubric scores,
│    fastAnalyze        │   verdict, SWOT, risks, competitors. 18s timeout
└──────────┬───────────┘   with a deterministic rule-based fallback
           ▼
┌─────────────────────┐   Pure transformation → assembles the final
│    formatReport       │   JSON report contract for the client
└──────────┬───────────┘
           ▼
          END
```

> **Note on `lib/agent/nodes/`:** the directory also contains earlier sequential nodes (`fetchFundamentals`, `fetchNewsAndSentiment`, `fetchIndustryContext`, `assessRisk`, `synthesizeDecision`, `generateInsights`) from an earlier 7-node design iteration. They're kept in the repo for reference but are **not wired into the compiled graph** — `fetchAllParallel` + `fastAnalyze` replaced them to cut latency from ~30s+ down to the current <15s target.

### Streaming Mechanism

`app/api/research/route.ts` calls LangGraph's `streamEvents()` (`v2`), which emits an `AsyncGenerator` of real run events for every node. The route listens for `on_chain_start` / `on_chain_end`, builds a one-line human-readable summary per node (e.g. `"P/E 52.1 · Growth 1.1% · 6 news articles"`), and pipes each as a Server-Sent Event into a `ReadableStream`:

```
event: step   { node, status: "active" | "done", label, summary }
event: final  { ...FinalReport }
event: error  { message }
```

The browser (`hooks/useResearchAgent.ts`) reads this with `fetch()` + `ReadableStream.getReader()` — no WebSocket, no polling, and no `setTimeout` fakery. Every step shown on screen is a real graph-node completion.

### The Decision Engine

`fastAnalyze` asks the LLM for a single structured response (Zod-validated) covering sentiment, SWOT, risks, competitors, and a 5-dimension rubric:

| Dimension | Weight | Signal |
|---|---|---|
| Fundamentals | 35% | Profit margin, debt load, cash flow health |
| Growth | 20% | Revenue growth / price momentum trajectory |
| Sentiment | 15% | Recent news tone |
| Valuation | 20% | P/E relative to a reasonable band |
| Risk | 10% | Downside severity (higher score = safer) |

```
weightedTotal = fundamentals×0.35 + growth×0.20 + sentiment×0.15
              + valuation×0.20 + risk×0.10

verdict = score ≥ 72 → BUY
          score ≥ 52 → HOLD
          score < 52 → PASS
```

**Two layers of reliability, by design:**
- When real market data is available, the server **recomputes** the fundamentals/growth/valuation/risk scores deterministically from the actual financial ratios (rather than trusting the LLM's arithmetic) — the LLM is used for sentiment, narrative, SWOT, and competitor discovery, not the math.
- If the LLM call exceeds an **18-second timeout** or throws, `ruleBasedVerdict()` computes a fully deterministic score from whatever fundamentals were fetched — margin, growth, 10-year return, P/E, and leverage — so the agent **always returns a verdict**, never a hard failure.

---

## 📡 Data Sources

| Source | Used for | API key required? |
|---|---|---|
| **Yahoo Finance Chart API** | Price history, 52-week high/low, returns, market cap basis | ❌ No |
| **Yahoo Finance Search** | Ticker resolution from a free-text company name | ❌ No |
| **Google News RSS** | News fallback when GNews isn't configured | ❌ No |
| **Wikipedia REST API** | Company description / context for resolution | ❌ No |
| **Twelve Data** | P/E, margins, debt/equity, EPS, ROE, sector/industry | ✅ Optional (free tier) |
| **GNews API** | Primary recent-news source with richer metadata | ✅ Optional (free tier) |
| **Gemini 2.5 Flash** | Sentiment, SWOT, risk synthesis, rubric scoring | ✅ Yes (free tier via AI Studio) |

This tiered design means the app **runs end-to-end with only a Gemini key** — Yahoo Finance and Google News RSS need no authentication at all, so a reviewer can clone, add one key, and get real results immediately.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### Installation

```bash
git clone https://github.com/ShahidAfridKhan/Ai-assessment.git
cd Ai-assessment

npm install

cp .env.local.example .env.local
# → add your GEMINI_API_KEY at minimum

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Try AlphaLens Free**, and enter any company name.

### Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `LLM_PROVIDER` | No | `gemini` | `gemini` \| `anthropic` \| `groq` \| `openai` |
| `GEMINI_API_KEY` | ✅ Yes (if using default provider) | — | [aistudio.google.com](https://aistudio.google.com/) |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Override the Gemini model |
| `GNEWS_API_KEY` | No | — | [gnews.io](https://gnews.io/) free tier; falls back to Google News RSS if unset |
| `TWELVE_DATA_API_KEY` | No | — | [twelvedata.com](https://twelvedata.com/) free tier; adds P/E, margins, market cap |
| `ANTHROPIC_API_KEY` | No | — | Only needed if `LLM_PROVIDER=anthropic` |
| `GROQ_API_KEY` | No | — | Only needed if `LLM_PROVIDER=groq` |
| `OPENAI_API_KEY` | No | — | Only needed if `LLM_PROVIDER=openai` |

---

## 📁 Project Structure

```
Ai-assessment/
├── app/
│   ├── api/research/route.ts     # SSE streaming endpoint
│   ├── research/page.tsx         # Research dashboard page
│   ├── page.tsx                  # Marketing landing page
│   └── layout.tsx                # Root layout + metadata
├── components/
│   ├── research/
│   │   ├── ResearchDashboard.tsx # Main report layout
│   │   ├── DashboardCharts.tsx   # Inline SVG price/return charts
│   │   ├── DashboardExtras.tsx   # SWOT, risks, competitors
│   │   ├── ResearchStepTracker.tsx # Live agent step UI
│   │   └── SearchBar.tsx
│   ├── Navbar.tsx, DecisionBadge.tsx, NewsList.tsx, RiskList.tsx, ...
├── hooks/
│   └── useResearchAgent.ts       # Client-side SSE consumer
├── lib/
│   ├── agent/
│   │   ├── graph.ts              # Compiled 4-node StateGraph
│   │   ├── state.ts              # Shared agent state schema
│   │   ├── nodes/                # resolveCompany, fetchAllParallel, fastAnalyze, formatReport (+ legacy nodes)
│   │   └── tools/                # marketData, gnews, wikipedia, yahooFast, webSearch, financialData
│   ├── llm.ts                    # Provider-swappable LLM factory
│   └── design.ts                 # Neo-brutalist design tokens
└── .env.local.example
```

---

## 🎨 Design System

The UI runs on a small, hand-rolled **neo-brutalist** token set (`lib/design.ts`) rather than a component library default:

```ts
YELLOW = "#ffe17c"        // primary accent
BG     = "#171e19"        // dark forest-green background
ACCENT = "#b7c6c2"
hardShadow   = "4px 4px 0px #000000"   // signature offset black shadow
border       = "2px solid #000000"
```

Typography pairs **Inter** (UI text) with **JetBrains Mono** (tickers, metrics, code-style figures) for a "Bloomberg terminal meets indie SaaS" feel.

---

## 🗺️ Roadmap

- [ ] Parallelize `fastAnalyze` sentiment scoring with the rubric-recompute step for further latency cuts
- [ ] Real-time/intraday price + volume via a WebSocket provider
- [ ] Multi-company side-by-side comparison view
- [ ] Persistent caching (Redis/Vercel KV) shared across serverless instances
- [ ] Auth + saved research history per user
- [ ] Backtest the 72/52 BUY/HOLD threshold against historical verdict accuracy

---

## 👤 Author

**Shahid Afrid Khan**
B.Tech CSE (Data Science), Lovely Professional University
[GitHub](https://github.com/ShahidAfridKhan) · [LeetCode](https://leetcode.com/shahidafrid_037)

---

<div align="center">

Built with Next.js, LangGraph.js, and a healthy amount of API fallback logic.

</div>
