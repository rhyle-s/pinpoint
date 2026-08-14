import 'server-only'
import * as cheerio from 'cheerio'
import { getCached, setCached } from '../cache'
import { LegislationFields } from '../citation-engine/types'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'
import { hashKey, normalizeJurisdiction, stripTrailingYear, TRY_ALTERNATIVE_INPUT_SUGGESTION } from './utils'

function detectJurisdiction(url: string): LegislationFields['jurisdiction'] | undefined {
  const match = url.match(/\/legis\/([a-z]+)\//i)
  if (!match) return undefined
  return normalizeJurisdiction(match[1])
}

function parseTitleAndYear(rawTitle: string): { actTitle: string; year: string } {
  let text = rawTitle.replace(/\s*-\s*AustLII\s*$/i, '').trim()
  text = text.replace(/\s*\([A-Za-z]+\)\s*$/, '').trim()
  const { title, year } = stripTrailingYear(text)
  return { actTitle: title, year }
}

// Confirmed by direct testing (same Cloudflare bot challenge as legislation.nsw.gov.au and
// legislation.sa.gov.au) — a genuine, permanent limitation rather than an intermittent failure.
const OFFICIAL_SOURCE_NOTE =
  "For legislation, official government sources (eg legislation.gov.au, or the relevant state or territory's own legislation website) tend to yield more reliable results than AustLII."

function fallbackResult(jurisdiction?: LegislationFields['jurisdiction']): AutofillResult {
  const fields: Partial<LegislationFields> = jurisdiction ? { jurisdiction } : {}
  const unfilledNote = jurisdiction
    ? 'only the jurisdiction could be filled from the link — please add the Act title and year manually'
    : 'please fill in the Act title, year, and jurisdiction manually'
  return {
    detectedSourceType: 'legislation',
    fields,
    confidence: 'low',
    message: `AustLII blocks automated requests, so ${unfilledNote}. ${OFFICIAL_SOURCE_NOTE} ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`,
  }
}

export async function scrapeAustliiLegislation(url: string): Promise<AutofillResult> {
  const cacheKey = `autofill:austlii-legislation:${hashKey(url)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetchWithUserAgentFallback(url)
    if (!response.ok) throw new Error(`AustLII request failed: ${response.status}`)
    const html = await response.text()
    const $ = cheerio.load(html)

    const rawTitle = $('title').text().trim() || $('h1').first().text().trim()
    const { actTitle, year } = parseTitleAndYear(rawTitle)
    const jurisdiction = detectJurisdiction(url)

    const fields: Partial<LegislationFields> = { actTitle, year }
    if (jurisdiction) fields.jurisdiction = jurisdiction

    const result: AutofillResult = {
      detectedSourceType: 'legislation',
      fields,
      confidence: actTitle && year ? 'high' : 'medium',
    }
    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult(detectJurisdiction(url))
  }
}
