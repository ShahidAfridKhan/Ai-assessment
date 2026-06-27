/**
 * hooks/useResearchAgent.ts
 *
 * Custom React hook that manages the SSE connection to /api/research.
 *
 * Uses fetch() instead of EventSource because EventSource only supports GET
 * and we need to POST the company name in the request body.
 *
 * Exposes: { steps, result, isLoading, error, reset }
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { FinalReport } from "@/lib/agent/nodes/formatReport";

export interface AgentStep {
  node: string;
  status: "pending" | "active" | "done" | "error";
  label: string;
  summary?: string;
  timestamp: number;
}

export interface UseResearchAgentReturn {
  steps: AgentStep[];
  result: FinalReport | null;
  isLoading: boolean;
  error: string | null;
  startResearch: (companyName: string) => void;
  reset: () => void;
}

// Ordered list of nodes for pre-rendering the step tracker
const ORDERED_NODES = [
  { node: "start", label: "Starting" },
  { node: "resolveCompany", label: "Finding Company" },
  { node: "fetchAllParallel", label: "Collecting Financial Data" },
  { node: "fastAnalyze", label: "Generating AI Report" },
  { node: "formatReport", label: "Finalizing Report" },
];

function makeInitialSteps(): AgentStep[] {
  return ORDERED_NODES.map((n) => ({
    ...n,
    status: "pending",
    timestamp: Date.now(),
  }));
}

export function useResearchAgent(): UseResearchAgentReturn {
  const [steps, setSteps] = useState<AgentStep[]>(makeInitialSteps());
  const [result, setResult] = useState<FinalReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setSteps(makeInitialSteps());
    setResult(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const startResearch = useCallback(async (companyName: string) => {
    // Abort any previous request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset state
    setSteps(makeInitialSteps());
    setResult(null);
    setError(null);
    setIsLoading(true);

    // Mark "start" node as active immediately
    setSteps((prev) =>
      prev.map((s) => (s.node === "start" ? { ...s, status: "active" } : s))
    );

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Unable to complete research at this time. Please try again.");
      }

      if (!response.body) {
        throw new Error("No response body — SSE stream unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let activeNodeIndex = 0; // tracks which node to mark as "active" next

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line in buffer

        let currentEvent = "";
        let currentData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim();
          } else if (line === "" && currentEvent && currentData) {
            // Complete SSE event — process it
            try {
              const parsed = JSON.parse(currentData);

              if (currentEvent === "step") {
                const { node, status, label, summary } = parsed;

                setSteps((prev) => {
                  const updated = prev.map((s) => {
                    if (s.node === node) {
                      return {
                        ...s,
                        status: status as AgentStep["status"],
                        label: label ?? s.label,
                        summary,
                        timestamp: Date.now(),
                      };
                    }
                    return s;
                  });

                  // Mark the NEXT node as active (look-ahead for UX)
                  const completedIdx = updated.findIndex((s) => s.node === node);
                  if (completedIdx !== -1 && completedIdx < updated.length - 1) {
                    activeNodeIndex = completedIdx + 1;
                    updated[activeNodeIndex] = {
                      ...updated[activeNodeIndex],
                      status: "active",
                    };
                  }

                  return updated;
                });
              } else if (currentEvent === "final") {
                setResult(parsed as FinalReport);
                setIsLoading(false);
              } else if (currentEvent === "error") {
                setError(
                  parsed.message ??
                    "Searching additional sources to complete your report."
                );
                setIsLoading(false);
              }
            } catch {
              // Ignore malformed SSE lines
            }

            currentEvent = "";
            currentData = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(
          (err as Error).message ?? "Connection to research agent failed."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { steps, result, isLoading, error, startResearch, reset };
}
