'use client'

import { SourceType } from '@/lib/citation-engine/types'
import { SOURCE_TYPE_LABELS } from '@/lib/library-types'

// One small icon per SourceType, purely decorative (approximate glyphs, not pixel-perfect
// iconography) — same 24-viewBox/strokeWidth-2 line-icon convention already used throughout
// LibraryClient.tsx's inline icon components.
const SOURCE_TYPE_ICONS: Record<SourceType, React.ReactNode> = {
  case: (
    <path d="M12 2v20M4 7h16M4 7l3 6a3 3 0 1 1-6 0l3-6zm16 0l3 6a3 3 0 1 1-6 0l3-6z" />
  ),
  legislation: (
    <>
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v5h5" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  journal: (
    <>
      <path d="M12 6c-2-1.5-5-2-8-1v13c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1z" />
      <path d="M12 6v13" />
    </>
  ),
  book: (
    <>
      <path d="M5 3h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V3z" />
      <path d="M5 17h13" />
    </>
  ),
  report: (
    <>
      <path d="M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1z" />
      <path d="M9 12h6M9 16h6M9 8h6" />
    </>
  ),
  researchPaper: <path d="M3 4h18M12 4v13M7 21l5-4 5 4M7 12l2-2 2 2 4-4" />,
  website: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
    </>
  ),
  newspaper: (
    <>
      <path d="M4 5h12a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
      <path d="M17 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2" />
      <path d="M7 9h6M7 12h6M7 15h3" />
    </>
  ),
  otherLegislativeMaterial: (
    <>
      <path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v4h4" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  internationalMaterial: <path d="M5 3v18M5 4h13l-3 4 3 4H5" />,
  otherSources: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
}

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

// Icon tiles rather than a dropdown — this file previously switched *to* a dropdown specifically to
// save vertical space (see the git history for that reasoning), but the new page layout has the
// room for it and the student can see every option at a glance instead of opening a list.
export default function SourceTypeSelector({ selected, onSelect }: SourceTypeSelectorProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-gray-900">Source type</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {SOURCE_TYPE_ORDER.map((type) => {
          const isSelected = type === selected
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
                isSelected
                  ? 'border-brand-600 bg-primary-tint shadow-ring-brand'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isSelected ? 'text-primary' : 'text-gray-400'}
              >
                {SOURCE_TYPE_ICONS[type]}
              </svg>
              <span className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                {SOURCE_TYPE_LABELS[type]}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
