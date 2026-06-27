"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AgentStep } from "@/hooks/useResearchAgent";

interface AgentStepTrackerProps {
  steps: AgentStep[];
}

function StatusIcon({ status }: { status: AgentStep["status"] }) {
  if (status === "done") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(158, 206, 106, 0.2)",
          border: "1.5px solid var(--green)",
        }}
      >
        <svg
          className="w-3.5 h-3.5"
          style={{ color: "var(--green)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>
    );
  }

  if (status === "active") {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 active-glow"
        style={{
          background: "rgba(125, 207, 255, 0.15)",
          border: "1.5px solid var(--cyan)",
        }}
      >
        <svg
          className="w-3.5 h-3.5 spinner"
          style={{ color: "var(--cyan)" }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(247, 118, 142, 0.2)",
          border: "1.5px solid var(--red)",
        }}
      >
        <svg
          className="w-3.5 h-3.5"
          style={{ color: "var(--red)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    );
  }

  // pending
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: "rgba(86, 95, 137, 0.2)",
        border: "1.5px solid var(--text-muted)",
      }}
    >
      <div
        className="w-2 h-2 rounded-full pulse-dot"
        style={{ background: "var(--text-muted)" }}
      />
    </div>
  );
}

export function AgentStepTracker({ steps }: AgentStepTrackerProps) {
  const visibleSteps = steps.filter((s) => s.status !== "pending" || true); // show all

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-2">
        {visibleSteps.map((step, index) => (
          <motion.div
            key={step.node}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: step.status === "pending" ? 0.4 : 1,
              x: 0,
            }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300"
            style={{
              background:
                step.status === "active"
                  ? "rgba(125, 207, 255, 0.06)"
                  : step.status === "done"
                  ? "rgba(158, 206, 106, 0.04)"
                  : "transparent",
              border:
                step.status === "active"
                  ? "1px solid rgba(125, 207, 255, 0.2)"
                  : "1px solid transparent",
            }}
          >
            <StatusIcon status={step.status} />

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-medium"
                  style={{
                    color:
                      step.status === "active"
                        ? "var(--cyan)"
                        : step.status === "done"
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {step.label}
                </span>
              </div>

              <AnimatePresence>
                {step.summary && step.status === "done" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Connector line (except last item) */}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
