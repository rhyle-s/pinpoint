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
    <main className="mx-auto max-w-[1100px] px-4 py-5 sm:px-7 sm:py-9">
      <div className="mb-6">
        <h1 className="mb-2 text-[28px] font-extrabold tracking-[-0.8px] text-gray-900">Citation generator</h1>
        <p className="max-w-[540px] text-sm leading-[1.65] text-gray-600">
          Choose a source type and add the details — by hand, or autofilled from a link, DOI, citation, or PDF —
          then copy the footnote citation, subsequent reference, and bibliography entry.
        </p>
      </div>
      <Generator initialSourceType={initialSourceType} />
    </main>
  )
}
