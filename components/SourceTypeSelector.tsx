'use client'

import { SourceType } from '@/lib/citation-engine/types'

const SOURCE_TYPES: { type: SourceType; label: string }[] = [
  { type: 'case', label: 'Cases' },
  { type: 'legislation', label: 'Legislation' },
  { type: 'journal', label: 'Journal Article' },
  { type: 'book', label: 'Book' },
  { type: 'report', label: 'Report' },
  { type: 'researchPaper', label: 'Conference/Research Paper/Thesis' },
  { type: 'website', label: 'Website' },
  { type: 'newspaper', label: 'Newspaper' },
  { type: 'otherLegislativeMaterial', label: 'Other Legislative Material' },
  { type: 'internationalMaterial', label: 'International Material' },
  { type: 'otherSources', label: 'Other Sources' },
]

interface SourceTypeSelectorProps {
  selected: SourceType
  onSelect: (type: SourceType) => void
}

// A single dropdown rather than 11 wrapped buttons — same selection contract (selected/onSelect),
// same list, just a lot less vertical space: the button row used to wrap to two lines above the
// form on every screen size, here it's one control the same height as any other field.
export default function SourceTypeSelector({ selected, onSelect }: SourceTypeSelectorProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">Source type</span>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value as SourceType)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
      >
        {SOURCE_TYPES.map((source) => (
          <option key={source.type} value={source.type}>
            {source.label}
          </option>
        ))}
      </select>
    </label>
  )
}
