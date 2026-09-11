import { SourceType } from '../citation-engine/types'
import { matchKnownOHCHRInstrument } from './known-ohchr-instruments'
import { isNZLegislationUrl } from './nz-legislation-parse'
import { isXUrl } from './x-post-parse'
import { isYouTubeWatchUrl } from './youtube-parse'

export type AutofillInputType =
  | 'austlii-case'
  | 'austlii-legislation'
  | 'au-legislation'
  | 'sclqld-case-summary'
  | 'known-ohchr-instrument'
  | 'blocked-database'
  | 'pubmed'
  | 'crossref-doi'
  | 'doi-url'
  | 'jade-case'
  | 'canada-legislation'
  | 'uk-legislation'
  | 'us-code'
  | 'nz-legislation'
  | 'foreign-domestic-url'
  | 'eu-materials-url'
  | 'x-post'
  | 'abs-materials'
  | 'abc-news'
  | 'youtube'
  | 'generic-url'
  | 'unknown'

// decisions.scc-csc.ca (the Supreme Court of Canada's own decisions site) used to be routed
// through the generic AI-extraction path with a strong 'internationalMaterial' hint — but a real
// case-detail page's server-rendered HTML was confirmed, by direct investigation, to carry NO
// citation data at all (no year, volume, SCR page, or judge — just navigation chrome and a
// breadcrumb naming the case). The site (built on the Decisia CMS) loads the actual judgment via
// a same-origin iframe request that itself returns no usable content either, with or without a
// real browser session — there's nothing here a plain server-side fetch can ever recover, so
// routing this to the AI extractor was guaranteed to fail every time, silently, with no
// explanation. Now short-circuited with an honest message instead (see 'foreign-domestic-url' in
// index.ts), the same pattern as AustLII/SSRN elsewhere in this file. The other Foreign Domestic
// Sources jurisdictions (US state legislation, Hong Kong, Malaysia, Singapore, South Africa)
// deliberately have no autofill wiring at all, manual entry only. laws-lois.justice.gc.ca,
// legislation.gov.uk, Cornell's US Code mirror, and legislation.govt.nz are deliberately NOT
// here — see 'canada-legislation'/'uk-legislation'/'us-code'/'nz-legislation' below, their own
// dedicated, non-AI routes.
const FOREIGN_DOMESTIC_DOMAINS = ['decisions.scc-csc.ca']

// eur-lex.europa.eu is genuinely AWS-WAF-blocked for a direct fetch (confirmed: HTTP 202, empty
// body, `x-amzn-waf-action: challenge`, regardless of User-Agent — the same class of block as
// APO/OHCHR/Congress.gov above, just a different WAF vendor) — but every URL form it serves
// (`?uri=CELEX:...`, `/eli/dir|reg/.../oj/eng`, the newer `?uri=OJ:L_...`) carries a CELEX or OJ
// document identifier that resolves cleanly through publications.europa.eu's Cellar repository
// instead, which is NOT blocked — see eu-cellar.ts/eu-cellar-parse.ts. Covers Official Journal
// documents (r 14.2.1) and Courts of the EU decisions (r 14.2.3); Constitutive Treaties (r
// 14.2.2), Council of Europe materials (r 14.3.1–14.3.3), and hudoc.echr.coe.int (a client-
// rendered SPA with no server-rendered case content and an unreliable, undocumented internal
// query API — confirmed by direct testing) have no autofill wiring, manual entry only.
const EU_LEX_DOMAIN = 'eur-lex.europa.eu'

// laws-lois.justice.gc.ca prints every Act's own citation inside a <header> element that the
// generic AI-extraction path's shared content-cleanup strips out as site-navigation noise — the
// AI extractor was confirmed live to sometimes hallucinate a wrong citation as a result (see
// canada-legislation.ts). The citation line is reliably parseable directly from the page, so this
// gets its own dedicated, deterministic route instead of the generic AI-hinted one.
const CANADA_LEGISLATION_DOMAIN = 'laws-lois.justice.gc.ca'

// legislation.gov.uk's own citation heading survives the AI path's content-cleanup (it isn't
// hidden the way Canada's is), but the AI path never distinguished ordinary legislation from
// delegated legislation by URL, and the real citation number only fits inside the extraction
// budget by a comfortable-but-not-huge margin (see uk-legislation-parse.ts). Reliably parseable
// directly, so this also gets its own dedicated, deterministic route.
const UK_LEGISLATION_DOMAIN = 'legislation.gov.uk'

