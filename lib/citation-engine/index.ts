import { generateCaseCitation } from './cases'
import { generateLegislationCitation } from './legislation'
import { generateJournalCitation } from './journal-articles'
import { generateBookCitation } from './books'
import { generateReportCitation } from './reports'
import { generateResearchPaperCitation } from './research-papers'
import { generateWebsiteCitation } from './websites'
import { generateNewspaperCitation } from './newspapers'
import { generateOtherLegislativeMaterialCitation } from './other-legislative-material'
import { generateInternationalMaterialCitation } from './international-material'
import { generateOtherSourcesCitation } from './other-sources'
import { getConferencePaperDateWarning, getMissingFieldsWarning, getUnreportedCaseWarning } from './warnings'
import {
  BookFields,
  CaseFields,
  CitationFields,
  CitationResult,
  InternationalMaterialFields,
  JournalFields,
  LegislationFields,
  NewspaperFields,
  OtherLegislativeMaterialFields,
  OtherSourcesFields,
  ReportFields,
  ResearchPaperFields,
  SourceType,
  WebsiteFields,
} from './types'

/**
 * Deterministic rules-engine citation, synchronous and free of any server-only dependency —
 * safe to call from client components for instant preview.
 */
export function generateCitationSync(sourceType: SourceType, fields: CitationFields): CitationResult {
  const result = (() => {
    switch (sourceType) {
      case 'case':
        return generateCaseCitation(fields as CaseFields)
      case 'legislation':
        return generateLegislationCitation(fields as LegislationFields)
      case 'journal':
        return generateJournalCitation(fields as JournalFields)
      case 'book':
        return generateBookCitation(fields as BookFields)
      case 'report':
        return generateReportCitation(fields as ReportFields)
      case 'researchPaper':
        return generateResearchPaperCitation(fields as ResearchPaperFields)
      case 'website':
        return generateWebsiteCitation(fields as WebsiteFields)
      case 'newspaper':
        return generateNewspaperCitation(fields as NewspaperFields)
      case 'otherLegislativeMaterial':
        return generateOtherLegislativeMaterialCitation(fields as OtherLegislativeMaterialFields)
      case 'internationalMaterial':
        return generateInternationalMaterialCitation(fields as InternationalMaterialFields)
      case 'otherSources':
        return generateOtherSourcesCitation(fields as OtherSourcesFields)
      default:
        throw new Error(`Citation generation for source type "${sourceType}" is not yet supported.`)
    }
  })()

  // Deterministic, field-level warnings — computed once here rather than inside each of the 11
  // formatter files above, since neither check needs anything formatter-specific (they look at
  // `fields` directly, not the formatted text), and centralising them means a new warning only
  // ever needs adding in one place.
  const warnings = [
    getMissingFieldsWarning(sourceType, fields),
    getUnreportedCaseWarning(sourceType, fields),
    getConferencePaperDateWarning(sourceType, fields),
  ].filter((w): w is string => w !== undefined)

  return warnings.length > 0 ? { ...result, warnings } : result
}

// Quote-wrapping in the engine files already inserts the outer curly quotes directly, but a
// title can itself contain a nested straight-quoted phrase (eg "...inside the 'black box'"),
// so a blind replace can't just use the closing mark everywhere — a straight quote opening a
// phrase (preceded by whitespace/start/an opening bracket or quote, followed by a non-space
// character) becomes the left mark; every other straight quote (mid-word contractions like
// "Snoswell's", trailing possessives, and closing quotes) becomes the right mark.
function applyTypographicApostrophes(text: string): string {
  const withOpeningQuotes = text.replace(/(^|[\s(["‘“])'(?=\S)/g, (_, prefix: string) => `${prefix}‘`)
  return withOpeningQuotes.replace(/'/g, '’')
}

/** Converts '*text*' markers to <em> tags for rendering, or strips them for plain-text copy. */
export function formatItalics(text: string, mode: 'html' | 'plain' = 'html'): string {
  if (mode === 'plain') return applyTypographicApostrophes(text.replace(/\*/g, ''))
  // Escape HTML-significant characters first — citations can contain literal '<url>' angle
  // brackets (websites) that must render as text, not be parsed as tags.
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return applyTypographicApostrophes(escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>'))
}

export * from './types'
export { getBracketType } from './report-series'
