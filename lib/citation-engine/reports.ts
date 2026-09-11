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
  // Same convention as websites.ts: the URL is the retrieval detail, appended after the
  // pinpoint in the footnote/bibliography and omitted entirely from the (already-cited)
  // subsequent reference.
  const urlPart = fields.url ? ` <${fields.url}>` : ''
  const footnoteNumber = fields.footnoteNumber || '1'

  // r 1.4.1: "For secondary sources authored by a body, it may be more helpful to use a short
  // title instead of the name of the author" — and AGLC4's own worked example for exactly this
  // report type does precisely that: the ALRC's 'Traditional Rights and Freedoms' subsequent
  // reference (r 1.4.1's example 55) is '*Traditional Rights and Freedoms* (n 52) ...' with NO
  // author at all, not 'Australian Law Reform Commission, ...'. Report authors are overwhelmingly
  // bodies in practice (Royal Commissions, government departments, regulators — every worked
  // example in this file's own tests is body-authored, not one is an individual), and a body has
  // no 'surname' to extract the way a person does — deliberately never attempts to derive one
  // (blindly taking the last word of eg 'Woolworths Group' would produce the nonsensical 'Group').
  // Title-only is therefore the default here, unlike journal-articles.ts/websites.ts/newspapers.ts
  // (where individual or no authorship dominates and a bare surname is both safe and correct).
  const subsequent = ensureFullStop(`${italicize(fields.shortTitle || fields.title)} (n ${footnoteNumber})${pinpoint}`)

  return {
    footnote: ensureFullStop(`${authorPrefix}${titleItalic} ${parenthetical}${pinpoint}${urlPart}`),
    subsequent,
    bibliography: stripTrailingFullStop(`${bibliographyAuthorPrefix}${titleItalic} ${parenthetical}${urlPart}`),
    sourceType: 'report',
    validationStatus: 'unvalidated',
  }
}