// Cornell Law's Legal Information Institute mirror of the federal US Code — the official
// government source, uscode.house.gov, isn't reachable from this environment at all (confirmed:
// connection times out). Every section page's own <title> is reliably parseable (see
// us-code-parse.ts), so this gets a dedicated, deterministic route too, federal Code only.
const US_CODE_DOMAIN = 'law.cornell.edu/uscode'

// legislation.govt.nz's own <title> tag is a reliable 'Title Year | New Zealand Legislation'
// shape (see nz-legislation-parse.ts's isNZLegislationUrl/parseNZTitleTag) — genuinely simpler
// than Canada/UK, since every NZ Act is cited '(NZ)' with no sub-jurisdiction to detect from the
// URL. Confirmed live as a real, previously-mis-cited bug: with no dedicated route here, a NZ Act
// URL fell to the generic AI path, which is explicitly told never to choose 'foreignDomestic' for
// New Zealand (no extraction support existed) and so guessed plain *domestic* 'legislation'
// instead, with a garbage jurisdiction abbreviation ('Cth', confirmed live) that has nothing to
// do with the source.

// x.com/twitter.com serves a single status page's citation-relevant fields (username, real name,
// full post text, precise published timestamp) in fully server-rendered meta tags with no JS
// needed — reliably parseable directly (see x-post-parse.ts's isXUrl/parseXPost), so this gets
// its own dedicated, deterministic route too, matching the Canada/UK/US Code precedent above.

// abs.gov.au's release pages carry the title, publication date, and (where one exists — see
// abs-materials-parse.ts) catalogue number in reliable Dublin Core meta tags.
const ABS_DOMAIN = 'abs.gov.au'

// abc.net.au/news hosts both ordinary articles and video/TV content (eg Four Corners episodes)
// under the same URL shape — routed through its own handler so the two can be told apart via the
// page's own ABC.ContentType meta tag before falling into the (otherwise unaffected) newspaper
// path or the new otherSources/filmOrMedia one; see abc-news-parse.ts.
const ABC_NEWS_DOMAIN = 'abc.net.au/news'

// youtube.com/watch pages embed real schema.org microdata (channel name, clean video title,
// precise publish timestamp) even without JS — but well past the generic AI path's ~4000-
// character content window, which is why a real test came back with an empty username rather
// than a wrong one (see youtube-parse.ts's isYouTubeWatchUrl/parseYouTubePage).

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

