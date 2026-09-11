import { describe, expect, it } from 'vitest'
import { generateInternationalMaterialCitation, internationalMaterialBadge } from './international-material'
import { InternationalMaterialFields } from './types'

describe('generateInternationalMaterialCitation', () => {
  it('dispatches to the treaty format for subtype "treaty"', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'treaty',
      title: 'International Covenant on Economic, Social and Cultural Rights',
      treatyType: 'multilateral',
      openedForSignature: '16 December 1966',
      treatySeries: '993 UNTS 3',
      enteredIntoForce: '3 January 1976',
    }
    const result = generateInternationalMaterialCitation(fields)
    expect(result.footnote).toBe(
      '*International Covenant on Economic, Social and Cultural Rights*, opened for signature 16 December 1966, 993 UNTS 3 (entered into force 3 January 1976).',
    )
    expect(result.sourceType).toBe('internationalMaterial')
  })

  it('dispatches to the UN document format for subtype "unDocument"', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'unDocument',
      title: 'Universal Declaration of Human Rights',
      resolutionNumber: '217A',
      session: 'III',
      includeOfficialRecords: true,
      unDocSymbol: 'A/810',
      date: '10 December 1948',
    }
    const result = generateInternationalMaterialCitation(fields)
    expect(result.footnote).toBe(
      '*Universal Declaration of Human Rights*, GA Res 217A (III), UN GAOR, UN Doc A/810 (10 December 1948).',
    )
    expect(result.sourceType).toBe('internationalMaterial')
  })

  it('dispatches to the foreign-domestic format for subtype "foreignDomestic"', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'case',
      title: 'R v Sharpe',
      year: '2001',
      volume: '1',
      reportAbbreviation: 'SCR',
      startingPage: '45',
    }
    const result = generateInternationalMaterialCitation(fields)
    expect(result.footnote).toBe('*R v Sharpe* [2001] 1 SCR 45.')
    expect(result.sourceType).toBe('internationalMaterial')
    expect(result.validationStatus).toBe('unvalidated')
  })
})

describe('internationalMaterialBadge', () => {
  it('names each subtype', () => {
    expect(internationalMaterialBadge({ subtype: 'treaty' })).toBe('Treaty')
    expect(internationalMaterialBadge({ subtype: 'unDocument' })).toBe('UN Materials')
    expect(internationalMaterialBadge({ subtype: 'foreignDomestic' })).toBe('Foreign Domestic Sources')
  })
})
