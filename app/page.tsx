"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ============================================================
   AlphaLens AI — Neo-Brutalist Landing Page
   Colors: bg #171e19 · yellow #ffe17c · accent #b7c6c2
   Rules: 2px black borders · hard shadows · no gradients
   ============================================================ */

// ---------- Inline styles shared across components ----------
const YELLOW = "#ffe17c";
const BG = "#171e19";
const ACCENT = "#b7c6c2";

const hardShadow = "4px 4px 0px #000000";
const hardShadowLg = "6px 6px 0px #000000";
const hardShadowSm = "2px 2px 0px #000000";
const border = "2px solid #000000";

// ---------- Reusable primitives ----------
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: YELLOW,
        border,
        boxShadow: hardShadowSm,
        padding: "6px 14px",
        fontWeight: 700,
        fontSize: "13px",
        letterSpacing: "0.05em",
        color: "#000",
      }}
    >
      {children}
    </span>
  );
}

function BtnPrimary({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const style = {
    display: "inline-block",
    background: YELLOW,
    border,
    boxShadow: pressed ? "0px 0px 0px #000" : hardShadow,
    padding: "14px 28px",
    fontWeight: 800,
    fontSize: "15px",
    color: "#000",
    cursor: "pointer",
    transform: pressed ? "translate(4px, 4px)" : "translate(0,0)",
    transition: "transform 0.08s, box-shadow 0.08s",
    textDecoration: "none",
    letterSpacing: "0.02em",
  };
  if (href)
    return (
      <Link
        href={href}
        style={style}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {children}
      </Link>
    );
  return (
    <button
      style={style}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      {children}
    </button>
  );
}

function BtnSecondary({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const style = {
    display: "inline-block",
    background: "transparent",
    border: "2px solid #fff",
    boxShadow: pressed ? "0px 0px 0px #fff" : "4px 4px 0px #fff",
    padding: "14px 28px",
    fontWeight: 800,
    fontSize: "15px",
    color: "#fff",
    cursor: "pointer",
    transform: pressed ? "translate(4px, 4px)" : "translate(0,0)",
    transition: "transform 0.08s, box-shadow 0.08s",
    textDecoration: "none",
    letterSpacing: "0.02em",
  };
  if (href)
    return (
      <Link
        href={href}
        style={style}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        {children}
      </Link>
    );
  return (
    <button
      style={style}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      {children}
    </button>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? YELLOW : "#fff",
        border,
        boxShadow: hovered ? hardShadowLg : hardShadow,
        padding: "28px 24px",
        transform: hovered ? "translate(-2px, -2px)" : "translate(0,0)",
        transition: "all 0.15s",
        cursor: "default",
      }}
    >
      <div
        style={{
          fontSize: "36px",
          marginBottom: "16px",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hovered ? "#000" : YELLOW,
          border,
          boxShadow: hardShadowSm,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: "17px",
          marginBottom: "10px",
          color: "#000",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: "14px", color: "#333", lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}

// ---------- Animated counter ----------
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const step = target / 60;
          const t = setInterval(() => {
            start += step;
            if (start >= target) {
              setVal(target);
              clearInterval(t);
            } else {
              setVal(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ---------- Dashboard mockup ----------
function DashboardMockup() {
  const [chartLoaded, setChartLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChartLoaded(true), 800);
    return () => clearTimeout(t);
  }, []);

  const bars = [55, 70, 62, 80, 75, 90, 85, 95];

  return (
    <div
      style={{
        background: "#fff",
        border: "3px solid #000",
        boxShadow: "8px 8px 0 #000",
        borderRadius: 0,
        overflow: "hidden",
        maxWidth: "520px",
        width: "100%",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#f0f0f0",
          borderBottom: border,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#ff5f57",
            border: "1.5px solid #000",
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#ffbd2e",
            border: "1.5px solid #000",
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#28ca41",
            border: "1.5px solid #000",
          }}
        />
        <div
          style={{
            flex: 1,
            background: "#fff",
            border,
            borderRadius: 0,
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 700,
            marginLeft: "8px",
            color: "#555",
          }}
        >
          alphalens.ai/research/tesla
        </div>
      </div>

      <div style={{ padding: "20px", background: "#fafafa" }}>
        {/* Search bar */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              flex: 1,
              border,
              background: "#fff",
              padding: "10px 14px",
              fontWeight: 700,
              fontSize: "14px",
              color: "#000",
              boxShadow: hardShadowSm,
            }}
          >
            🔍 Tesla, Inc.
          </div>
          <div
            style={{
              background: YELLOW,
              border,
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: "13px",
              boxShadow: hardShadowSm,
              cursor: "pointer",
            }}
          >
            Analyze →
          </div>
        </div>

        {/* Score + verdict row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              background: YELLOW,
              border,
              boxShadow: hardShadowSm,
              padding: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>
              INVESTMENT SCORE
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#000",
                lineHeight: 1.1,
              }}
            >
              92
              <span style={{ fontSize: "14px" }}>/100</span>
            </div>
          </div>
          <div
            style={{
              background: "#000",
              border,
              boxShadow: "2px 2px 0 " + YELLOW,
              padding: "14px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: ACCENT }}>
              RECOMMENDATION
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: YELLOW,
              }}
            >
              ✅ BUY
            </div>
          </div>
        </div>

        {/* Revenue chart */}
        <div
          style={{
            border,
            background: "#fff",
            boxShadow: hardShadowSm,
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
            REVENUE GROWTH (TTM)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "6px",
              height: "60px",
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: i === bars.length - 1 ? "#000" : YELLOW,
                  border: "1.5px solid #000",
                  height: chartLoaded ? `${h}%` : "0%",
                  transition: `height 0.5s ease ${i * 0.06}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Metrics row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {[
            { label: "P/E", val: "52.1" },
            { label: "Mkt Cap", val: "$780B" },
            { label: "52W High", val: "$299" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                border,
                background: "#fff",
                padding: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#666" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: "#000" }}>
                {m.val}
              </div>
            </div>
          ))}
        </div>

        {/* Risk meter */}
        <div
          style={{
            border,
            background: "#fff",
            padding: "10px 12px",
            boxShadow: hardShadowSm,
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              fontWeight: 800,
              marginBottom: "6px",
            }}
          >
            <span>RISK METER</span>
            <span style={{ color: "#e67e22" }}>MEDIUM</span>
          </div>
          <div
            style={{
              height: "10px",
              background: "#eee",
              border: "1.5px solid #000",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "55%",
                background: "#e67e22",
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>

        {/* AI Summary */}
        <div
          style={{
            border,
            background: "#000",
            padding: "10px 12px",
            boxShadow: "2px 2px 0 " + YELLOW,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: YELLOW,
              marginBottom: "6px",
            }}
          >
            🤖 AI RECOMMENDATION
          </div>
          <div style={{ fontSize: "12px", color: "#fff", lineHeight: 1.5 }}>
            Strong fundamentals, FSD growth opportunity, valuation premium
            justified by energy segment. Recommend BUY with 12-month horizon.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Marquee ----------
const COMPANIES = [
  "Google",
  "Microsoft",
  "NVIDIA",
  "Amazon",
  "Tesla",
  "Apple",
  "Meta",
  "Adobe",
  "Netflix",
  "Spotify",
  "Salesforce",
  "Palantir",
];

function Marquee() {
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-inner {
          display: flex;
          gap: 0;
          animation: marqueeScroll 22s linear infinite;
          width: max-content;
        }
      `}</style>
      <div className="marquee-inner">
        {[...COMPANIES, ...COMPANIES].map((c, i) => (
          <div
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 32px",
              borderRight: border,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "15px",
                color: "#fff",
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
              }}
            >
              {c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UseCaseCard({
  icon,
  role,
  headline,
  desc,
  featured,
}: {
  icon: string;
  role: string;
  headline: string;
  desc: string;
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? YELLOW : featured ? "#fff" : "#1e1e1e",
        border: featured ? border : "2px solid #444",
        boxShadow: hovered ? hardShadowLg : featured ? hardShadow : "4px 4px 0 #444",
        padding: "32px 28px",
        transform: hovered ? "translate(-2px,-2px)" : "translate(0,0)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "16px" }}>{icon}</div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: hovered ? "#000" : YELLOW,
          marginBottom: "10px",
        }}
      >
        {role.toUpperCase()}
      </div>
      <h3
        style={{
          fontWeight: 800,
          fontSize: "20px",
          color: hovered ? "#000" : featured ? "#000" : "#fff",
          marginBottom: "12px",
        }}
      >
        {headline}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: hovered ? "#333" : featured ? "#555" : ACCENT,
          lineHeight: 1.6,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ---------- Testimonial ----------
function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? YELLOW : "#fff",
        border,
        boxShadow: hovered ? hardShadowLg : hardShadow,
        padding: "28px",
        transform: hovered ? "translate(-2px,-2px)" : "translate(0,0)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ color: "#f39c12", fontSize: "18px", marginBottom: "14px" }}>
        ★★★★★
      </div>
      <p
        style={{
          fontSize: "15px",
          lineHeight: 1.6,
          fontWeight: 600,
          color: "#000",
          marginBottom: "20px",
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div style={{ borderTop: "2px solid #000", paddingTop: "14px" }}>
        <div style={{ fontWeight: 800, fontSize: "14px", color: "#000" }}>
          {name}
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
          {role}
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN PAGE ----------
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#fff",
      }}
    >
      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #ffe17c; color: #000; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .nav-link {
          color: #b7c6c2;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .nav-link:hover { color: #ffe17c; }
        @keyframes skeleton {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* ====== NAV ====== */}
      <nav
        style={{
          borderBottom: border,
          background: BG,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#000",
                border,
                boxShadow: hardShadowSm,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
              >
                <polyline
                  points="3,16 8,10 12,13 19,5"
                  stroke={YELLOW}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="15,5 19,5 19,9"
                  stroke={YELLOW}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 900,
                fontSize: "18px",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              AlphaLens{" "}
              <span style={{ color: YELLOW }}>AI</span>
            </span>
          </div>

          {/* Desktop menu */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            {["Features", "AI Research", "Pricing", "Demo", "About"].map(
              (item) => (
                <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="nav-link">
                  {item}
                </a>
              )
            )}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <BtnPrimary href="/research">Try AlphaLens Free</BtnPrimary>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div className="fade-up">
          <div style={{ marginBottom: "24px" }}>
            <Tag>🚀 AI Investment Research Agent</Tag>
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(42px, 5vw, 68px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
              color: "#fff",
            }}
          >
            Stop Guessing.
            <br />
            Start Investing with{" "}
            <span
              style={{
                WebkitTextStroke: "3px " + YELLOW,
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              AI.
            </span>
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: ACCENT,
              lineHeight: 1.7,
              marginBottom: "36px",
              maxWidth: "480px",
              fontWeight: 500,
            }}
          >
            Analyze any company in seconds using real-time financial data, market
            news, AI reasoning, and investment scoring.
          </p>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <BtnPrimary href="/research">Analyze Company →</BtnPrimary>
            <BtnSecondary href="#demo">▶ Watch Demo</BtnSecondary>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "48px",
              flexWrap: "wrap",
            }}
          >
            {[
              { n: 5000, s: "+", label: "Companies Analyzed" },
              { n: 98, s: "%", label: "Accuracy Rate" },
              { n: 12, s: "s", label: "Avg. Research Time" },
            ].map((st) => (
              <div key={st.label}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "32px",
                    color: YELLOW,
                    lineHeight: 1,
                  }}
                >
                  <Counter target={st.n} suffix={st.s} />
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: ACCENT,
                    fontWeight: 600,
                    marginTop: "4px",
                  }}
                >
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Dashboard */}
        <div
          style={{ display: "flex", justifyContent: "center" }}
          className="fade-up"
        >
          <DashboardMockup />
        </div>
      </section>

      {/* ====== MARQUEE ====== */}
      <section
        style={{
          borderTop: border,
          borderBottom: border,
          background: "#000",
          padding: "0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            borderBottom: "1.5px solid #333",
            padding: "10px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.15em",
              color: ACCENT,
            }}
          >
            COMPANIES AVAILABLE FOR ANALYSIS
          </span>
        </div>
        <div style={{ padding: "18px 0" }}>
          <Marquee />
        </div>
      </section>

      {/* ====== PROBLEM vs SOLUTION ====== */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <Tag>⚡ Why AlphaLens</Tag>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 52px)",
              marginTop: "20px",
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Traditional Research is Broken
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Problem */}
          <div
            style={{
              background: "#1e1e1e",
              border: "2px solid #444",
              boxShadow: "4px 4px 0 #444",
              padding: "36px",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: "13px",
                letterSpacing: "0.1em",
                color: "#f7768e",
                marginBottom: "20px",
              }}
            >
              ❌ THE PROBLEM
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "24px",
                marginBottom: "24px",
                color: "#fff",
              }}
            >
              Traditional Investment Research is:
            </h3>
            {[
              "Slow — takes days of reading reports",
              "Confusing — jargon-heavy and inaccessible",
              "Requires reading hundreds of documents",
              "Difficult for beginners to interpret",
              "Expensive — Bloomberg costs $24K/year",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "14px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "#f7768e", fontWeight: 800, flexShrink: 0 }}>
                  ✗
                </span>
                <span
                  style={{ color: ACCENT, fontSize: "15px", fontWeight: 500 }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Solution */}
          <div
            style={{
              background: YELLOW,
              border,
              boxShadow: hardShadowLg,
              padding: "36px",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: "13px",
                letterSpacing: "0.1em",
                color: "#000",
                marginBottom: "20px",
              }}
            >
              ✅ THE SOLUTION
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "24px",
                marginBottom: "24px",
                color: "#000",
              }}
            >
              AlphaLens AI gives you:
            </h3>
            {[
              "AI-powered reasoning — done in seconds",
              "Complete financial statement analysis",
              "Latest market news, summarized by AI",
              "Risk analysis with clear scoring",
              "Buy / Hold / Pass recommendation",
              "Instant professional-grade reports",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "14px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    color: "#000",
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{ color: "#000", fontSize: "15px", fontWeight: 600 }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section
        id="features"
        style={{
          background: "#000",
          borderTop: border,
          borderBottom: border,
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <Tag>🧠 Core Features</Tag>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(32px, 4vw, 52px)",
                marginTop: "20px",
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              Everything You Need to Invest Smarter
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "🤖",
                title: "AI Research Agent",
                desc: "LangGraph-powered multi-step agent that autonomously researches any public company from resolve to verdict.",
              },
              {
                icon: "📊",
                title: "Financial Statement Analysis",
                desc: "Deep dive into revenue growth, profit margins, debt-to-equity, P/E ratio, and free cash flow — automatically.",
              },
              {
                icon: "📰",
                title: "Market News Intelligence",
                desc: "Scans and summarizes recent news with AI-powered sentiment scoring across 100+ financial sources.",
              },
              {
                icon: "🎯",
                title: "Investment Score Engine",
                desc: "Weighted 5-dimension rubric scoring (fundamentals, growth, sentiment, valuation, risk) → 0–100 score.",
              },
              {
                icon: "⚠️",
                title: "Risk Detection",
                desc: "Identifies 3–5 specific, falsifiable risk factors per company — categorized by type and severity.",
              },
              {
                icon: "📋",
                title: "AI Investment Report",
                desc: "Full structured report with reasoning, rubric math, news citations, and a clear Buy/Hold/Pass verdict.",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section
        id="ai-research"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <Tag>🔬 How It Works</Tag>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 52px)",
              marginTop: "20px",
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Research in 3 Simple Steps
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "24px",
            position: "relative",
          }}
        >
          {[
            {
              step: "01",
              title: "Enter Company Name",
              example: "e.g. Tesla, Infosys, Apple",
              items: ["Type any company name", "AI disambiguates automatically", "Works for global stocks"],
              icon: "🔍",
            },
            {
              step: "02",
              title: "AI Collects Data",
              example: "7 agent nodes run in sequence",
              items: ["Financial data (FMP API)", "Recent news (Tavily)", "Market sentiment analysis", "Industry context"],
              icon: "⚡",
            },
            {
              step: "03",
              title: "Receive Your Report",
              example: "In ~30 seconds",
              items: ["Investment Score (0–100)", "Risk Analysis report", "Pros & Cons breakdown", "Buy / Hold / Pass verdict"],
              icon: "📈",
            },
          ].map((s, i) => (
            <div
              key={s.step}
              style={{
                background: i === 1 ? YELLOW : "#fff",
                border,
                boxShadow: hardShadow,
                padding: "32px 28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "48px",
                    color: i === 1 ? "#000" : "#eee",
                    lineHeight: 1,
                  }}
                >
                  {s.step}
                </span>
                <span style={{ fontSize: "28px" }}>{s.icon}</span>
              </div>
              <h3
                style={{
                  fontWeight: 900,
                  fontSize: "20px",
                  color: "#000",
                  marginBottom: "6px",
                }}
              >
                {s.title}
              </h3>
              <div
                style={{
                  fontSize: "12px",
                  color: i === 1 ? "#333" : "#666",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                {s.example}
              </div>
              {s.items.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#000",
                    fontWeight: 600,
                  }}
                >
                  <span>→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ====== LIVE DASHBOARD (large) ====== */}
      <section
        id="demo"
        style={{
          background: "#000",
          borderTop: border,
          borderBottom: border,
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <Tag>📊 Live Dashboard</Tag>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(32px, 4vw, 52px)",
                marginTop: "20px",
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              See AlphaLens in Action
            </h2>
          </div>

          {/* Large dashboard */}
          <div
            style={{
              background: "#fff",
              border: "3px solid #000",
              boxShadow: "10px 10px 0 " + YELLOW,
              overflow: "hidden",
            }}
          >
            {/* Browser bar */}
            <div
              style={{
                background: "#111",
                borderBottom: "2px solid #333",
                padding: "12px 20px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              {["#ff5f57", "#ffbd2e", "#28ca41"].map((c) => (
                <div
                  key={c}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: c,
                    border: "1.5px solid rgba(255,255,255,0.2)",
                  }}
                />
              ))}
              <div
                style={{
                  flex: 1,
                  background: "#222",
                  border: "1.5px solid #444",
                  padding: "5px 16px",
                  marginLeft: "8px",
                  color: ACCENT,
                  fontSize: "13px",
                  fontFamily: "monospace",
                }}
              >
                app.alphalens.ai/research/infosys
              </div>
            </div>

            {/* Dashboard grid */}
            <div
              style={{
                padding: "24px",
                background: "#f8f8f8",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "auto auto auto",
                gap: "16px",
              }}
            >
              {/* Score */}
              <div
                style={{
                  background: YELLOW,
                  border,
                  boxShadow: hardShadowSm,
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800 }}>
                  INVESTMENT SCORE
                </div>
                <div style={{ fontSize: "52px", fontWeight: 900, lineHeight: 1.1 }}>
                  78<span style={{ fontSize: "20px" }}>/100</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>INVEST ✅</div>
              </div>

              {/* Company info */}
              <div
                style={{
                  border,
                  background: "#fff",
                  padding: "20px",
                  boxShadow: hardShadowSm,
                  gridColumn: "span 2",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: "22px", color: "#000" }}>
                  Infosys Limited
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                  {[
                    { l: "TICKER", v: "INFY", c: "#000", bg: YELLOW },
                    { l: "EXCHANGE", v: "NYSE", c: "#fff", bg: "#000" },
                    { l: "SECTOR", v: "Technology", c: "#000", bg: ACCENT },
                  ].map((b) => (
                    <div
                      key={b.l}
                      style={{
                        background: b.bg,
                        border,
                        padding: "4px 10px",
                        boxShadow: hardShadowSm,
                      }}
                    >
                      <div style={{ fontSize: "9px", fontWeight: 700, color: b.c, opacity: 0.7 }}>
                        {b.l}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: b.c }}>
                        {b.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              {[
                { label: "Revenue Growth", val: "+8.3%", color: "#27ae60" },
                { label: "52W Return", val: "+18.7%", color: "#27ae60" },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    border,
                    background: "#fff",
                    padding: "14px",
                    boxShadow: hardShadowSm,
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      color: m.color,
                    }}
                  >
                    {m.val}
                  </div>
                </div>
              ))}

              {/* AI Recommendation — full width */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  background: "#000",
                  border,
                  padding: "20px 24px",
                  boxShadow: "4px 4px 0 " + YELLOW,
                  display: "flex",
                  gap: "24px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    background: YELLOW,
                    border,
                    padding: "10px 20px",
                    fontWeight: 900,
                    fontSize: "16px",
                    color: "#000",
                    flexShrink: 0,
                  }}
                >
                  ✅ INVEST
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: YELLOW, marginBottom: "4px" }}>
                    🤖 AI FINAL RECOMMENDATION
                  </div>
                  <p style={{ fontSize: "14px", color: "#fff", lineHeight: 1.5 }}>
                    Infosys demonstrates strong fundamentals with 16.2% net margin, near-zero leverage (D/E 0.09), 
                    and resilient IT services demand recovery. P/E of 24 is a modest discount to sector peers. 
                    Recommend INVEST with 12-month horizon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== USE CASES ====== */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <Tag>👥 Use Cases</Tag>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 52px)",
              marginTop: "20px",
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Built for Everyone Who Invests
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {[
            {
              icon: "💼",
              role: "Retail Investor",
              headline: "Research companies faster",
              desc: "Get institutional-grade analysis without the Bloomberg terminal price tag.",
            },
            {
              icon: "📊",
              role: "Financial Analyst",
              headline: "Generate investment reports",
              desc: "Automate first-pass research. Spend your time on decisions, not data gathering.",
            },
            {
              icon: "🎓",
              role: "Finance Students",
              headline: "Learn stock market analysis",
              desc: "Understand how real investment decisions are made — with full reasoning shown.",
            },
          ].map((u, i) => (
            <UseCaseCard
              key={u.role}
              icon={u.icon}
              role={u.role}
              headline={u.headline}
              desc={u.desc}
              featured={i === 1}
            />
          ))}
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section
        style={{
          background: "#000",
          borderTop: border,
          borderBottom: border,
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <Tag>💬 Testimonials</Tag>
            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(32px, 4vw, 52px)",
                marginTop: "20px",
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              Trusted by Investors Worldwide
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            <TestimonialCard
              quote="AlphaLens AI saved me hours of manual research. The AI reasoning is detailed and actually explains WHY it recommends a stock."
              name="Priya Sharma"
              role="Retail Investor, Mumbai"
            />
            <TestimonialCard
              quote="The AI explanations are incredibly useful. I use it to validate my own thesis before making any investment decision."
              name="Marcus Chen"
              role="Portfolio Manager, Singapore"
            />
            <TestimonialCard
              quote="A powerful research assistant for investors. The rubric-based scoring makes the recommendation transparent and auditable."
              name="Sarah Johnson"
              role="Financial Analyst, London"
            />
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section
        style={{
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <Tag>🚀 Get Started Free</Tag>
          </div>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 64px)",
              letterSpacing: "-0.03em",
              marginBottom: "20px",
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            Ready To Make Smarter Investment Decisions?
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: ACCENT,
              marginBottom: "40px",
              fontWeight: 500,
            }}
          >
            Join 5,000+ investors using AI to research companies in seconds.
          </p>
          <BtnPrimary href="/research">Start Free Analysis →</BtnPrimary>
          <p
            style={{
              marginTop: "20px",
              fontSize: "13px",
              color: "#555",
              fontWeight: 600,
            }}
          >
            No credit card required · 5 free analyses/day
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer
        style={{
          borderTop: border,
          background: "#000",
          padding: "60px 24px 32px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "48px",
              marginBottom: "48px",
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#111",
                    border: "2px solid #333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <polyline
                      points="3,16 8,10 12,13 19,5"
                      stroke={YELLOW}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: "16px", color: "#fff" }}>
                  AlphaLens <span style={{ color: YELLOW }}>AI</span>
                </span>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  lineHeight: 1.6,
                  maxWidth: "260px",
                }}
              >
                AI-powered investment research. Analyze any company in seconds.
              </p>
            </div>

            {/* Links */}
            {[
              {
                heading: "Product",
                links: ["Features", "Pricing", "Documentation", "Changelog"],
              },
              {
                heading: "Resources",
                links: ["Blog", "FAQs", "Support", "API Docs"],
              },
              {
                heading: "Company",
                links: ["About", "Careers", "Contact", "Legal"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "12px",
                    letterSpacing: "0.1em",
                    color: YELLOW,
                    marginBottom: "16px",
                  }}
                >
                  {col.heading.toUpperCase()}
                </div>
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      display: "block",
                      color: "#666",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "10px",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#fff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#666")
                    }
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: "1.5px solid #222",
              paddingTop: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#444", fontWeight: 600 }}>
              © 2025 AlphaLens AI. All rights reserved.
            </span>
            <div style={{ display: "flex", gap: "16px" }}>
              {["GitHub", "LinkedIn", "Twitter", "Email"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    textDecoration: "none",
                    fontWeight: 700,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = YELLOW)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
