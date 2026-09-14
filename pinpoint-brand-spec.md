# Pinpoint — Brand & Design System Specification
**Version 1.1 · September 2026**

*Updated to match the live app after a round of iterative visual feedback (nav colour/logo size, input field treatment, heading-copy sizing, citation-panel styling, citation font) — see `CLAUDE.md`'s "Post-hybrid iteration" note for the change-by-change reasoning. Sections below describe what's actually implemented, not the original v1.0 proposal where the two have since diverged.*

---

## 1. Brand Identity

### Logo — "Precision Mark"
Chosen from an 8-direction exploration (v1.0 shipped the two-tone `pin`/`point` split below; superseded here). One ink colour throughout — the two-tone split is dropped — with a small blue full stop standing in for "pin" and for the name's own meaning.
- **Wordmark:** `pinpoint.` — all lowercase, no separator between the words, a trailing full stop in the accent colour. No icon.
- **Text colour:** `#1C1C1A` (near black) — pure `#FFFFFF` on a dark/blue background
- **Full-stop accent:** `#2563EB` (rich blue) — `rgba(255,255,255,0.35)` (translucent white) on a dark/blue background
- **On-dark usage:** the nav bar (`bg-primary`, see NavBar below) renders the wordmark at `xl` size with `onDark` — this is the mark's primary real-world placement, not just a documented fallback state
- **Font:** Plus Jakarta Sans, weight 700
- **Letter spacing:** -0.03em
- **Optional underline rule:** a short bar in the accent colour beneath the mark, width ≈ 2.4em relative to the wordmark's own font size — a hero/marketing flourish only, never in compact contexts (nav bar, favicon)
- **Never:** italicise, outline, stretch, rotate, or add effects to the logo
- **Never:** use the logo smaller than 14px font size

### Logo implementation (JSX)
```jsx
// components/Logo.tsx
const SIZES = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl', xl: 'text-4xl' }

export default function Logo({ size = 'md', onDark = false, rule = false }) {
  const ink = onDark ? '#FFFFFF' : '#1C1C1A'
  const accent = onDark ? 'rgba(255,255,255,0.35)' : '#2563EB'
  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <span className={`font-sans font-bold ${SIZES[size]}`} style={{ letterSpacing: '-0.03em', color: ink }}>
        pinpoint<span style={{ color: accent, marginLeft: 1 }}>.</span>
      </span>
      {rule && (
        <span aria-hidden style={{ width: '2.4em', height: 3, borderRadius: 2, background: accent, display: 'block' }} />
      )}
    </span>
  )
}
```

### Superseded: v1.0 two-tone split
Kept for reference only — not in use.
- **"pin":** `#2563EB` (rich blue) — **"point":** `#1C1C1A` (near black), Plus Jakarta Sans weight 600, letter-spacing -0.5px, no full stop, no underline rule.

### Tagline
*AGLC4 citations, done correctly.*

### Favicon / app icon
- Square canvas, `#2563EB` background
- White lowercase `p` in Plus Jakarta Sans 700, centred
- Sizes: 16×16, 32×32, 180×180 (Apple touch), 512×512 (PWA)

---

## 2. Colour System

### Primary palette
| Token | Hex | Usage |
|-------|-----|-------|
| `blue-600` | `#2563EB` | Primary actions, logo "pin", links, focus rings |
| `blue-700` | `#1D4ED8` | Button hover states |
| `blue-50` | `#EFF6FF` | Light blue tint — badges, highlights, selected states |
| `blue-100` | `#DBEAFE` | Hover backgrounds on blue-tinted elements |
| `blue-200` | `#BFDBFE` | Borders on blue-tinted elements |
| `blue-400` | `#60A5FA` | Blue on dark backgrounds |

### Neutral palette
| Token | Hex | Usage |
|-------|-----|-------|
| `gray-950` | `#1C1C1A` | Logo "point", primary text, headings |
| `gray-900` | `#1A1A18` | Darkest text |
| `gray-600` | `#6B6B69` | Secondary text, nav links, labels |
| `gray-400` | `#AEADA9` | Tertiary text, placeholders, dividers |
| `gray-300` | `#CFCECA` | Disabled text |
| `gray-200` | `#E8E8E6` | Borders, dividers |
| `gray-100` | `#F3F3F1` | Hover backgrounds |
| `gray-50`  | `#FAFAF9` | Page background (warm white — not clinical) |
| `white`    | `#FFFFFF` | Card backgrounds, input backgrounds |

