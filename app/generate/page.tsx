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
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">Citation generator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a source type and add the details — by hand, or autofilled from a link, DOI, citation, or PDF —
          then copy the footnote citation, subsequent reference, and bibliography entry.
        </p>
      </div>
      <Generator initialSourceType={initialSourceType} />
    </main>
  )
}
