import { describe, expect, it } from 'vitest'
import { generateCaseCitation } from './cases'
import { CaseFields } from './types'

describe('generateCaseCitation — reported', () => {
  it('Mabo v Queensland [No 2]', () => {
    const fields: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
      pinpoint: '29',
      pinpointType: 'page',
      judge: 'Brennan J',
    }
    expect(generateCaseCitation(fields).footnote).toBe(
      '*Mabo v Queensland [No 2]* (1992) 175 CLR 1, 29 (Brennan J).',
    )
  })

  it('R v Lester', () => {
    const fields: CaseFields = {
      caseName: 'R v Lester',
      reportType: 'reported',
      year: '2008',
      volume: '190',
      reportAbbreviation: 'A Crim R',
      startingPage: '468',
    }
    expect(generateCaseCitation(fields).footnote).toBe('*R v Lester* (2008) 190 A Crim R 468.')
  })

  it('strips a CCH-style pilcrow paragraph marker from the starting page', () => {
    const fields: CaseFields = {
      caseName: 'KLH v Northern NSW Local Health District',
      reportType: 'reported',
      year: '2026',
      reportAbbreviation: 'Aust Torts Reports',
      startingPage: '¶83-437',
    }
    expect(generateCaseCitation(fields).footnote).toBe(
      '*KLH v Northern NSW Local Health District* (2026) Aust Torts Reports 83-437.',
    )
  })

  it('King v King', () => {
    const fields: CaseFields = {
      caseName: 'King v King',
      reportType: 'reported',
      year: '1974',
      reportAbbreviation: 'Qd R',
      startingPage: '253',
    }
    expect(generateCaseCitation(fields).footnote).toBe('*King v King* [1974] Qd R 253.')
  })
})

describe('generateCaseCitation — unreported MNC', () => {
  it('Agius v South Australia [No 6]', () => {
    const fields: CaseFields = {
      caseName: 'Agius v South Australia [No 6]',
      reportType: 'unreported-mnc',
      year: '2018',
      courtCode: 'FCA',
      caseNumber: '358',
      pinpoint: '90',
      judge: 'Mortimer J',
    }
    expect(generateCaseCitation(fields).footnote).toBe(
      '*Agius v South Australia [No 6]* [2018] FCA 358, [90] (Mortimer J).',
    )
  })
})

describe('generateCaseCitation — unreported no MNC', () => {
  it('Barton v Chibber', () => {
    const fields: CaseFields = {
      caseName: 'Barton v Chibber',
      reportType: 'unreported-no-mnc',
      year: '1989',
      court: 'Supreme Court of Victoria',
      judge: 'Hampel J',
      date: '29 June 1989',
      pinpoint: '3',
      pinpointType: 'page',
    }
    expect(generateCaseCitation(fields).footnote).toBe(
      '*Barton v Chibber* (Supreme Court of Victoria, Hampel J, 29 June 1989) 3.',
    )
  })
})
