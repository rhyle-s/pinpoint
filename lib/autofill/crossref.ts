import 'server-only'
import { getCached, setCached } from '../cache'
import { JournalFields, ResearchPaperFields } from '../citation-engine/types'
import { AutofillResult } from './types'
import { BibCandidate, isAcceptableBibMatch } from './crossref-bib-parse'
import { formatAuthorAGLC4, hashKey } from './utils'

const USER_AGENT = 'Pinpoint/1.0 (aglcite.com.au; mailto:contact@aglcite.com.au)'

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface CrossRefAuthor {
  given?: string
  family?: string
}

interface CrossRefDateParts {
  'date-parts'?: number[][]
}

interface CrossRefEvent {
  name?: string
  acronym?: string
  sponsor?: string[]
  start?: CrossRefDateParts
  end?: CrossRefDateParts
}

interface CrossRefMessage {
  type?: string
  author?: CrossRefAuthor[]
  title?: string[]
  subtitle?: string[]
  published?: CrossRefDateParts
  'published-print'?: CrossRefDateParts
  volume?: string
  issue?: string
  'container-title'?: string[]
  page?: string
  event?: CrossRefEvent
}

/**
 * CrossRef's generic 'published' field reflects whichever date came first — for an article
 * published online ahead of its print/volume assignment, that's the online date, not the year the
 * journal itself cites the article under. Confirmed on a real record: 'published' gave 2023 (the
 * online-first date) while the article's own printed citation, and CrossRef's own
 * 'published-print', both said 2024 (the volume's cover year) — AGLC4 wants the latter, since
 * that's the year that actually appears in the citation printed on the article.
 */
function resolveYear(message: CrossRefMessage): string {
  const printYear = message['published-print']?.['date-parts']?.[0]?.[0]
  const anyYear = message.published?.['date-parts']?.[0]?.[0]
  return (printYear ?? anyYear)?.toString() ?? ''
}

interface CrossRefResponse {
  message: CrossRefMessage
}

function cleanDoi(doi: string): string {
  return doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
}

function fallbackResult(): AutofillResult {
  return {
    detectedSourceType: 'journal',
    fields: {},
    confidence: 'low',
    message: 'Could not look up this DOI — please fill fields manually.',
  }
}

// CrossRef's own title/subtitle occasionally carry decorative emoji (confirmed on a real record:
// the "Stochastic Parrots" paper's subtitle literally ends in a parrot emoji) — harmless on a web
// page, but out of place in a formal AGLC4 citation.
function stripEmoji(text: string): string {
  // No 'u' regex flag available under this project's TS target, so emoji (almost all of which
  // live above the Basic Multilingual Plane) are matched as UTF-16 surrogate pairs instead of via
  // a Unicode property escape.
  return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

// CrossRef's title/subtitle/container-title fields come straight from the publisher's raw XML
// deposit, entities and all — confirmed on real records: a Wiley journal name literally stored as
// the eight characters 'B... &amp; ...' (not an actual ampersand), and a Modern Law Review title
// with a genuinely embedded '<i>Case Name</i>' around an italicised case citation. Left alone,
// these render as literal '&amp;' text or literal '<i>' tags in the final citation — quote() and
// italicize() (citation-engine/utils.ts) are deliberately dumb string wrappers with no HTML
// awareness, so the cleanup has to happen here, before the text reaches them. The <i>/<em> tags
// are converted to this app's own '*text*' italic marker (the same convention formatItalics
// converts to <em> at render time) rather than just stripped, so the case name still comes out
// italicised instead of losing that formatting entirely.
function cleanCrossRefText(text: string): string {
  return stripEmoji(text)
    .replace(/<\/?(i|em)>/gi, '*')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, name: string) => HTML_ENTITIES[name.toLowerCase()])
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFullTitle(message: CrossRefMessage): string {
  const title = message.title?.[0] ?? ''
  const subtitle = message.subtitle?.[0]
  return cleanCrossRefText(subtitle ? `${title}: ${subtitle}` : title)
}

/**
 * CrossRef's event.name is usually "{Acronym}: {Year} {SponsorAbbrev} {Rest of name}", eg
 * "FAccT '21: 2021 ACM Conference on Fairness, Accountability, and Transparency" — this strips
 * the acronym/year prefix and expands the sponsor abbreviation (from event.sponsor, eg "ACM
 * Association for Computing Machinery") to its full form, giving eg "Association for Computing
 * Machinery Conference on Fairness, Accountability, and Transparency". Falls back gracefully to
 * whatever's available at each step rather than failing outright on an unexpected shape.
 */
function buildInstitutionName(event: CrossRefEvent | undefined): string {
  if (!event?.name) return ''
  let name = event.name

  if (event.acronym && name.startsWith(`${event.acronym}: `)) {
    name = name.slice(`${event.acronym}: `.length)
  }
  name = name.replace(/^\d{4}\s+/, '')

  const sponsor = event.sponsor?.[0]
  const sponsorMatch = sponsor?.match(/^([A-Z]{2,})\s+(.+)$/)
  if (sponsorMatch) {
    const [, abbreviation, fullName] = sponsorMatch
    if (name.startsWith(`${abbreviation} `)) {
      name = `${fullName} ${name.slice(`${abbreviation} `.length)}`
    }
  }

  return name.trim()
}

/** Formats eg '3-10 March 2021' when the full date range is known, falling back to progressively
 *  less precise forms (a single day, a bare month, then just the year) as data allows. */
