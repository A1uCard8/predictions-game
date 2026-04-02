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
          void: "#050505",
          sidebar: "#000000",
          panel: "#0a0a0c",
          border: "#1a1f18",
          accent: "#8ACC16",
          accentDim: "#6fb010",
          danger: "#ff4d6d",
          gold: "#f5c542",
          muted: "#8b9199",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 28px rgba(138, 204, 22, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
