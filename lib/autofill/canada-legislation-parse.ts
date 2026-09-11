import * as cheerio from 'cheerio'
import { CanadaStatuteVolumeType } from '../citation-engine/types'

/**
 * laws-lois.justice.gc.ca prints every Act's own citation right next to its title, in the fixed
 * form 'Title (Citation)' — eg 'Privacy Act (R.S.C., 1985, c. P-21)', 'Income Tax Act (R.S.C.,
 * 1985, c. 1 (5th Supp.))', 'Youth Criminal Justice Act (S.C. 2002, c. 1)'. Confirmed by direct
 * testing that this heading lives inside the page's own semantic <header> element — which
 * ai-extract.ts's shared extractPageContent() strips out entirely as generic site-navigation
 * chrome, correct for most sites but wrong here, since this particular site's real content lives
 * there too. Without this fix, the AI extractor was never shown the real citation at all: for a
 * very well-known Act (eg the Income Tax Act) it produced a citation that happened to be correct
 * purely from background/training knowledge of a famous statute, and for a less well-known one
 * (the Youth Criminal Justice Act) it confidently hallucinated a wrong one instead — same
 * underlying cause, just not equally visible. The citation line turns out to be exactly, reliably
 * parseable, so canada-legislation.ts bypasses the AI for Canada legislation entirely (matching
 * the known-treaties.ts/known-ohchr-instruments.ts precedent of never trusting an LLM to
 * reproduce a fact that can just be read directly), falling back to the ordinary AI-hinted path
 * only if a page doesn't match this expected shape.
 *
 * Kept in its own file, without a 'server-only' import (unlike canada-legislation.ts, which does
 * the actual fetching), purely so these pure parsing functions stay directly unit-testable —
 * 'server-only' breaks under the vitest test environment, matching every other fetch-driving file
 * in this app (eg au-legislation.ts), none of which have their own test file for that reason.
 */
const CITATION_LINE_PATTERN = /^(R\.S\.C\.?|S\.C\.?),?\s*(\d{4}),\s*c\.?\s*([A-Za-z0-9][A-Za-z0-9.-]*)\.?(?:\s*\(([^)]+)\))?/

export interface CanadaLegislationCitation {
  statuteVolumeType: CanadaStatuteVolumeType
  jurisdictionAbbrev: string
  year: string
  chapter: string
  sessionOrSupp?: string
}

/** Pure parser for the citation string itself (eg 'R.S.C., 1985, c. 1 (5th Supp.)'). */
export function parseCanadaCitationLine(citation: string): CanadaLegislationCitation | undefined {
  const match = citation.trim().match(CITATION_LINE_PATTERN)
  if (!match) return undefined
  const [, volumePrefix, year, chapterRaw, supp] = match
  return {
    statuteVolumeType: volumePrefix.startsWith('R') ? 'RS' : 'S',
    // Federal legislation only — laws-lois.justice.gc.ca doesn't host provincial Acts (those live
    // on each province's own legislation site), so the jurisdiction letter is always 'C'.
    jurisdictionAbbrev: 'C',
    year,
    chapter: chapterRaw.replace(/\.$/, ''),
    sessionOrSupp: supp?.replace(/\.$/, ''),
  }
}

/** Finds and parses the 'Title (Citation)' heading from the raw (unstripped) page HTML. */
export function extractCanadaLegislationCitation(html: string, title: string): CanadaLegislationCitation | undefined {
  const trimmedTitle = title.trim()
  if (!trimmedTitle) return undefined

  const $ = cheerio.load(html)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const escapedTitle = trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = bodyText.match(new RegExp(`${escapedTitle}\\s*\\(([^()]+(?:\\([^()]*\\))?)\\)`))
  if (!match) return undefined

  return parseCanadaCitationLine(match[1])
}
