"use client";

import { useState, useEffect } from "react";
import type { FinalReport } from "@/lib/agent/nodes/formatReport";
import { YELLOW, border, hardShadowSm, ACCENT } from "@/lib/design";

const SAVED_KEY = "alphalens_saved";
const WATCHLIST_KEY = "alphalens_watchlist";
const HISTORY_KEY = "alphalens_history";

function sentimentStyle(sentiment?: string): React.CSSProperties {
  if (sentiment === "positive") return { background: "#27ae60", color: "#fff" };
  if (sentiment === "negative") return { background: "#d63031", color: "#fff" };
  return { background: YELLOW, color: "#000" };
}

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function saveList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

interface Props {
  report: FinalReport;
  onNewResearch: () => void;
}

export function DashboardActions({ report, onNewResearch }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const name = report.company.name;

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const saveReport = () => {
    const saved = loadList(SAVED_KEY);
    if (!saved.includes(name)) saveList(SAVED_KEY, [name, ...saved].slice(0, 20));
    notify(`Saved report for ${name}`);
  };

  const addWatchlist = () => {
    const list = loadList(WATCHLIST_KEY);
    if (!list.includes(name)) saveList(WATCHLIST_KEY, [name, ...list].slice(0, 20));
    notify(`Added ${name} to watchlist`);
  };

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-")}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Report exported");
  };

  const shareReport = async () => {
    const text = `${name}: ${report.decision.verdict} (${report.decision.confidence}/100) — AlphaLens AI`;
    if (navigator.share) {
      await navigator.share({ title: "AlphaLens Report", text });
    } else {
      await navigator.clipboard.writeText(text);
      notify("Summary copied to clipboard");
    }
  };

  // Save to history once per report
  useEffect(() => {
    const hist = loadList(HISTORY_KEY);
    if (!hist.includes(name)) saveList(HISTORY_KEY, [name, ...hist].slice(0, 10));
  }, [name]);

  const btn: React.CSSProperties = {
    background: "#fff",
    border,
    boxShadow: hardShadowSm,
    padding: "8px 14px",
    fontWeight: 800,
    fontSize: "12px",
    color: "#000",
    cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button style={{ ...btn, background: YELLOW }} onClick={onNewResearch}>
          + New Research
        </button>
        <button style={btn} onClick={saveReport}>💾 Save Report</button>
        <button style={btn} onClick={addWatchlist}>⭐ Watchlist</button>
        <button style={btn} onClick={exportReport}>📥 Export</button>
        <button style={btn} onClick={shareReport}>🔗 Share</button>
      </div>
      {toast && (
        <div
          style={{
            marginTop: "10px",
            background: YELLOW,
            border,
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: "13px",
            color: "#000",
            display: "inline-block",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export function DashboardExtras({ report }: { report: FinalReport }) {
  const [tab, setTab] = useState<"news" | "swot" | "competitors" | "risks">("news");
  const tabs = [
    { id: "news" as const, label: `News (${report.news.length})` },
    { id: "swot" as const, label: "SWOT" },
    { id: "competitors" as const, label: "Competitors" },
    { id: "risks" as const, label: "Risks" },
  ];

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? YELLOW : "#fff",
              border,
              boxShadow: hardShadowSm,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: "12px",
              color: "#000",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "news" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {report.news.slice(0, 6).map((n, i) => (
            <div key={i} style={{ background: "#fff", border, padding: "14px", boxShadow: hardShadowSm }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    border,
                    padding: "2px 6px",
                    ...sentimentStyle(n.sentiment),
                  }}
                >
                  {(n.sentiment ?? "neutral").toUpperCase()}
                </span>
                <span style={{ fontSize: "10px", color: "#666" }}>{n.date}</span>
              </div>
              <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 800, fontSize: "13px", color: "#000", textDecoration: "none" }}>
                {n.headline}
              </a>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{n.source}</div>
            </div>
          ))}
          {report.news.length === 0 && (
            <p style={{ color: ACCENT, fontSize: "14px" }}>No recent news — analysis based on financial data.</p>
          )}
        </div>
      )}

      {tab === "swot" && report.swot && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((key) => (
            <div key={key} style={{ background: key === "strengths" ? YELLOW : "#fff", border, padding: "14px", boxShadow: hardShadowSm }}>
              <div style={{ fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>{key.toUpperCase()}</div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", lineHeight: 1.5 }}>
                {(report.swot![key].length ? report.swot![key] : ["No data available yet."]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "competitors" && (
        <div style={{ overflowX: "auto", background: "#fff", border }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: YELLOW }}>
                {["Company", "Ticker", "Rating"].map((h) => (
                  <th key={h} style={{ border, padding: "10px", fontSize: "11px", fontWeight: 800, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(report.competitors.length
                ? report.competitors
                : [{ name: "No competitor data available", ticker: "N/A", rating: "HOLD" as const }]
              ).map((c) => (
                <tr key={c.ticker}>
                  <td style={{ border, padding: "10px", fontWeight: 700 }}>{c.name}</td>
                  <td style={{ border, padding: "10px" }}>{c.ticker}</td>
                  <td style={{ border, padding: "10px", fontWeight: 900 }}>{c.rating ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "risks" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {(report.riskCategories.length
            ? report.riskCategories
            : [
                {
                  category: "Market Risk",
                  level: "MEDIUM" as const,
                  description: "No detailed risk categories returned yet.",
                },
              ]
          ).map((r) => (
            <div key={r.category} style={{ background: "#fff", border, padding: "14px", boxShadow: hardShadowSm }}>
              <div style={{ fontSize: "11px", fontWeight: 800 }}>{r.category}</div>
              <span style={{ fontSize: "10px", fontWeight: 900, border, padding: "2px 6px", background: r.level === "HIGH" ? "#000" : YELLOW, color: r.level === "HIGH" ? YELLOW : "#000", display: "inline-block", margin: "6px 0" }}>
                {r.level}
              </span>
              <p style={{ fontSize: "12px", color: "#444", margin: 0, lineHeight: 1.5 }}>{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryPanel() {
  const [history] = useState<string[]>(() =>
    typeof window !== "undefined" ? loadList(HISTORY_KEY) : []
  );
  const [watchlist] = useState<string[]>(() =>
    typeof window !== "undefined" ? loadList(WATCHLIST_KEY) : []
  );
  const [saved] = useState<string[]>(() =>
    typeof window !== "undefined" ? loadList(SAVED_KEY) : []
  );

  if (!history.length && !watchlist.length && !saved.length) return null;

  return (
    <div id="history" style={{ marginTop: "48px", paddingTop: "32px", borderTop: border }}>
      <h3 style={{ fontWeight: 900, fontSize: "18px", marginBottom: "16px" }}>Your Workspace</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { id: "history", title: "Recent", items: history },
          { id: "watchlist", title: "Watchlist", items: watchlist },
          { id: "saved", title: "Saved Reports", items: saved },
        ].map((col) =>
          col.items.length > 0 ? (
            <div key={col.id} id={col.id} style={{ background: "#fff", border, padding: "16px", boxShadow: hardShadowSm }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#666", marginBottom: "10px" }}>{col.title.toUpperCase()}</div>
              {col.items.map((item) => (
                <div key={item} style={{ fontWeight: 700, fontSize: "14px", color: "#000", marginBottom: "6px" }}>
                  {item}
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
