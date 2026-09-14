import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import NavBar from '@/components/NavBar'
import './globals.css'

// Pinpoint Brand & Design System v1.0: Plus Jakarta Sans for all UI text. Generated citation
// output uses Times New Roman — a system font, not loaded here — see the `.citation-text` class /
// `font-citation` Tailwind utility in CitationOutput.tsx.
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Pinpoint — AGLC4 Citation Generator',
  description: 'AGLC4 citations, done correctly. A free citation generator for Australian law students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Page background is the spec's warm gray-50 (#FAFAF9), not pure white — cards (bg-white)
          sit on top of it, per the brand spec's "never pure white for page backgrounds" rule. */}
      <body className={`${jakartaSans.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
