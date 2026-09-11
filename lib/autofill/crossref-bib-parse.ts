/**
 * Pure matching / gating logic for the CrossRef bibliographic (title) search — kept out of the
 * server-only crossref.ts so it can be unit-tested, following the *-parse.ts convention used
 * across this directory. crossref.ts maps a raw CrossRef item into a BibCandidate and asks this
 * whether it clears the bar; nothing here touches the network.
 */

export interface BibCandidate {
  /** CrossRef's own record type — only 'journal-article' / 'proceedings-article' are accepted. */
  type?: string
  /** Already-assembled full title (crossref.ts's buildFullTitle). */
  title: string
  /** Already-resolved publication year (crossref.ts's resolveYear), or '' if unknown. */
  year: string
  /** Author family names only. */
  authorFamilyNames: string[]
  /** CrossRef relevance score for this item against the query. */
  score: number
}

// CrossRef relevance scores are unbounded and query-dependent, but a confident title match sits
// well above these in practice and a spurious one well below. The higher bar applies when the
// pasted text gives nothing to cross-check the match against (no matching year, no matching author
// surname).
const MIN_SCORE_CORROBORATED = 50
const MIN_SCORE_UNCORROBORATED = 70
// Fraction of the candidate title's own meaningful words that must actually appear in the pasted
// text — ie "does the text the student pasted contain this title?".
const MIN_TITLE_COVERAGE_CORROBORATED = 0.8
const MIN_TITLE_COVERAGE_UNCORROBORATED = 0.95

const TITLE_MATCH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'from', 'at', 'by', 'as', 'is', 'are', 'be',
])

export function normaliseForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function meaningfulTitleWords(title: string): string[] {
  return normaliseForMatch(title)
    .split(' ')
    .filter((w) => w.length > 2 && !TITLE_MATCH_STOPWORDS.has(w))
}

function titleCoverage(title: string, normalisedText: string): number {
  const words = meaningfulTitleWords(title)
  if (words.length === 0) return 0
  const present = words.filter((w) => normalisedText.includes(w)).length
  return present / words.length
}

export function yearsIn(text: string): Set<string> {
  return new Set(Array.from(text.matchAll(/\b(?:19|20)\d{2}\b/g), (m) => m[0]))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function authorSurnameInText(familyNames: string[], normalisedText: string): boolean {
  return familyNames.some((name) => {
    const family = normaliseForMatch(name)
    return family.length >= 3 && new RegExp(`\\b${escapeRegExp(family)}\\b`).test(normalisedText)
  })
}

/**
 * The acceptance gate. A CrossRef title search returns the *closest* work, not necessarily *the*
 * work, and a silently-wrong match is worse than none — so acceptance needs (a) a record type the
 * citation builders handle, (b) most of the candidate title's own words present in the pasted
 * text, and (c) a relevance score over the bar. A matching year or author surname in the pasted
 * text lowers both the score and coverage bars; without either, they're stricter. A very short /
 * generic title needs both corroborating signals regardless.
 */
export function isAcceptableBibMatch(candidate: BibCandidate, referenceText: string): boolean {
  if (candidate.type !== 'journal-article' && candidate.type !== 'proceedings-article') return false
  if (!candidate.title.trim()) return false

  const normalisedText = normaliseForMatch(referenceText)
  const years = yearsIn(referenceText)

  const wordCount = meaningfulTitleWords(candidate.title).length
  const coverage = titleCoverage(candidate.title, normalisedText)
  const yearOk = !!candidate.year && years.has(candidate.year)
  const authorOk = authorSurnameInText(candidate.authorFamilyNames, normalisedText)

  if (wordCount < 3) {
    return yearOk && authorOk && candidate.score >= MIN_SCORE_CORROBORATED && coverage >= MIN_TITLE_COVERAGE_CORROBORATED
  }
  if (yearOk || authorOk) {
    return candidate.score >= MIN_SCORE_CORROBORATED && coverage >= MIN_TITLE_COVERAGE_CORROBORATED
  }
  return candidate.score >= MIN_SCORE_UNCORROBORATED && coverage >= MIN_TITLE_COVERAGE_UNCORROBORATED
}

// Signals that pasted text is a primary legal source (a case or a statute), not a secondary-source
// reference. CrossRef indexes neither, so a title search on one would at best waste a call and at
// worst surface an unrelated journal article that shares words. High-precision only (unambiguous
// markers), so a genuine journal/conference reference is never wrongly excluded.
const CASE_MNC_PATTERN = /\[\d{4}]\s+[A-Z]{2,}\s+\d+/
const LAW_REPORT_PATTERN = /\(\d{4}\)\s+\d+\s+[A-Z][A-Za-z]/
const LEGISLATION_JURISDICTION_PATTERN = /\((?:Cth|NSW|Vic|Qld|WA|SA|Tas|ACT|NT)\)/

export function looksLikeSecondarySourceReference(text: string): boolean {
  return (
    !CASE_MNC_PATTERN.test(text) &&
    !LAW_REPORT_PATTERN.test(text) &&
    !LEGISLATION_JURISDICTION_PATTERN.test(text)
  )
}
