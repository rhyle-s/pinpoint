import 'server-only'
import { getCached, setCached } from '../cache'
import { JournalFields, ResearchPaperFields } from '../citation-engine/types'
import { AutofillResult } from './types'
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
  volume?: string
  issue?: string
  'container-title'?: string[]
  page?: string
  event?: CrossRefEvent
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
  return text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFullTitle(message: CrossRefMessage): string {
  const title = message.title?.[0] ?? ''
  const subtitle = message.subtitle?.[0]
  return stripEmoji(subtitle ? `${title}: ${subtitle}` : title)
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
  const year = message.published?.['date-parts']?.[0]?.[0]?.toString() ?? ''
  const institution = buildInstitutionName(message.event)

  return {
    authors,
    title: buildFullTitle(message),
    documentType: 'Conference Paper',
    institution: institution || (message['container-title']?.[0] ?? ''),
    date: formatConferenceDate(message.event, year),
  }
}

function buildJournalFields(message: CrossRefMessage, authors: string[]): Partial<JournalFields> {
  const pageParts = message.page?.split(/[-–]/)

  return {
    authors,
    articleTitle: buildFullTitle(message),
    year: message.published?.['date-parts']?.[0]?.[0]?.toString() ?? '',
    volume: message.volume,
    issue: message.issue,
    journalName: message['container-title']?.[0] ?? '',
    startingPage: pageParts?.[0]?.trim(),
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
