import type { Metadata } from 'next'
import { Crimson_Pro, Plus_Jakarta_Sans } from 'next/font/google'
import NavBar from '@/components/NavBar'
import './globals.css'

// Pinpoint Brand & Design System v2.0 (LOCKED — pinpoint-brand-spec-v2.md): Plus Jakarta Sans for
// all UI text, Crimson Pro (serif) for generated citation output only — see the `.citation-text`
// class / `font-citation` Tailwind utility in CitationOutput.tsx.
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

export const metadata: Metadata = {
  title: 'Pinpoint — AGLC4 Citation Generator',
  description: 'AGLC4 citations, done correctly. A free citation generator for Australian law students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakartaSans.variable} ${crimsonPro.variable}`}>
      {/* Page background is the spec's warm surface-page (#FAFAF9), not pure white — cards
          (surface-card / bg-white) sit on top of it, per the brand spec's "never pure white for
          page backgrounds" rule. Also set directly on `body` in globals.css per the spec's own
          Step 3, so it's correct even before Tailwind's utilities apply. */}
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
