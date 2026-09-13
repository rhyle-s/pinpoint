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

// Brand & Design System v2.0 (LOCKED) §6 "Source type pills" — a wrapped row of pill buttons,
// same selected/onSelect contract as before. This reverts an earlier change to a single <select>
// (made purely to save the vertical space 11 wrapped buttons cost); the spec explicitly wants the
// pill treatment back, with flex-wrap already accounted for.
export default function SourceTypeSelector({ selected, onSelect }: SourceTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Source type">
      {SOURCE_TYPES.map((source) => {
        const isActive = source.type === selected
        return (
          <button
            key={source.type}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(source.type)}
            className={`rounded-md border px-3.5 py-[7px] text-[13px] transition-colors ${
              isActive
                ? 'border-brand-600 bg-primary-tint font-semibold text-primary'
                : 'border-gray-200 bg-white font-medium text-gray-600 hover:bg-gray-100'
            }`}
          >
            {source.label}
          </button>
        )
      })}
    </div>
  )
}
