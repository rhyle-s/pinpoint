import 'server-only'
import * as cheerio from 'cheerio'
import { parseABSPage } from './abs-materials-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See abs-materials-parse.ts for why this bypasses the AI-based extraction path entirely,
// mirroring canada-legislation.ts/uk-legislation.ts/us-code.ts's own reasoning and structure.
export async function handleABSMaterials(url: string): Promise<AutofillResult> {
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
            'This page is too large for Pinpoint to fetch directly. Please paste the citation details directly.',
        }
      }

      html = await response.text()
    } finally {
      clearTimeout(timeout)
    }

    const $ = cheerio.load(html)
    const ogTitle = $('meta[property="og:title"]').attr('content') ?? ''
    const dctermsIssued = $('meta[name="dcterms.issued"]').attr('content') ?? ''
    const dctermsIsPartOf = $('meta[name="dcterms.isPartOf"]').attr('content') ?? ''
    const citation = parseABSPage(ogTitle, dctermsIssued, dctermsIsPartOf)

    if (citation) {
      return {
        detectedSourceType: 'otherSources',
        // Genuinely 'medium', not 'high', whenever no catalogue number was found — AGLC4 r 7.1.5
        // cites ABS materials specifically by catalogue number, so a release missing one (see
        // abs-materials-parse.ts) is still correctly extracted, but incompletely — worth a second
        // look, not a confident, complete result the way Canada/UK/US Code parses are.
        confidence: citation.catalogueNumber ? 'high' : 'medium',
        message: citation.catalogueNumber
          ? undefined
          : "This release doesn't state a catalogue number on its own page — recent ABS releases increasingly don't have one. Please double-check on the ABS site (or an older/related release) before leaving this blank.",
        fields: {
          subtype: 'abs',
          absTitle: citation.title,
          absCatalogueNumber: citation.catalogueNumber,
          absDate: citation.date,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case ABS's page layout has changed.
  return aiExtractFromUrl(url, 'otherSources')
}
