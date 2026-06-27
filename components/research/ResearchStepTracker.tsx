"use client";

import { motion } from "framer-motion";
import type { AgentStep } from "@/hooks/useResearchAgent";
import { YELLOW, border, hardShadow, hardShadowSm } from "@/lib/design";

export function ResearchStepTracker({ steps }: { steps: AgentStep[] }) {
  const displaySteps = steps.filter(
    (s) => s.node !== "start" && s.node !== "formatReport" && s.node !== "generateInsights"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {displaySteps.map((step, i) => (
        <motion.div
          key={step.node}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            background: step.status === "active" ? YELLOW : step.status === "done" ? "#fff" : "#2a322e",
            border,
            boxShadow: step.status === "active" ? hardShadow : hardShadowSm,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            opacity: step.status === "pending" ? 0.5 : 1,
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: step.status === "done" ? "#000" : step.status === "active" ? "#000" : "transparent",
              border,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "16px",
              color: step.status === "done" || step.status === "active" ? YELLOW : "#888",
              flexShrink: 0,
            }}
          >
            {step.status === "done" ? "✓" : step.status === "active" ? "…" : "○"}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: "15px",
                color: step.status === "pending" ? "#888" : "#000",
              }}
            >
              {step.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
