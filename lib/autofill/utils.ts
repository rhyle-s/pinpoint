import crypto from 'crypto'
import { CaseFields, JurisdictionCode, LegislationFields } from '../citation-engine/types'
import { AutofillResult } from './types'

/** AGLC4 r 4.1 — author's given name(s) in full, then family name, eg 'Robert John Smith'. */
export function formatAuthorAGLC4(given: string, family: string): string {
  return [given.trim(), family.trim()].filter(Boolean).join(' ')
}

export function hashKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/** Shown alongside any "couldn't fetch/read this automatically" message — a live alternative given
 *  the PDF-upload and paste-text autofill paths exist precisely for sources Pinpoint can't reach. */
export const TRY_ALTERNATIVE_INPUT_SUGGESTION =
  'Alternatively, save the page as a PDF and upload it, or paste the citation details directly.'

/**
 * Splits a trailing year off an Act title, eg 'Crimes Act 1958' -> { title: 'Crimes Act', year:
 * '1958' } — the citation engine italicises the title and year together itself (AGLC4 r 3.1), so
 * a title that already carries its own year produces a duplicate ('Crimes Act 1958 1958').
 * Returns the year unchanged if one is already known and the title has none of its own.
 */
export function stripTrailingYear(rawTitle: string, knownYear = ''): { title: string; year: string } {
  const trimmed = rawTitle.trim()
  const yearMatch = trimmed.match(/(\d{4})\s*$/)
  if (!yearMatch || yearMatch.index === undefined) {
    return { title: trimmed, year: knownYear }
  }
  return { title: trimmed.slice(0, yearMatch.index).trim(), year: yearMatch[1] }
}

/**
 * Strips a leading or trailing year from a report title when it duplicates the already-extracted
 * date, eg title 'Sustainability Report 2025' with date '2025' becomes 'Sustainability Report' —
 * a cover page often prints the year directly alongside the title (eg 'Sustainability Report
 * 2025' or '2025 Sustainability Report'), and left in place this produces a duplicate ('2025)
 * Sustainability Report 2025)'). Deliberately bounded to a year that matches the *known* date
 * (not just any leading/trailing 4-digit number) so it can't strip a number that's genuinely part
 * of the title, eg a report literally called 'Vision 2030'.
 */
export function stripDuplicateYearFromTitle(title: string, date: string): string {
  const year = date.match(/\b(\d{4})\b/)?.[1]
  if (!year) return title.trim()
  return title
    .trim()
    .replace(new RegExp(`^${year}\\s+`), '')
    .replace(new RegExp(`\\s+${year}$`), '')
    .trim()
}

/**
 * AGLC4 r 7.1.1: where a document-type label forms an integral part of the title — the title is
 * essentially just that label plus a year/edition, with no distinct name or tagline of its own —
 * the label stays in the title and the *generic* document type goes in the parentheses. A document
 * titled 'Annual Report 2023–24' is cited '... Annual Report 2023–24 (Report, 2024)', never
 * '(Annual Report, 2024)'. The ai-extract system prompt already states this rule, but the model
 * doesn't reliably apply it (confirmed on the Home Affairs 2023–24 annual report), so this is the
 * deterministic backstop. Scoped to the '...Report' family — the only document-type family whose
 * integral form differs from its own generic; 'White Paper' and 'Policy Document' are already
 * their own generic forms (r 7.1.1's same principle, no collapse needed). Only fires when what's
 * left of the title after removing the label and any year/number tokens is empty, so a genuine
 * title that merely contains the words (eg 'Interim Report on the Operation of the Foo Act') keeps
 * whatever split the model chose.
 */
