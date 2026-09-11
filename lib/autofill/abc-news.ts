import 'server-only'
import * as cheerio from 'cheerio'
import { isABCVideoContentType, parseABCVideoNextData } from './abc-news-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'

// See abc-news-parse.ts for why this exists at all — abc.net.au/news hosts both ordinary
// articles and video/TV content, and the generic AI-extraction path had no way to tell them
// apart. Deliberately narrower in scope than Canada/UK/US Code's dedicated routes: an ordinary
// article still goes through the same AI-hinted extraction it always has (now explicitly hinted
// 'newspaper', since ABC.ContentType has already confirmed that much deterministically) — only the
// video case is genuinely new behaviour.
export async function handleABCNews(url: string): Promise<AutofillResult> {
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
    const contentType = $('meta[property="ABC.ContentType"]').attr('content') ?? ''

    if (!isABCVideoContentType(contentType)) {
      // A genuine article (or any other ABC.ContentType this parser doesn't specifically handle,
      // eg a live blog or photo gallery) — the ordinary newspaper-article path already works fine
      // for these, now with a confirmed, explicit hint rather than leaving the model to guess.
      return aiExtractFromUrl(url, 'newspaper')
    }

    const nextDataText = $('script#__NEXT_DATA__').text()
    const nextData = nextDataText ? safeJsonParse(nextDataText) : undefined
    const citation = parseABCVideoNextData(nextData)

    if (citation) {
      return {
        detectedSourceType: 'otherSources',
        confidence: 'high',
        fields: {
          subtype: 'filmOrMedia',
          mediaFormat: 'tvSeries',
          mediaEpisodeTitle: citation.episodeTitle,
          mediaTitle: citation.seriesTitle,
          mediaStudio: 'Australian Broadcasting Corporation',
          mediaDate: citation.date,
          mediaUrl: url,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // Confirmed video, but the __NEXT_DATA__ shape didn't match what parseABCVideoNextData expects
  // (or the fetch itself failed) — fall back to the ordinary AI-hinted extraction with an
  // 'otherSources' hint (the SYSTEM_PROMPT's own filmOrMedia guidance covers ABC News video pages
  // specifically) rather than failing outright.
  return aiExtractFromUrl(url, 'otherSources')
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
