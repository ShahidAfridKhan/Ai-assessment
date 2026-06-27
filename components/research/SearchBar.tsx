"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { YELLOW, border, hardShadow, hardShadowSm } from "@/lib/design";

const POPULAR = ["Tesla", "Apple", "NVIDIA", "Microsoft", "Amazon", "Google"];
const RECENT_KEY = "alphalens_recent_searches";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecent(company: string) {
  const recent = [company, ...getRecent().filter((r) => r !== company)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

interface SearchBarProps {
  onSearch: (company: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    saveRecent(trimmed);
    setRecent(getRecent());
    onSearch(trimmed);
  };

  const selectCompany = (name: string) => {
    setValue(name);
    saveRecent(name);
    setRecent(getRecent());
    onSearch(name);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{ width: "100%", maxWidth: "720px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: "10px",
          background: "#fff",
          border,
          boxShadow: hardShadow,
          padding: "8px",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setRecent(getRecent())}
          placeholder="Search any company… Tesla, Apple, Infosys"
          disabled={isLoading}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "14px 16px",
            fontWeight: 700,
            fontSize: "16px",
            background: "transparent",
            color: "#000",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          style={{
            background: YELLOW,
            border,
            boxShadow: hardShadowSm,
            padding: "14px 24px",
            fontWeight: 900,
            fontSize: "14px",
            color: "#000",
            cursor: isLoading ? "wait" : "pointer",
            opacity: !value.trim() || isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "Analyzing…" : "Analyze →"}
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", color: "#b7c6c2", marginBottom: "10px" }}>
          POPULAR SEARCHES
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {POPULAR.map((c) => (
            <button
              key={c}
              onClick={() => selectCompany(c)}
              disabled={isLoading}
              style={{
                background: "#fff",
                border,
                boxShadow: hardShadowSm,
                padding: "8px 14px",
                fontWeight: 700,
                fontSize: "13px",
                color: "#000",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", color: "#b7c6c2", marginBottom: "10px" }}>
            RECENT SEARCHES
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {recent.map((c) => (
              <button
                key={c}
                onClick={() => selectCompany(c)}
                disabled={isLoading}
                style={{
                  background: YELLOW,
                  border,
                  boxShadow: hardShadowSm,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#000",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
