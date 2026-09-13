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
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">AGLC4 guide</h1>
        <p className="mt-1 text-sm text-gray-500">
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
