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
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-7 sm:py-9">
      <div className="mb-6">
        <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.8px] text-gray-900">AGLC4 guide</h1>
        <p className="max-w-[540px] text-sm leading-[1.65] text-gray-600">
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
