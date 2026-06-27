"use client";

import type { FinalReport } from "@/lib/agent/nodes/formatReport";
import { YELLOW, ACCENT, border, hardShadowSm } from "@/lib/design";

function formatCap(m?: number) {
  if (m == null) return "N/A";
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(1)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
  return `$${m.toLocaleString()}M`;
}

function pctColor(v: number | undefined, invert = false) {
  if (v == null) return "#666";
  const good = invert ? v < 0.3 : v > 0;
  return good ? "#27ae60" : "#d63031";
}

function verdictLabel(v: string) {
  if (v === "BUY") return "✅ BUY";
  if (v === "HOLD") return "⏸ HOLD";
  return "⛔ PASS";
}

interface DashboardProps {
  report?: FinalReport | null;
  companySlug?: string;
  loading?: boolean;
  progress?: number;
}

export function ResearchDashboard({
  report,
  companySlug = "company",
  loading = false,
  progress = 0,
}: DashboardProps) {
  const company = report?.company;
  const decision = report?.decision;
  const f = report?.fundamentals;
  const aiText =
    report?.aiSummary?.investmentThesis ??
    report?.aiSummary?.finalRecommendation ??
    decision?.reasoning?.join(" ") ??
    "";

  const hasFundamentals = f?.peRatio != null || f?.profitMargin != null;
  const growthLabel = hasFundamentals ? "Revenue Growth" : "1Y Return";
  const growth =
    f?.revenueGrowthYoY != null
      ? `${f.revenueGrowthYoY >= 0 ? "+" : ""}${(f.revenueGrowthYoY * 100).toFixed(1)}%`
      : f?.return1Year != null
      ? `${f.return1Year >= 0 ? "+" : ""}${(f.return1Year * 100).toFixed(1)}%`
      : "N/A";
  const margin =
    f?.profitMargin != null ? `${(f.profitMargin * 100).toFixed(1)}%` : "N/A";
  const pe = f?.peRatio != null ? `${f.peRatio.toFixed(1)}x` : "N/A";
  const debt = f?.debtToEquity != null ? f.debtToEquity.toFixed(2) : "N/A";
  const mktCap = formatCap(f?.marketCapUSD);
  const ret52 =
    f?.return52Week != null
      ? `${f.return52Week >= 0 ? "+" : ""}${(f.return52Week * 100).toFixed(1)}%`
      : "N/A";

  const metrics = [
    { label: growthLabel, val: growth, color: pctColor(f?.revenueGrowthYoY ?? f?.return1Year) },
    { label: "Net Margin", val: margin, color: pctColor(f?.profitMargin) },
    { label: "P/E Ratio", val: pe, color: "#000" },
    { label: "Debt / Equity", val: debt, color: pctColor(f?.debtToEquity, true) },
    { label: "Market Cap", val: mktCap, color: "#000" },
    { label: "52W Return", val: ret52, color: pctColor(f?.return52Week) },
  ];

  const score = loading ? "N/A" : String(decision?.confidence ?? "N/A");
  const verdict = loading ? "…" : verdictLabel(decision?.verdict ?? "HOLD");

  return (
    <div
      style={{
        background: "#fff",
        border: "3px solid #000",
        boxShadow: `10px 10px 0 ${YELLOW}`,
        overflow: "hidden",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#111",
          borderBottom: "2px solid #333",
          padding: "12px 20px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {["#ff5f57", "#ffbd2e", "#28ca41"].map((c) => (
          <div
            key={c}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: c,
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          />
        ))}
        <div
          style={{
            flex: 1,
            background: "#222",
            border: "1.5px solid #444",
            padding: "5px 16px",
            marginLeft: "8px",
            color: ACCENT,
            fontSize: "13px",
            fontFamily: "monospace",
          }}
        >
          app.alphalens.ai/research/{companySlug.toLowerCase().replace(/\s+/g, "-")}
        </div>
      </div>

      {loading && (
        <div style={{ background: "#000", padding: "8px 20px" }}>
          <div style={{ height: "6px", background: "#333", border: "1px solid #555" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(progress, 95)}%`,
                background: YELLOW,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          padding: "24px",
          background: "#f8f8f8",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {/* Score */}
        <div
          style={{
            background: loading ? "#eee" : YELLOW,
            border,
            boxShadow: hardShadowSm,
            padding: "20px",
            textAlign: "center",
            animation: loading ? "pulse 1.5s ease infinite" : undefined,
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#000" }}>
            INVESTMENT SCORE
          </div>
          <div style={{ fontSize: "52px", fontWeight: 900, lineHeight: 1.1, color: "#000" }}>
            {score}
            {!loading && <span style={{ fontSize: "20px" }}>/100</span>}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>{verdict}</div>
        </div>

        {/* Company */}
        <div
          style={{
            border,
            background: "#fff",
            padding: "20px",
            boxShadow: hardShadowSm,
            gridColumn: "span 2",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: "22px",
              color: loading ? "#999" : "#000",
            }}
          >
            {loading ? "Loading company…" : company?.name ?? companySlug}
          </div>
          {!loading && company && (
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
              {company.ticker && (
                <Tag label="TICKER" value={company.ticker} bg={YELLOW} fg="#000" />
              )}
              {company.exchange && (
                <Tag label="EXCHANGE" value={company.exchange} bg="#000" fg="#fff" />
              )}
              {(company.sector || company.industry) && (
                <Tag
                  label="SECTOR"
                  value={company.sector ?? company.industry ?? ""}
                  bg={ACCENT}
                  fg="#000"
                />
              )}
              {!company.ticker && !company.exchange && !company.sector && !company.industry && (
                <Tag label="DATA" value="PUBLIC SOURCES" bg={ACCENT} fg="#000" />
              )}
            </div>
          )}
        </div>

        {/* Metrics */}
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              border,
              background: loading ? "#eee" : "#fff",
              padding: "14px",
              boxShadow: hardShadowSm,
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>{m.label}</div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: loading ? "#aaa" : m.color,
              }}
            >
              {loading ? "N/A" : m.val}
            </div>
          </div>
        ))}

        {/* AI Recommendation */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: loading ? "#222" : "#000",
            border,
            padding: "20px 24px",
            boxShadow: `4px 4px 0 ${YELLOW}`,
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: YELLOW,
              border,
              padding: "10px 20px",
              fontWeight: 900,
              fontSize: "16px",
              color: "#000",
              flexShrink: 0,
              minWidth: "120px",
              textAlign: "center",
            }}
          >
            {loading ? "…" : verdictLabel(decision?.verdict ?? "HOLD")}
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: YELLOW,
                marginBottom: "4px",
              }}
            >
              🤖 AI FINAL RECOMMENDATION
            </div>
            <p style={{ fontSize: "14px", color: loading ? "#888" : "#fff", lineHeight: 1.5, margin: 0 }}>
              {loading
                ? "Analyzing financials and market signals…"
                : aiText || decision?.reasoning?.[0]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: string;
  bg: string;
  fg: string;
}) {
  return (
    <div style={{ background: bg, border, padding: "4px 10px", boxShadow: hardShadowSm }}>
      <div style={{ fontSize: "9px", fontWeight: 700, color: fg, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 900, color: fg }}>{value}</div>
    </div>
  );
}
