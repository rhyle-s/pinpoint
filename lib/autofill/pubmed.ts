import 'server-only'
import * as cheerio from 'cheerio'
import { getCached, setCached } from '../cache'
import { JournalFields } from '../citation-engine/types'
import { stripTrailingFullStop } from '../citation-engine/utils'
import { AutofillResult } from './types'
import { formatAuthorAGLC4, hashKey } from './utils'

const USER_AGENT = 'Pinpoint/1.0 (aglcite.com.au; mailto:contact@aglcite.com.au)'
const FETCH_TIMEOUT_MS = 15_000

// cheerio.load()'s return type doesn't structurally match the separately-exported `CheerioAPI`
// type in this cheerio version — deriving both local aliases from `typeof cheerio.load` itself
// keeps them consistent rather than fighting the mismatch.
type CheerioRoot = ReturnType<typeof cheerio.load>
type CheerioNode = ReturnType<CheerioRoot>

function fallbackResult(): AutofillResult {
  return {
    detectedSourceType: 'journal',
    fields: {},
    confidence: 'low',
    message: 'Could not look up this PubMed article — please fill fields manually.',
  }
}

/** A four-digit year pulled out of whichever date field is populated — older MEDLINE records
 *  sometimes carry only a free-text 'MedlineDate' (eg '1977 Jul-Dec') instead of a plain Year. */
function extractYear(pubDate: CheerioNode): string {
  const year = pubDate.find('Year').first().text().trim()
  if (year) return year
  const medlineDate = pubDate.find('MedlineDate').first().text().trim()
  return medlineDate.match(/\d{4}/)?.[0] ?? ''
}

function buildAuthors($: CheerioRoot): string[] {
  return $('AuthorList > Author')
    .map((_, el) => {
      const author = $(el)
      const family = author.find('LastName').first().text().trim()
      const given = author.find('ForeName').first().text().trim() || author.find('Initials').first().text().trim()
      // A 'CollectiveName' (eg a working group or consortium credited as sole author) has no
      // LastName/ForeName split at all — used as-is rather than run through the given/family joiner.
      if (!family) return author.find('CollectiveName').first().text().trim()
      return formatAuthorAGLC4(given, family)
    })
    .get()
    .filter(Boolean)
}

function buildJournalFields($: CheerioRoot): Partial<JournalFields> {
  const article = $('Article').first()
  const journal = article.find('Journal').first()
  const journalIssue = journal.find('JournalIssue').first()
  const pagination = article.find('Pagination').first()

  const startPage = pagination.find('StartPage').first().text().trim()
  const medlinePgn = pagination.find('MedlinePgn').first().text().trim()

  return {
    authors: buildAuthors($),
    // MEDLINE normalises every ArticleTitle to end with a full stop even when the original didn't
    // have one — left in place, this collides with the citation engine's own closing punctuation.
    articleTitle: stripTrailingFullStop(article.find('ArticleTitle').first().text().trim()),
    year: extractYear(journalIssue.find('PubDate').first()),
    volume: journalIssue.find('Volume').first().text().trim() || undefined,
    issue: journalIssue.find('Issue').first().text().trim() || undefined,
    // The full journal name (eg 'Public health reviews'), not the abbreviated ISOAbbreviation
    // (eg 'Public Health Rev') that MEDLINE also carries — AGLC4 wants the full name.
    journalName: journal.find('Title').first().text().trim(),
    startingPage: startPage || medlinePgn.split(/[-–]/)[0]?.trim() || '',
  }
}

export async function fetchPubMedArticle(pmid: string): Promise<AutofillResult> {
  const cacheKey = `autofill:pubmed:${hashKey(pmid)}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let xml: string
    try {
      const response = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&retmode=xml`,
        { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal },
      )
      if (!response.ok) throw new Error(`PubMed eutils request failed: ${response.status}`)
      xml = await response.text()
    } finally {
      clearTimeout(timeout)
    }

    const $ = cheerio.load(xml, { xmlMode: true })
    if ($('PubmedArticle').length === 0) return fallbackResult()

    const fields = buildJournalFields($)
    const result: AutofillResult = { detectedSourceType: 'journal', fields, confidence: 'high' }

    await setCached(cacheKey, result)
    return result
  } catch {
    return fallbackResult()
  }
}
