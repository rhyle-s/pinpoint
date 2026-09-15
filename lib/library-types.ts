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
  // Free-text grouping (eg an assessment name) — the `label` column already existed in the schema
  // reserved for this, unused until now. Optional: citations saved before this feature, or without
  // one entered, have label null and show up under "Uncategorised" in the Library page.
  label?: string | null
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

// Sentinel value for "citations with no collection assigned" — used as a ?collection= query value
// (can't express "label IS NULL" as a literal label string) and as the matching <select> option
// value in LibraryClient's collection filter, so both sides agree on the same string.
export const UNCATEGORISED_COLLECTION = '__uncategorised__'

// Tailwind class pairs (bg/text) for the source-type pill on each library card — one per
// SourceType, not the fictional 8-category list from the original feature spec.
export const SOURCE_TYPE_PILL_CLASSES: Record<SourceType, string> = {
  // Not blue — the library table's collection-tag pill (next to the citation, when it belongs to
  // one) uses bg-primary-tint/text-primary, so Cases needed its own colour to stay distinguishable
  // from that rather than the two blue pills sitting side by side on the same row. Rose rather than
  // a blue-adjacent hue (indigo/sky/teal) or purple-adjacent one (already Journal Article's colour)
  // — stays clearly distinct from both at a glance, not just technically a different shade.
  case: 'bg-rose-50 text-rose-700',
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

// Same colour family as SOURCE_TYPE_PILL_CLASSES above, just as a left-border accent (border-l-*-400)
// for the Library table's rows — a second, lower-key use of the same per-type colour language rather
// than a separate palette.
export const SOURCE_TYPE_ACCENT_CLASSES: Record<SourceType, string> = {
  case: 'border-l-rose-400',
  legislation: 'border-l-emerald-400',
  journal: 'border-l-purple-400',
  book: 'border-l-amber-400',
  report: 'border-l-orange-400',
  researchPaper: 'border-l-pink-400',
  website: 'border-l-gray-300',
  newspaper: 'border-l-gray-300',
  otherLegislativeMaterial: 'border-l-emerald-400',
  internationalMaterial: 'border-l-teal-400',
  otherSources: 'border-l-gray-300',
}
