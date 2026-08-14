import { CitationResult, ReportFields } from './types'
import { ensureFullStop, formatAuthorList, formatBibliographyAuthorList, italicize, joinParts, stripTrailingFullStop } from './utils'

function buildParenthetical(fields: ReportFields): string {
  const label = fields.seriesNumber || fields.documentType
  return `(${joinParts([label, fields.date], ', ')})`
}

export function generateReportCitation(fields: ReportFields): CitationResult {
  const authors = formatAuthorList(fields.authors ?? [])
  const authorPrefix = authors ? `${authors}, ` : ''
  const bibliographyAuthors = formatBibliographyAuthorList(fields.authors ?? [])
  const bibliographyAuthorPrefix = bibliographyAuthors ? `${bibliographyAuthors}, ` : ''
  const titleItalic = italicize(fields.title)
  const parenthetical = buildParenthetical(fields)
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${authorPrefix}${titleItalic} ${parenthetical}${pinpoint}`),
    subsequent: ensureFullStop(`${authorPrefix}${shortTitle} (n ${footnoteNumber})${pinpoint}`),
    bibliography: stripTrailingFullStop(`${bibliographyAuthorPrefix}${titleItalic} ${parenthetical}`),
    sourceType: 'report',
    validationStatus: 'unvalidated',
  }
}
