"use client";

import { motion } from "framer-motion";

interface RubricScores {
  fundamentals: number;
  growth: number;
  sentiment: number;
  valuation: number;
  risk: number;
}

interface RubricBreakdownProps {
  scores: RubricScores;
  weightedTotal: number;
}

const DIMENSIONS = [
  {
    key: "fundamentals" as keyof RubricScores,
    label: "Fundamentals",
    weight: 35,
    description: "Financial health",
    color: "var(--blue)",
  },
  {
    key: "valuation" as keyof RubricScores,
    label: "Valuation",
    weight: 20,
    description: "Price attractiveness",
    color: "var(--violet)",
  },
  {
    key: "growth" as keyof RubricScores,
    label: "Growth",
    weight: 20,
    description: "Revenue trajectory",
    color: "var(--cyan)",
  },
  {
    key: "sentiment" as keyof RubricScores,
    label: "Sentiment",
    weight: 15,
    description: "News & market tone",
    color: "var(--amber)",
  },
  {
    key: "risk" as keyof RubricScores,
    label: "Risk",
    weight: 10,
    description: "Downside protection",
    color: "var(--green)",
  },
];

function scoreToColor(score: number): string {
  if (score >= 70) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

export function RubricBreakdown({ scores, weightedTotal }: RubricBreakdownProps) {
  return (
    <div className="space-y-3">
      {/* Header with weighted total */}
      <div className="flex items-center justify-between mb-1">
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Decision Rubric
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Weighted Score:
          </span>
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: scoreToColor(weightedTotal) }}
          >
            {weightedTotal.toFixed(1)}/100
          </span>
        </div>
      </div>

      {/* Dimension bars */}
      {DIMENSIONS.map((dim, i) => {
        const score = scores[dim.key];
        const contribution = (score * dim.weight) / 100;

        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {dim.label}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: "10px",
                  }}
                >
                  {dim.weight}% weight
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  +{contribution.toFixed(1)} pts
                </span>
                <span
                  className="font-mono text-sm font-semibold w-8 text-right"
                  style={{ color: scoreToColor(score) }}
                >
                  {score}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: dim.color }}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Threshold note */}
      <p className="text-xs pt-1" style={{ color: "var(--text-muted)" }}>
        Threshold: ≥ 60 → INVEST · &lt; 60 → PASS
      </p>
    </div>
  );
}
