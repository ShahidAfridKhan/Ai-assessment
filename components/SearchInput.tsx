"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";

interface SearchInputProps {
  onSearch: (companyName: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function SearchInput({ onSearch, isLoading, disabled }: SearchInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSearch(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className="flex items-center gap-3 rounded-2xl p-2 pl-5 glass-card input-focus-ring transition-all duration-300"
        style={{ borderColor: "rgba(122, 162, 247, 0.2)" }}
      >
        {/* Search icon */}
        <svg
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          id="company-search-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a company name… (e.g. Tesla, Infosys, Zomato)"
          disabled={isLoading || disabled}
          className="flex-1 bg-transparent outline-none text-base py-2"
          style={{
            color: "var(--text-primary)",
            fontFamily: "Inter, sans-serif",
          }}
          autoComplete="off"
          autoFocus
        />

        <motion.button
          id="research-submit-button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%)",
            color: "#1a1b2e",
          }}
        >
          {isLoading ? (
            <>
              <svg
                className="w-4 h-4 spinner"
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
              Researching…
            </>
          ) : (
            <>
              Research
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
