"use client";

import { motion } from "framer-motion";
import type { FinalReport } from "@/lib/agent/nodes/formatReport";

interface DecisionBadgeProps {
  report: FinalReport;
}

export function DecisionBadge({ report }: DecisionBadgeProps) {
  const { decision, company } = report;
  const isBuy = decision.verdict === "BUY";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      className="w-full"
    >
      {/* Main verdict card */}
      <div
        className={`rounded-2xl p-6 mb-4 ${isBuy ? "invest-glow" : "pass-glow"}`}
        style={{
          background: isBuy
            ? "linear-gradient(135deg, rgba(158, 206, 106, 0.15) 0%, rgba(158, 206, 106, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(247, 118, 142, 0.15) 0%, rgba(247, 118, 142, 0.05) 100%)",
          border: `1px solid ${isBuy ? "rgba(158, 206, 106, 0.4)" : "rgba(247, 118, 142, 0.4)"}`,
        }}
      >
        {/* Company header */}
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {company.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {company.ticker && (
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{
                    color: "var(--cyan)",
                    background: "rgba(125, 207, 255, 0.1)",
                    border: "1px solid rgba(125, 207, 255, 0.2)",
                  }}
                >
                  {company.ticker}
                </span>
              )}
              {company.exchange && (
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {company.exchange}
                </span>
              )}
              {company.sector && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    color: "var(--violet)",
                    background: "rgba(187, 154, 247, 0.1)",
                    border: "1px solid rgba(187, 154, 247, 0.2)",
                  }}
                >
                  {company.sector}
                </span>
              )}
            </div>
          </div>

          {/* Verdict badge */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="flex flex-col items-center"
          >
            <div
              className="px-6 py-3 rounded-xl font-black text-2xl tracking-wider"
              style={{
                color: isBuy ? "#1a2e1a" : "#2e1a1d",
                background: isBuy ? "var(--green)" : "var(--red)",
                letterSpacing: "0.1em",
              }}
            >
              {decision.verdict}
            </div>
            <div
              className="mt-1.5 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="font-mono text-lg font-semibold"
                style={{ color: isBuy ? "var(--green)" : "var(--red)" }}
              >
                {decision.confidence}
              </span>
              <span className="text-xs ml-0.5">/100</span>
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              confidence
            </div>
          </motion.div>
        </div>

        {/* Reasoning bullets */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Key Reasoning
          </h3>
          <ul className="space-y-2">
            {decision.reasoning.map((reason, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-2.5 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isBuy ? "var(--green)" : "var(--red)",
                  }}
                />
                {reason}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
