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
          /* Dark ink for text on accent CTAs */
          void: "#0a0d10",
          /* Light “heavenly” shell */
          canvas: "#e8eef8",
          heaven: "#eef3fc",
          mist: "#f6f8fe",
          sidebar: "#fbfcff",
          panel: "#ffffff",
          border: "#d4dce8",
          accent: "#e8b923",
          accentDim: "#c49a16",
          danger: "#e11d48",
          gold: "#f5c542",
          muted: "#5c6470",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 28px rgba(232, 185, 35, 0.32)",
      },
    },
  },
  plugins: [],
};
export default config;
