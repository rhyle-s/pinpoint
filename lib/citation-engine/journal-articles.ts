import { CitationResult, JournalFields } from './types'
import { getJournalBracketType } from './report-series'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatPinpoint,
  formatSubsequentAuthorList,
  italicize,
  joinParts,
  quote,
  stripTrailingFullStop,
} from './utils'

function formatVolumeIssue(volume?: string, issue?: string): string {
  if (volume && issue) return `${volume}(${issue})`
  if (volume) return volume
  if (issue) return `(${issue})`
  return ''
}

function buildCitationCore(fields: JournalFields): string {
  const bracket = getJournalBracketType(fields.journalName)
  const yearPart = bracket === 'round' ? `(${fields.year})` : `[${fields.year}]`
  const volumeIssue = formatVolumeIssue(fields.volume, fields.issue)
  return joinParts([yearPart, volumeIssue, italicize(fields.journalName), fields.startingPage])
}

/**
 * AGLC4 r 1.4.1's own default for a secondary source is a BARE 'Author Surname (n X) Pinpoint' —
 * a title is only added when several works by the same author are cited (eg '61 Rubenstein,
 * Australian Citizenship Law in Context (n 59) 48, 65–74.'), something this app can't detect,
 * since every citation is generated independently with no knowledge of a student's other
 * footnotes. The student's own explicit shortTitle is treated as the signal that they already
 * know disambiguation is needed. Where there's no author at all — an unsigned article, r 1.4.1's
 * own note: 'Where there is no author or editor, the title... should be included in place of the
 * author's surname' — the title stands in for the surname entirely rather than being dropped too.
 */
function formatSubsequent(fields: JournalFields): string {
  const surnames = formatSubsequentAuthorList(fields.authors ?? [])
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  if (!surnames) {
    return ensureFullStop(`${quote(fields.shortTitle || fields.articleTitle)} (n ${footnoteNumber})${pinpoint}`)
  }
  const titlePart = fields.shortTitle ? `, ${quote(fields.shortTitle)}` : ''
  return ensureFullStop(`${surnames}${titlePart} (n ${footnoteNumber})${pinpoint}`)
}

export function generateJournalCitation(fields: JournalFields): CitationResult {
  const authors = formatAuthorList(fields.authors)
  const bibliographyAuthors = formatBibliographyAuthorList(fields.authors)
  const quotedTitle = quote(fields.articleTitle)
  const citationCore = buildCitationCore(fields)
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${authors}, ${quotedTitle} ${citationCore}${pinpointPart}`),
    subsequent: formatSubsequent(fields),
    bibliography: stripTrailingFullStop(`${bibliographyAuthors}, ${quotedTitle} ${citationCore}`),
    sourceType: 'journal',
    validationStatus: 'unvalidated',
  }
}
