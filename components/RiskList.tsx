"use client";

import { motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  Regulatory: "var(--red)",
  Competitive: "var(--violet)",
  Financial: "var(--amber)",
  Macro: "var(--blue)",
  Operational: "var(--cyan)",
  Data: "var(--text-muted)",
};

function extractCategory(risk: string): { category: string; text: string } {
  const match = risk.match(/^\[([^\]]+)\]\s*(.*)/);
  if (match) {
    return { category: match[1], text: match[2] };
  }
  return { category: "General", text: risk };
}

interface RiskListProps {
  risks: string[];
}

export function RiskList({ risks }: RiskListProps) {
  if (!risks || risks.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No specific risks identified.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {risks.map((risk, i) => {
        const { category, text } = extractCategory(risk);
        const color = CATEGORY_COLORS[category] ?? "var(--text-secondary)";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              background: "rgba(247, 118, 142, 0.04)",
              border: "1px solid rgba(247, 118, 142, 0.1)",
            }}
          >
            {/* Risk number */}
            <span
              className="font-mono text-xs font-bold w-5 flex-shrink-0 mt-0.5 text-center"
              style={{ color }}
            >
              {i + 1}.
            </span>

            <div className="flex-1">
              {/* Category badge */}
              <span
                className="inline-block text-xs px-1.5 py-0.5 rounded mb-1.5 font-medium"
                style={{
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                }}
              >
                {category}
              </span>
              {/* Risk text */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {text}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
