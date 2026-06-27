"use client";

import { motion } from "framer-motion";

interface NewsItem {
  headline: string;
  source: string;
  url: string;
  date: string;
}

interface NewsListProps {
  news: NewsItem[];
  sentimentScore?: number;
  sentimentSummary?: string;
}

function SentimentBadge({ score }: { score: number }) {
  const label =
    score > 0.3 ? "Positive" : score < -0.3 ? "Negative" : "Mixed/Neutral";
  const color =
    score > 0.3 ? "var(--green)" : score < -0.3 ? "var(--red)" : "var(--amber)";
  const bg =
    score > 0.3
      ? "rgba(158, 206, 106, 0.1)"
      : score < -0.3
      ? "rgba(247, 118, 142, 0.1)"
      : "rgba(224, 175, 104, 0.1)";

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color, background: bg, border: `1px solid ${color}40` }}
    >
      {score > 0 ? "+" : ""}
      {score.toFixed(2)} · {label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function NewsList({ news, sentimentScore, sentimentSummary }: NewsListProps) {
  if (!news || news.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No recent news articles found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sentiment header */}
      {sentimentScore !== undefined && (
        <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Overall:
          </span>
          <SentimentBadge score={sentimentScore} />
        </div>
      )}

      {sentimentSummary && (
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: "var(--text-secondary)" }}
        >
          &ldquo;{sentimentSummary}&rdquo;
        </p>
      )}

      {/* News items */}
      <div className="space-y-2">
        {news.map((item, i) => (
          <motion.a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 p-3 rounded-xl group transition-all duration-200 block"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(122, 162, 247, 0.08)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(122, 162, 247, 0.06)";
              e.currentTarget.style.borderColor = "rgba(122, 162, 247, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.borderColor = "rgba(122, 162, 247, 0.08)";
            }}
          >
            {/* Source favicon placeholder */}
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
              style={{
                background: "rgba(122, 162, 247, 0.15)",
                color: "var(--blue)",
              }}
            >
              {item.source.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium leading-snug group-hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {item.headline}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.source}
                </span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  ·
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatDate(item.date)}
                </span>
              </div>
            </div>

            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--cyan)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
