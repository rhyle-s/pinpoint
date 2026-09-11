import 'server-only'
import * as cheerio from 'cheerio'
import { parseYouTubePage } from './youtube-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See youtube-parse.ts for why this bypasses the AI-based extraction path entirely, mirroring
// x-post.ts's own reasoning and structure. Confirmed live as the actual bug: the generic
// AI-extraction path's shared content-cleanup/character budget never reaches the channel name at
// all on a real youtube.com/watch page (it sits deep in the page, well past what a ~4000-character
// window captures), so socialMediaUsername came back empty — not a prompt-wording gap, a content-
// visibility one, the same class of bug canada-legislation.ts/uk-legislation.ts were built to fix.
export async function handleYouTube(url: string): Promise<AutofillResult> {
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
    const channelName = $('span[itemprop="author"] link[itemprop="name"]').attr('content') ?? ''
    const datePublished = $('meta[itemprop="datePublished"]').attr('content') ?? ''
    const citation = parseYouTubePage(ogTitle, channelName, datePublished)

    if (citation) {
      return {
        detectedSourceType: 'otherSources',
        confidence: 'high',
        fields: {
          subtype: 'socialMedia',
          socialMediaUsername: citation.channelName,
          socialMediaTitle: citation.title,
          socialMediaPlatform: 'YouTube',
          socialMediaDate: citation.date,
          socialMediaUrl: url,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case YouTube's page layout has changed.
  return aiExtractFromUrl(url, 'otherSources')
}
