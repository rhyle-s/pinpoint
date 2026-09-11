import { CitationResult, NewspaperFields } from './types'
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

export function generateNewspaperCitation(fields: NewspaperFields): CitationResult {
  const authors = fields.authors ?? []
  const authorPrefix = authors.length > 0 ? `${formatAuthorList(authors)}, ` : ''
  const bibliographyAuthorPrefix = authors.length > 0 ? `${formatBibliographyAuthorList(authors)}, ` : ''
  const quotedTitle = `${quote(fields.articleTitle)},`
  const newspaperItalic = italicize(fields.newspaperName)
  // AGLC4 r 7.11.2 — an online newspaper article is pinpointed by '(online, Date)', never a page
  // number (there's no print pagination to point to), unlike the print form in r 7.11.1.
  const parenthetical = `(online, ${fields.date})`
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const urlPart = `<${fields.url}>`

  const footnote = ensureFullStop(
    `${authorPrefix}${quotedTitle} ${newspaperItalic} ${parenthetical}${pinpointPart} ${urlPart}`,
  )
  const bibliography = stripTrailingFullStop(
    `${bibliographyAuthorPrefix}${quotedTitle} ${newspaperItalic} ${parenthetical} ${urlPart}`,
  )

  // AGLC4 r 1.4.1's own default is a BARE 'Author Surname (n X) Pinpoint' (surnames, not the
  // footnote's own full names) — a title is only added when several works by the same author are
  // cited, undetectable here since each citation is generated independently; an explicit
  // shortTitle is treated as the student's own signal that disambiguation is needed. An unbylined
  // article (no author at all — a common case for wire-service reports) uses the title in place
  // of the author's surname entirely, per that same rule.
  const surnames = formatSubsequentAuthorList(authors)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequentPinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const subsequent = !surnames
    ? ensureFullStop(`${quote(fields.shortTitle || fields.articleTitle)} (n ${footnoteNumber})${subsequentPinpoint}`)
    : ensureFullStop(
        `${surnames}${fields.shortTitle ? `, ${quote(fields.shortTitle)}` : ''} (n ${footnoteNumber})${subsequentPinpoint}`,
      )

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'newspaper',
    validationStatus: 'unvalidated',
  }
}
