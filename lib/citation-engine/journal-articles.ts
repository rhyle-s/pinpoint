import { CitationResult, JournalFields } from './types'
import { getJournalBracketType } from './report-series'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatPinpoint,
  italicize,
  joinParts,
  lastName,
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

function formatSubsequent(fields: JournalFields): string {
  const surname = lastName(fields.authors[0] ?? '')
  const shortTitle = fields.shortTitle || fields.articleTitle
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  return ensureFullStop(`${surname}, ${quote(shortTitle)} (n ${footnoteNumber})${pinpoint}`)
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
