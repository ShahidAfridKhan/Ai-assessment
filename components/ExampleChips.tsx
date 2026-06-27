"use client";

import { motion } from "framer-motion";

interface ExampleChipsProps {
  onSelect: (company: string) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  { name: "Tesla", icon: "⚡" },
  { name: "Infosys", icon: "💻" },
  { name: "Zomato", icon: "🍔" },
  { name: "Tata Motors", icon: "🚗" },
  { name: "Apple", icon: "🍎" },
  { name: "Reliance Industries", icon: "🏭" },
];

export function ExampleChips({ onSelect, disabled }: ExampleChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
    >
      <span
        className="text-sm mr-1 self-center"
        style={{ color: "var(--text-muted)" }}
      >
        Try:
      </span>
      {EXAMPLES.map((ex, i) => (
        <motion.button
          key={ex.name}
          id={`example-chip-${ex.name.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => onSelect(ex.name)}
          disabled={disabled}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 + i * 0.05 }}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "rgba(122, 162, 247, 0.08)",
            border: "1px solid rgba(122, 162, 247, 0.2)",
            color: "var(--text-secondary)",
          }}
        >
          <span className="text-xs">{ex.icon}</span>
          {ex.name}
        </motion.button>
      ))}
    </motion.div>
  );
}
