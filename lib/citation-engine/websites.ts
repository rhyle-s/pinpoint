import { CitationResult, WebsiteFields } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatPinpoint,
  formatSubsequentAuthorList,
  italicize,
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

  // AGLC4 r 1.4.1's own default is a BARE 'Author Surname (n X) Pinpoint' (surnames, not the
  // footnote's own full names) — a title is only added when several works by the same author are
  // cited, undetectable here since each citation is generated independently; an explicit
  // shortTitle is treated as the student's own signal that disambiguation is needed. Most web
  // pages have no author at all (effectiveAuthors() already drops one that just repeats the
  // website name), in which case the title stands in for the surname entirely, per that same rule.
  const surnames = formatSubsequentAuthorList(authors)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequentPinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const subsequent = !surnames
    ? ensureFullStop(`${quote(fields.shortTitle || fields.documentTitle)} (n ${footnoteNumber})${subsequentPinpoint}`)
    : ensureFullStop(
        `${surnames}${fields.shortTitle ? `, ${quote(fields.shortTitle)}` : ''} (n ${footnoteNumber})${subsequentPinpoint}`,
      )

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'website',
    validationStatus: 'unvalidated',
  }
}
