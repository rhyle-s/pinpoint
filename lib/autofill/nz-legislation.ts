import 'server-only'
import * as cheerio from 'cheerio'
import { parseNZTitleTag } from './nz-legislation-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See nz-legislation-parse.ts for why this bypasses the AI-based extraction path entirely,
// mirroring canada-legislation.ts/uk-legislation.ts/us-code.ts's own reasoning and structure.
// Scope is deliberately ordinary public Acts only (the `/act/` URL segment, matching the one URL
// shape this was actually confirmed against) — NZ delegated legislation (Regulations, cited 'SR
// Year/Number' per r 21.2.2) lives under a different `/regulation/` URL segment this parser
// hasn't been verified against, so it's left to the AI-hinted fallback below rather than guessed.
export async function handleNZLegislation(url: string): Promise<AutofillResult> {
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

    const title = cheerio.load(html)('title').text()
    const citation = parseNZTitleTag(title)

    if (citation) {
      return {
        detectedSourceType: 'internationalMaterial',
        confidence: 'high',
        fields: {
          subtype: 'foreignDomestic',
          foreignCountry: 'NewZealand',
          foreignCategory: 'legislation',
          title: citation.title,
          year: citation.year,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case this is NZ delegated legislation
  // (a different URL shape, see above) or the site's page layout has changed.
  return aiExtractFromUrl(url, 'internationalMaterial')
}
