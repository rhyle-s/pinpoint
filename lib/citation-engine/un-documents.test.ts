import { describe, expect, it } from 'vitest'
import { generateUNDocumentCitation } from './un-documents'
import { UNDocumentFields } from './types'

describe('generateUNDocumentCitation', () => {
  it('UDHR — includeOfficialRecords set explicitly, independent of the (III) session shown in the resolution number', () => {
    const fields: UNDocumentFields = {
      title: 'Universal Declaration of Human Rights',
      resolutionNumber: '217A',
      session: 'III',
      includeOfficialRecords: true,
      unDocSymbol: 'A/810',
      date: '10 December 1948',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe(
      '*Universal Declaration of Human Rights*, GA Res 217A (III), UN GAOR, UN Doc A/810 (10 December 1948).',
    )
  })

  it('session present but includeOfficialRecords not set — UN GAOR is correctly omitted, since the two are independent elements (r 9.2.4 vs r 9.2.6)', () => {
    const fields: UNDocumentFields = {
      title: 'Universal Declaration of Human Rights',
      resolutionNumber: '217A',
      session: 'III',
      unDocSymbol: 'A/810',
      date: '10 December 1948',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe(
      '*Universal Declaration of Human Rights*, GA Res 217A (III), UN Doc A/810 (10 December 1948).',
    )
  })

  it('UNDRIP — newer session/number scheme omits UN GAOR, and has a separate adopted date', () => {
    const fields: UNDocumentFields = {
      title: 'United Nations Declaration on the Rights of Indigenous Peoples',
      resolutionNumber: '61/295',
      unDocSymbol: 'A/RES/61/295',
      date: '2 October 2007',
      adoptedDate: '13 September 2007',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe(
      '*United Nations Declaration on the Rights of Indigenous Peoples*, GA Res 61/295, UN Doc A/RES/61/295 (2 October 2007, adopted 13 September 2007).',
    )
  })

  it('resolution number known but no session or UN Doc symbol stated', () => {
    const fields: UNDocumentFields = {
      title: 'Declaration on the Right to Development',
      resolutionNumber: '41/128',
      date: '4 December 1986',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe(
      '*Declaration on the Right to Development*, GA Res 41/128 (4 December 1986).',
    )
  })

  it('no resolution number at all — just title and date', () => {
    const fields: UNDocumentFields = {
      title: 'Example Declaration',
      date: '1 January 2000',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe('*Example Declaration* (1 January 2000).')
  })

  it('Charter of the United Nations — cited by bare title alone, no date or resolution at all', () => {
    const fields: UNDocumentFields = {
      title: 'Charter of the United Nations',
      date: '',
    }
    expect(generateUNDocumentCitation(fields).footnote).toBe('*Charter of the United Nations*.')
  })

  it('subsequent reference and bibliography', () => {
    const fields: UNDocumentFields = {
      title: 'Universal Declaration of Human Rights',
      resolutionNumber: '217A',
      session: 'III',
      includeOfficialRecords: true,
      unDocSymbol: 'A/810',
      date: '10 December 1948',
    }
    const result = generateUNDocumentCitation(fields)
    expect(result.subsequent).toBe('*Universal Declaration of Human Rights* (n 1).')
    expect(result.bibliography).toBe(
      '*Universal Declaration of Human Rights*, GA Res 217A (III), UN GAOR, UN Doc A/810 (10 December 1948)',
    )
  })
})
