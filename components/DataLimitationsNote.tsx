"use client";

import { motion } from "framer-motion";

interface DataLimitationsNoteProps {
  limitations: string[];
}

export function DataLimitationsNote({ limitations }: DataLimitationsNoteProps) {
  if (!limitations || limitations.length === 0) return null;

  // Clean up error messages for user display
  const displayLimitations = limitations.map((l) => {
    // Strip internal node prefixes for cleaner display
    return l.replace(/^[a-zA-Z]+:\s*/, "").replace(/\. Proceeding.*$/, ".");
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl p-4"
      style={{
        background: "rgba(224, 175, 104, 0.08)",
        border: "1px solid rgba(224, 175, 104, 0.25)",
      }}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: "var(--amber)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h4
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--amber)" }}
          >
            Data Limitations
          </h4>
          <ul className="space-y-1">
            {displayLimitations.map((limitation, i) => (
              <li
                key={i}
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                • {limitation}
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            The verdict was generated with available signals. Treat with higher
            caution when data is limited.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
