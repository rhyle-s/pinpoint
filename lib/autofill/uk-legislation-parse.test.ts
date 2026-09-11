import { describe, expect, it } from 'vitest'
import {
  detectUKJurisdictionFromUrl,
  isUKDelegatedLegislationUrl,
  parseUKUrlLegislation,
  ukInstrumentTypeForJurisdiction,
} from './uk-legislation-parse'

// legislation.gov.uk's own URL path is now the sole source of the year and instrument number —
// see CLAUDE.md and this module's own comment for why an earlier version instead parsed the
// page's 'You are here:' breadcrumb text, and why that turned out to feed a fabricated chapter
// number ('c'/'asp'/'nawm'/'anaw'/'asc') into ordinary-legislation citations that AGLC4 never
// actually wants for a post-1963 Act.
describe('parseUKUrlLegislation', () => {
  it('parses year and number from a UK Public General Act URL', () => {
    expect(parseUKUrlLegislation('https://www.legislation.gov.uk/ukpga/2023/50/contents')).toEqual({
      year: '2023',
      number: '50',
    })
  })

  it('parses year and number from an Act of the Scottish Parliament URL', () => {
    expect(parseUKUrlLegislation('https://www.legislation.gov.uk/asp/2003/12/contents')).toEqual({
      year: '2003',
      number: '12',
    })
  })

  it('parses year and number from a UK Statutory Instrument URL', () => {
    expect(parseUKUrlLegislation('https://www.legislation.gov.uk/uksi/1998/2024/contents/made')).toEqual({
      year: '1998',
      number: '2024',
    })
  })

  it('parses year and number from a Northern Ireland Statutory Rule URL', () => {
    expect(parseUKUrlLegislation('https://www.legislation.gov.uk/nisr/2005/279/contents/made')).toEqual({
      year: '2005',
      number: '279',
    })
  })

  it('returns undefined for a URL with no 4-digit year (eg a pre-1963 regnal-year-keyed Act)', () => {
    expect(parseUKUrlLegislation('https://www.legislation.gov.uk/ukpga/Geo5/15-16/49/contents')).toBeUndefined()
  })

  it('returns undefined for an unrelated URL', () => {
    expect(parseUKUrlLegislation('https://example.com/not-legislation')).toBeUndefined()
  })
})

describe('detectUKJurisdictionFromUrl', () => {
  it.each([
    ['https://www.legislation.gov.uk/ukpga/2023/50/contents', 'UK'],
    ['https://www.legislation.gov.uk/nia/2008/8/contents', 'NI'],
    ['https://www.legislation.gov.uk/asp/2003/12/contents', 'Scot'],
    ['https://www.legislation.gov.uk/mwa/2008/2/contents', 'Wales'],
    ['https://www.legislation.gov.uk/anaw/2020/1/contents', 'Wales'],
    ['https://www.legislation.gov.uk/asc/2022/1/contents', 'Wales'],
    ['https://www.legislation.gov.uk/uksi/1998/2024/contents/made', 'UK'],
    ['https://www.legislation.gov.uk/nisr/2005/279/contents/made', 'NI'],
  ])('detects %s as %s', (url, expected) => {
    expect(detectUKJurisdictionFromUrl(url)).toBe(expected)
  })
})

describe('isUKDelegatedLegislationUrl', () => {
  it('distinguishes ordinary legislation from delegated legislation by URL segment', () => {
    expect(isUKDelegatedLegislationUrl('https://www.legislation.gov.uk/ukpga/2023/50/contents')).toBe(false)
    expect(isUKDelegatedLegislationUrl('https://www.legislation.gov.uk/uksi/1998/2024/contents/made')).toBe(true)
    expect(isUKDelegatedLegislationUrl('https://www.legislation.gov.uk/nisr/2005/279/contents/made')).toBe(true)
  })
})

describe('ukInstrumentTypeForJurisdiction', () => {
  it('maps Northern Ireland to SR and everything else to SI', () => {
    expect(ukInstrumentTypeForJurisdiction('NI')).toBe('SR')
    expect(ukInstrumentTypeForJurisdiction('UK')).toBe('SI')
    expect(ukInstrumentTypeForJurisdiction('Scot')).toBe('SI')
    expect(ukInstrumentTypeForJurisdiction('Wales')).toBe('SI')
  })
})
