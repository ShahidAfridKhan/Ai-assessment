import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // TokyoNight / Dark Cosmic palette
      colors: {
        // Backgrounds
        "bg-base": "#1a1b2e",
        "bg-surface": "#16213e",
        "bg-elevated": "#0f3460",
        "bg-card": "rgba(22, 33, 62, 0.8)",

        // Accents
        "accent-cyan": "#7dcfff",
        "accent-violet": "#bb9af7",
        "accent-green": "#9ece6a",
        "accent-red": "#f7768e",
        "accent-amber": "#e0af68",
        "accent-blue": "#7aa2f7",

        // Text
        "text-primary": "#c0caf5",
        "text-secondary": "#a9b1d6",
        "text-muted": "#565f89",
        "text-dim": "#3b4261",

        // Borders
        "border-subtle": "rgba(122, 162, 247, 0.15)",
        "border-glow": "rgba(125, 207, 255, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "cosmic-gradient":
          "radial-gradient(ellipse at top left, #1a1b2e 0%, #0f3460 50%, #16213e 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(22,33,62,0.9) 0%, rgba(15,52,96,0.7) 100%)",
        "invest-gradient":
          "linear-gradient(135deg, rgba(158,206,106,0.2) 0%, rgba(158,206,106,0.05) 100%)",
        "pass-gradient":
          "linear-gradient(135deg, rgba(247,118,142,0.2) 0%, rgba(247,118,142,0.05) 100%)",
        "cyan-glow":
          "linear-gradient(90deg, rgba(125,207,255,0.1), rgba(187,154,247,0.1))",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(125, 207, 255, 0.25)",
        "glow-violet": "0 0 20px rgba(187, 154, 247, 0.25)",
        "glow-green": "0 0 30px rgba(158, 206, 106, 0.3)",
        "glow-red": "0 0 30px rgba(247, 118, 142, 0.3)",
        card: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 2s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
