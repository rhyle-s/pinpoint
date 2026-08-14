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
  const trimmed = pinpoint.trim()
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

/**
 * Bibliography author list — AGLC4: every author is listed (no 'et al'), and only the first
 * author's name is inverted (Surname, Given), eg 'Ramsay, Ian and Cameron Sim'.
 */
export function formatBibliographyAuthorList(authorNames: string[]): string {
  const authors = authorNames.map(stripInitialFullStops)
  if (authors.length === 0) return ''
  const inverted = invertName(authors[0])
  if (authors.length === 1) return inverted
  const rest = authors.slice(1)
  if (rest.length === 1) return `${inverted} and ${rest[0]}`
  return `${inverted}, ${rest.slice(0, -1).join(', ')} and ${rest[rest.length - 1]}`
}

/** Last whitespace-separated token of a name, eg 'RJ Ellicott' -> 'Ellicott'. */
export function lastName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}
