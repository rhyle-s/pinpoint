import { CitationFields, SourceType } from '@/lib/citation-engine/types'

// Mirrors the `citations` table in supabase/schema.sql. Kept separate from citation-engine/types.ts
// deliberately — this is persistence shape, not citation-generation shape, even though it's built
// directly from a CitationResult + CitationFields.
export interface SavedCitation {
  id: string
  user_id: string
  source_type: SourceType
  fields: CitationFields
  footnote_text: string
  bibliography_text: string
  subsequent_text: string | null
  footnote_html: string | null
  bibliography_html: string | null
  label: string | null
  created_at: string
}

export interface SaveCitationPayload {
  sourceType: SourceType
  fields: CitationFields
  footnoteText: string
  bibliographyText: string
  subsequentText: string
  footnoteHtml: string
  bibliographyHtml: string
}

// Same labels SourceTypeSelector.tsx uses — duplicated rather than imported from there so the
// Library page's filter/pill rendering doesn't create a dependency on a form-selection component.
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  case: 'Cases',
  legislation: 'Legislation',
  journal: 'Journal Article',
  book: 'Book',
  report: 'Report',
  researchPaper: 'Conference/Research Paper/Thesis',
  website: 'Website',
  newspaper: 'Newspaper',
  otherLegislativeMaterial: 'Other Legislative Material',
  internationalMaterial: 'International Material',
  otherSources: 'Other Sources',
}

// Tailwind class pairs (bg/text) for the source-type pill on each library card — one per
// SourceType, not the fictional 8-category list from the original feature spec.
export const SOURCE_TYPE_PILL_CLASSES: Record<SourceType, string> = {
  case: 'bg-primary-tint text-primary',
  legislation: 'bg-emerald-50 text-emerald-700',
  journal: 'bg-purple-50 text-purple-700',
  book: 'bg-amber-50 text-amber-700',
  report: 'bg-orange-50 text-orange-700',
  researchPaper: 'bg-pink-50 text-pink-700',
  website: 'bg-gray-100 text-gray-600',
  newspaper: 'bg-gray-100 text-gray-600',
  otherLegislativeMaterial: 'bg-emerald-50 text-emerald-700',
  internationalMaterial: 'bg-teal-50 text-teal-700',
  otherSources: 'bg-gray-100 text-gray-600',
}
