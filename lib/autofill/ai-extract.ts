import 'server-only'
import * as cheerio from 'cheerio'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { getCached, setCached } from '../cache'
import { extractPdfText, isPdfContentType } from '../pdf'
import { LegislationFields, SourceType } from '../citation-engine/types'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillFields, AutofillResult } from './types'
import {
  finalizeAutofillResult,
  hashKey,
  normalizeJurisdiction,
  stripTrailingYear,
  TRY_ALTERNATIVE_INPUT_SUGGESTION,
} from './utils'

const MODEL = 'claude-sonnet-4-6'
const FETCH_TIMEOUT_MS = 20_000
const CONTENT_CHAR_LIMIT = 3000

const SYSTEM_PROMPT = `You are a legal citation metadata extractor. Given webpage content, identify what type of source it is and extract the relevant fields for AGLC4 citation. Return JSON only, no explanation.

Source types: case, legislation, journal, book, report, researchPaper, website, treaty

For any field that is not clearly present in the content, use an empty string "" (or an empty array [] for "authors") — never omit a field or use null.

For legislation, actTitle is the Act's name only, with no year in it (eg 'Crimes Act', not 'Crimes Act 1958') — the year belongs solely in the separate year field.

For cases, set caseReportType based on how the case is cited: 'unreported-mnc' when the citation is a medium neutral citation in the form [Year] CourtCode Number (eg '[2026] QCA 146') — courtCode is the court abbreviation (eg 'QCA') and caseNumber is just the trailing number (eg '146'), and volume/reportAbbreviation/startingPage are left empty. Use 'reported' when the citation instead has a volume and a law report series (eg '(1992) 175 CLR 1') — volume, reportAbbreviation, and startingPage are filled and courtCode/caseNumber are left empty. A case's judge(s) is whoever delivered the judgment, not the parties.

Use 'researchPaper' — not 'report' or 'journal' — for a conference paper (eg one bearing an ACM/IEEE-style "Reference Format:" or "Cite as:" block naming a conference), a thesis, or an unpublished/preprint working paper. 'report' is for a standalone institutional, government, or organisational publication (eg a law reform commission report); 'journal' is for an article published in a journal issue. For researchPaper, set documentType to one of 'Conference Paper', 'PhD Thesis', 'Masters Thesis', 'Honours Thesis', 'Working Paper', or 'Research Paper' (pick 'Research Paper' if the type of thesis/degree isn't stated). institution is the conference name for a conference paper, the university for a thesis, or the publishing body for a working/research paper. date is the full event date for a conference paper (eg '4 July 2015'), or just the year for a thesis or working paper.`

// Every field is a plain (non-nullable) string/array, using "" / [] as the "not present"
// sentinel — the Anthropic structured-output API caps requests at 16 nullable/union-typed
// parameters, and this schema's field count is well over that if each one is `.nullable()`.
const ExtractionSchema = z.object({
  sourceType: z.enum(['case', 'legislation', 'journal', 'book', 'report', 'researchPaper', 'website', 'treaty']),
  confidence: z.enum(['high', 'medium', 'low']),
  fields: z.object({
    caseName: z.string(),
    caseReportType: z.enum(['reported', 'unreported-mnc', 'not-applicable']),
    year: z.string(),
    volume: z.string(),
    reportAbbreviation: z.string(),
    startingPage: z.string(),
    courtCode: z.string(),
    caseNumber: z.string(),
    judge: z.string(),
    actTitle: z.string(),
    jurisdiction: z.string(),
    authors: z.array(z.string()),
    articleTitle: z.string(),
    issue: z.string(),
    journalName: z.string(),
    title: z.string(),
    publisher: z.string(),
    edition: z.string(),
    documentType: z.string(),
    seriesNumber: z.string(),
    institution: z.string(),
    date: z.string(),
    documentTitle: z.string(),
    websiteName: z.string(),
    openedForSignature: z.string(),
    treatySeries: z.string(),
    enteredIntoForce: z.string(),
  }),
})

type ExtractedFields = z.infer<typeof ExtractionSchema>['fields']

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

