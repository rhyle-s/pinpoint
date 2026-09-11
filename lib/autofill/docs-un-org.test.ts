import { describe, expect, it } from 'vitest'
import { rewriteDocsUnOrgUrl } from './docs-un-org'

describe('rewriteDocsUnOrgUrl', () => {
  it('rewrites a resolution symbol URL to the documents.un.org PDF API', () => {
    expect(rewriteDocsUnOrgUrl('https://docs.un.org/en/A/RES/79/243')).toBe(
      'https://documents.un.org/api/symbol/access?s=A%2FRES%2F79%2F243&l=en&t=pdf',
    )
  })

  it('handles a trailing slash', () => {
    expect(rewriteDocsUnOrgUrl('https://docs.un.org/en/A/RES/61/295/')).toBe(
      'https://documents.un.org/api/symbol/access?s=A%2FRES%2F61%2F295&l=en&t=pdf',
    )
  })

  it('handles a query string or fragment after the symbol', () => {
    expect(rewriteDocsUnOrgUrl('https://docs.un.org/en/A/RES/70/1?utm_source=x#section')).toBe(
      'https://documents.un.org/api/symbol/access?s=A%2FRES%2F70%2F1&l=en&t=pdf',
    )
  })

  it('is case-insensitive on the domain and protocol-tolerant', () => {
    expect(rewriteDocsUnOrgUrl('http://DOCS.UN.ORG/en/A/RES/79/243')).toBe(
      'https://documents.un.org/api/symbol/access?s=A%2FRES%2F79%2F243&l=en&t=pdf',
    )
  })

  it('returns undefined for a non-docs.un.org URL, even a similar-looking one', () => {
    expect(rewriteDocsUnOrgUrl('https://www.un.org/en/about-us/un-charter')).toBeUndefined()
    expect(rewriteDocsUnOrgUrl('https://documents.un.org/api/symbol/access?s=A/RES/79/243')).toBeUndefined()
  })

  it('returns undefined when there is no symbol after the prefix', () => {
    expect(rewriteDocsUnOrgUrl('https://docs.un.org/en/')).toBeUndefined()
  })
})
