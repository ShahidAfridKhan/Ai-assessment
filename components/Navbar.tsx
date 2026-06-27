"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { YELLOW, BG, ACCENT, border, hardShadowSm } from "@/lib/design";

const NAV_ITEMS = [
  { label: "Research", href: "/research" },
  { label: "History", href: "/research#history" },
  { label: "Saved Reports", href: "/research#saved" },
  { label: "Watchlist", href: "/research#watchlist" },
  { label: "Settings", href: "/research#settings" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
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
          gap: "16px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
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
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <polyline points="3,16 8,10 12,13 19,5" stroke={YELLOW} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="15,5 19,5 19,9" stroke={YELLOW} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: "18px", color: "#fff", letterSpacing: "-0.02em" }}>
            AlphaLens <span style={{ color: YELLOW }}>AI</span>
          </span>
        </Link>

        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: pathname === item.href ? YELLOW : ACCENT,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.04em",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          style={{
            display: "inline-block",
            background: YELLOW,
            border,
            boxShadow: hardShadowSm,
            padding: "10px 18px",
            fontWeight: 800,
            fontSize: "13px",
            color: "#000",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Home
        </Link>
      </div>
    </nav>
  );
}