### Semantic colours
| Token | Hex | Usage |
|-------|-----|-------|
| `success-600` | `#059669` | Success states, verified badge text |
| `success-50`  | `#F0FDF4` | Success badge background |
| `success-200` | `#BBF7D0` | Success badge border |
| `warning-600` | `#D97706` | Warning states, low-confidence badge |
| `warning-50`  | `#FFFBEB` | Warning badge background |

*Exception: `amber-700` (`#B45309`, slightly darker than `warning-600`) is used instead in a few places — deliberately, for stronger contrast. On `amber-50`: `CitationOutput`'s "unsure"/low-confidence validation pill and "Corrected" pill. With no background at all (plain text directly on the page or a transparent form panel): `AutofillBar`'s extraction-warning notice and its error-state message.*
| `error-600`   | `#DC2626` | Error states |
| `error-50`    | `#FEF2F2` | Error badge background |

### Do not use
- Pure black `#000000` — use `#1C1C1A` instead
- Pure white `#FFFFFF` for page backgrounds — use `#FAFAF9`
- Any purple, violet, or teal — not part of this brand

---

## 3. Typography

### Font stack
```css
--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-citation: 'Times New Roman', Times, Georgia, ui-serif, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Only `--font-sans` is loaded as a webfont — Times New Roman is a system font (ships with both Windows and macOS), so citation output needs no `next/font` entry, no hosting, and no `variable` CSS var:
```js
import { Plus_Jakarta_Sans } from 'next/font/google'

export const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})
```

### Type scale
| Role | Size | Weight | Line height | Letter spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 48px | 700 | 1.1 | -2px | Hero headline only |
| H1 | 30px | 800 (extrabold) | 1.2 | -1px | Page titles — eg the generate screen's "AGLC4 Citation Generator" |
| H2 | 24px | 600 | 1.3 | -0.5px | Section headings |
| H3 | 18px | 600 | 1.4 | -0.3px | Card headings |
| H4 | 15px | 600 | 1.4 | 0 | Sub-section labels |
| Body lg | 16px | 400 | 1.7 | 0 | Marketing copy |
| Body | 14px | 400 | 1.6 | 0 | UI text, descriptions |
| Body sm | 13px | 400 | 1.55 | 0 | Secondary UI text |
| Label | 12px | 500 | 1.4 | 0 | Form labels, tags |
| Caption | 11px | 500 | 1.4 | +0.5px | Uppercase labels, timestamps |
| Micro | 10px | 600 | 1.3 | +0.6px | Badges, status pills (uppercase) |

### Citation output typography
All generated citation text uses `--font-citation` (Times New Roman, serif — a system font, not a webfont):
- Font size: 15px
- Line height: 1.8
- Italic via `<em>` tags for case names, legislation, treaties, journal names, book titles
- Never bold citation text
- The Copy button on each output panel writes both a plain-text and an HTML clipboard flavour (`ClipboardItem` with `text/plain` + `text/html`), so italics survive a paste into Word/Docs instead of coming through as flat text

---

## 4. Spacing & Layout

### Spacing scale (Tailwind tokens)
Use standard Tailwind spacing. Key values:
- `4px` (1) — icon gaps, tight padding
- `8px` (2) — small gaps between related elements
- `12px` (3) — inner card padding (compact)
- `16px` (4) — standard gap, inner padding
- `20px` (5) — card padding
- `24px` (6) — section inner padding
- `32px` (8) — section gaps
- `48px` (12) — large section spacing
- `64px` (16) — hero padding

### Border radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 8px | Buttons, inputs, small badges |
| `rounded-lg` | 10px | Small cards |
| `rounded-xl` | 14px | Main cards, panels |
| `rounded-2xl` | 16px | Large feature cards |
| `rounded-full` | 9999px | Pills, avatars, dot indicators |

### Shadows
| Name | Value | Usage |
|------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle card lift |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Cards, inputs on focus |
| `shadow-ring-blue` | `0 0 0 3px rgba(37,99,235,0.12)` | Focus ring on inputs |
| `shadow-featured` | `0 0 0 1.5px #2563EB, 0 4px 16px rgba(37,99,235,0.12)` | Featured pricing card |

---

## 5. Component Specifications

