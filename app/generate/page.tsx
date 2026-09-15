import Generator from '@/components/Generator'
import { SourceType } from '@/lib/citation-engine/types'

const VALID_SOURCE_TYPES: SourceType[] = [
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

function isSourceType(value: string | string[] | undefined): value is SourceType {
  return typeof value === 'string' && (VALID_SOURCE_TYPES as string[]).includes(value)
}

export default function GeneratePage({ searchParams }: { searchParams: { type?: string | string[] } }) {
  const initialSourceType = isSourceType(searchParams.type) ? searchParams.type : undefined

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-2xl">
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-primary">AGLC4 · 4th edition</span>
        <h1 className="mt-3 text-[2.25rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[2.5rem]" style={{ textWrap: 'balance' }}>
          Citation Generator
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          Choose a source type and add the details — by hand, or autofilled from a link, DOI, citation, or PDF —
          then copy the footnote citation, subsequent reference, and bibliography entry.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-tint text-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
              </svg>
            </span>
            <span className="text-[13.5px] font-medium text-gray-600">Autofill from link, text or PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-tint text-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="text-[13.5px] font-medium text-gray-600">Rule-checked against AGLC4</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-tint text-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
              </svg>
            </span>
            <span className="text-[13.5px] font-medium text-gray-600">Saves to your own library</span>
          </div>
        </div>
      </div>
      <Generator initialSourceType={initialSourceType} />
    </main>
  )
}
