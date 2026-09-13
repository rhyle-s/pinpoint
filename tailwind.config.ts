import type { Config } from "tailwindcss";

// Pinpoint Brand & Design System v2.0 — LOCKED (pinpoint-brand-spec-v2.md).
//
// `gray` is still remapped wholesale (not just replaced by the new named tokens below) because
// ~30 components already use plain `gray-*` classes and this keeps every one of them on the exact
// same warm-neutral hexes without a rewrite. `surface`/`ink`/`border` are the same underlying
// hexes under the v2 spec's own names, added for anywhere written against the new vocabulary —
// `ink-primary` and `gray-950` are literally the same colour, use whichever reads better in context.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Existing `primary`/`primary-tint`/`on-tint` tokens are kept (used everywhere already)
        // but repointed at the spec's brand blue.
        primary: "#2563EB", // brand-600
        "primary-tint": "#EFF6FF", // brand-50
        "on-tint": "#1D4ED8", // brand-700
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          400: "#60A5FA",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
        },
        surface: {
          page: "#FAFAF9",
          card: "#FFFFFF",
          subtle: "#F3F3F1",
        },
        ink: {
          primary: "#1C1C1A",
          secondary: "#6B6B69",
          tertiary: "#AEADA9",
          disabled: "#CFCECA",
        },
        border: {
          DEFAULT: "#E8E8E6",
        },
        success: {
          50: "#F0FDF4",
          200: "#BBF7D0",
          600: "#059669",
        },
        warning: {
          50: "#FFFBEB",
          600: "#D97706",
        },
        error: {
          50: "#FEF2F2",
          600: "#DC2626",
        },
        gray: {
          50: "#FAFAF9",
          100: "#F3F3F1",
          200: "#E8E8E6",
          300: "#CFCECA",
          400: "#AEADA9",
          500: "#8F8E8A",
          600: "#6B6B69",
          700: "#4A4A47",
          800: "#2E2E2B",
          900: "#1A1A18",
          950: "#1C1C1A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        citation: ["var(--font-citation)", "Georgia", "ui-serif", "serif"],
        // Kept as an alias — a couple of places reference `font-serif` directly.
        serif: ["var(--font-citation)", "Georgia", "ui-serif", "serif"],
      },
      borderRadius: {
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
        "ring-brand": "0 0 0 3px rgba(37,99,235,0.12)",
        "ring-brand-focus": "0 0 0 3px rgba(37,99,235,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
