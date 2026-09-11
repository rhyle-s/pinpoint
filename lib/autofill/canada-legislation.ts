import 'server-only'
import * as cheerio from 'cheerio'
import { extractCanadaLegislationCitation } from './canada-legislation-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See canada-legislation-parse.ts for why this bypasses the AI-based extraction path entirely.
// Applies the exact same timeout/size protections aiExtractFromUrl does for its own fetch —
// necessary here too, since a student can just as easily paste a laws-lois.justice.gc.ca
// 'FullText.html' URL (some of which are 10MB+, see MAX_FETCH_BYTES's own comment) as an
// 'index.html' one, and this path fetches directly rather than going through that function.
export async function handleCanadaLegislation(url: string): Promise<AutofillResult> {
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
            "This page is too large for Pinpoint to fetch directly. Try the Act's 'index.html' landing page instead of 'FullText.html' if you pasted the latter, or download it and upload the PDF here, or paste the citation details directly.",
        }
      }

      html = await response.text()
    } finally {
      clearTimeout(timeout)
    }

    const title = cheerio.load(html)('title').text().trim()
    const citation = extractCanadaLegislationCitation(html, title)

    if (citation) {
      return {
        detectedSourceType: 'internationalMaterial',
        confidence: 'high',
        fields: {
          subtype: 'foreignDomestic',
          foreignCountry: 'Canada',
          foreignCategory: 'legislation',
          title,
          canadaStatuteVolumeType: citation.statuteVolumeType,
          canadaJurisdictionAbbrev: citation.jurisdictionAbbrev,
          year: citation.year,
          canadaChapter: citation.chapter,
          canadaSessionOrSupp: citation.sessionOrSupp,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case this is some other laws-lois page
  // layout the deterministic parser hasn't seen.
  return aiExtractFromUrl(url, 'internationalMaterial')
}