### NavBar
```
Background: #2563EB (primary blue) — not white
Padding: 16px 16px (mobile) / 24px (sm) / 32px (lg), max content width 1152px, centred
Logo: left-aligned, size "xl" (36px), onDark (white ink, translucent white full stop)
Nav links: right-aligned, gap 24px, font-size 16px (text-base), weight 500
  - Current: white (#FFFFFF)
  - Followable, not current: white/75%, hover white
  - "Coming soon" (Checker, Library — not yet built): white/40%, cursor not-allowed,
    dark tooltip ("Coming soon") on hover
No CTA button.
Mobile (below sm/640px): only the logo shows — the link list is `hidden sm:flex`. None of the
  four links are meaningfully usable one-handed at that width (two are inert placeholders), and
  showing them at the larger logo size reproduced a horizontal-overflow bug once already.
```

### Buttons
```
Primary:
  background: #2563EB
  color: #FFFFFF
  border: none
  border-radius: 8px
  padding: 9px 18px
  font-size: 14px
  font-weight: 600
  hover: background #1D4ED8
  active: background #1E40AF
  focus: box-shadow 0 0 0 3px rgba(37,99,235,0.25)
  disabled: opacity 0.4, cursor not-allowed

Secondary / Ghost:
  background: transparent
  color: #1C1C1A
  border: 1.5px solid #E8E8E6
  border-radius: 8px
  padding: 8px 16px
  font-size: 14px
  font-weight: 500
  hover: background #F3F3F1
  focus: border-color #2563EB

Destructive:
  background: #DC2626
  color: #FFFFFF
  (same sizing as Primary)
```

### Inputs & textareas
```
background: #FFFFFF
border: 1px solid #CFCECA (gray-300 — not gray-200; a visibly stronger border than most other
  card/divider borders in the app, deliberately, since this is what defines the field's edge)
border-radius: 8px (rounded-lg)
padding: 8px 12px (py-2 px-3)
font-size: 14px
color: #1C1C1A
placeholder color: #AEADA9
focus: border-color #2563EB (brand-600), box-shadow 0 0 0 3px rgba(37,99,235,0.12) (shadow-ring-brand)
error: border-color #DC2626
disabled: opacity 0.6 (no background change — the field already has no fill to lighten)
```
Applies to every text input, textarea, and `<select>` across the app — the 13 source-type forms, the AutofillBar's URL/paste fields, and the source-type dropdown all share one styling decision: **a white/unfilled field with a defined border does the work, not a grey fill.** A grey-fill treatment (`bg-gray-100`) was tried and rejected twice — it read as flat/murky since the form cards it sits inside are themselves transparent, sitting directly on the page's grey background, leaving the fill nothing to contrast against.

### Cards
```
Standard card:
  background: #FFFFFF
  border: 1.5px solid #E8E8E6
  border-radius: 14px
  padding: 20px 24px
  shadow: 0 1px 3px rgba(0,0,0,0.04)

Featured card (pricing):
  border: 1.5px solid #2563EB
  shadow: 0 0 0 1px #2563EB, 0 4px 16px rgba(37,99,235,0.1)

Subtle card (secondary content):
  background: #FAFAF9
  border: 1px solid #E8E8E6
  border-radius: 10px
  padding: 16px

Form panel (the actual container around each source type's fields, and the AutofillBar):
  background: transparent — no fill, sits directly on the page background
  border: 1px solid #E8E8E6
  border-radius: 14px
  padding: 24px (form panel) / 16px (AutofillBar)
  This is the most common card in the app and doesn't match either variant above — it's
  deliberately unfilled, which is also why the Inputs spec's border needs to be a visible
  gray-300 rather than a subtle gray-200: there's no white card underneath to lift a lighter
  border against.
```

### Badges & pills
```
Default pill:
  background: #FAFAF9
  border: 1px solid #E8E8E6
  color: #6B6B69
  border-radius: 9999px
  padding: 4px 12px
  font-size: 12px
  font-weight: 500

Blue pill (active/selected):
  background: #EFF6FF
  border: 1px solid #BFDBFE
  color: #2563EB

Success badge (AGLC4 verified):
  background: #F0FDF4
  border: 1px solid #BBF7D0
  color: #059669
  font-size: 11px
  font-weight: 600
  padding: 2px 8px
  border-radius: 9999px
  text: "AGLC4 verified ✓"

Warning badge (low confidence):
  background: #FFFBEB
  border: 1px solid #FDE68A
  color: #D97706
  text: "Please review"

Corrected badge:
  background: #EFF6FF
  border: 1px solid #BFDBFE
  color: #2563EB
  text: "Auto-corrected"
```