// Subscription/login-gated legal-research databases — none of these are fixable by a User-Agent
// trick or similar, so rather than let each one fail silently through the generic AI-extraction
// path (which either burns a fetch attempt on a guaranteed 403/challenge, or — worse — succeeds
// against a login-wall stub and hands the AI extractor nothing useful to work with), each is
// named explicitly so the message tells the student exactly which source blocked them. Confirmed
// by direct testing against each domain below (see CLAUDE.md for the specific failure mode per
// site — Cloudflare challenge, JS-redirect stub, or login redirect). To add another blocked
// database, just add an entry here — no new message text needed, the shared template covers it.
// defaultSourceType controls which tab the student lands on after the blocked-source message —
// omit it to keep the long-standing 'researchPaper' default (right for most of this list, which
// is academic-paper databases); set it explicitly for a database whose content is something else
// entirely, so the student isn't handed the wrong form to fill in by hand.
const BLOCKED_DATABASES: Array<{ name: string; patterns: string[]; defaultSourceType?: SourceType }> = [
  { name: 'SSRN', patterns: ['ssrn.com'] },
  { name: 'Informit', patterns: ['informit.org', 'informit.com.au'] },
  { name: 'HeinOnline', patterns: ['heinonline.org', 'heinonline.com'] },
  { name: 'Westlaw', patterns: ['thomsonreuters.com', 'westlaw.com'] },
  { name: 'Lexis+', patterns: ['lexis.com', 'lexisnexis.com', 'lexisadvance.com'] },
  { name: 'iKnowConnect', patterns: ['iknowconnect.cch.com'] },
  { name: 'EBSCOhost', patterns: ['ebsco.com', 'ebscohost.com'] },
  { name: 'Gale', patterns: ['gale.com'] },
  { name: 'Emerald', patterns: ['emerald.com'] },
  // Reached via an institutional OpenAthens proxy, which rewrites 'www.iclr.co.uk' to
  // 'www-iclr-co-uk' as a subdomain of the proxy's own domain — matching that rewritten form
  // as well as the real domain, since a student will only ever see the proxied version.
  { name: 'ICLR', patterns: ['iclr.co.uk', 'iclr-co-uk'] },
  { name: 'Web of Science', patterns: ['webofscience.com'] },
  { name: 'ProQuest', patterns: ['proquest.com'] },
  // Deliberately 'sk.sagepub.com' only, not the broader 'sagepub.com' — that would also catch
  // journals.sagepub.com (SAGE Journals), which is a *different* SAGE product that isn't blocked
  // and already routes correctly to CrossRef via its embedded DOI (see EMBEDDED_DOI_PATTERN
  // below); SAGE Knowledge (reference works/encyclopedias, no DOI in the URL) is the one that's
  // actually login-gated.
  { name: 'SAGE Knowledge', patterns: ['sk.sagepub.com'] },
  { name: 'ScienceDirect', patterns: ['sciencedirect.com'] },
  { name: 'Scopus', patterns: ['scopus.com'] },
  { name: 'ACS Publications', patterns: ['pubs.acs.org'] },
  { name: 'Oxford Academic', patterns: ['academic.oup.com'] },
  { name: 'Semantic Scholar', patterns: ['semanticscholar.org'] },
  // Unlike the rest of this list, APO (Analysis & Policy Observatory) isn't a subscription
  // database — it's a free open-access repository — but it's genuinely Cloudflare-blocked all
  // the same (confirmed: `cf-mitigated: challenge`), so the same named message and remedy apply.
  { name: 'APO (Analysis & Policy Observatory)', patterns: ['apo.org.au'] },
  // Also free/open-access, also genuinely Cloudflare-blocked (confirmed: `cf-mitigated:
  // challenge` on both, regardless of User-Agent) — OHCHR hosts nearly every UN human rights
  // treaty and declaration's own instrument page, and the Australian Human Rights Commission's
  // site mirrors the same instruments on its own pages, so both default a student straight to
  // the International Material tab (which covers both of the two source types this content
  // turns out to be) rather than the generic 'researchPaper' default, which would be a
  // confusing landing spot here.
  { name: 'OHCHR', patterns: ['ohchr.org'], defaultSourceType: 'internationalMaterial' },
  { name: 'Australian Human Rights Commission', patterns: ['humanrights.gov.au'], defaultSourceType: 'internationalMaterial' },
  // congress.gov (US federal bills/session laws) is genuinely Cloudflare-blocked too (confirmed:
  // HTTP 403, `cf-mitigated: challenge`, a "Just a moment..." JS-challenge body — the exact same
  // signature as APO/OHCHR above), regardless of User-Agent. Sent to Foreign Domestic Sources
  // (US) rather than 'researchPaper', same reasoning as OHCHR/AHRC — this is legislative content,
  // not a research paper. Note AGLC4's Foreign Domestic Sources US categories (r 25.1-25.4) don't
  // actually define a citation format for a pending Bill, only enacted Code/session-law
  // provisions and cases — a congress.gov Bill link should still land students on the right tab
  // to enter what they have manually rather than the generic default.
  { name: 'Congress.gov', patterns: ['congress.gov'], defaultSourceType: 'internationalMaterial' },
  // A Facebook post URL 302s to a login-walled permalink page (confirmed live, regardless of
  // User-Agent) — no fetch ever reaches the post's own content. Lands on Other Sources (Social
  // Media Post), same reasoning as OHCHR/AHRC/Congress.gov landing a student on the tab that
  // actually covers the content rather than the generic 'researchPaper' default.
  { name: 'Facebook', patterns: ['facebook.com'], defaultSourceType: 'otherSources' },
  // oed.com (Oxford English Dictionary) 302s to its own OAuth2 login/subscription flow (confirmed
  // live) — a genuine subscription wall, not a bot challenge.
  { name: 'Oxford English Dictionary', patterns: ['oed.com'], defaultSourceType: 'otherSources' },
  // merriam-webster.com is genuinely Cloudflare-blocked (confirmed: HTTP 403, `cf-mitigated:
  // challenge`, a "Just a moment..." JS-challenge body, regardless of User-Agent) — same
  // signature as APO/OHCHR/Congress.gov above.
  { name: 'Merriam-Webster', patterns: ['merriam-webster.com'], defaultSourceType: 'otherSources' },
  // macquariedictionary.com.au is a genuinely different failure mode from the rest of this list —
  // not blocked at the HTTP level at all (200 OK), but a real word-lookup submits to a separate
  // `app.macquariedictionary.com.au` subdomain that's a client-rendered SPA shell with no
  // server-rendered dictionary content whatsoever (confirmed live: the fetched HTML is just an
  // empty app shell, same "client-rendered, nothing to scrape" failure mode as
  // `sclqld.org.au/caselaw/*` elsewhere in this file) — but the remedy is identical to every other
  // entry here, so it lives in the same list rather than a separate mechanism.
  { name: 'Macquarie Dictionary', patterns: ['macquariedictionary.com.au'], defaultSourceType: 'otherSources' },
  // hudoc.echr.coe.int (the European Court of Human Rights' own case database) is a genuinely
  // different failure mode again — not blocked at the HTTP level (200 OK), but a client-rendered
  // SPA shell with a generic <title> and no server-rendered case content at all, same as
  // Macquarie Dictionary above; its internal query API was tested directly and found unreliable
  // (wrong case data for a valid-looking query, 404s for syntax variations) — not safe to build
  // autofill on. Lands a student on European Union Materials (which covers the ECtHR, r 14.3.2)
  // rather than the generic 'researchPaper' default.
  { name: 'HUDOC (European Court of Human Rights case database)', patterns: ['hudoc.echr.coe.int'], defaultSourceType: 'internationalMaterial' },
  // latrobe.edu.au is genuinely Cloudflare-blocked domain-wide (confirmed: HTTP 403,
  // `cf-mitigated: challenge`, a "Just a moment..." JS-challenge body, on both the reported page
  // and the site's own homepage, regardless of User-Agent) — same signature as APO/OHCHR/
  // Congress.gov/Merriam-Webster above. Defaults to 'website' rather than the generic
  // 'researchPaper' fallback — a university's own scholarship/fees page is an ordinary
  // institutional web page (AGLC4 r 7.15), not a conference paper, thesis, or working paper.
  { name: 'La Trobe University', patterns: ['latrobe.edu.au'], defaultSourceType: 'website' },
]

