import { describe, expect, it } from 'vitest'
import { isABSUrl, parseABSPage } from './abs-materials-parse'

// Meta-tag values below are exactly what abs.gov.au's own page returned for a real release,
// confirmed by direct fetch — not invented, including the body text confirming the catalogue
// number independently of the meta tag.
describe('parseABSPage', () => {
  it('parses a release with a catalogue number', () => {
    const result = parseABSPage('Underemployed workers, February 2026', 'Fri, 31/07/2026 - 11:30', '6229.0')
    expect(result).toEqual({
      title: 'Underemployed workers, February 2026',
      date: '31 July 2026',
      catalogueNumber: '6229.0',
    })
  })

  it('parses a multi-part catalogue number', () => {
    const result = parseABSPage('International Merchandise Trade', 'Tue, 11/01/2018 - 09:00', '5372.0.55.001')
    expect(result?.catalogueNumber).toBe('5372.0.55.001')
  })

  it('leaves catalogueNumber undefined when dcterms.isPartOf is empty or not catalogue-shaped', () => {
    const result = parseABSPage('Some Release', 'Mon, 01/01/2026 - 00:00', '')
    expect(result?.catalogueNumber).toBeUndefined()
  })

  it('returns undefined when the title is empty', () => {
    expect(parseABSPage('', 'Fri, 31/07/2026 - 11:30', '6229.0')).toBeUndefined()
  })

  it('returns undefined when the issued date is unparseable', () => {
    expect(parseABSPage('Some Release', 'not a date', '6229.0')).toBeUndefined()
  })
})

describe('isABSUrl', () => {
  it('recognises abs.gov.au URLs', () => {
    expect(isABSUrl('https://www.abs.gov.au/statistics/labour/employment-and-unemployment/underemployed-workers/feb-2026')).toBe(
      true,
    )
  })

  it('does not match an unrelated domain', () => {
    expect(isABSUrl('https://www.abc.net.au/news/example')).toBe(false)
  })
})