### Source type selector
```
A single <select> dropdown, not a button group — 11 options (Cases, Legislation, Journal Article,
  Book, Report, Conference/Research Paper/Thesis, Website, Newspaper, Other Legislative Material,
  International Material, Other Sources).
Styled identically to the Inputs & textareas spec above (white/border-gray-300, same focus ring) —
  one control the height of any other field, not a row of wrapped buttons.
Label: "Source type", text-sm font-medium text-gray-700, 4px below

Deliberately not a button group: with 11 source types (up from an original ~7), a wrapped button
  row took two lines above the form on every screen size. A dropdown carries the same selection
  contract (selected/onSelect) in a fraction of the vertical space.
```

### Citation output panels
```
Container (one per panel — Footnote citation / Subsequent reference / Bibliography entry):
  background: #FFFFFF
  border: 1px solid #CFCECA (gray-300) — matches the Inputs spec's border exactly, deliberately
  border-radius: 14px (rounded-xl)
  padding: 20px (p-5)

Header row:
  display: flex, justify-content: space-between, margin-bottom 12px
  label: "Footnote citation" etc, text-base (16px) font-medium #1A1A18
  rule reference below label: text-xs (12px) #AEADA9, eg "AGLC4 r 2.2"
  right side: "Copy" button — bordered ghost button, border-gray-200, text-gray-600;
    turns emerald-tinted (bg-emerald-50, border-emerald-200, text-emerald-600) with
    "Copied ✓" text for 1.5s after a successful copy
  No "Add to library" button — not implemented.

Citation text:
  font-family: Times New Roman, serif (a system font — see Typography)
  font-size: 15px
  line-height: 1.8
  color: #1C1C1A
  italic via <em> for legal names — formatItalics() renders both the on-page HTML and the
    text/html clipboard flavour written on Copy, so italics survive a paste into Word/Docs

Above the three panels — a status/badge row, not per-panel:
  Validating: spinner + "Verifying…", text-xs text-gray-400
  Validated, high confidence: emerald pill, "AGLC4 check passed ✓"
  Validated, medium/low confidence: amber pill (not emerald — a weaker claim than a full pass),
    "AGLC4 check passed · {confidence} confidence"
  Corrected: amber pill, "Corrected · {confidence} confidence"
  Unvalidated (AI check didn't run or failed): gray pill, "Not AGLC4-checked" — shown explicitly
    rather than rendering nothing, so "no badge" is never mistaken for "checked and fine"
  Optional source-verification badge (eg a CrossRef/AustLII match) alongside: primary-tint pill
Deterministic field-level warnings (missing core element, a substantive AGLC4 practice note) render
  as their own full-width amber notes below the badge row, above the panels — distinct from the
  validation badge, which is about the *formatted text's* correctness.
```

### AutofillBar
```
Container:
  background: transparent (no fill — sits directly on the page)
  border: 1px solid #E8E8E6
  border-radius: 14px (rounded-xl)
  padding: 16px

Header row: "Fill in details automatically" label (text-base font-medium #4A4A47) left,
  "Clear" text-button right (disabled/greyed until there's something to clear)

Two rows, no icon (no magnifying glass):
  Row 1 — URL/DOI: text input (styled per Inputs & textareas spec) + "Fill ↵" primary
    button, 88px fixed width, spinner + "Fill" while loading
  Row 2 — paste: 4-row textarea (same field styling) + "Extract" primary button, same
    88px width, to line up with row 1
  Beside both rows: a square "Upload PDF" drop target, bg-primary, 144×144px from sm up
    (full-width 56px bar below sm, stacked above the two rows) — accepts a dropped or
    clicked PDF; parsed entirely client-side, the file itself is never sent to the server

Below the rows — a persistent amber notice (not a transient state):
  "⚠ Automated extraction can get things wrong — always check the result against the
  actual source before relying on it." — text-sm font-medium text-amber-700

Transient states (replace each other, shown under the notice):
  Loading: "Reading page…" → "Extracting details…" (AI paths) or a source-specific message
    (eg "Fetching from AustLII…"), text-xs text-gray-500; a "Larger documents take a little
    longer — still working…" note appears after 4s on slow requests (PDFs especially)
  Success, high confidence: "Fields filled ✓", text-xs text-emerald-600, resets after 2s
  Success, low confidence: "Some fields filled — review them", same styling
  Error: message is specific to the failure (eg "That doesn't look like a URL or DOI —
    please paste a link or fill fields manually.", "Couldn't read this page — please fill
    manually."), text-xs text-amber-700
```

