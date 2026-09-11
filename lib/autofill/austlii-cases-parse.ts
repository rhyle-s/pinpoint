import { CaseFields } from '../citation-engine/types'
import { isKnownReportSeries } from '../citation-engine/report-series'

// Reported citation: 'Volume ReportAbbreviation StartingPage', eg '270 CLR 1', '190 A Crim R 468'.
// The abbreviation is bounded to 1–4 short words (was an unbounded `[A-Za-z\s]+`, which let a
// stray run of capitalised words anywhere on the page masquerade as a report series).
const REPORTED_CITATION_PATTERN = /(\d{1,4})\s+([A-Z][A-Za-z]*(?:\s[A-Za-z]+){0,3})\s+(\d{1,5})\b/
// Medium neutral citation: '[Year] CourtCode Number', eg '[2020] HCA 5'. Court codes are always
// at least two letters.
const MNC_PATTERN = /\[(\d{4})]\s+([A-Z]{2,})\s+(\d+)/
const JUDGE_PATTERN = /(?:Coram|Before):\s*([^.\n]+)/i
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
const DATE_PATTERN = new RegExp(`\\b(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})\\b`)

export function cleanCaseName(rawTitle: string): string {
  let name = rawTitle.replace(/\s*-\s*AustLII\s*$/i, '').trim()
  name = name.replace(/\s*\[\d{4}]\s*[A-Z]+\s*\d+.*$/, '').trim()
  return name
}

/**
 * A defensive sanity check on a regex-matched reported citation before it's trusted. The pattern
 * is deliberately loose (it has to cope with every report series AustLII carries), so an
 * implausible volume/page or an over-long "abbreviation" is a sign the match landed on something
 * that merely looks citation-shaped rather than an actual citation.
 */
export function isPlausibleReportedCitation(volume: string, abbreviation: string, startingPage: string): boolean {
  const v = Number(volume)
  const p = Number(startingPage)
  if (!Number.isFinite(v) || v < 1 || v > 3000) return false
  if (!Number.isFinite(p) || p < 1 || p > 99999) return false
  const abbr = abbreviation.trim()
  if (abbr.length < 2 || abbr.length > 15) return false
  if (abbr.split(/\s+/).length > 4) return false
  return true
}

export interface ParsedAustliiCase {
  fields: Partial<CaseFields>
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Pulls citation fields out of an AustLII case page.
 *
 * @param rawTitle      the page's own `<title>` text (for the case name).
 * @param citationText  a BOUNDED slice of the page — its title plus the very top of the body, not
 *                      the whole thing. Running the loose citation patterns against the entire
 *                      body and taking the first hit is how this used to yield confident-but-wrong
 *                      volumes/pages from unrelated `<number> <Words> <number>` text lower down.
 * @param bodyText      the full page text — used only for the judge/date patterns, which carry
 *                      their own anchors ('Before:' / a full 'DD Month YYYY' date) and a bounded
 *                      search window, so they're safe against the whole body.
 */
export function parseAustliiCase(rawTitle: string, citationText: string, bodyText: string): ParsedAustliiCase {
  const fields: Partial<CaseFields> = { caseName: cleanCaseName(rawTitle) }
  let confidence: ParsedAustliiCase['confidence'] = 'low'
  let reportType: CaseFields['reportType'] = 'unreported-no-mnc'

  const reportedMatch = citationText.match(REPORTED_CITATION_PATTERN)
  const mncMatch = citationText.match(MNC_PATTERN)

  if (reportedMatch && isPlausibleReportedCitation(reportedMatch[1], reportedMatch[2], reportedMatch[3])) {
    const abbreviation = reportedMatch[2].trim()
    fields.volume = reportedMatch[1]
    fields.reportAbbreviation = abbreviation
    fields.startingPage = reportedMatch[3]
    if (mncMatch) fields.year = mncMatch[1]
    reportType = 'reported'
    // High confidence only when the series is one the engine actually recognises; a plausible but
    // unrecognised abbreviation is still worth offering, just flagged for the student to check.
    confidence = isKnownReportSeries(abbreviation) ? 'high' : 'medium'
  } else if (mncMatch) {
    fields.year = mncMatch[1]
    fields.courtCode = mncMatch[2]
    fields.caseNumber = mncMatch[3]
    reportType = 'unreported-mnc'
    confidence = 'medium'
  }

  const judgeMatch = bodyText.match(JUDGE_PATTERN)
  if (judgeMatch) fields.judge = judgeMatch[1].trim()

  if (reportType === 'unreported-no-mnc') {
    const dateMatch = bodyText.slice(0, 2000).match(DATE_PATTERN)
    if (dateMatch) fields.date = dateMatch[1]
  }

  fields.reportType = reportType
  return { fields, confidence }
}
