import { CitationResult, ResearchPaperFields } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  joinParts,
  lastName,
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

  const surname = authors.length > 0 ? lastName(authors[0]) : ''
  const subsequentAuthorPrefix = surname ? `${surname}, ` : ''
  const shortTitle = quote(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequent = ensureFullStop(`${subsequentAuthorPrefix}${shortTitle} (n ${footnoteNumber})${pinpoint}`)

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'researchPaper',
    validationStatus: 'unvalidated',
  }
}
