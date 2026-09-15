import type { Metadata } from 'next'
import Link from 'next/link'
import GuideNav from '@/components/GuideNav'
import GuideSection from '@/components/GuideSection'
import { GUIDE_ENTRIES } from '@/lib/guide-content'

export const metadata: Metadata = {
  title: 'AGLC4 Guide — Pinpoint',
  description: `Format templates, worked examples, and key rules for all ${GUIDE_ENTRIES.length} AGLC4 source types.`,
}

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr_240px]">
        <GuideNav />
        <div className="space-y-10">
          {GUIDE_ENTRIES.map((entry) => (
            <GuideSection key={entry.sourceType} entry={entry} />
          ))}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick actions</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Every format on this page is checked automatically when you generate or check a citation.
            </p>
            <div className="space-y-2">
              <Link
                href="/generate"
                className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Open the Generator →
              </Link>
              <Link
                href="/checker"
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400"
              >
                Check a citation →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
