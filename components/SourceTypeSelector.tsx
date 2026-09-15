'use client'

import { SourceType } from '@/lib/citation-engine/types'
import { SOURCE_TYPE_LABELS } from '@/lib/library-types'

const SOURCE_TYPE_ORDER: SourceType[] = [
  'case',
  'legislation',
  'journal',
  'book',
  'report',
  'researchPaper',
  'website',
  'newspaper',
  'otherLegislativeMaterial',
  'internationalMaterial',
  'otherSources',
]

interface SourceTypeSelectorProps {
  selected: SourceType
  onSelect: (type: SourceType) => void
}

// Back to a dropdown (the icon-tile grid tried in the redesign round was reverted at the user's
// request) — kept in its own card shell at the same width as before, so it still lines up with the
// AGLC4-check-passed column on the right the same way the tile grid did.
export default function SourceTypeSelector({ selected, onSelect }: SourceTypeSelectorProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <label className="block">
        <span className="mb-2 block text-[13px] font-bold uppercase tracking-wide text-gray-900">Source type</span>
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value as SourceType)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-brand-600 focus:shadow-ring-brand"
        >
          {SOURCE_TYPE_ORDER.map((type) => (
            <option key={type} value={type}>
              {SOURCE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
