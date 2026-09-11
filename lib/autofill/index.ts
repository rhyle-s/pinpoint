import 'server-only'
import { detectInputType, extractDoiFromUrl, extractPmidFromUrl, matchBlockedDatabase, matchBlockedDatabaseSourceType } from './detect'
import { scrapeAustliiCase } from './austlii-cases'
import { scrapeAustliiLegislation } from './austlii-legislation'
import { handleAuLegislation } from './au-legislation'
import { handleCanadaLegislation } from './canada-legislation'
import { handleUKLegislation } from './uk-legislation'
import { handleUSCode } from './us-code'
import { handleNZLegislation } from './nz-legislation'
import { fetchEuropeanUnionByIdentifier } from './eu-cellar'
import { extractEuIdentifierFromUrl } from './eu-cellar-parse'
import { handleXPost } from './x-post'
import { handleABSMaterials } from './abs-materials'
import { handleABCNews } from './abc-news'
import { handleYouTube } from './youtube'
import { fetchCrossRefDOI } from './crossref'
import { matchKnownOHCHRInstrument } from './known-ohchr-instruments'
import { fetchPubMedArticle } from './pubmed'
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
      case 'known-ohchr-instrument':
        return (
          matchKnownOHCHRInstrument(trimmed) ?? {
            detectedSourceType: 'internationalMaterial',
            fields: {},
            confidence: 'low',
            message: 'OHCHR restricts automated access, so Pinpoint is unable to retrieve citation details directly from this link. Please download the PDF and upload it here instead, or paste the citation details directly.',
          }
        )
      case 'blocked-database': {
        const name = matchBlockedDatabase(trimmed) ?? 'This source'
        return {
          detectedSourceType: matchBlockedDatabaseSourceType(trimmed),
          fields: {},
          confidence: 'low',
          message: `${name} restricts automated access, so Pinpoint is unable to retrieve citation details directly from this link. Please download the PDF and upload it here instead, or paste the citation details directly.`,
        }
      }
      case 'pubmed': {
        const pmid = extractPmidFromUrl(trimmed)
        return pmid
          ? fetchPubMedArticle(pmid)
          : { detectedSourceType: 'journal', fields: {}, confidence: 'low', message: 'Could not find a PubMed ID in this link — please fill fields manually.' }
      }
      case 'crossref-doi':
        return fetchCrossRefDOI(trimmed)
      case 'doi-url':
        return fetchCrossRefDOI(extractDoiFromUrl(trimmed))
      case 'jade-case':
      case 'generic-url':
        return aiExtractFromUrl(trimmed)
      case 'foreign-domestic-url':
        // decisions.scc-csc.ca (the only domain this covers) genuinely has no citation data in
        // its server-rendered HTML at all — see detect.ts's FOREIGN_DOMESTIC_DOMAINS comment for
        // the full investigation. Short-circuited here rather than attempting (and silently
        // failing) the generic AI extraction path, matching the blocked-database pattern above.
        return {
          detectedSourceType: 'internationalMaterial',
          fields: { subtype: 'foreignDomestic', foreignCountry: 'Canada', foreignCategory: 'case' },
          confidence: 'low',
          message:
            "The Supreme Court of Canada's own decisions site loads case details in a way Pinpoint can't read automatically, so citation details could not be fetched — please fill fields manually. Alternatively, save the page as a PDF and upload it, or paste the citation details directly.",
        }
      case 'eu-materials-url': {
        const identifier = extractEuIdentifierFromUrl(trimmed)
        const result = identifier ? await fetchEuropeanUnionByIdentifier(identifier) : null
        return result ?? aiExtractFromUrl(trimmed, 'internationalMaterial')
      }
      case 'canada-legislation':
        return handleCanadaLegislation(trimmed)
      case 'uk-legislation':
        return handleUKLegislation(trimmed)
      case 'us-code':
        return handleUSCode(trimmed)
      case 'nz-legislation':
        return handleNZLegislation(trimmed)
      case 'x-post':
        return handleXPost(trimmed)
      case 'abs-materials':
        return handleABSMaterials(trimmed)
      case 'abc-news':
        return handleABCNews(trimmed)
      case 'youtube':
        return handleYouTube(trimmed)
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
