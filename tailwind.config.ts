import type { Config } from "tailwindcss";

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
          void: "#050508",
          panel: "#0c0e14",
          border: "#1e2433",
          accent: "#00e5a8",
          accentDim: "#00b884",
          danger: "#ff4d6d",
          gold: "#f5c542",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 229, 168, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