function formatConferenceDate(event: CrossRefEvent | undefined, fallbackYear: string): string {
  const start = event?.start?.['date-parts']?.[0]
  if (!start) return fallbackYear

  const [year, month, day] = start
  const end = event?.end?.['date-parts']?.[0]
  const endDay = end?.[1] === month ? end[2] : undefined

  if (day && month && endDay && endDay !== day) return `${day}-${endDay} ${MONTH_NAMES[month]} ${year}`
  if (day && month) return `${day} ${MONTH_NAMES[month]} ${year}`
  if (month) return `${MONTH_NAMES[month]} ${year}`
  return year.toString()
}

function buildResearchPaperFields(message: CrossRefMessage, authors: string[]): Partial<ResearchPaperFields> {
  const year = resolveYear(message)
  const institution = buildInstitutionName(message.event)

  return {
    authors,
    title: buildFullTitle(message),
    documentType: 'Conference Paper',
    institution: institution || cleanCrossRefText(message['container-title']?.[0] ?? ''),
    date: formatConferenceDate(message.event, year),
  }
}

function buildJournalFields(message: CrossRefMessage, authors: string[]): Partial<JournalFields> {
  const pageParts = message.page?.split(/[-–]/)

  return {
    authors,
    articleTitle: buildFullTitle(message),
    year: resolveYear(message),
    volume: message.volume,
    issue: message.issue,
    journalName: cleanCrossRefText(message['container-title']?.[0] ?? ''),
    startingPage: pageParts?.[0]?.trim(),
  }
}

// Bibliographic (title) search — for pasted text that names a journal/conference paper but has no
// DOI or URL. CrossRef's metadata is authoritative where a free-text AI parse is only as good as
// what the student typed, so this is tried first (see aiExtractFromPastedText). Returns a match
// ONLY when crossref-bib-parse.ts's strict gate clears — a silently-wrong "closest work" is worse
// than no match — and the caller surfaces the matched title for the student to confirm.

const BIBLIOGRAPHIC_ROWS = 5
const MIN_QUERY_LENGTH = 20
const MAX_QUERY_LENGTH = 300

interface CrossRefBibItem extends CrossRefMessage {
  DOI?: string
  score?: number
}

function toBibCandidate(item: CrossRefBibItem): BibCandidate {
  return {
    type: item.type,
    title: buildFullTitle(item),
    year: resolveYear(item),
    authorFamilyNames: (item.author ?? []).map((author) => author.family ?? '').filter(Boolean),
    score: item.score ?? 0,
  }
}

export async function fetchCrossRefByBibliographic(referenceText: string): Promise<AutofillResult | null> {
  const query = referenceText.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH)
  if (query.length < MIN_QUERY_LENGTH) return null

  const cacheKey = `autofill:crossref-bib:${hashKey(query)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const url = new URL('https://api.crossref.org/works')
    url.searchParams.set('query.bibliographic', query)
    url.searchParams.set('rows', String(BIBLIOGRAPHIC_ROWS))
    url.searchParams.set(
      'select',
      'DOI,title,subtitle,author,published,published-print,container-title,volume,issue,page,type,event,score',
    )

    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!response.ok) return null
    const data = (await response.json()) as { message?: { items?: CrossRefBibItem[] } }
    const items = data.message?.items ?? []
    if (items.length === 0) return null

    // CrossRef returns items already ranked by score — take the best one that clears the gate.
    const match = items.find((item) => isAcceptableBibMatch(toBibCandidate(item), referenceText))
    if (!match) return null

    const authors = (match.author ?? [])
      .map((author) => formatAuthorAGLC4(author.given ?? '', author.family ?? ''))
      .filter(Boolean)

    const isConferencePaper = match.type === 'proceedings-article'
    // AGLC4 styles a work's own title in single quotation marks (typographic ‘ ’) — not italics,
    // which are reserved for the journal/publication name. The banner renders this string as-is.
    const styledTitle = `‘${buildFullTitle(match)}’`

    const result: AutofillResult = {
      detectedSourceType: isConferencePaper ? 'researchPaper' : 'journal',
      fields: isConferencePaper ? buildResearchPaperFields(match, authors) : buildJournalFields(match, authors),
      // Never 'high' for a fuzzy title match — this is a strong guess, not a lookup by identifier.
      confidence: 'medium',
      message: `Source identified from CrossRef: ${styledTitle} — a best guess, not an exact-identifier lookup.`,
      // doi.org resolves to the publisher's landing page for the work — the student clicks through
      // to confirm this is the right paper. Not added to the citation (AGLC4 cites the print form).
      verifyUrl: match.DOI ? `https://doi.org/${match.DOI}` : undefined,
    }
    await setCached(cacheKey, result)
    return result
  } catch {
    return null
  }
}

export async function fetchCrossRefDOI(doi: string): Promise<AutofillResult> {
  const trimmedDoi = cleanDoi(doi)
  const cacheKey = `autofill:crossref:${hashKey(trimmedDoi)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(trimmedDoi)}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!response.ok) throw new Error(`CrossRef request failed: ${response.status}`)
    const data = (await response.json()) as CrossRefResponse
    const message = data.message

    const authors = (message.author ?? [])
      .map((author) => formatAuthorAGLC4(author.given ?? '', author.family ?? ''))
      .filter(Boolean)

    // CrossRef's own 'type' distinguishes a conference paper ('proceedings-article') from a
    // journal article — mapping everything to journal fields regardless was the root cause of
    // conference papers rendering with a journal-shaped citation (wrong brackets, wrong pinpoint
    // punctuation, "container-title" masquerading as a journal name).
    const isConferencePaper = message.type === 'proceedings-article'

    const result: AutofillResult = isConferencePaper
      ? { detectedSourceType: 'researchPaper', fields: buildResearchPaperFields(message, authors), confidence: 'high' }
      : { detectedSourceType: 'journal', fields: buildJournalFields(message, authors), confidence: 'high' }

    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult()
  }
}
