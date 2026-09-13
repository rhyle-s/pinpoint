# Pinpoint — Brand & Design System Specification
**Version 2.0 · September 2026 · LOCKED**

---

## 1. Wordmark

### Primary wordmark (on blue nav)
- **Text:** `pinpoint.` — all lowercase, trailing dot
- **"pinpoint":** `#FFFFFF` (pure white)
- **".":** `rgba(255,255,255,0.35)` (faint white — subtle, not invisible)
- **Font:** Plus Jakarta Sans, weight 700
- **Letter spacing:** -0.5px
- **Never** split colours on the blue nav — always full white wordmark

### Black version (for light backgrounds)
- **"pinpoint":** `#1C1C1A` (near black)
- **".":** `#2563EB` (brand blue)
- **Font:** Plus Jakarta Sans, weight 700
- **Letter spacing:** -0.5px
- Use this version on white/light grey backgrounds only

### Logo component (`components/Logo.tsx`)
```tsx
type LogoVariant = 'white' | 'black'

export function Logo({
  variant = 'white',
  size = 'md'
}: {
  variant?: LogoVariant
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = { sm: '14px', md: '20px', lg: '28px' }
  const styles = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    fontSize: sizes[size],
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'baseline',
  }
  if (variant === 'white') {
    return (
      <span style={styles}>
        <span style={{ color: '#FFFFFF' }}>pinpoint</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>.</span>
      </span>
    )
  }
  return (
    <span style={styles}>
      <span style={{ color: '#1C1C1A' }}>pinpoint</span>
      <span style={{ color: '#2563EB' }}>.</span>
    </span>
  )
}
```

