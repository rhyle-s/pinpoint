import { describe, expect, it } from 'vitest'
import { detectInputType, extractDoiFromUrl } from './detect'

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
