import 'server-only'
import { detectInputType, extractDoiFromUrl } from './detect'
import { scrapeAustliiCase } from './austlii-cases'
import { scrapeAustliiLegislation } from './austlii-legislation'
import { handleAuLegislation } from './au-legislation'
import { fetchCrossRefDOI } from './crossref'
import { aiExtractFromUrl } from './ai-extract'
import { AutofillResult } from './types'
import { finalizeAutofillResult } from './utils'

export async function autofill(input: string): Promise<AutofillResult> {
  const trimmed = input.trim()
  const type = detectInputType(trimmed)

  const result = await (async (): Promise<AutofillResult> => {
    switch (type) {
      case 'austlii-case':
        return scrapeAustliiCase(trimmed)
      case 'austlii-legislation':
        return scrapeAustliiLegislation(trimmed)
      case 'au-legislation':
        return handleAuLegislation(trimmed)
      case 'sclqld-case-summary':
        return {
          detectedSourceType: 'case',
          fields: {},
          confidence: 'low',
          message:
            "This is a case summary page, not the judgment itself — Pinpoint can't pull citation details from it. Please find the actual judgment (usually linked from this page as a PDF) and paste that link instead, or upload the PDF directly.",
        }
      case 'crossref-doi':
        return fetchCrossRefDOI(trimmed)
      case 'doi-url':
        return fetchCrossRefDOI(extractDoiFromUrl(trimmed))
      case 'jade-case':
      case 'generic-url':
        return aiExtractFromUrl(trimmed)
      case 'unknown':
      default:
        return {
          detectedSourceType: 'website',
          fields: {},
          confidence: 'low',
          message: "That doesn't look like a URL or DOI — please paste a link or fill the fields manually.",
        }
    }
  })()

  return finalizeAutofillResult(result, true)
}

export * from './types'
export { detectInputType } from './detect'
