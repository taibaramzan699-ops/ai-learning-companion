import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import tailwindcssAnimate from "tailwindcss-animate";

// Design system tokens for AI Learning Companion.
// Palette: deep "notebook indigo" ink + a single warm "highlighter" accent —
// evokes annotated study material rather than a generic SaaS dashboard.
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: { "2xl": "1280px" },
    },
    extend: {
      screens: {
        xs: "480px",
        "3xl": "1600px",
      },
      colors: {
        ink: {
          950: "#0B0E1A",
          900: "#111527",
          800: "#1B2036",
          700: "#262C47",
          600: "#3A4166",
          400: "#6B7299",
          200: "#B7BBD6",
          100: "#E4E6F2",
          50: "#F6F7FC",
        },
        highlight: {
          DEFAULT: "#FFC857", // marker-yellow accent, used sparingly
          600: "#E0A93A",
          700: "#B8862A",
        },
        signal: {
          success: "#3FBF7F",
          error: "#E5484D",
          warning: "#FFC857",
          info: "#5B8DEF",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        manrope: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      maxWidth: {
        content: "1400px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,14,26,0.04), 0 8px 24px -8px rgba(11,14,26,0.12)",
        "card-hover": "0 2px 4px rgba(11,14,26,0.06), 0 16px 40px -12px rgba(11,14,26,0.18)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-soft": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default config;