function extractPageContent(html: string) {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header').remove()

  const title = $('title').text().trim()

  // Pages can carry multiple <meta name="author"> tags (eg multi-author news articles) —
  // .attr() on a multi-element match only ever returns the first, so collect them all.
  const authorNames = $('meta[name="author"]')
    .map((_, el) => $(el).attr('content')?.trim())
    .get()
    .filter((value): value is string => Boolean(value))
  const metaAuthor =
    authorNames.length > 0 ? authorNames.join('; ') : ($('meta[property="article:author"]').attr('content') ?? '')

  const metaDate =
    $('meta[name="date"]').attr('content') ??
    $('meta[name="pubdate"]').attr('content') ??
    $('meta[name="publish-date"]').attr('content') ??
    $('meta[property="article:published_time"]').attr('content') ??
    $('meta[property="og:updated_time"]').attr('content') ??
    $('meta[itemprop="datePublished"]').attr('content') ??
    ''

  const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, CONTENT_CHAR_LIMIT)

  return { title, metaAuthor, metaDate, content }
}

function mapFieldsToSourceType(sourceType: SourceType, raw: ExtractedFields, url: string): AutofillFields {
  const authors = raw.authors.filter((author) => author.trim().length > 0)

  switch (sourceType) {
    case 'case':
      return {
        caseName: raw.caseName,
        reportType: raw.caseReportType === 'unreported-mnc' ? 'unreported-mnc' : 'reported',
        year: raw.year,
        volume: raw.volume || undefined,
        reportAbbreviation: raw.reportAbbreviation || undefined,
        startingPage: raw.startingPage || undefined,
        courtCode: raw.courtCode || undefined,
        caseNumber: raw.caseNumber || undefined,
        judge: raw.judge || undefined,
      }
    case 'legislation': {
      const jurisdiction: LegislationFields['jurisdiction'] = normalizeJurisdiction(raw.jurisdiction) ?? 'Cth'
      // Safety net regardless of how well the model followed the "no year in actTitle"
      // instruction above — the citation engine italicises title and year together itself.
      const { title: actTitle, year } = stripTrailingYear(raw.actTitle, raw.year)
      return {
        actTitle,
        year,
        jurisdiction,
      }
    }
    case 'journal':
      return {
        authors,
        articleTitle: raw.articleTitle,
        year: raw.year,
        volume: raw.volume || undefined,
        issue: raw.issue || undefined,
        journalName: raw.journalName,
        startingPage: raw.startingPage,
      }
    case 'book':
      return {
        bookType: 'book',
        authors: authors.length > 0 ? authors : undefined,
        title: raw.title,
        publisher: raw.publisher,
        year: raw.year,
        edition: raw.edition || undefined,
      }
    case 'report':
      return {
        authors: authors.length > 0 ? authors : undefined,
        title: raw.title,
        documentType: raw.documentType || 'Report',
        seriesNumber: raw.seriesNumber || undefined,
        date: raw.date,
      }
    case 'researchPaper':
      return {
        authors: authors.length > 0 ? authors : undefined,
        title: raw.title,
        documentType: raw.documentType || 'Research Paper',
        seriesNumber: raw.seriesNumber || undefined,
        institution: raw.institution,
        date: raw.date,
      }
    case 'treaty':
      return {
        title: raw.title,
        treatyType: 'multilateral',
        openedForSignature: raw.openedForSignature || undefined,
        treatySeries: raw.treatySeries,
        enteredIntoForce: raw.enteredIntoForce || undefined,
      }
    case 'website':
    default:
      return {
        authors: authors.length > 0 ? authors : undefined,
        documentTitle: raw.documentTitle || raw.title,
        websiteName: raw.websiteName,
        documentType: 'Web Page',
        date: raw.date || undefined,
        url,
      }
  }
}

// suggestAlternative is only meaningful for a URL-based attempt — a failure while already
// processing an uploaded PDF or pasted text shouldn't recommend the very thing that just failed.
function fallbackResult(url: string, suggestAlternative = false): AutofillResult {
  const message = suggestAlternative
    ? `Could not extract details — please fill fields manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`
    : 'Could not extract details — please fill fields manually.'
  return {
    detectedSourceType: 'website',
    fields: { url, documentTitle: '' },
    confidence: 'low',
    message,
  }
}

interface ExtractionSource {
  title: string
  metaAuthor: string
  metaDate: string
  content: string
  url: string
}

