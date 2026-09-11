import 'server-only'
import * as cheerio from 'cheerio'
import { parseXPost } from './x-post-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See x-post-parse.ts for why this bypasses the AI-based extraction path entirely, mirroring
// canada-legislation.ts/uk-legislation.ts/us-code.ts's own reasoning and structure.
export async function handleXPost(url: string): Promise<AutofillResult> {
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
    const ogDescription = $('meta[property="og:description"]').attr('content') ?? ''
    const publishedTime = $('meta[property="article:published_time"]').attr('content') ?? ''
    const citation = parseXPost(ogTitle, ogDescription, publishedTime)

    if (citation) {
      return {
        detectedSourceType: 'otherSources',
        confidence: 'high',
        fields: {
          subtype: 'socialMedia',
          socialMediaUsername: citation.username,
          socialMediaRealName: citation.realName,
          socialMediaTitle: citation.text,
          socialMediaPlatform: 'Twitter',
          socialMediaDate: citation.date,
          socialMediaTime: citation.time,
          socialMediaTimeZone: citation.timeZone,
          socialMediaUrl: url,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case X's page layout has changed.
  return aiExtractFromUrl(url, 'otherSources')
}
