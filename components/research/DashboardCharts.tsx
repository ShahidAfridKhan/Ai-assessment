"use client";

import type { FinalReport } from "@/lib/agent/nodes/formatReport";
import { YELLOW, border, hardShadowSm } from "@/lib/design";

const GREEN = "#27ae60";
const RED = "#d63031";
const NEUTRAL = "#000";

function trendColor(data?: { value: number }[]) {
  if (!data || data.length < 2) return NEUTRAL;
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? first;
  if (last > first) return GREEN;
  if (last < first) return RED;
  return NEUTRAL;
}

function LineChart({
  title,
  data,
  suffix = "",
}: {
  title: string;
  data?: { label: string; value: number }[];
  suffix?: string;
}) {
  if (!data?.length) return null;
  const color = trendColor(data);
  const w = 100;
  const h = 56;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const step = w / Math.max(vals.length - 1, 1);
  const points = vals
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ background: "#fff", border, boxShadow: hardShadowSm, padding: "14px" }}>
      <div style={{ fontSize: "10px", fontWeight: 800, marginBottom: "10px", letterSpacing: "0.06em" }}>
        {title.toUpperCase()}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "72px", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={0}
            y1={h * p}
            x2={w}
            y2={h * p}
            stroke="#eee"
            strokeWidth={0.5}
          />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polyline
          points={`${points} ${w},${h} 0,${h}`}
          fill={color === RED ? RED : YELLOW}
          fillOpacity={0.35}
          stroke="none"
        />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 700, color: "#666", marginTop: "6px" }}>
        <span>{data[0]?.label}</span>
        <span>
          {data[data.length - 1]?.value}
          {suffix}
        </span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function BarChart({
  title,
  data,
  unit = "",
}: {
  title: string;
  data?: { label: string; value: number }[];
  unit?: string;
}) {
  if (!data?.length) return null;
  const visibleData = data.slice(-12);
  const max = Math.max(...visibleData.map((d) => d.value), 1);
  const overallColor = trendColor(visibleData);
  return (
    <div style={{ background: "#fff", border, boxShadow: hardShadowSm, padding: "14px" }}>
      <div style={{ fontSize: "10px", fontWeight: 800, marginBottom: "10px" }}>{title.toUpperCase()}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "64px" }}>
        {visibleData.map((d, i, arr) => {
          const prev = arr[i - 1]?.value ?? arr[0]?.value ?? d.value;
          const barColor = i === 0 ? overallColor : d.value >= prev ? GREEN : RED;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(8, (d.value / max) * 100)}%`,
                background: barColor,
                border: "1.5px solid #000",
              }}
            />
          );
        })}
      </div>
      {unit && (
        <div style={{ fontSize: "9px", color: "#666", marginTop: "6px", fontWeight: 600 }}>{unit}</div>
      )}
    </div>
  );
}

export function DashboardCharts({ report }: { report: FinalReport }) {
  const f = report.fundamentals;
  const priceData = f.priceChart10Y ?? f.priceHistory;

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 800, color: "#b7c6c2", letterSpacing: "0.1em", marginBottom: "12px" }}>
        MARKET CHARTS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        <LineChart
          title="10-Year Stock Price"
          data={priceData}
          suffix={f.currentPrice ? ` → $${f.currentPrice.toFixed(0)}` : ""}
        />
        <BarChart title="Monthly Volume (M)" data={f.volumeHistory} unit="Shares in millions" />
        <BarChart
          title="Recent Price Trend"
          data={f.priceHistory?.slice(-8) ?? f.profitHistory?.slice(-8)}
          unit="USD"
        />
        {f.return10Year != null && (
          <div style={{ background: YELLOW, border, boxShadow: hardShadowSm, padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800 }}>10-YEAR RETURN</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: f.return10Year >= 0 ? "#000" : RED,
              }}
            >
              {f.return10Year >= 0 ? "+" : ""}
              {(f.return10Year * 100).toFixed(0)}%
            </div>
          </div>
        )}
        {f.return52Week != null && (
          <div style={{ background: "#fff", border, boxShadow: hardShadowSm, padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800 }}>52-WEEK RETURN</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: f.return52Week >= 0 ? GREEN : RED,
              }}
            >
              {f.return52Week >= 0 ? "+" : ""}
              {(f.return52Week * 100).toFixed(1)}%
            </div>
          </div>
        )}
        {f.peRatio != null && (
          <div style={{ background: "#fff", border, boxShadow: hardShadowSm, padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800 }}>P/E RATIO</div>
            <div style={{ fontSize: "36px", fontWeight: 900 }}>{f.peRatio.toFixed(1)}x</div>
          </div>
        )}
      </div>
    </div>
  );
}
