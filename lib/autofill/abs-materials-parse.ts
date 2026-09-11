/**
 * abs.gov.au's own release pages carry reliable Dublin Core meta tags: `og:title` is the release's
 * clean title (no ' | Australian Bureau of Statistics' suffix the way the plain `<title>` tag
 * has), `dcterms.issued` is the publication date in an unusual 'Ddd, DD/MM/YYYY - HH:MM' form, and
 * `dcterms.isPartOf` — confirmed against the page's own visible body text too, not just the meta
 * tag, eg 'This release uses ABS catalogue number 6229.0.' — is the release's catalogue number,
 * when it has one. Not every release does: some current ABS releases have moved to a web-first
 * publishing model with no traditional catalogue number at all (confirmed live: one such page's
 * own body text was headed 'Previous catalogue number', ie the number shown was itself only
 * historical) — `catalogueNumber` is genuinely optional here, not a parsing gap to fix. No
 * `'server-only'` import, matching every other `*-parse.ts` file in this directory.
 */
export interface ABSCitation {
  title: string
  date: string
  catalogueNumber?: string
}

const DCTERMS_ISSUED_PATTERN = /(\d{1,2})\/(\d{1,2})\/(\d{4})/

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** 'Fri, 31/07/2026 - 11:30' -> '31 July 2026'. */
function parseDctermsIssuedDate(value: string): string | undefined {
  const match = value.match(DCTERMS_ISSUED_PATTERN)
  if (!match) return undefined
  const [, day, month, year] = match
  const monthIndex = Number(month) - 1
  if (monthIndex < 0 || monthIndex > 11) return undefined
  return `${Number(day)} ${MONTHS[monthIndex]} ${year}`
}

export function parseABSPage(ogTitle: string, dctermsIssued: string, dctermsIsPartOf: string): ABSCitation | undefined {
  const title = ogTitle.trim()
  const date = parseDctermsIssuedDate(dctermsIssued)
  if (!title || !date) return undefined

  // A genuine ABS catalogue number is a small number of digits, a full stop, then more digits
  // (eg '6202.0', '5372.0.55.001') — dcterms.isPartOf is otherwise unused on this site, but this
  // still guards against picking up something unrelated should that ever change.
  const catalogueNumber = /^\d[\d.]*\d$|^\d+$/.test(dctermsIsPartOf.trim()) ? dctermsIsPartOf.trim() : undefined

  return { title, date, catalogueNumber }
}

export function isABSUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?abs\.gov\.au\//i.test(url)
}
