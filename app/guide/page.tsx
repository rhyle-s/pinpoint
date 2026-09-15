import type { Metadata } from 'next'
import GuideNav from '@/components/GuideNav'
import GuideSection from '@/components/GuideSection'
import { GUIDE_ENTRIES } from '@/lib/guide-content'

export const metadata: Metadata = {
  title: 'AGLC4 Guide — Pinpoint',
  description: `Format templates, worked examples, and key rules for all ${GUIDE_ENTRIES.length} AGLC4 source types.`,
}

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl mx-auto text-center">
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-primary">AGLC4 · 4th edition</span>
        <h1
          className="mt-3 text-[2.25rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[2.5rem]"
          style={{ textWrap: 'balance' }}
        >
          AGLC4 Guide
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          Format templates, worked examples, and the rules students get wrong most often — for all{' '}
          {GUIDE_ENTRIES.length} source types.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <GuideNav />
        <div className="space-y-10">
          {GUIDE_ENTRIES.map((entry) => (
            <GuideSection key={entry.sourceType} entry={entry} />
          ))}
        </div>
      </div>
    </main>
  )
}