function matchBlockedDatabaseEntry(input: string) {
  const lower = input.trim().toLowerCase()
  return BLOCKED_DATABASES.find((db) => db.patterns.some((pattern) => lower.includes(pattern)))
}

/** Returns the display name of the blocked database a URL belongs to, if any. */
export function matchBlockedDatabase(input: string): string | undefined {
  return matchBlockedDatabaseEntry(input)?.name
}

/** Which tab a student should land on after a blocked-database message — see defaultSourceType above. */
export function matchBlockedDatabaseSourceType(input: string): SourceType {
  return matchBlockedDatabaseEntry(input)?.defaultSourceType ?? 'researchPaper'
}

const PMID_PATTERN = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i

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
  // Checked before the generic ohchr.org block below, so this specific, fixed set of instrument
  // URLs gets its full pre-verified citation instead of the generic "restricts automated access"
  // message that every other ohchr.org page still (correctly) falls back to.
  if (matchKnownOHCHRInstrument(trimmed)) return 'known-ohchr-instrument'
  if (matchBlockedDatabase(trimmed)) return 'blocked-database'
  // pubmed.ncbi.nlm.nih.gov's own article pages are behind a genuine proof-of-work JS challenge
  // (confirmed by direct testing: a SHA-256 leading-zero-bits puzzle served regardless of
  // User-Agent) — but NCBI's free eutils API (a different, unprotected subdomain) returns full
  // structured MEDLINE metadata for the same article given its PMID, so this is a real fetch
  // (see pubmed.ts), not a "sorry, can't do this" fallback like the blocked databases above.
  if (PMID_PATTERN.test(trimmed)) return 'pubmed'
  if (trimmed.includes('jade.io')) return 'jade-case'
  if (trimmed.toLowerCase().includes(CANADA_LEGISLATION_DOMAIN)) return 'canada-legislation'
  if (trimmed.toLowerCase().includes(UK_LEGISLATION_DOMAIN)) return 'uk-legislation'
  if (trimmed.toLowerCase().includes(US_CODE_DOMAIN)) return 'us-code'
  if (isNZLegislationUrl(trimmed)) return 'nz-legislation'
  if (FOREIGN_DOMESTIC_DOMAINS.some((domain) => trimmed.toLowerCase().includes(domain))) return 'foreign-domestic-url'
  if (trimmed.toLowerCase().includes(EU_LEX_DOMAIN)) return 'eu-materials-url'
  if (isXUrl(trimmed)) return 'x-post'
  if (trimmed.toLowerCase().includes(ABS_DOMAIN)) return 'abs-materials'
  if (trimmed.toLowerCase().includes(ABC_NEWS_DOMAIN)) return 'abc-news'
  if (isYouTubeWatchUrl(trimmed)) return 'youtube'
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

export function extractPmidFromUrl(input: string): string | null {
  const match = input.trim().match(PMID_PATTERN)
  return match ? match[1] : null
}
