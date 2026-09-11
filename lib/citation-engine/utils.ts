import { CitationFields } from './types'

export function italicize(text: string): string {
  return `*${text}*`
}

/** Wraps text in typographic (curly) single quotation marks, eg 'text' -> ‘text’. */
export function quote(text: string): string {
  return `‘${text}’`
}

export function ensureFullStop(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`
}

/** Bibliography entries end without a full stop. */
export function stripTrailingFullStop(text: string): string {
  const trimmed = text.trim()
  return trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed
}

export function joinParts(parts: Array<string | undefined | null>, sep = ' '): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(sep)
}

/**
 * Some commercial report series (eg CCH's Australian Torts Reports, via CCH KnowConnect) are
 * paragraph-numbered and display that with a leading pilcrow, eg '¶83-437' — a house style of the
 * publisher's, not part of the AGLC4 citation itself, so it's stripped rather than carried through.
 */
export function stripPilcrow(text?: string): string | undefined {
  return text?.replace(/¶\s*/g, '')
}

/** Bare pinpoint value with no leading punctuation: '29' or '[29]'. */
export function pinpointValue(pinpoint?: string, type?: 'page' | 'paragraph'): string {
  if (!pinpoint) return ''
  const trimmed = stripPilcrow(pinpoint)!.trim()
  return type === 'paragraph' ? `[${trimmed}]` : trimmed
}

/** Pinpoint prefixed with ', ' — the standard mid-citation pinpoint join. */
export function formatPinpoint(pinpoint?: string, type?: 'page' | 'paragraph'): string {
  const value = pinpointValue(pinpoint, type)
  return value ? `, ${value}` : ''
}

export function wrapParens(text?: string): string {
  if (!text) return ''
  return `(${text})`
}

/**
 * Strips a stray full stop after a standalone single-letter initial, eg 'Emily M. Bender' ->
 * 'Emily M Bender' — AGLC4 r 4.1 carries no full stops in author initials (matching 'RJ Ellicott',
 * never 'R.J. Ellicott'), but sources like CrossRef commonly supply given names with one. Bounded
 * to a single capital letter with a word boundary before it, so it doesn't touch multi-letter
 * abbreviations or a surname genuinely ending in a single capital.
 */
function stripInitialFullStops(name: string): string {
  return name.replace(/\b([A-Z])\.(?=\s|$)/g, '$1')
}

/**
 * Footnote/subsequent-reference author list — AGLC4 r 4.1: 'A Smith, B Jones and C Lee',
 * comma-joined with 'and' before the last, no Oxford comma. Where there are more than three
 * authors, only the first is named, followed by 'et al'.
 */
export function formatAuthorList(authorNames: string[]): string {
  const authors = authorNames.map(stripInitialFullStops)
  if (authors.length === 0) return ''
  if (authors.length > 3) return `${authors[0]} et al`
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`
  return `${authors.slice(0, -1).join(', ')} and ${authors[authors.length - 1]}`
}

/** 'Given Family' -> 'Family, Given'. Splits on the last space, so multi-word given names are kept together. */
function invertName(name: string): string {
  const trimmed = name.trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return trimmed
  return `${trimmed.slice(lastSpace + 1)}, ${trimmed.slice(0, lastSpace)}`
}

// Words that essentially never appear in a personal name but reliably mark a body/organisation or
// a company. AGLC4 r 4.1: an institutional author is listed in its natural order, never inverted
// to 'Surname, Given' — 'Department of Home Affairs', not 'Affairs, Department of Home'. Kept
// deliberately conservative: a false positive here (a real person's name left un-inverted) is
// also a formatting error, so only markers with a very low chance of being someone's actual
// surname are included. reports.ts already relies on this same insight for its subsequent
// references ('a body has no surname to extract'); this brings the bibliography into line.
const INSTITUTIONAL_AUTHOR_MARKERS = [
  'department',
  'commission',
  'commissioner',
  'bureau',
  'authority',
  'ministry',
  'directorate',
  'secretariat',
  'agency',
  'tribunal',
  'parliament',
  'senate',
  'inspectorate',
  'ombudsman',
  'university',
  'institute',
  'institution',
  'academy',
  'college',
  'faculty',
  'foundation',
  'society',
  'association',
  'federation',
  'organisation',
  'organization',
  'council',
  'committee',
  'board',
  'office',
  'coalition',
  'network',
  'programme',
  'corporation',
  'incorporated',
  'company',
  'group',
  'holdings',
  'services',
  'systems',
  'technologies',
  'partners',
  'party',
  'nations',
  'union',
  'centre',
  'center',
  'pty',
  'ltd',
  'llc',
  'llp',
  'plc',
  'gmbh',
]

