import 'server-only'
import * as cheerio from 'cheerio'
import { getCached, setCached } from '../cache'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'
import { hashKey, TRY_ALTERNATIVE_INPUT_SUGGESTION } from './utils'
import { parseAustliiCase } from './austlii-cases-parse'

// How much of the page's leading text (after the title) the citation patterns are allowed to see.
// A real AustLII case page states its citation right at the top; anything past this is body text
// where a loose regex could easily false-match.
const CITATION_HEAD_CHARS = 500

// Confirmed by direct testing (same Cloudflare bot challenge as legislation.nsw.gov.au and
// legislation.sa.gov.au) — a genuine, permanent limitation rather than an intermittent failure.
function fallbackResult(): AutofillResult {
  return {
    detectedSourceType: 'case',
    fields: {},
    confidence: 'low',
    message: `AustLII blocks automated requests, so case details could not be fetched automatically — please fill fields manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`,
  }
}

export async function scrapeAustliiCase(url: string): Promise<AutofillResult> {
  const cacheKey = `autofill:austlii-case:${hashKey(url)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetchWithUserAgentFallback(url)
    if (!response.ok) throw new Error(`AustLII request failed: ${response.status}`)
    const html = await response.text()
    const $ = cheerio.load(html)

    const rawTitle = $('title').text()
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
    const citationText = `${rawTitle}\n${bodyText.slice(0, CITATION_HEAD_CHARS)}`

    const { fields, confidence } = parseAustliiCase(rawTitle, citationText, bodyText)

    const result: AutofillResult = { detectedSourceType: 'case', fields, confidence }
    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult()
  }
}
