import type { Config } from "tailwindcss";

// Pinpoint Brand & Design System v1.0 (pinpoint-brand-spec.md).
//
// The `gray` scale is overridden wholesale rather than introduced as new `ink`/`surface`/`border`
// tokens, because every component in this app already uses plain `gray-*` Tailwind classes
// (border-gray-200, text-gray-700, bg-gray-50, ...) — remapping the scale itself brings the whole
// existing UI onto the spec's exact warm neutral palette without touching ~30 component files.
// The spec only names 50/100/200/300/400/600/900/950; 500/700/800 are linearly interpolated
// between the nearest named anchors to keep the same warm (R≈G>B) character, since this app also
// uses those shades.
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
        // Existing `primary`/`primary-tint`/`on-tint` tokens are kept (every component already
        // uses them) but repointed at the spec's brand blue, so the rename is just three values.
        primary: "#2563EB", // blue-600
        "primary-tint": "#EFF6FF", // blue-50
        "on-tint": "#1D4ED8", // blue-700
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          400: "#60A5FA",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
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
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
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
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "ring-brand": "0 0 0 3px rgba(37,99,235,0.12)",
        featured: "0 0 0 1.5px #2563EB, 0 4px 16px rgba(37,99,235,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
