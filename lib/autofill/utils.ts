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

const MANUAL_PINPOINT_NOTE =
  "This site's section links aren't recognised, or this link doesn't point at a specific section — if you're citing one, add the pinpoint manually below."

const MISSING_CASE_YEAR_NOTE =
  "This site doesn't expose the case year in a way we could extract automatically — please add it manually."

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
    if (fields.actTitle && !fields.pinpointValue) return { ...result, message: MANUAL_PINPOINT_NOTE }
  }

  if (result.detectedSourceType === 'case') {
    const fields = result.fields as Partial<CaseFields>
    if (fields.caseName && !fields.year) return { ...result, message: MISSING_CASE_YEAR_NOTE }
  }

  if (suggestAlternative && result.confidence === 'low') {
    return { ...result, message: `Some fields filled — please review. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}` }
  }

  return result
}
