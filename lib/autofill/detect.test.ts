import { describe, expect, it } from 'vitest'
import { detectInputType, extractDoiFromUrl, extractPmidFromUrl, matchBlockedDatabase, matchBlockedDatabaseSourceType } from './detect'

describe('detectInputType', () => {
  it('detects AustLII cases', () => {
    expect(detectInputType('https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/1992/23.html')).toBe(
      'austlii-case',
    )
  })

  it('detects AustLII legislation', () => {
    expect(detectInputType('http://www5.austlii.edu.au/au/legis/cth/consol_act/pa1988108/')).toBe(
      'austlii-legislation',
    )
  })

  it('detects Jade case URLs', () => {
    expect(detectInputType('https://jade.io/article/12345')).toBe('jade-case')
  })

  it('detects Canada legislation (laws-lois.justice.gc.ca) as its own dedicated route', () => {
    expect(detectInputType('https://laws-lois.justice.gc.ca/eng/acts/P-21/FullText.html')).toBe('canada-legislation')
  })

  it('detects UK legislation (legislation.gov.uk) as its own dedicated route', () => {
    expect(detectInputType('https://www.legislation.gov.uk/ukpga/2023/50/contents')).toBe('uk-legislation')
  })

  it('detects US federal Code (law.cornell.edu/uscode) as its own dedicated route', () => {
    expect(detectInputType('https://www.law.cornell.edu/uscode/text/12/1811')).toBe('us-code')
  })

  it('detects New Zealand legislation (legislation.govt.nz) as its own dedicated route — a real, confirmed-live gap fixed after a URL was mis-cited with a "Cth" jurisdiction', () => {
    expect(detectInputType('https://www.legislation.govt.nz/act/public/2004/72/en/latest/#DLM306036')).toBe(
      'nz-legislation',
    )
  })

  it('does not route a NZ regulation/delegated-legislation page to nz-legislation', () => {
    expect(detectInputType('https://www.legislation.govt.nz/regulation/public/2003/0288/latest/')).toBe(
      'generic-url',
    )
  })

  it('detects x.com/twitter.com status pages as their own dedicated route', () => {
    expect(detectInputType('https://x.com/JoeOrrico/status/2095495318984962245?s=20')).toBe('x-post')
    expect(detectInputType('https://twitter.com/JoeOrrico/status/2095495318984962245')).toBe('x-post')
  })

  it('does not route a bare X/Twitter profile URL (no status) to x-post', () => {
    expect(detectInputType('https://x.com/JoeOrrico')).toBe('generic-url')
  })

  it('detects ABS releases (abs.gov.au) as their own dedicated route', () => {
    expect(
      detectInputType('https://www.abs.gov.au/statistics/labour/employment-and-unemployment/underemployed-workers/feb-2026'),
    ).toBe('abs-materials')
  })

  it('detects ABC News pages (abc.net.au/news) as their own dedicated route', () => {
    expect(detectInputType('https://www.abc.net.au/news/2026-08-24/access-all-areas/107072218')).toBe('abc-news')
  })

  it('does not route a non-news ABC page to abc-news', () => {
    expect(detectInputType('https://www.abc.net.au/iview/show/four-corners')).toBe('generic-url')
  })

  it('detects YouTube watch pages (youtube.com/watch and youtu.be) as their own dedicated route', () => {
    expect(detectInputType('https://www.youtube.com/watch?v=f74XcGyZMCg')).toBe('youtube')
    expect(detectInputType('https://youtu.be/f74XcGyZMCg')).toBe('youtube')
  })

  it('does not route a YouTube channel/search page to youtube', () => {
    expect(detectInputType('https://www.youtube.com/@GameTrailers')).toBe('generic-url')
  })

  it('detects Canada cases (decisions.scc-csc.ca) as a Foreign Domestic Sources URL', () => {
    expect(detectInputType('https://decisions.scc-csc.ca/scc-csc/scc-csc/en/item/1837/index.do')).toBe(
      'foreign-domestic-url',
    )
  })

  it('detects eur-lex.europa.eu URLs as a European Union Materials URL', () => {
    expect(detectInputType('https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:31993L0013')).toBe('eu-materials-url')
    expect(detectInputType('https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng')).toBe('eu-materials-url')
  })

  it('detects hudoc.echr.coe.int as a blocked database, landing on International Material', () => {
    expect(detectInputType('https://hudoc.echr.coe.int/?i=001-58014')).toBe('blocked-database')
    expect(matchBlockedDatabaseSourceType('https://hudoc.echr.coe.int/?i=001-58014')).toBe('internationalMaterial')
  })

  it('detects bare DOIs', () => {
    expect(detectInputType('10.1093/ojls/gqt001')).toBe('crossref-doi')
  })

  it('detects doi.org URLs', () => {
    expect(detectInputType('https://doi.org/10.1093/ojls/gqt001')).toBe('doi-url')
  })

  it('detects generic URLs', () => {
    expect(detectInputType('https://www.alrc.gov.au/publication/traditional-rights-and-freedoms-report-129/')).toBe(
      'generic-url',
    )
  })

  it('routes academic publisher URLs with an embedded DOI to CrossRef, not the generic AI fallback', () => {
    expect(detectInputType('https://journals.sagepub.com/doi/full/10.1177/13548565251324508')).toBe('doi-url')
  })

  it('falls back to unknown for non-URL input', () => {
    expect(detectInputType('just some random text')).toBe('unknown')
  })

  it.each([
    ['NSW', 'https://legislation.nsw.gov.au/view/html/inforce/current/act-2011-010'],
    ['Qld', 'https://www.legislation.qld.gov.au/view/html/inforce/current/act-2009-014'],
    ['Vic', 'https://www.legislation.vic.gov.au/in-force/acts/crimes-act-1958/281'],
    ['WA', 'https://www.legislation.wa.gov.au/legislation/statutes.nsf/law_a147282.html'],
    ['SA', 'https://www.legislation.sa.gov.au/_legislation-documents/lz/c/a/debtors-act-1936/current/1936.2266.auth.pdf'],
    ['Tas', 'https://www.legislation.tas.gov.au/view/html/inforce/current/act-2009-014'],
    ['ACT', 'https://www.legislation.act.gov.au/a/2011-40'],
    ['NT', 'https://legislation.nt.gov.au/en/Legislation/WORK-HEALTH-AND-SAFETY-NATIONAL-UNIFORM-LEGISLATION-ACT-2011'],
  ])('detects %s state/territory legislation URLs', (_jurisdiction, url) => {
    expect(detectInputType(url)).toBe('au-legislation')
  })

  it('leaves the Commonwealth Federal Register of Legislation on the generic AI path', () => {
    expect(detectInputType('https://www.legislation.gov.au/C1958A00062/latest/text')).toBe('generic-url')
  })

  it('detects Supreme Court Library Queensland case summary pages', () => {
    expect(detectInputType('https://www.sclqld.org.au/caselaw/163435')).toBe('sclqld-case-summary')
  })

  it('leaves the SCLQLD judgment archive (a different subdomain) on the generic AI path', () => {
    expect(detectInputType('https://archive.sclqld.org.au/qjudgment/2026/QCA26-146.pdf')).toBe('generic-url')
  })

  it('detects SSRN abstract pages', () => {
    expect(detectInputType('https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1999938')).toBe('blocked-database')
  })

  it('detects SSRN direct PDF download links the same way as the abstract page', () => {
    expect(
      detectInputType(
        'https://download.ssrn.com/12/02/06/ssrn_id1999938_code1784571.pdf?response-content-disposition=inline&X-Amz-Expires=300',
      ),
    ).toBe('blocked-database')
  })

  it.each([
    ['Informit', 'https://search.informit.org/doi/10.3316/informit.T2026072400008501865718434'],
    [
      'HeinOnline',
      'https://access.heinonline.com/HOL/Page?public=true&handle=hein.journals/nclr101&div=14&start_page=355&collection=journals&set_as_cursor=0&men_tab=srchresults',
    ],
    [
      'Westlaw',
      'https://anzlaw.thomsonreuters.com/Browse/Home/Australia160?transitionType=Default&contextData=(sc.Default)&comp=wlau',
    ],
    [
      'Lexis+',
      'https://plus.lexis.com/apac/document/?pdmfid=1539278&crid=78b7758a-3564-44d3-864b-10f2d5970ce1&pddocfullpath=%2Fshared%2Fdocument%2Fanalytical-materials-au%2Furn:contentItem:5NHG-8861-JGPY-X1BS-00000-00',
    ],
    [
      'iKnowConnect',
      'https://iknowconnect.cch.com/AUS/document/ausUwknewsPartP36270/excise-determination-for-denatured-spirits-finalised',
    ],
    ['EBSCOhost', 'https://research.ebsco.com/c/2urfuu/search/details/klmc4hf6nn?db=afh'],
    [
      'Gale',
      'https://go.gale.com/ps/profileDocument?docId=SFOBVU471456895&userGroupName=qut&inPS=true&prodId=GBIB&type=Company',
    ],
    [
      'Emerald',
      'https://www.emerald.com/jwl/article-pdf/38/6/529/11590052/jwl-07-2025-0241en.pdf',
    ],
    [
      'ICLR',
      'https://www-iclr-co-uk.eu1.proxy.openathens.net/document/2026006677/casereport_7e60a706-7228-4aea-b432-0c6ed8001d4c/html',
    ],
    ['Web of Science', 'https://www.webofscience.com/wos/woscc/full-record/WOS:001302897500001'],
    [
      'ProQuest',
      'https://www.proquest.com/docview/3237560010/CC29FEA820D24C0FPQ/4?accountid=13380&sourcetype=Scholarly%20Journals',
    ],
    ['SAGE Knowledge', 'https://sk.sagepub.com/book/edvol/the-nurture-versus-biosocial-debate-in-criminology/toc'],
    ['ScienceDirect', 'https://www.sciencedirect.com/science/article/pii/S2090123220300540'],
    ['Scopus', 'https://www.scopus.com/pages/publications/105045904184?origin=resultslist'],
    [
      'ACS Publications',
      'https://pubs.acs.org/jacsat/article-abstract/64/11/2716/533000/The-Viscosity-of-Dilute-Solutions-of-Long-Chain?redirectedFrom=fulltext',
    ],
    ['Oxford Academic', 'https://academic.oup.com/ojls/article-abstract/41/4/929/6242750'],
    [
      'Semantic Scholar',
      'https://www.semanticscholar.org/paper/Artificial-Intelligence-Applications-in-K-12-A-Zafari-Bazargani/f35ea3543312b4145c292a5c8521fc45872524f5',
    ],
    ['APO (Analysis & Policy Observatory)', 'https://apo.org.au/sites/default/files/resource-files/2018-02/apo-nid131101.pdf'],
    ['Congress.gov', 'https://www.congress.gov/bill/119th-congress/house-bill/9319?s=2&r=4'],
    ['Facebook', 'https://www.facebook.com/share/p/1DKy98hRUV/'],
    ['Oxford English Dictionary', 'https://www.oed.com/dictionary/trade_n?tab=factsheet'],
    ['Merriam-Webster', 'https://www.merriam-webster.com/dictionary/trade'],
    ['Macquarie Dictionary', 'https://www.macquariedictionary.com.au/'],
  ])('detects %s links as a blocked database', (_name, url) => {
    expect(detectInputType(url)).toBe('blocked-database')
  })

  it('leaves SAGE Journals (a different SAGE product with a working CrossRef route) off the blocked-database path', () => {
    expect(detectInputType('https://journals.sagepub.com/doi/full/10.1177/15598276261449784')).toBe('doi-url')
  })

  it.each([
    ['JSTOR', 'https://www.jstor.org/content/oa_book_monograph/j.ctvp2n3pr'],
    ['Nature', 'https://www.nature.com/articles/d41586-026-02503-7'],
    ['O’Reilly', 'https://learning.oreilly.com/library/view/advances-in-financial/9781119482086/f_06.xhtml'],
  ])('leaves %s on the generic AI path — confirmed reachable, not blocked', (_name, url) => {
    expect(detectInputType(url)).toBe('generic-url')
  })

  it('detects PubMed article pages', () => {
    expect(detectInputType('https://pubmed.ncbi.nlm.nih.gov/10297840/')).toBe('pubmed')
  })

  it('detects PubMed article pages without a trailing slash', () => {
    expect(detectInputType('https://pubmed.ncbi.nlm.nih.gov/10297840')).toBe('pubmed')
  })

  it('leaves a bare PubMed homepage/search URL (no PMID) on the generic AI path', () => {
    expect(detectInputType('https://pubmed.ncbi.nlm.nih.gov/?term=health+education')).toBe('generic-url')
  })
})

