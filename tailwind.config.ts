import type { Config } from "tailwindcss";

/** Stitch / “Algorithmic Precision” tokens — see ~/Downloads/stitch */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        plains: {
          void: "#1b1c1c",
          onSurfaceVariant: "#434656",
          canvas: "#fbf9f8",
          heaven: "#f5f3f3",
          mist: "#f5f3f3",
          sidebar: "#fbf9f8",
          panel: "#ffffff",
          container: "#efeded",
          containerHigh: "#e9e8e7",
          containerHighest: "#e4e2e2",
          border: "#c3c5d9",
          outline: "#737688",
          primary: "#003ec7",
          primaryHi: "#0052ff",
          accent: "#0052ff",
          accentDim: "#003ec7",
          secondary: "#7a2ad6",
          secondaryContainer: "#944af1",
          tertiary: "#005474",
          danger: "#ba1a1a",
          dangerMuted: "#ffdad6",
          gold: "#f59e0b",
          muted: "#434656",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        headline: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 20px 40px rgba(0, 62, 199, 0.06)",
        stitch: "0 1px 0 rgba(27, 28, 28, 0.04), 0 16px 40px -12px rgba(0, 62, 199, 0.08)",
      },
      borderRadius: {
        stitch: "0.125rem",
      },
    },
  },
  plugins: [],
};
export default config;
