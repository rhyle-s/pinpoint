import { UKInstrumentType } from '../citation-engine/types'

/**
 * legislation.gov.uk encodes which UK Parliament/Assembly passed an Act directly in the URL path
 * segment right after the domain (eg '/ukpga/2023/50' vs '/nia/2008/8') — a reliable,
 * deterministic signal, the same shape as au-legislation.ts's detectBillSubtype(). 'uksi'/'nisr'/
 * 'ssi'/'wsi' are the delegated-legislation equivalents.
 */
// 'mwa' (pre-2011 Measures), 'anaw' (2011–2020 Acts of the National Assembly for Wales), and
// 'asc' (2020– Acts of Senedd Cymru, after the Assembly's own rename) are three genuinely
// different URL segments across Welsh legislative history — confirmed against real pages, not
// assumed to be a closed set (a real 2020 Senedd/Assembly Act URL, '/anaw/2020/1/...', was the
// original bug report; '/asc/...' was found and confirmed the same way while fixing it).
const UK_JURISDICTION_URL_SEGMENTS: Record<string, 'UK' | 'NI' | 'Scot' | 'Wales'> = {
  ukpga: 'UK',
  uksi: 'UK',
  nia: 'NI',
  nisr: 'NI',
  asp: 'Scot',
  ssi: 'Scot',
  mwa: 'Wales',
  anaw: 'Wales',
  asc: 'Wales',
  wsi: 'Wales',
}

/** Which of the delegated-legislation URL segments (as opposed to ordinary legislation ones). */
const UK_DELEGATED_SEGMENTS = new Set(['uksi', 'nisr', 'ssi', 'wsi'])

export function detectUKJurisdictionFromUrl(url: string): 'UK' | 'NI' | 'Scot' | 'Wales' | undefined {
  const match = url.match(/legislation\.gov\.uk\/([a-z]+)\//i)
  if (!match) return undefined
  return UK_JURISDICTION_URL_SEGMENTS[match[1].toLowerCase()]
}

export function isUKDelegatedLegislationUrl(url: string): boolean {
  const match = url.match(/legislation\.gov\.uk\/([a-z]+)\//i)
  return !!match && UK_DELEGATED_SEGMENTS.has(match[1].toLowerCase())
}

// r 24.3's own instrument-type table only lists UK (1890-1947 'SR & O', 1947- 'SI') and Northern
// Ireland ('SR') explicitly; Scottish Statutory Instruments are also 'SI' per the same table.
// Wales isn't separately listed — defaulted to 'SI' here, the general post-1947 UK convention,
// same as Scotland.
const UK_INSTRUMENT_TYPE_BY_JURISDICTION: Record<'UK' | 'NI' | 'Scot' | 'Wales', UKInstrumentType> = {
  UK: 'SI',
  NI: 'SR',
  Scot: 'SI',
  Wales: 'SI',
}

export function ukInstrumentTypeForJurisdiction(jurisdiction: 'UK' | 'NI' | 'Scot' | 'Wales'): UKInstrumentType {
  return UK_INSTRUMENT_TYPE_BY_JURISDICTION[jurisdiction]
}

/**
 * legislation.gov.uk's own URL path already encodes the year and the site's internal
 * type/instrument number directly (eg '/ukpga/2023/50/contents' -> year '2023', number '50';
 * '/uksi/1998/2024/contents/made' -> year '1998', number '2024') — the same shape for every
 * jurisdiction and for both ordinary and delegated legislation, confirmed against every real URL
 * this app is expected to handle. That number is exactly what r 24.3 needs for delegated
 * legislation's own 'Year/Number' instrument number (eg 'SI 1998/2024').
 *
 * It is deliberately NOT used as an ordinary-legislation chapter number, unlike an earlier version
 * of this parser: AGLC4 r 24.2.3 includes a chapter number ONLY for statutes enacted before
 * 1 January 1963 (in the 'RegnalYear, c Number' form) — every post-1963 UK/NI/Scot/Wales statute
 * has no number in its citation at all, confirmed directly against every one of r 24.2.2's own
 * worked examples. legislation.gov.uk's own real-world citation practice (chapter/'asp'/'anaw'
 * numbers for every Act, regardless of era) is not the same as AGLC4's — a direct search of the
 * entire AGLC4 guide confirms 'asp'/'nawm'/'anaw'/'asc' don't appear in it anywhere. Reading the
 * number straight from the URL is also simpler and more robust than the earlier version's
 * approach (parsing the page's own 'You are here:' breadcrumb text) — no fetch/page-shape
 * dependency at all for this part.
 */
export interface UKUrlLegislationInfo {
  year: string
  number: string // the site's own type/instrument number — only meaningful for delegated legislation (r 24.3); see comment above
}

export function parseUKUrlLegislation(url: string): UKUrlLegislationInfo | undefined {
  const match = url.match(/legislation\.gov\.uk\/[a-z]+\/(\d{4})\/(\d+)/i)
  if (!match) return undefined
  return { year: match[1], number: match[2] }
}
