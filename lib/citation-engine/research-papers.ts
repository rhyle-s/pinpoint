import { CitationResult, ResearchPaperFields } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatSubsequentAuthorList,
  joinParts,
  quote,
  stripTrailingFullStop,
} from './utils'

function buildParenthetical(fields: ResearchPaperFields): string {
  const label = fields.seriesNumber ? `${fields.documentType} ${fields.seriesNumber}` : fields.documentType
  return `(${joinParts([label, fields.institution, fields.date], ', ')})`
}

export function generateResearchPaperCitation(fields: ResearchPaperFields): CitationResult {
  const authors = fields.authors ?? []
  const authorPrefix = authors.length > 0 ? `${formatAuthorList(authors)}, ` : ''
  const bibliographyAuthors = formatBibliographyAuthorList(authors)
  const bibliographyAuthorPrefix = bibliographyAuthors ? `${bibliographyAuthors}, ` : ''
  const quotedTitle = quote(fields.title)
  const parenthetical = buildParenthetical(fields)
  // A bare pinpoint follows the closing parenthesis directly (like a report or a whole book) —
  // no comma, unlike a pinpoint that's disambiguating itself from a preceding starting page.
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const footnote = ensureFullStop(`${authorPrefix}${quotedTitle} ${parenthetical}${pinpoint}`)
  const bibliography = stripTrailingFullStop(`${bibliographyAuthorPrefix}${quotedTitle} ${parenthetical}`)

  // AGLC4 r 1.4.1's own default is a BARE 'Author Surname (n X) Pinpoint' (surnames, not the
  // footnote's own full names) — a title is only added when several works by the same author are
  // cited, undetectable here since each citation is generated independently; an explicit
  // shortTitle is treated as the student's own signal that disambiguation is needed.
  const surnames = formatSubsequentAuthorList(authors)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequent = !surnames
    ? ensureFullStop(`${quote(fields.shortTitle || fields.title)} (n ${footnoteNumber})${pinpoint}`)
    : ensureFullStop(
        `${surnames}${fields.shortTitle ? `, ${quote(fields.shortTitle)}` : ''} (n ${footnoteNumber})${pinpoint}`,
      )

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'researchPaper',
    validationStatus: 'unvalidated',
  }
}