export function genericiseIntegralDocumentType(title: string, documentType: string): string {
  const dt = documentType.trim()
  // Must end with 'Report'/'Reports' but not BE just that (a bare 'Report' is already generic).
  if (!/\breports?$/i.test(dt) || /^reports?$/i.test(dt)) return dt
  if (!title.toLowerCase().includes(dt.toLowerCase())) return dt
  const remainder = title
    .toLowerCase()
    .replace(dt.toLowerCase(), ' ')
    .replace(/\b\d{4}\s*[–-]\s*\d{2,4}\b/g, ' ') // year ranges: 2023–24, 2023-2024
    .replace(/\b\d{4}\b/g, ' ') // bare years
    .replace(/\bno\s*\d+\b/gi, ' ') // 'No 129'
    .replace(/[^a-z]/g, '')
  return remainder.length === 0 ? 'Report' : dt
}

const VALID_JURISDICTIONS: Array<JurisdictionCode | 'none'> = [
  'Cth',
  'Vic',
  'NSW',
  'Qld',
  'WA',
  'SA',
  'Tas',
  'ACT',
  'NT',
  'none',
]

/** Matches free-text jurisdiction (eg from AI extraction) against a known AGLC4 code. */
export function normalizeJurisdiction(value?: string | null): JurisdictionCode | 'none' | undefined {
  if (!value) return undefined
  return VALID_JURISDICTIONS.find((code) => code.toLowerCase() === value.trim().toLowerCase())
}

// Both notes below used to be fixed strings written for the URL-fetch path only ('this site',
// 'this link') — reused unconditionally for a PDF upload or pasted text too, where there's no
// site or link involved at all, confirmed as a real, live wording bug during a full autofill
// audit (a legislation PDF upload showing "This site's section links aren't recognised..."). Both
// are now built from `suggestAlternative` — the same flag `finalizeAutofillResult` already uses
// to distinguish a URL fetch from an upload/paste for its own generic fallback message below —
// so the wording matches whichever input method the student actually used.
function manualPinpointNote(fromUrl: boolean): string {
  return fromUrl
    ? "This site's section links aren't recognised, or this link doesn't point at a specific section — if you're citing one, add the pinpoint manually below."
    : "A specific pinpoint wasn't found in this document — if you're citing one, add it manually below."
}

function missingCaseYearNote(fromUrl: boolean): string {
  return fromUrl
    ? "This site doesn't expose the case year in a way we could extract automatically — please add it manually."
    : "The case year wasn't found in this document — please add it manually."
}

/**
 * Runs after any handler — URL fetch, PDF upload, or pasted text — has produced a result, adding
 * whichever note best explains what's missing. Only fires when nothing more specific is already
 * set (eg a blocked-site warning already implies "fill this in yourself"), and checks are ordered
 * most-specific-first: a missing pinpoint or case year is more actionable than a generic "some
 * fields filled" note, so those take priority when both would otherwise apply.
 *
 * suggestAlternative controls whether a low-confidence result with no other message gets pointed
 * at the PDF-upload/paste-text alternatives — only sensible for a URL-based attempt, since a
 * failure while already processing an upload or paste shouldn't recommend the thing that just failed.
 */
export function finalizeAutofillResult(result: AutofillResult, suggestAlternative: boolean): AutofillResult {
  if (result.message) return result

  // Gated on the primary identifying field (actTitle / caseName) having actually been found —
  // otherwise the note undersells the problem: "just add the pinpoint" reads very differently
  // when nothing else came through either, which calls for the generic suggestion below instead.
  if (result.detectedSourceType === 'legislation') {
    const fields = result.fields as Partial<LegislationFields>
    if (fields.actTitle && !fields.pinpointValue) return { ...result, message: manualPinpointNote(suggestAlternative) }
  }

  if (result.detectedSourceType === 'case') {
    const fields = result.fields as Partial<CaseFields>
    if (fields.caseName && !fields.year) return { ...result, message: missingCaseYearNote(suggestAlternative) }
  }

  if (suggestAlternative && result.confidence === 'low') {
    return { ...result, message: `Some fields filled — please review. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}` }
  }

  return result
}