/**
 * Shared by both the URL-fetch path and the direct-PDF-upload path — everything past "here's
 * some page/document content" is identical. When the caller already knows the source type (eg an
 * AU legislation domain, or a hint threaded through from elsewhere), passing it here does two
 * things: it tells the model what fields matter instead of leaving it to guess the source type
 * from content alone, and — more importantly — mapFieldsToSourceType is forced to use it rather
 * than trusting a possibly-wrong guess, so the returned fields are always shaped correctly for
 * the type the caller expects.
 */
async function runExtraction(source: ExtractionSource, sourceTypeHint?: SourceType): Promise<AutofillResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')

  const hintLine = sourceTypeHint
    ? `\n\nThis source is already known to be of type "${sourceTypeHint}" — extract fields for that type.`
    : ''
  const urlLine = source.url ? `URL: ${source.url}\n\n` : ''

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'low',
      format: zodOutputFormat(ExtractionSchema),
    },
    messages: [
      {
        role: 'user',
        content: `Extract citation metadata from this ${source.url ? 'webpage' : 'document'}.\n\n${urlLine}Page title: ${source.title}\n\nMeta author(s) (if more than one, semicolon-separated — include every one as a separate author): ${source.metaAuthor}\n\nMeta date: ${source.metaDate}\n\nContent:\n${source.content}${hintLine}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    return fallbackResult(source.url, !!source.url)
  }

  const parsed = response.parsed_output
  const sourceType = sourceTypeHint ?? parsed.sourceType
  const fields = mapFieldsToSourceType(sourceType, parsed.fields, source.url)

  return {
    detectedSourceType: sourceType,
    fields,
    confidence: parsed.confidence,
  }
}

export async function aiExtractFromUrl(url: string, sourceTypeHint?: SourceType): Promise<AutofillResult> {
  const cacheKey = `autofill:ai-extract:${hashKey(url)}:${sourceTypeHint ?? ''}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let title: string
    let metaAuthor: string
    let metaDate: string
    let content: string
    try {
      const response = await fetchWithUserAgentFallback(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

      if (isPdfContentType(response.headers.get('content-type'))) {
        title = ''
        metaAuthor = ''
        metaDate = ''
        content = await extractPdfText(await response.arrayBuffer(), CONTENT_CHAR_LIMIT)
      } else {
        ;({ title, metaAuthor, metaDate, content } = extractPageContent(await response.text()))
      }
    } finally {
      clearTimeout(timeout)
    }

    const result = await runExtraction({ title, metaAuthor, metaDate, content, url }, sourceTypeHint)
    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult(url, true)
  }
}

export interface PdfMetadataInput {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  rawText?: string
}

/**
 * For a PDF the student uploads — parsed entirely client-side (see
 * lib/pdf-extract/client-extract.ts) so the file itself, and the bulk of its text, never reach
 * the server. This only ever receives the small text-only summary that extraction produces (a
 * handful of document-properties fields plus a ~2000-character snippet of page 1), not the file.
 */
export async function aiExtractFromPdfMetadata(metadata: PdfMetadataInput): Promise<AutofillResult> {
  const supplementaryLines = [
    metadata.subject ? `Subject: ${metadata.subject}` : '',
    metadata.keywords ? `Keywords: ${metadata.keywords}` : '',
    metadata.creator ? `Creator: ${metadata.creator}` : '',
    metadata.producer ? `Producer: ${metadata.producer}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const content = [supplementaryLines, metadata.rawText ?? ''].filter(Boolean).join('\n\n')

  try {
    const result = await runExtraction({
      title: metadata.title ?? '',
      metaAuthor: metadata.author ?? '',
      metaDate: '',
      content,
      url: '',
    })
    return finalizeAutofillResult(result, false)
  } catch {
    return fallbackResult('')
  }
}

/**
 * For citation details copied by hand from a source Pinpoint can't fetch itself — eg a login-
 * gated database like Lexis+ or Westlaw. No fetch or parsing involved, so this can't fail the
 * way the URL/PDF paths can; any error here is a genuine extraction failure.
 */
export async function aiExtractFromPastedText(text: string): Promise<AutofillResult> {
  try {
    const result = await runExtraction({
      title: '',
      metaAuthor: '',
      metaDate: '',
      content: text.slice(0, CONTENT_CHAR_LIMIT),
      url: '',
    })
    return finalizeAutofillResult(result, false)
  } catch {
    return fallbackResult('')
  }
}