### When to use each variant
| Context | Variant |
|---------|---------|
| Blue nav bar (#2563EB) | `white` |
| White / light grey backgrounds | `black` |
| Dark backgrounds (#0F172A etc) | `white` |
| Printed materials, PDFs | `black` |
| Email headers on white | `black` |
| Favicon / app icon | Blue square, white "p" |

### Favicon / app icon
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#2563EB"/>
  <text x="16" y="23" text-anchor="middle"
    font-family="system-ui,sans-serif"
    font-size="20" font-weight="700" fill="white">p</text>
</svg>
```
Save as `app/icon.svg`.

### Tagline
*AGLC4 citations, done correctly.*

---

## 2. Page Layout

**Structure:** Blue nav + warm white body. This is the locked layout.

```
┌─────────────────────────────────┐
│  Blue nav #2563EB    56px       │  ← Logo (white), nav links (white/faint), CTA
├─────────────────────────────────┤
│                                 │
│  Warm white body #FAFAF9        │  ← All content lives here
│                                 │
└─────────────────────────────────┘
```

---

## 3. Colour System

### Core
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-600` | `#2563EB` | Nav background, primary buttons, links, active states |
| `brand-700` | `#1D4ED8` | Button hover, darker blue accents |
| `brand-50`  | `#EFF6FF` | Light blue tint — badges, selected pills |
| `brand-200` | `#BFDBFE` | Blue borders, badge borders |
| `brand-400` | `#60A5FA` | Blue on dark backgrounds |

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `ink-primary`   | `#1C1C1A` | Body text, headings, black logo |
| `ink-secondary` | `#6B6B69` | Secondary text, nav links on light bg |
| `ink-tertiary`  | `#AEADA9` | Placeholders, field labels, captions |
| `ink-disabled`  | `#CFCECA` | Disabled text, coming-soon links |
| `surface-page`  | `#FAFAF9` | Page background |
| `surface-card`  | `#FFFFFF` | Cards, panels, inputs |
| `surface-subtle`| `#F3F3F1` | Input backgrounds, hover states |
| `border`        | `#E8E8E6` | All borders |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `success-600` | `#059669` | AGLC4 verified badge text |
| `success-50`  | `#F0FDF4` | Verified badge background |
| `success-200` | `#BBF7D0` | Verified badge border |
| `warning-600` | `#D97706` | Low confidence, autofill warning |
| `warning-50`  | `#FFFBEB` | Warning background |
| `error-600`   | `#DC2626` | Error states |
| `error-50`    | `#FEF2F2` | Error background |

---

## 4. Typography

### Fonts
```js
// app/layout.tsx
import { Plus_Jakarta_Sans, Crimson_Pro } from 'next/font/google'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-citation',
})
```

### Scale
| Role | Size | Weight | Usage |
|------|------|--------|-------|
| H1 | 28–32px | 800 | Page titles (Citation generator) |
| H2 | 22px | 700 | Section headings |
| H3 | 16px | 600 | Card headings |
| Body | 14px | 400 | UI text, descriptions |
| Label | 13px | 500 | Form labels |
| Caption | 9–10px | 700 | Uppercase field labels (CASE NAME) |
| Citation | 15px | 400 | All citation output — Crimson Pro serif |

### Citation output
```css
.citation-text {
  font-family: var(--font-citation); /* Crimson Pro */
  font-size: 15px;
  line-height: 1.8;
  color: #1C1C1A;
}
```
Italic case names, legislation, treaties, book titles, journal names via `<em>` tags.

---

## 5. Nav Bar

```
Height: 56px
Background: #2563EB
Padding: 0 28px
Logo: <Logo variant="white" size="md" /> — left aligned
Nav links: right side, gap 24px
  - Active link: color #FFFFFF, font-weight 700
  - Inactive links: color rgba(255,255,255,0.75), font-weight 500
  - Coming soon (Checker, Library if not built): color rgba(255,255,255,0.4), cursor default
CTA button "Get started": background rgba(255,255,255,0.15), color #fff,
  border-radius 8px, padding 7px 16px, font-weight 600
```

---

## 6. Component Specs

### Buttons
```
Primary:
  bg: #2563EB · color: #fff · border-radius: 8px
  padding: 9px 18px · font-size: 14px · font-weight: 600
  hover: bg #1D4ED8
  focus: box-shadow 0 0 0 3px rgba(37,99,235,0.25)

Ghost / Secondary:
  bg: transparent · color: #1C1C1A
  border: 1.5px solid #E8E8E6 · border-radius: 8px
  padding: 8px 16px · font-weight: 500
  hover: bg #F3F3F1
```

### Inputs
```
bg: #FFFFFF (or #F3F3F1 for subtle inputs)
border: 1.5px solid #E8E8E6 · border-radius: 8px
padding: 9px 12px · font-size: 13–14px
color: #1C1C1A · placeholder: #AEADA9
focus: border-color #2563EB, box-shadow 0 0 0 3px rgba(37,99,235,0.12)
```

### Cards / Panels
```
bg: #FFFFFF · border: 1.5px solid #E8E8E6
border-radius: 10–14px · padding: 18–24px
shadow: 0 1px 3px rgba(0,0,0,0.04)
```

### Citation output panels
```
bg: #FFFFFF · border: 1.5px solid #E8E8E6 · border-radius: 10px
padding: 16px 20px
Field label (FOOTNOTE CITATION): 9px, 700 weight, uppercase, #AEADA9, letter-spacing 0.7px
Rule ref (AGLC4 r 2.2): 10px, #AEADA9
Citation text: Crimson Pro, 15px, line-height 1.8, color #1C1C1A
Divider between sections: 1px solid #E8E8E6
```

### AGLC4 verified badge
```
bg: #EFF6FF · color: #2563EB · border: none
font-size: 12px · font-weight: 700
padding: 4px 10px · border-radius: 100px
text: "✓ AGLC4 check passed"
```

### Source type pills (active/inactive)
```
Default: bg #FFFFFF, border 1.5px solid #E8E8E6, color #6B6B69
Active: bg #EFF6FF, border 1.5px solid #2563EB, color #2563EB, font-weight 600
Hover (inactive): bg #F3F3F1
```

### AutofillBar
```
bg: #FFFFFF · border: 1.5px solid #E8E8E6 · border-radius: 10px
padding: 14px 16px
Input: bg #F3F3F1, no border, font-size 13px, placeholder color #AEADA9
Fill button: primary button style
Extract button: bg #1D4ED8 (slightly darker than Fill)
Warning text: 11px, color #D97706
```

---

## 7. Tailwind Config

```js
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      citation: ['var(--font-citation)', 'Georgia', 'serif'],
    },
    colors: {
      brand: {
        50:  '#EFF6FF',
        200: '#BFDBFE',
        400: '#60A5FA',
        600: '#2563EB',
        700: '#1D4ED8',
      },
      surface: {
        page:   '#FAFAF9',
        card:   '#FFFFFF',
        subtle: '#F3F3F1',
      },
      ink: {
        primary:   '#1C1C1A',
        secondary: '#6B6B69',
        tertiary:  '#AEADA9',
        disabled:  '#CFCECA',
      },
      border: { DEFAULT: '#E8E8E6' },
    },
    boxShadow: {
      'card':       '0 1px 3px rgba(0,0,0,0.04)',
      'ring-brand': '0 0 0 3px rgba(37,99,235,0.12)',
    },
  },
}
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
  }
  * { border-color: #E8E8E6; }
  .citation-text {
    font-family: var(--font-citation);
    font-size: 15px;
    line-height: 1.8;
    color: #1C1C1A;
  }
  .label-caps {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #AEADA9;
  }
}
```

---

## 9. Rules

**Do:**
- Blue nav always has white wordmark (`variant="white"`)
- Light/white backgrounds always use black wordmark (`variant="black"`)
- Page background is always `#FAFAF9` — never pure white
- Citation text is always Crimson Pro serif
- Buttons always use `#2563EB` as primary blue

**Don't:**
- Split the wordmark colours on the blue nav
- Use gradients anywhere
- Use pure black `#000000` (use `#1C1C1A`)
- Use pure white `#FFFFFF` for page backgrounds
- Add heavy drop shadows
- Use any purple, teal, or other accent colours

---

*Source of truth for all Pinpoint visual decisions.
When in doubt: simpler, more whitespace, less colour.*
