import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Tailwind ne sert qu'aux composants shadcn (migration progressive). Le preflight
 * est désactivé : le reset/base vit déjà dans globals.css et s'applique aux pages
 * non migrées. Les couleurs pointent vers les tokens DESIGN.md (var(--*)) — aucune
 * valeur en dur, le miroir DESIGN.md ↔ globals.css reste la source unique.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--ink)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--accent)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)"
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)"
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--on-accent)"
        },
        secondary: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--ink)"
        },
        muted: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--muted)"
        },
        accent: {
          DEFAULT: "var(--accent-soft)",
          foreground: "var(--accent)"
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--on-accent)"
        }
      },
      borderRadius: {
        lg: "var(--radius-md)",
        md: "var(--radius-sm)",
        sm: "var(--radius-sm)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"]
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
