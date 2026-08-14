import 'server-only'
import * as cheerio from 'cheerio'
import { getCached, setCached } from '../cache'
import { CaseFields } from '../citation-engine/types'
import { fetchWithUserAgentFallback } from './fetch'
import { AutofillResult } from './types'
import { hashKey, TRY_ALTERNATIVE_INPUT_SUGGESTION } from './utils'

const REPORTED_CITATION_PATTERN = /(\d+)\s+([A-Z][A-Za-z\s]+\w)\s+(\d+)/
const MNC_PATTERN = /\[(\d{4})]\s+([A-Z]+)\s+(\d+)/
const JUDGE_PATTERN = /(?:Coram|Before):\s*([^.\n]+)/i
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
const DATE_PATTERN = new RegExp(`\\b(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})\\b`)

function cleanCaseName(rawTitle: string): string {
  let name = rawTitle.replace(/\s*-\s*AustLII\s*$/i, '').trim()
  name = name.replace(/\s*\[\d{4}]\s*[A-Z]+\s*\d+.*$/, '').trim()
  return name
}

// Confirmed by direct testing (same Cloudflare bot challenge as legislation.nsw.gov.au and
// legislation.sa.gov.au) — a genuine, permanent limitation rather than an intermittent failure.
function fallbackResult(): AutofillResult {
  return {
    detectedSourceType: 'case',
    fields: {},
    confidence: 'low',
    message: `AustLII blocks automated requests, so case details could not be fetched automatically — please fill fields manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`,
  }
}

export async function scrapeAustliiCase(url: string): Promise<AutofillResult> {
  const cacheKey = `autofill:austlii-case:${hashKey(url)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetchWithUserAgentFallback(url)
    if (!response.ok) throw new Error(`AustLII request failed: ${response.status}`)
    const html = await response.text()
    const $ = cheerio.load(html)

    const caseName = cleanCaseName($('title').text())
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

    const reportedMatch = bodyText.match(REPORTED_CITATION_PATTERN)
    const mncMatch = bodyText.match(MNC_PATTERN)
    const judgeMatch = bodyText.match(JUDGE_PATTERN)
    const dateMatch = bodyText.slice(0, 2000).match(DATE_PATTERN)

    const fields: Partial<CaseFields> = { caseName }
    let confidence: AutofillResult['confidence'] = 'low'
    let reportType: CaseFields['reportType'] = 'unreported-no-mnc'

    if (reportedMatch) {
      fields.volume = reportedMatch[1]
      fields.reportAbbreviation = reportedMatch[2].trim()
      fields.startingPage = reportedMatch[3]
      if (mncMatch) fields.year = mncMatch[1]
      reportType = 'reported'
      confidence = 'high'
    } else if (mncMatch) {
      fields.year = mncMatch[1]
      fields.courtCode = mncMatch[2]
      fields.caseNumber = mncMatch[3]
      reportType = 'unreported-mnc'
      confidence = 'medium'
    }

    if (judgeMatch) fields.judge = judgeMatch[1].trim()
    if (dateMatch && reportType === 'unreported-no-mnc') fields.date = dateMatch[1]
    fields.reportType = reportType

    const result: AutofillResult = { detectedSourceType: 'case', fields, confidence }
    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult()
  }
}
