import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b16",
          900: "#0a1428",
          800: "#0f1e3a",
          700: "#152a4d",
          600: "#1c3660",
        },
        aqua: {
          400: "#5eead4",
          500: "#2dd4bf",
          600: "#14b8a6",
        },
        riskLow: "#2dd4bf",
        riskMedium: "#fbbf24",
        riskHigh: "#f87171",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(45, 212, 191, 0.35)",
        glowRed: "0 0 24px rgba(248, 113, 113, 0.45)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
