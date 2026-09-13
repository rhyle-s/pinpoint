# Pinpoint — Brand & Design System Specification
**Version 1.0 · September 2026**

> **Superseded.** `pinpoint-brand-spec-v2.md` (LOCKED) is now the source of truth — white nav →
> blue nav, the two-tone logo → the single-ink "Precision Mark" `pinpoint.` wordmark, and several
> component-level values changed. Kept here for history; do not implement from this file.

---

## 1. Brand Identity

### Logo — "Precision Mark"
Chosen from an 8-direction exploration (v1.0 shipped the two-tone `pin`/`point` split below; superseded here). One ink colour throughout — the two-tone split is dropped — with a small blue full stop standing in for "pin" and for the name's own meaning.
- **Wordmark:** `pinpoint.` — all lowercase, no separator between the words, a trailing full stop in the accent colour. No icon.
- **Text colour:** `#1C1C1A` (near black) — `#F1F5FF` on a dark/blue background
- **Full-stop accent:** `#2563EB` (rich blue) — `#93C5FD` on a dark/blue background
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
  const ink = onDark ? '#F1F5FF' : '#1C1C1A'
  const accent = onDark ? '#93C5FD' : '#2563EB'
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
--font-citation: 'Crimson Pro', Georgia, 'Times New Roman', serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Install via `next/font/google`:
```js
import { Plus_Jakarta_Sans, Crimson_Pro } from 'next/font/google'

export const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-citation',
})
```

### Type scale
| Role | Size | Weight | Line height | Letter spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 48px | 700 | 1.1 | -2px | Hero headline only |
| H1 | 32px | 700 | 1.2 | -1px | Page titles |
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
All generated citation text uses `--font-citation` (Crimson Pro, serif):
- Font size: 15px
- Line height: 1.8
- Italic via `<em>` tags for case names, legislation, treaties, journal names, book titles
- Never bold citation text

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
Height: 56px
Background: #FFFFFF
Border bottom: 1px solid #E8E8E6
Padding: 0 32px (desktop), 0 16px (mobile)
Logo: left-aligned
Nav links: right-aligned, gap 24px, font-size 14px, color #6B6B69, weight 500
CTA button: rightmost
Mobile: hamburger menu below 768px
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
border: 1.5px solid #E8E8E6
border-radius: 8px
padding: 10px 14px
font-size: 14px
color: #1C1C1A
placeholder color: #AEADA9
focus: border-color #2563EB, box-shadow 0 0 0 3px rgba(37,99,235,0.12)
error: border-color #DC2626
disabled: background #FAFAF9, opacity 0.6
```

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
Button group, 7 buttons (Cases / Legislation / Journal Article / Book / Report / Website / Treaty)
Default state:
  background: #FFFFFF
  border: 1.5px solid #E8E8E6
  color: #6B6B69
  border-radius: 8px
  padding: 8px 14px
  font-size: 13px
  font-weight: 500

Active/selected state:
  background: #EFF6FF
  border: 1.5px solid #2563EB
  color: #2563EB
  font-weight: 600

Hover (unselected):
  background: #F3F3F1
```

### Citation output panels
```
Container:
  background: #FFFFFF
  border: 1.5px solid #E8E8E6
  border-radius: 12px
  padding: 16px 20px

Label row:
  display: flex, justify-content: space-between
  label font: 10px, uppercase, #AEADA9, letter-spacing 0.6px
  right side: validation badge

Citation text:
  font-family: Crimson Pro, serif
  font-size: 15px
  line-height: 1.8
  color: #1C1C1A
  italic via <em> for legal names

Action row (below citation):
  gap: 8px, margin-top: 12px
  "Copy" = primary button (small)
  "Add to library" = ghost button (small)

Loading state:
  Pulse animation on citation text
  "Verifying…" in #AEADA9, 12px

Rule reference:
  10px, #AEADA9, right-aligned in label row
  eg "AGLC4 r 2.2"
```

### AutofillBar
```
Container:
  background: #FFFFFF
  border: 1.5px solid #E8E8E6
  border-radius: 10px
  padding: 12px 16px
  display: flex, gap: 10px, align-items: center

Icon: magnifying glass, 16px, #AEADA9
Input: flex: 1, no border, no background, font-size 14px, placeholder #AEADA9
Button: "Fill →" primary button, padding 8px 14px

States:
  Loading: spinner + "Fetching…" in #AEADA9
  Success: "Fields filled ✓" in #059669, 2s then reset
  Partial: "Some fields filled — please review" in #D97706
  Error: "Couldn't read this source — fill manually" in #DC2626
```

### Tab navigation (Generator tabs)
```
Tab bar:
  background: #FFFFFF
  border-bottom: 1px solid #E8E8E6
  padding: 0 24px

Tab item:
  font-size: 14px
  font-weight: 500
  color: #6B6B69
  padding: 12px 16px
  border-bottom: 2px solid transparent
  cursor: pointer

Active tab:
  color: #2563EB
  border-bottom: 2px solid #2563EB
  font-weight: 600

Coming soon tab:
  color: #CFCECA
  cursor: default
  tooltip on hover: "Coming soon"
```

---

## 6. Page Layout — Generator Screen

```
┌─────────────────────────────────────────────────┐
│  NavBar (56px)                                  │
├─────────────────────────────────────────────────┤
│  Tab bar: Generate / Checker / Library / Guide  │
├─────────────────────────────────────────────────┤
│  AutofillBar (full width, 16px padding)         │
├─────────────────────────────────────────────────┤
│  SourceTypeSelector (7 buttons)                 │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│  Form panel (left)   │  Output panel (right)    │
│  flex: 1             │  flex: 1                 │
│                      │  - Footnote citation     │
│  Dynamic fields      │  - Subsequent ref        │
│  based on source     │  - Bibliography          │
│  type                │  - Rule note             │
│                      │                          │
└──────────────────────┴──────────────────────────┘

Desktop: two-column grid, gap 24px, padding 24px
Mobile: single column, output below form
Max content width: 1100px, centred
```

---

## 7. Tailwind Config

```js
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        citation: ['var(--font-citation)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#60A5FA',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        surface: {
          page:  '#FAFAF9',
          card:  '#FFFFFF',
          subtle: '#F3F3F1',
        },
        ink: {
          primary:   '#1C1C1A',
          secondary: '#6B6B69',
          tertiary:  '#AEADA9',
          disabled:  '#CFCECA',
        },
        border: {
          DEFAULT: '#E8E8E6',
          strong:  '#CFCECA',
          brand:   '#2563EB',
        },
      },
      borderRadius: {
        '4': '4px',
        DEFAULT: '8px',
        'lg': '10px',
        'xl': '14px',
        '2xl': '16px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06)',
        'ring-brand': '0 0 0 3px rgba(37,99,235,0.12)',
        'featured': '0 0 0 1.5px #2563EB, 0 4px 16px rgba(37,99,235,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 8. Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #FAFAF9;
    color: #1C1C1A;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    border-color: #E8E8E6;
  }

  /* Citation text rendered with serif font */
  .citation-text {
    font-family: var(--font-citation);
    font-size: 15px;
    line-height: 1.8;
    color: #1C1C1A;
  }

  /* Uppercase section labels */
  .label-caps {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #AEADA9;
  }
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
- Use Crimson Pro for all citation output text
- Keep the logo wordmark always lowercase
- Use the blue ring focus style consistently
- Leave generous whitespace — this is not a dense tool

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
