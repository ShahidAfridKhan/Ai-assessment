"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearchAgent } from "@/hooks/useResearchAgent";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/research/SearchBar";
import { ResearchDashboard } from "@/components/research/ResearchDashboard";
import {
  DashboardActions,
  DashboardExtras,
  HistoryPanel,
} from "@/components/research/DashboardExtras";
import { DashboardCharts } from "@/components/research/DashboardCharts";
import { BG, YELLOW, ACCENT, border } from "@/lib/design";

export default function ResearchPage() {
  const { steps, result, isLoading, error, startResearch, reset } = useResearchAgent();
  const [currentCompany, setCurrentCompany] = useState("");

  const handleSearch = (company: string) => {
    setCurrentCompany(company);
    startResearch(company);
  };

  const doneSteps = steps.filter((s) => s.status === "done").length;
  const totalSteps = steps.length - 1;
  const progress = totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 10;

  const isIdle = !isLoading && !result && !error;
  const showDashboard = isLoading || result;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 60px" }}>
        {/* Search — always visible when idle or compact when loading/done */}
        <section style={{ padding: isIdle ? "60px 0 40px" : "24px 0", textAlign: isIdle ? "center" : "left" }}>
          {isIdle && (
            <>
              <div style={{ display: "inline-block", background: YELLOW, border, padding: "6px 14px", fontWeight: 700, fontSize: "13px", color: "#000", marginBottom: "20px" }}>
                📊 AI Research Workspace
              </div>
              <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.03em", marginBottom: "12px" }}>
                Analyze Any Company in Seconds
              </h1>
              <p style={{ fontSize: "16px", color: ACCENT, maxWidth: "480px", margin: "0 auto 32px" }}>
                Institutional-grade research powered by real-time data and AI.
              </p>
            </>
          )}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </section>

        {/* Dashboard — skeleton while loading, full when done */}
        <AnimatePresence mode="wait">
          {showDashboard && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {result && (
                <DashboardActions
                  report={result}
                  onNewResearch={() => {
                    setCurrentCompany("");
                    reset();
                  }}
                />
              )}

              <ResearchDashboard
                report={result}
                companySlug={currentCompany || result?.company.name}
                loading={isLoading}
                progress={progress}
              />

              {result && <DashboardCharts report={result} />}

              {result && <DashboardExtras report={result} />}

              {error && !result && (
                <div style={{ background: "#fff", border, padding: "20px", marginTop: "16px" }}>
                  <p style={{ fontWeight: 800, color: "#000" }}>Searching additional sources…</p>
                  <p style={{ fontSize: "14px", color: "#444" }}>Generating report using verified public data.</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {isIdle && <HistoryPanel />}
      </main>

      <footer style={{ borderTop: border, padding: "24px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "#555", fontWeight: 600 }}>
          © 2025 AlphaLens AI · Not financial advice
        </span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
