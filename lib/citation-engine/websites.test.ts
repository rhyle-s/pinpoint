import { describe, expect, it } from 'vitest'
import { generateWebsiteCitation } from './websites'
import { WebsiteFields } from './types'

describe('generateWebsiteCitation', () => {
  it('James Edelman — no date', () => {
    const fields: WebsiteFields = {
      authors: ['James Edelman'],
      documentTitle: 'High Court of Australia',
      websiteName: 'High Court of Australia',
      documentType: 'Web Page',
      url: 'http://www.hcourt.gov.au/justices/current/justice-james-edelman',
    }
    expect(generateWebsiteCitation(fields).footnote).toBe(
      'James Edelman, ‘High Court of Australia’, *High Court of Australia* (Web Page) <http://www.hcourt.gov.au/justices/current/justice-james-edelman>.',
    )
  })

  it('Martin Clark — blog post with date', () => {
    const fields: WebsiteFields = {
      authors: ['Martin Clark'],
      documentTitle: 'Koani v The Queen',
      websiteName: 'Opinions on High',
      documentType: 'Blog Post',
      date: '18 October 2017',
      url: 'http://blogs.unimelb.edu.au/opinionsonhigh/2017/10/18/koani-case-page/',
    }
    expect(generateWebsiteCitation(fields).footnote).toBe(
      'Martin Clark, ‘Koani v The Queen’, *Opinions on High* (Blog Post, 18 October 2017) <http://blogs.unimelb.edu.au/opinionsonhigh/2017/10/18/koani-case-page/>.',
    )
  })

  it('OAIC — no author', () => {
    const fields: WebsiteFields = {
      documentTitle: 'Privacy',
      websiteName: 'Office of the Australian Information Commissioner',
      documentType: 'Web Page',
      url: 'https://www.oaic.gov.au/privacy',
    }
    expect(generateWebsiteCitation(fields).footnote).toBe(
      '‘Privacy’, *Office of the Australian Information Commissioner* (Web Page) <https://www.oaic.gov.au/privacy>.',
    )
  })
})