*(There is no separate in-page tab bar for the generator screen — the Generate/Checker/Library/Guide links live in the NavBar itself, spec'd above. The "Coming soon" tooltip treatment described there is the real implementation of what this section originally proposed as a standalone component.)*

---

## 6. Page Layout — Generator Screen

```
┌─────────────────────────────────────────────────┐
│  NavBar — blue background                       │
│  pinpoint. [xl, onDark]   Generate Checker       │
│                           Library Guide          │
├─────────────────────────────────────────────────┤
│  Page title + subtitle (H1 extrabold 30px)       │
├─────────────────────────────────────────────────┤
│  AutofillBar (full width, 16px padding)          │
├─────────────────────────────────────────────────┤
│  SourceTypeSelector — a <select> dropdown        │
├──────────────────────┬───────────────────────────┤
│                      │                           │
│  Form panel (left)   │  Output panel (right)     │
│  1.15fr              │  1fr                      │
│                      │  - Status/badge row       │
│  Dynamic fields      │  - Footnote citation      │
│  based on source     │  - Subsequent ref         │
│  type                │  - Bibliography entry     │
│                      │                           │
└──────────────────────┴───────────────────────────┘

lg (1024px) and up: two-column grid (grid-cols-1 lg:grid-cols-2), gap 32px (gap-8)
Below lg: single column, output stacks below form
Max content width: 1152px (max-w-6xl), centred — deliberately not widened on large monitors;
  a dense multi-field form scans worse stretched across an ultra-wide screen than capped
```

---

## 7. Tailwind Config

The config actually shipped diverges from an earlier draft of this section in one deliberate way: rather than introducing new `surface`/`ink`/`border` token namespaces, the `gray` scale itself is overridden wholesale to this spec's exact warm-neutral hexes. Every component already used plain `gray-*` Tailwind classes (`border-gray-200`, `text-gray-700`, `bg-gray-50`, …) — remapping the scale brings the whole existing UI onto the spec's palette without renaming classes across ~30 files. `primary`/`primary-tint`/`on-tint` are likewise kept (not renamed to `brand.600` everywhere) since components already reference them. This is the real, current file:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

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
        // Times New Roman is a system font (Windows/macOS ship it), not loaded via next/font.
        citation: ['"Times New Roman"', "Times", "Georgia", "ui-serif", "serif"],
        serif: ['"Times New Roman"', "Times", "Georgia", "ui-serif", "serif"],
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
```

---

## 8. Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #fafaf9;
  --foreground: #1c1c1a;
}

body {
  color: var(--foreground);
  background: var(--background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Citation output text — Times New Roman, applied via the `font-citation` Tailwind class in
   CitationOutput.tsx; this plain class exists for anywhere else that needs the same treatment. */
.citation-text {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 15px;
  line-height: 1.8;
  color: #1a1a18;
}

/* Uppercase section labels (rule references, panel captions). */
.label-caps {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #aeada9;
}
```

---

## 9. Accessibility

- All interactive elements must have visible focus states (blue ring)
- Minimum contrast ratio 4.5:1 for all body text
- `#2563EB` on `#FFFFFF` = 5.1:1 ✓
- `#1C1C1A` on `#FAFAF9` = 18.1:1 ✓
- `#6B6B69` on `#FFFFFF` = 5.74:1 ✓
- All icon-only buttons must have `aria-label`
- All form inputs must have associated `<label>` elements
- Citation output panels must have `role="region"` and `aria-label`

---

## 10. Do & Don't

**Do:**
- Use `#FAFAF9` for page backgrounds — never pure white
- Use Plus Jakarta Sans for all UI text
- Use Times New Roman for all citation output text (a system font — nothing to load or host)
- Keep the logo wordmark always lowercase
- Use the blue ring focus style consistently
- Leave clear breathing room between fields and sections — this *is* a dense, multi-field tool (11 source types, up to a dozen fields each), so spacing does the work of keeping it scannable rather than page width (see §6's max-width note)

**Don't:**
- Add drop shadows heavier than `shadow-card`
- Use gradients anywhere in the UI
- Use more than 2 font families in any single view
- Add animation to citation text (keep output instant-feeling)
- Use the logo at sizes smaller than 14px
- Use any colour outside the defined palette

---

*This spec is the source of truth for all visual decisions in Pinpoint.
When in doubt: simpler, more whitespace, less colour.*
