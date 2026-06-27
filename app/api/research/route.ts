/**
 * app/api/research/route.ts
 *
 * SSE streaming API route for the Investment Research Agent.
 *
 * Protocol:
 *   POST body: { "companyName": string }
 *   Response:  text/event-stream
 *
 *   SSE event types:
 *   - "step":  { node, status, summary, label }  — emitted per node completion
 *   - "final": FinalReport JSON                  — emitted after formatReport
 *   - "error": { message }                       — emitted if the graph crashes fatally
 *
 * STREAMING MECHANISM:
 * LangGraph's streamEvents() method emits an AsyncGenerator of LangChain
 * run events. We filter for "on_chain_end" events whose name matches our
 * node names, and pipe them into a ReadableStream that Next.js returns
 * as text/event-stream. No setTimeout — the events are real graph events.
 */

import { NextRequest } from "next/server";
import { investmentGraph, NODE_LABELS, finalReportStore } from "@/lib/agent/graph";

// Disable body parsing timeout — SSE streams can run for 60s+
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Formats a Server-Sent Event string */
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Maps a completed node name to a one-line summary from the resulting state */
function buildNodeSummary(
  nodeName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: Record<string, any>
): string {
  try {
    switch (nodeName) {
      case "resolveCompany": {
        const c = output?.resolvedCompany;
        if (!c) return "Company identity resolved.";
        const ticker = c.ticker ? ` (${c.ticker})` : " (private/unlisted)";
        return `Resolved to ${c.name}${ticker} — ${c.sector ?? "sector unknown"} [${c.confidence} confidence]`;
      }
      case "fetchAllParallel": {
        const f = output?.fundamentals;
        const count = output?.news?.length ?? 0;
        const parts: string[] = [];
        if (f?.peRatio != null) parts.push(`P/E ${f.peRatio.toFixed(1)}`);
        if (f?.revenueGrowthYoY != null)
          parts.push(`Growth ${(f.revenueGrowthYoY * 100).toFixed(1)}%`);
        if (count) parts.push(`${count} news articles`);
        return parts.length ? parts.join(" · ") : "Public data collected.";
      }
      case "fastAnalyze": {
        const d = output?.decision;
        if (!d) return "AI analysis complete.";
        return `${d.verdict} — ${d.confidence}/100`;
      }
      case "formatReport":
        return "Report assembled — streaming final results.";
      default:
        return "Step complete.";
    }
  } catch {
    return "Step complete.";
  }
}

export async function POST(req: NextRequest) {
  // Parse body
  let companyName: string;
  try {
    const body = await req.json();
    companyName = (body?.companyName ?? "").trim();
    if (!companyName) {
      return new Response(JSON.stringify({ error: "companyName is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create SSE ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function emit(event: string, data: unknown) {
        try {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        } catch {
          // Controller may be closed if client disconnected
        }
      }

      // Send initial "started" step
      emit("step", {
        node: "start",
        status: "done",
        label: "Agent started",
        summary: `Starting research on "${companyName}"…`,
      });

      try {
        // Run the graph with streamEvents to capture node-level events
        // LangGraph v2 events: on_chain_start, on_chain_stream, on_chain_end
        const eventStream = investmentGraph.streamEvents(
          { companyNameRaw: companyName },
          {
            version: "v2",
            configurable: { thread_id: `research-${Date.now()}` },
          }
        );

        // Track which nodes we've started/completed to avoid duplicate events
        const startedNodes = new Set<string>();
        const completedNodes = new Set<string>();

        for await (const event of eventStream) {
          const { event: eventType, name, data } = event;

          // Emit "active" on node start (provides real-time status before completion)
          if (eventType === "on_chain_start" && name && NODE_LABELS[name]) {
            if (!startedNodes.has(name)) {
              startedNodes.add(name);
              emit("step", {
                node: name,
                status: "active",
                label: NODE_LABELS[name],
                summary: undefined,
              });
            }
          }

          // Emit "done" on node completion
          if (eventType === "on_chain_end" && name && NODE_LABELS[name]) {
            if (completedNodes.has(name)) continue;
            completedNodes.add(name);

            // LangGraph v2 may nest output differently — handle both shapes
            const nodeOutput =
              data?.output ??
              (typeof data === "object" && !Array.isArray(data) ? data : {});
            const summary = buildNodeSummary(name, nodeOutput as Record<string, unknown>);

            emit("step", {
              node: name,
              status: "done",
              label: NODE_LABELS[name],
              summary,
            });

            // After formatReport completes, retrieve and emit the final report
            if (name === "formatReport") {
              // Small delay to ensure the store write has settled
              await new Promise((r) => setTimeout(r, 50));
              const report = finalReportStore.get(companyName);
              if (report) {
                finalReportStore.delete(companyName);
                emit("final", report);
              } else {
                emit("error", {
                  message:
                    "Searching additional sources to complete your report.",
                });
              }
            }
          }
        }
      } catch (error) {
        emit("error", {
          message: "Searching additional sources... Please wait while we finalize your report.",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering on Vercel
      "Access-Control-Allow-Origin": "*",
    },
  });
}
