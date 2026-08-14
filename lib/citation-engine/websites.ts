import { CitationResult, WebsiteFields } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatPinpoint,
  italicize,
  lastName,
  quote,
  stripTrailingFullStop,
} from './utils'

/** Author is omitted when absent, or when it's just the website name repeated. */
function effectiveAuthors(fields: WebsiteFields): string[] {
  const authors = fields.authors ?? []
  if (authors.length === 1 && authors[0].trim().toLowerCase() === fields.websiteName.trim().toLowerCase()) {
    return []
  }
  return authors
}

function buildParenthetical(fields: WebsiteFields): string {
  return fields.date ? `(${fields.documentType}, ${fields.date})` : `(${fields.documentType})`
}

export function generateWebsiteCitation(fields: WebsiteFields): CitationResult {
  const authors = effectiveAuthors(fields)
  const authorPrefix = authors.length > 0 ? `${formatAuthorList(authors)}, ` : ''
  const bibliographyAuthorPrefix = authors.length > 0 ? `${formatBibliographyAuthorList(authors)}, ` : ''
  const quotedTitle = `${quote(fields.documentTitle)},`
  const websiteItalic = italicize(fields.websiteName)
  const parenthetical = buildParenthetical(fields)
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const urlPart = `<${fields.url}>`

  const footnote = ensureFullStop(
    `${authorPrefix}${quotedTitle} ${websiteItalic} ${parenthetical}${pinpointPart} ${urlPart}`,
  )
  const bibliography = stripTrailingFullStop(
    `${bibliographyAuthorPrefix}${quotedTitle} ${websiteItalic} ${parenthetical} ${urlPart}`,
  )

  const surname = authors.length > 0 ? lastName(authors[0]) : ''
  const subsequentAuthorPrefix = surname ? `${surname}, ` : ''
  const shortTitle = quote(fields.shortTitle || fields.documentTitle)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequentPinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const subsequent = ensureFullStop(`${subsequentAuthorPrefix}${shortTitle} (n ${footnoteNumber})${subsequentPinpoint}`)

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'website',
    validationStatus: 'unvalidated',
  }
}
