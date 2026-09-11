import { describe, expect, it } from 'vitest'
import { matchKnownOHCHRInstrument } from './known-ohchr-instruments'
import { InternationalMaterialFields } from '../citation-engine/types'

describe('matchKnownOHCHRInstrument', () => {
  it('returns the full verified citation for a known treaty URL', () => {
    const result = matchKnownOHCHRInstrument(
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-covenant-economic-social-and-cultural-rights',
    )
    expect(result?.detectedSourceType).toBe('internationalMaterial')
    expect(result?.confidence).toBe('high')
    const fields = result?.fields as Partial<InternationalMaterialFields>
    expect(fields.subtype).toBe('treaty')
    expect(fields.title).toBe('International Covenant on Economic, Social and Cultural Rights')
    expect(fields.openedForSignature).toBe('16 December 1966')
    expect(fields.treatySeries).toBe('993 UNTS 3')
    expect(fields.enteredIntoForce).toBe('3 January 1976')
  })

  it('returns unDocument fields for the one declaration in the set (UNDRIP)', () => {
    const result = matchKnownOHCHRInstrument('https://www.ohchr.org/en/indigenous-peoples/un-declaration-rights-indigenous-peoples')
    expect(result?.detectedSourceType).toBe('internationalMaterial')
    const fields = result?.fields as Partial<InternationalMaterialFields>
    expect(fields.subtype).toBe('unDocument')
    expect(fields.title).toBe('United Nations Declaration on the Rights of Indigenous Peoples')
    expect(fields.resolutionNumber).toBe('61/295')
    expect(fields.unDocSymbol).toBe('A/RES/61/295')
    expect(fields.date).toBe('2 October 2007')
    expect(fields.adoptedDate).toBe('13 September 2007')
  })

  it('is case-insensitive and tolerant of query strings/fragments', () => {
    const result = matchKnownOHCHRInstrument(
      'HTTPS://WWW.OHCHR.ORG/en/instruments-mechanisms/instruments/convention-rights-child?utm_source=x#top',
    )
    expect((result?.fields as Partial<InternationalMaterialFields>).title).toBe('Convention on the Rights of the Child')
  })

  it('returns undefined for an ohchr.org page outside the known set', () => {
    expect(matchKnownOHCHRInstrument('https://www.ohchr.org/en/about-us')).toBeUndefined()
  })

  it('returns undefined for a non-ohchr.org URL, even one with a matching path', () => {
    expect(
      matchKnownOHCHRInstrument('https://example.com/en/instruments-mechanisms/instruments/convention-rights-child'),
    ).toBeUndefined()
  })

  it('covers all 13 requested instruments', () => {
    const urls = [
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-prevention-and-punishment-crime-genocide',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-relating-status-refugees',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/discrimination-employment-and-occupation-convention-1958-no-111',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-convention-elimination-all-forms-racial',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-covenant-economic-social-and-cultural-rights',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-covenant-civil-and-political-rights',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-elimination-all-forms-discrimination-against-women',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-against-torture-and-other-cruel-inhuman-or-degrading',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/indigenous-and-tribal-peoples-convention-1989-no-169',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/international-convention-protection-rights-all-migrant-workers',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-persons-disabilities',
      'https://www.ohchr.org/en/indigenous-peoples/un-declaration-rights-indigenous-peoples',
      'https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child',
    ]
    for (const url of urls) {
      expect(matchKnownOHCHRInstrument(url), url).toBeDefined()
    }
  })
})
