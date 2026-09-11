import 'server-only'
import * as cheerio from 'cheerio'
import {
  detectUKJurisdictionFromUrl,
  isUKDelegatedLegislationUrl,
  parseUKUrlLegislation,
  ukInstrumentTypeForJurisdiction,
} from './uk-legislation-parse'
import { aiExtractFromUrl, FETCH_TIMEOUT_MS, MAX_FETCH_BYTES } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'
import { stripTrailingYear } from './utils'

function stripLeadingThe(title: string): string {
  return title.replace(/^the\s+/i, '')
}

// See uk-legislation-parse.ts for why this bypasses the AI-based extraction path entirely,
// mirroring canada-legislation.ts's own reasoning and structure.
export async function handleUKLegislation(url: string): Promise<AutofillResult> {
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

    const $ = cheerio.load(html)
    const info = parseUKUrlLegislation(url)
    const jurisdiction = detectUKJurisdictionFromUrl(url) ?? 'UK'

    // legislation.gov.uk's own <title> tag includes the year as part of the Act's/instrument's
    // own name (eg 'Online Safety Act 2023', 'The Fertilisers (Amendment) Regulations 1998') —
    // matching AGLC4 r 24.2.1's own convention that the year is part of the title. But
    // ForeignDomesticForm.tsx/foreign-domestic.ts treat title and year as two separate fields
    // that the formatter glues back together itself, so leaving the year in both places produced
    // a real, confirmed-live duplicate (eg 'Fertilisers (Amendment) Regulations 1998 1998') —
    // stripTrailingYear (the same helper au-legislation.ts and ai-extract.ts already use for this
    // exact "title already has the year baked in" shape) removes it once here at the source.
    const rawTitle = info ? stripTrailingYear($('title').text().trim(), info.year).title : ''
    const title = stripLeadingThe(rawTitle)

    if (info && title) {
      if (isUKDelegatedLegislationUrl(url)) {
        return {
          detectedSourceType: 'internationalMaterial',
          confidence: 'high',
          fields: {
            subtype: 'foreignDomestic',
            foreignCountry: 'UK',
            foreignCategory: 'delegatedLegislation',
            title,
            year: info.year,
            ukJurisdiction: jurisdiction,
            ukInstrumentType: ukInstrumentTypeForJurisdiction(jurisdiction),
            ukInstrumentNumber: `${info.year}/${info.number}`,
          },
        }
      }

      // Ordinary legislation (r 24.2) — no chapter number at all for a post-1963 Act, which is
      // every Act this deterministic path (keyed off a plain 4-digit calendar year in the URL)
      // can actually reach; see parseUKUrlLegislation's own comment.
      return {
        detectedSourceType: 'internationalMaterial',
        confidence: 'high',
        fields: {
          subtype: 'foreignDomestic',
          foreignCountry: 'UK',
          foreignCategory: 'legislation',
          title,
          year: info.year,
          ukJurisdiction: jurisdiction,
        },
      }
    }
  } catch {
    // Falls through to the AI-hinted path below — same as any other fetch failure.
  }

  // The page didn't match the expected shape (or couldn't be fetched) — fall back to the ordinary
  // AI-hinted extraction rather than failing outright, in case this is some other legislation.gov.uk
  // page layout (eg a pre-1963 historical Act) the deterministic parser hasn't seen.
  return aiExtractFromUrl(url, 'internationalMaterial')
}
