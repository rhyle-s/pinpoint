import 'server-only'
import * as cheerio from 'cheerio'
import { LegislationFields, LegislationPinpointType } from '../citation-engine/types'
import { aiExtractFromUrl } from './ai-extract'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'
import { TRY_ALTERNATIVE_INPUT_SUGGESTION } from './utils'

const LANDING_PAGE_TIMEOUT_MS = 8_000

// Hostname -> jurisdiction. Each state/territory runs "legislation" as a subdomain of its own
// gov.au domain, so these are unambiguous exact matches (unlike the Commonwealth's own
// legislation.gov.au, which has no state segment and is left on the generic AI-extraction path).
const AU_LEGISLATION_DOMAINS: Record<string, LegislationFields['jurisdiction']> = {
  'legislation.nsw.gov.au': 'NSW',
  'legislation.qld.gov.au': 'Qld',
  'legislation.vic.gov.au': 'Vic',
  'legislation.wa.gov.au': 'WA',
  'legislation.sa.gov.au': 'SA',
  'legislation.tas.gov.au': 'Tas',
  'legislation.act.gov.au': 'ACT',
  'legislation.nt.gov.au': 'NT',
}

// Confirmed by direct testing for NSW and Qld, which run the same underlying legislation
// platform as Tasmania — so extended to Tas too. Deliberately NOT applied to Vic/WA/SA/ACT/NT,
// which run different, unverified platforms: guessing a pinpoint wrong is worse than not
// filling one in, since a citation with a silently incorrect pinpoint reads as correct.
const PINPOINT_FRAGMENT_JURISDICTIONS: ReadonlySet<LegislationFields['jurisdiction']> = new Set<
  LegislationFields['jurisdiction']
>(['NSW', 'Qld', 'Tas'])

// This platform's URL fragments encode the full hierarchical path to a point in the Act, broad
// to narrow — eg '#ch.2-pt.3A-sec.18' for chapter 2, part 3A, section 18. AGLC4 only pinpoints
// the most specific unit actually referenced, so among whichever of these segments are present,
// the last (rightmost, most specific) one wins. 'ch' (chapter) has no AGLC4 pinpoint abbreviation
// this app supports, so a chapter-only fragment intentionally yields no pinpoint rather than a
// wrong one — matching the "don't guess" principle above.
const PINPOINT_FRAGMENT_PATTERN = /(sec|ss|sch|pt|div|reg)\.(\d+[a-zA-Z]*)/g
const FRAGMENT_ABBREVIATION_TO_PINPOINT_TYPE: Record<string, LegislationPinpointType> = {
  sec: 's',
  ss: 'ss',
  sch: 'sch',
  pt: 'pt',
  div: 'div',
  reg: 'reg',
}

// legislation.nsw.gov.au and legislation.sa.gov.au block plain server-side requests with a
// Cloudflare bot challenge at the whole-domain level (confirmed directly, not just this page) —
// there's no DOI-style workaround the way there was for SAGE, so this is a genuine, permanent
// limitation rather than a bug to route around.
const KNOWN_BLOCKED_DOMAINS = new Set(['legislation.nsw.gov.au', 'legislation.sa.gov.au'])

function detectJurisdiction(url: string): LegislationFields['jurisdiction'] | undefined {
  const lower = url.toLowerCase()
  const domain = Object.keys(AU_LEGISLATION_DOMAINS).find((d) => lower.includes(d))
  return domain ? AU_LEGISLATION_DOMAINS[domain] : undefined
}

function detectBlockedDomain(url: string): string | undefined {
  const lower = url.toLowerCase()
  return Array.from(KNOWN_BLOCKED_DOMAINS).find((d) => lower.includes(d))
}

function extractPinpointFromUrl(
  url: string,
  jurisdiction: LegislationFields['jurisdiction'] | undefined,
): Partial<LegislationFields> | undefined {
  if (!jurisdiction || !PINPOINT_FRAGMENT_JURISDICTIONS.has(jurisdiction)) return undefined
  const fragment = url.split('#')[1]
  if (!fragment) return undefined
  const matches = Array.from(fragment.matchAll(PINPOINT_FRAGMENT_PATTERN))
  if (matches.length === 0) return undefined
  const [, abbreviation, value] = matches[matches.length - 1]
  return { pinpointType: FRAGMENT_ABBREVIATION_TO_PINPOINT_TYPE[abbreviation], pinpointValue: value }
}

/**
 * Victoria publishes Acts as a PDF linked from an HTML landing page (rather than a full HTML
 * view like NSW/Qld/Tas) — following that link first gives the extractor the actual authorised
 * text instead of just the landing page's boilerplate.
 */
async function resolveVicPdfUrl(landingUrl: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LANDING_PAGE_TIMEOUT_MS)
    try {
      const response = await fetchWithUserAgentFallback(landingUrl, { signal: controller.signal })
      if (!response.ok) return landingUrl
      const html = await response.text()
      const $ = cheerio.load(html)
      const href = $('a[href$=".pdf"]').first().attr('href')
      if (!href) return landingUrl
      return new URL(href, landingUrl).toString()
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return landingUrl
  }
}

function blockedFallback(
  jurisdiction: LegislationFields['jurisdiction'] | undefined,
  pinpoint: Partial<LegislationFields> | undefined,
): AutofillResult {
  const fields: Partial<LegislationFields> = { ...(jurisdiction ? { jurisdiction } : {}), ...pinpoint }
  const filledParts = [jurisdiction && 'jurisdiction', pinpoint && 'pinpoint'].filter(Boolean).join(' and ')
  return {
    detectedSourceType: 'legislation',
    fields,
    confidence: 'low',
    message: filledParts
      ? `This site blocks automated requests, so only the ${filledParts} could be filled from the link — please add the Act title and year manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`
      : `This site blocks automated requests — please fill fields manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`,
  }
}

export async function handleAuLegislation(url: string): Promise<AutofillResult> {
  const jurisdiction = detectJurisdiction(url)
  const pinpoint = extractPinpointFromUrl(url, jurisdiction)

  if (detectBlockedDomain(url)) {
    return blockedFallback(jurisdiction, pinpoint)
  }

  const contentUrl = jurisdiction === 'Vic' ? await resolveVicPdfUrl(url) : url
  const result = await aiExtractFromUrl(contentUrl, 'legislation')

  // aiExtractFromUrl always honours the 'legislation' hint on success — the only way to get a
  // different sourceType back here is its own generic failure fallback (fetch error, AI
  // refusal, etc), which we replace with a legislation-shaped one so jurisdiction and pinpoint
  // still make it through even when the page content didn't.
  if (result.detectedSourceType !== 'legislation') {
    return blockedFallback(jurisdiction, pinpoint)
  }

  return {
    ...result,
    fields: {
      ...result.fields,
      ...(jurisdiction ? { jurisdiction } : {}),
      ...pinpoint,
    },
  }
}
