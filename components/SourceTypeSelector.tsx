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
  { type: 'treaty', label: 'Treaty' },
]

interface SourceTypeSelectorProps {
  selected: SourceType
  onSelect: (type: SourceType) => void
}

export default function SourceTypeSelector({ selected, onSelect }: SourceTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOURCE_TYPES.map((source) => {
        const isSelected = source.type === selected

        return (
          <button
            key={source.type}
            type="button"
            onClick={() => onSelect(source.type)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-primary bg-primary-tint text-primary'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {source.label}
          </button>
        )
      })}
    </div>
  )
}