const INSTITUTIONAL_MARKER_PATTERN = new RegExp(`\\b(?:${INSTITUTIONAL_AUTHOR_MARKERS.join('|')})\\b`, 'i')

/**
 * True when a name should be treated as a body/organisation rather than a person — used to skip
 * the 'Surname, Given' inversion the bibliography applies to a personal first author. A
 * single-token name ('UNESCO', 'Cisco', 'Google') is taken as institutional too, since a personal
 * name in this app is always at least 'Given Family'.
 */
export function isInstitutionalAuthor(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  if (!/\s/.test(trimmed)) return true
  return INSTITUTIONAL_MARKER_PATTERN.test(trimmed)
}

/**
 * Bibliography author list — AGLC4: every author is listed (no 'et al'), and only the first
 * author's name is inverted (Surname, Given), eg 'Ramsay, Ian and Cameron Sim'. An institutional
 * first author (see isInstitutionalAuthor) is listed in natural order instead — never inverted.
 */
export function formatBibliographyAuthorList(authorNames: string[]): string {
  const authors = authorNames.map(stripInitialFullStops)
  if (authors.length === 0) return ''
  const first = isInstitutionalAuthor(authors[0]) ? authors[0] : invertName(authors[0])
  if (authors.length === 1) return first
  const rest = authors.slice(1)
  if (rest.length === 1) return `${first} and ${rest[0]}`
  return `${first}, ${rest.slice(0, -1).join(', ')} and ${rest[rest.length - 1]}`
}

/** Last whitespace-separated token of a name, eg 'RJ Ellicott' -> 'Ellicott'. */
export function lastName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

/**
 * Subsequent-reference author list — AGLC4 r 1.4.1's own worked examples show SURNAMES ONLY (not
 * full names, unlike the footnote's own author list), joined the same and/'et al' way r 4.1.2
 * already governs for a footnote, eg 'Edelman and Bant (n 2) 260.', 'Rishworth et al (n 3).'.
 */
export function formatSubsequentAuthorList(authorNames: string[]): string {
  return formatAuthorList(authorNames.map(lastName))
}

// The Charter of the United Nations is cited by bare title alone under AGLC4 (r 9.2.4's own
// commentary) — every other UN Materials field (resolutionNumber, session, unDocSymbol, date,
// adoptedDate) is correctly empty for it, unlike any other unDocument citation, even though
// authoritative sources about the Charter typically do state a signature/entry-into-force date the
// way a treaty's page would. Shared here (rather than kept as a private copy in ai-extract.ts,
// which is 'server-only' and can't be imported by the plain citation-engine layer) so both the
// autofill classifier and warnings.ts's missing-fields check agree on the same list and don't
// silently drift apart. Covers the couple of common alternate short names, not just the formal
// title, since a source might use either.
const UN_CHARTER_TITLES = ['charter of the united nations', 'united nations charter', 'un charter']

export function isUnitedNationsCharter(title: string): boolean {
  return UN_CHARTER_TITLES.includes(title.trim().toLowerCase())
}

/**
 * validator.ts sends the raw source fields to the AI as JSON context (alongside the already-
 * generated footnote/subsequent/bibliography strings) so it can reason about the underlying data
 * — but that means a corrected* field it writes back is reconstructed straight from that JSON,
 * bypassing every deterministic post-processing step (eg stripPilcrow, applied inside
 * generateCaseCitation/pinpointValue) that only ran on the *original* base citation. Confirmed
 * live: a CCH-style '¶83-437' starting page survived into a 'corrected' footnote even though the
 * unvalidated base citation was already pilcrow-free, because the AI was correcting an unrelated
 * issue and reconstructed the whole footnote from these raw fields in the process. Sanitising the
 * fields before they're ever serialised for the AI — the same way, before it can see the data —
 * closes that gap for every current and future normalisation this applies, not just this one case.
 * Lives here rather than in validator.ts itself so it's testable without the server-only guard
 * validator.ts (and every other file that calls the Anthropic API) carries.
 */
export function sanitizeFieldsForValidation(fields: CitationFields): CitationFields {
  const clean = { ...fields } as Record<string, unknown>
  for (const [key, value] of Object.entries(clean)) {
    if (typeof value === 'string') clean[key] = stripPilcrow(value)
    else if (Array.isArray(value)) clean[key] = value.map((v) => (typeof v === 'string' ? stripPilcrow(v) : v))
  }
  return clean as unknown as CitationFields
}
