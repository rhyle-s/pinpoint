import { describe, expect, it } from 'vitest'
import { isNZLegislationUrl, parseNZTitleTag } from './nz-legislation-parse'

// Every <title> string below was confirmed by direct fetch against the real legislation.govt.nz
// page (across three unrelated Acts, not just the one in the original bug report), not invented.
describe('parseNZTitleTag', () => {
  it('parses the Building Act 2004 (the original bug report)', () => {
    expect(parseNZTitleTag('  Building Act 2004\n  | New Zealand Legislation\n')).toEqual({
      title: 'Building Act',
      year: '2004',
    })
  })

  it('parses the Companies Act 1993', () => {
    expect(parseNZTitleTag('  Companies Act 1993\n  | New Zealand Legislation\n')).toEqual({
      title: 'Companies Act',
      year: '1993',
    })
  })

  it('parses the Crimes Act 1961', () => {
    expect(parseNZTitleTag('  Crimes Act 1961\n  | New Zealand Legislation\n')).toEqual({
      title: 'Crimes Act',
      year: '1961',
    })
  })

  it('returns undefined for text that does not match the expected shape', () => {
    expect(parseNZTitleTag('404 Not Found')).toBeUndefined()
  })
})

describe('isNZLegislationUrl', () => {
  it('recognises legislation.govt.nz Act URLs', () => {
    expect(isNZLegislationUrl('https://www.legislation.govt.nz/act/public/2004/72/en/latest/')).toBe(true)
  })

  it('does not match a non-Act legislation.govt.nz page', () => {
    expect(isNZLegislationUrl('https://www.legislation.govt.nz/regulation/public/2003/0288/latest/')).toBe(false)
  })
})
