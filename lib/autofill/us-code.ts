import 'server-only'
import * as cheerio from 'cheerio'
import { parseUSCodeTitleTag } from './us-code-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See us-code-parse.ts for why this bypasses the AI-based extraction path entirely, mirroring
// canada-legislation.ts/uk-legislation.ts's own reasoning and structure. Scope is deliberately
// federal US Code only (AGLC4 r 25.2) — session laws and state legislation are manual-entry only.
export async function handleUSCode(url: string): Promise<AutofillResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let html: string
    try {
      const response = await fetchWithUserAgentFallback(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

      const contentLength = response.headers.get('content-length')
      if (contentLength && Number(contentLength) > MAX_FETCH_BYTES) {
        return {
          detectedSourceType: 'website',
          fields: { url, documentTitle: '' },
          confidence: 'low',
          message:
            'This page is too large for Pinpoint to fetch directly. Please download it and upload the PDF here, or paste the citation details directly.',
        }
      }

      html = await response.text()
    } finally {
      clearTimeout(timeout)
    }

    const title = cheerio.load(html)('title').text().trim()
    const citation = parseUSCodeTitleTag(title)

    if (citation) {
      return {
        detectedSourceType: 'internationalMaterial',
        confidence: 'high',
        fields: {
          subtype: 'foreignDomestic',
          foreignCountry: 'US',
          foreignCategory: 'legislation',
          usTitleOrChapterNumber: citation.titleNumber,
          usCodeAbbrev: 'USC',
          pinpoint: `§ ${citation.section}`,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case Cornell's page layout has changed
  // or this is some other law.cornell.edu/uscode page shape the deterministic parser hasn't seen.
  return aiExtractFromUrl(url, 'internationalMaterial')
}
