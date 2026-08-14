export type AutofillInputType =
  | 'austlii-case'
  | 'austlii-legislation'
  | 'au-legislation'
  | 'sclqld-case-summary'
  | 'crossref-doi'
  | 'doi-url'
  | 'jade-case'
  | 'generic-url'
  | 'unknown'

// Each Australian state/territory runs "legislation" as a subdomain of its own gov.au domain —
// the Commonwealth's legislation.gov.au has no state segment and is deliberately left off this
// list, since it's a different (Angular SPA) platform handled fine by the generic AI path.
const AU_LEGISLATION_DOMAINS = [
  'legislation.nsw.gov.au',
  'legislation.qld.gov.au',
  'legislation.vic.gov.au',
  'legislation.wa.gov.au',
  'legislation.sa.gov.au',
  'legislation.tas.gov.au',
  'legislation.act.gov.au',
  'legislation.nt.gov.au',
]

const BARE_DOI_PATTERN = /^10\.\d{4,}\/\S+/
// Academic publisher pages (SAGE, Wiley, Taylor & Francis, Springer, ScienceDirect, ...)
// almost always embed the DOI directly in the URL path, eg .../doi/full/10.1177/xxxxx.
// Those pages are also almost always behind bot-detection that blocks a plain server-side
// fetch, so it's both faster and more reliable to pull the DOI out and go straight to
// CrossRef than to attempt scraping the page itself.
const EMBEDDED_DOI_PATTERN = /(10\.\d{4,}\/[^\s"'<>?#]+)/

export function detectInputType(input: string): AutofillInputType {
  const trimmed = input.trim()

  if (trimmed.includes('austlii.edu.au') && trimmed.includes('/cases/')) return 'austlii-case'
  if (trimmed.includes('austlii.edu.au') && trimmed.includes('/legis/')) return 'austlii-legislation'
  if (AU_LEGISLATION_DOMAINS.some((domain) => trimmed.toLowerCase().includes(domain))) return 'au-legislation'
  // sclqld.org.au/caselaw/ is a search-result *summary* page (a client-rendered SPA with no
  // server-rendered content at all) — distinct from archive.sclqld.org.au, which serves the
  // actual judgment PDFs and works fine. Caught early so we can say so immediately rather than
  // attempting (and failing) the generic AI extraction path first.
  if (trimmed.toLowerCase().includes('sclqld.org.au/caselaw/')) return 'sclqld-case-summary'
  if (trimmed.includes('jade.io')) return 'jade-case'
  if (BARE_DOI_PATTERN.test(trimmed)) return 'crossref-doi'
  if (trimmed.includes('doi.org/')) return 'doi-url'
  if (/^https?:\/\//i.test(trimmed) && EMBEDDED_DOI_PATTERN.test(trimmed)) return 'doi-url'
  if (/^https?:\/\//i.test(trimmed)) return 'generic-url'
  return 'unknown'
}

export function extractDoiFromUrl(input: string): string {
  const trimmed = input.trim()
  const prefixStripped = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
  if (prefixStripped !== trimmed) return prefixStripped

  const match = trimmed.match(EMBEDDED_DOI_PATTERN)
  return match ? match[1] : trimmed
}