describe('matchBlockedDatabase', () => {
  it.each([
    ['SSRN', 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1999938'],
    ['Informit', 'https://search.informit.org/doi/10.3316/informit.T2026072400008501865718434'],
    ['HeinOnline', 'https://access.heinonline.com/HOL/Page?public=true&handle=hein.journals/nclr101'],
    ['Westlaw', 'https://anzlaw.thomsonreuters.com/Browse/Home/Australia160'],
    ['Lexis+', 'https://plus.lexis.com/apac/document/?pdmfid=1539278'],
    ['Lexis+', 'https://signin.lexisnexis.com/lnaccess/app/signin'],
    [
      'iKnowConnect',
      'https://iknowconnect.cch.com/AUS/document/ausUwknewsPartP36270/excise-determination-for-denatured-spirits-finalised',
    ],
  ])('names %s specifically', (name, url) => {
    expect(matchBlockedDatabase(url)).toBe(name)
  })

  it('returns undefined for a URL that is not a known blocked database', () => {
    expect(matchBlockedDatabase('https://www.alrc.gov.au/publication/traditional-rights-and-freedoms-report-129/')).toBeUndefined()
  })

  it('does not match SAGE Journals against the narrower SAGE Knowledge pattern', () => {
    expect(matchBlockedDatabase('https://journals.sagepub.com/doi/full/10.1177/15598276261449784')).toBeUndefined()
  })

  it.each([
    ['OHCHR', 'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child'],
    [
      'Australian Human Rights Commission',
      'https://humanrights.gov.au/resource-hub/by-resource-type/publications/guidelines/articles/rights-and-freedoms/universal-declaration-human-rights-human-rights-your-fingertips',
    ],
    ['Congress.gov', 'https://www.congress.gov/bill/119th-congress/house-bill/9319?s=2&r=4'],
    ['Facebook', 'https://www.facebook.com/share/p/1DKy98hRUV/'],
    ['Oxford English Dictionary', 'https://www.oed.com/dictionary/trade_n?tab=factsheet'],
    ['Merriam-Webster', 'https://www.merriam-webster.com/dictionary/trade'],
    ['Macquarie Dictionary', 'https://www.macquariedictionary.com.au/'],
  ])('names %s specifically', (name, url) => {
    expect(matchBlockedDatabase(url)).toBe(name)
  })
})

describe('matchBlockedDatabaseSourceType', () => {
  it('defaults to researchPaper for a blocked database with no explicit hint', () => {
    expect(matchBlockedDatabaseSourceType('https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1999938')).toBe('researchPaper')
  })

  it('lands on the International Material tab for OHCHR and the Australian Human Rights Commission', () => {
    expect(
      matchBlockedDatabaseSourceType('https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child'),
    ).toBe('internationalMaterial')
    expect(matchBlockedDatabaseSourceType('https://humanrights.gov.au/some-page')).toBe('internationalMaterial')
  })

  it('lands on the International Material tab for Congress.gov', () => {
    expect(
      matchBlockedDatabaseSourceType('https://www.congress.gov/bill/119th-congress/house-bill/9319?s=2&r=4'),
    ).toBe('internationalMaterial')
  })

  it('lands on the Other Sources tab for Facebook, OED, Merriam-Webster, and Macquarie Dictionary', () => {
    expect(matchBlockedDatabaseSourceType('https://www.facebook.com/share/p/1DKy98hRUV/')).toBe('otherSources')
    expect(matchBlockedDatabaseSourceType('https://www.oed.com/dictionary/trade_n?tab=factsheet')).toBe('otherSources')
    expect(matchBlockedDatabaseSourceType('https://www.merriam-webster.com/dictionary/trade')).toBe('otherSources')
    expect(matchBlockedDatabaseSourceType('https://www.macquariedictionary.com.au/')).toBe('otherSources')
  })

  it('defaults to researchPaper for a URL that is not a known blocked database at all', () => {
    expect(matchBlockedDatabaseSourceType('https://www.alrc.gov.au/publication/traditional-rights-and-freedoms-report-129/')).toBe(
      'researchPaper',
    )
  })
})

describe('extractPmidFromUrl', () => {
  it('extracts the PMID from an article URL with a trailing slash', () => {
    expect(extractPmidFromUrl('https://pubmed.ncbi.nlm.nih.gov/10297840/')).toBe('10297840')
  })

  it('extracts the PMID from an article URL without a trailing slash', () => {
    expect(extractPmidFromUrl('https://pubmed.ncbi.nlm.nih.gov/10297840')).toBe('10297840')
  })

  it('returns null when the URL has no PMID', () => {
    expect(extractPmidFromUrl('https://pubmed.ncbi.nlm.nih.gov/?term=health+education')).toBeNull()
  })
})

describe('extractDoiFromUrl', () => {
  it('strips the doi.org prefix', () => {
    expect(extractDoiFromUrl('https://doi.org/10.1093/ojls/gqt001')).toBe('10.1093/ojls/gqt001')
  })

  it('strips the dx.doi.org prefix', () => {
    expect(extractDoiFromUrl('http://dx.doi.org/10.1093/ojls/gqt001')).toBe('10.1093/ojls/gqt001')
  })

  it('leaves a bare DOI unchanged', () => {
    expect(extractDoiFromUrl('10.1093/ojls/gqt001')).toBe('10.1093/ojls/gqt001')
  })

  it('pulls a DOI embedded in an academic publisher URL', () => {
    expect(extractDoiFromUrl('https://journals.sagepub.com/doi/full/10.1177/13548565251324508')).toBe(
      '10.1177/13548565251324508',
    )
  })

  it('stops the embedded DOI at a query string', () => {
    expect(extractDoiFromUrl('https://onlinelibrary.wiley.com/doi/10.1111/some.12345?campaign=share')).toBe(
      '10.1111/some.12345',
    )
  })
})
