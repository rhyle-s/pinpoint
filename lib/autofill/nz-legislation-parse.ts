/**
 * legislation.govt.nz's own `<title>` tag for an Act's page is a reliable, fixed 'Title Year |
 * New Zealand Legislation' shape (eg '  Building Act 2004\n  | New Zealand Legislation\n',
 * confirmed by direct fetch across three unrelated Acts, not just one) — genuinely simpler than
 * Canada or the UK, since AGLC4 r 21.2.1 has no sub-jurisdictions to distinguish the way Canada's
 * provinces or the UK's four nations do: every Act on this site is cited '(NZ)', full stop, no
 * branching needed. This was previously left entirely unhandled by the AI-extraction path, which
 * — since AGLC4's Foreign Domestic Sources classification is explicitly told never to choose New
 * Zealand as a jurisdiction (no extraction support existed) — fell back to guessing plain
 * *domestic* 'legislation' instead, and then guessed a jurisdiction abbreviation for that
 * (typically 'Cth', confirmed live) that has nothing to do with the source at all. No
 * `'server-only'` import here, matching every other `*-parse.ts` file in this directory.
 */
export interface NZLegislationCitation {
  title: string
  year: string
}

const TITLE_TAG_PATTERN = /^(.*\S)\s+(\d{4})\s*\|\s*New Zealand Legislation\s*$/

export function parseNZTitleTag(titleTagText: string): NZLegislationCitation | undefined {
  const normalised = titleTagText.replace(/\s+/g, ' ').trim()
  const match = normalised.match(TITLE_TAG_PATTERN)
  if (!match) return undefined
  return { title: match[1].trim(), year: match[2] }
}

export function isNZLegislationUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?legislation\.govt\.nz\/act\//i.test(url)
}
