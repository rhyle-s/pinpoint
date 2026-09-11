// docs.un.org/en/{ResolutionSymbol} (eg 'docs.un.org/en/A/RES/79/243') is just a thin JS-shell
// "Document Viewer" page — the actual document is loaded client-side into an <iframe> pointing at
// a *different* domain (documents.un.org), so a plain server-side HTML fetch (cheerio, no JS
// execution) never sees any real content at all, regardless of extraction-prompt quality. But the
// iframe's own src is a plain, unauthenticated API endpoint that redirects straight through to the
// real PDF with no blocking whatsoever (confirmed by direct testing: 's=<symbol>' round-trips
// through two redirects to a 200 'application/pdf' response) — so rewriting the URL before fetching
// is all that's needed; the existing generic PDF-content-type handling in aiExtractFromUrl already
// takes it from there. This isn't specific to any one document — every resolution symbol on
// research.un.org's Conventions & Declarations tables (and any other docs.un.org URL) follows the
// same pattern, so this is a systemic fix rather than another hardcoded lookup.
const DOCS_UN_ORG_PREFIX = 'docs.un.org/en/'

/**
 * Rewrites a docs.un.org viewer URL to the underlying documents.un.org API URL that actually
 * serves the PDF, or returns undefined if the URL isn't a docs.un.org one at all.
 */
export function rewriteDocsUnOrgUrl(url: string): string | undefined {
  const trimmed = url.trim()
  const idx = trimmed.toLowerCase().indexOf(DOCS_UN_ORG_PREFIX)
  if (idx === -1) return undefined

  const afterPrefix = trimmed.slice(idx + DOCS_UN_ORG_PREFIX.length)
  const symbolPart = afterPrefix.split(/[?#]/)[0].replace(/\/+$/, '')
  if (!symbolPart) return undefined

  let symbol: string
  try {
    symbol = decodeURIComponent(symbolPart)
  } catch {
    symbol = symbolPart
  }

  return `https://documents.un.org/api/symbol/access?s=${encodeURIComponent(symbol)}&l=en&t=pdf`
}
