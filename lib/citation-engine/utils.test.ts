import { describe, expect, it } from 'vitest'
import {
  formatAuthorList,
  formatBibliographyAuthorList,
  isInstitutionalAuthor,
  quote,
  sanitizeFieldsForValidation,
  stripTrailingFullStop,
} from './utils'
import { CaseFields } from './types'

describe('quote', () => {
  it('wraps text in typographic curly quotes, not straight ones', () => {
    expect(quote('The Role and Use of Debt Agreements')).toBe('‘The Role and Use of Debt Agreements’')
  })
})

describe('stripTrailingFullStop', () => {
  it('removes a trailing full stop', () => {
    expect(stripTrailingFullStop('Smith v Jones (2020) 1 CLR 1.')).toBe('Smith v Jones (2020) 1 CLR 1')
  })

  it('leaves text without a trailing full stop unchanged', () => {
    expect(stripTrailingFullStop('Smith v Jones (2020) 1 CLR 1')).toBe('Smith v Jones (2020) 1 CLR 1')
  })
})

describe('formatAuthorList', () => {
  it('returns a single author unchanged', () => {
    expect(formatAuthorList(['Ian Ramsay'])).toBe('Ian Ramsay')
  })

  it('joins two authors with "and"', () => {
    expect(formatAuthorList(['Ian Ramsay', 'Cameron Sim'])).toBe('Ian Ramsay and Cameron Sim')
  })

  it('joins three authors with a comma and "and" before the last', () => {
    expect(formatAuthorList(['A', 'B', 'C'])).toBe('A, B and C')
  })

  it('reduces more than three authors to the first author followed by "et al"', () => {
    expect(formatAuthorList(['A', 'B', 'C', 'D'])).toBe('A et al')
  })

  it('strips a stray full stop after a standalone middle initial', () => {
    expect(formatAuthorList(['Emily M. Bender'])).toBe('Emily M Bender')
  })

  it('leaves a name with no initial full stop unchanged', () => {
    expect(formatAuthorList(['RJ Ellicott'])).toBe('RJ Ellicott')
  })
})

describe('formatBibliographyAuthorList', () => {
  it('inverts a single author', () => {
    expect(formatBibliographyAuthorList(['Ian Ramsay'])).toBe('Ramsay, Ian')
  })

  it('inverts only the first author for two authors, joined by "and"', () => {
    expect(formatBibliographyAuthorList(['Ian Ramsay', 'Cameron Sim'])).toBe('Ramsay, Ian and Cameron Sim')
  })

  it('never truncates to "et al", however many authors there are', () => {
    expect(formatBibliographyAuthorList(['A One', 'B Two', 'C Three', 'D Four'])).toBe(
      'One, A, B Two, C Three and D Four',
    )
  })

  it('does not invert an institutional first author (AGLC4 r 4.1)', () => {
    // The exact bug the AI validator was papering over on the Home Affairs annual report.
    expect(formatBibliographyAuthorList(['Department of Home Affairs'])).toBe('Department of Home Affairs')
    expect(formatBibliographyAuthorList(['Australian Law Reform Commission'])).toBe('Australian Law Reform Commission')
    expect(formatBibliographyAuthorList(['Cisco'])).toBe('Cisco')
  })

  it('still inverts a personal first author when the co-authors are institutional', () => {
    expect(formatBibliographyAuthorList(['Jane Smith', 'Department of Health'])).toBe(
      'Smith, Jane and Department of Health',
    )
  })
})

describe('isInstitutionalAuthor', () => {
  it('flags bodies, organisations and companies', () => {
    for (const name of [
      'Department of Home Affairs',
      'Australian Bureau of Statistics',
      'Productivity Commission',
      'Law Council of Australia',
      'Grattan Institute',
      'United Nations',
      'Woolworths Group',
      'Google LLC',
      'BHP Billiton Ltd',
      'UNESCO',
    ]) {
      expect(isInstitutionalAuthor(name), name).toBe(true)
    }
  })

  it('does not flag ordinary personal names', () => {
    for (const name of ['Ian Ramsay', 'Cameron Sim', 'Emily M Bender', 'H P Lee', 'Mary-Anne O’Brien']) {
      expect(isInstitutionalAuthor(name), name).toBe(false)
    }
  })
})

describe('sanitizeFieldsForValidation', () => {
  it('strips a CCH-style pilcrow from string fields before they reach the AI validator', () => {
    // Regression test: the validator sends the raw source fields to the AI as JSON context so it
    // can reason about the underlying data — but a corrected* field it writes back is
    // reconstructed straight from that JSON, bypassing whatever deterministic post-processing
    // (stripPilcrow) already ran on the original base citation. Confirmed live: a '¶83-437'
    // starting page survived into a 'corrected' footnote even though the unvalidated citation was
    // already pilcrow-free, because the AI reconstructed the whole footnote from these raw fields
    // while correcting an unrelated issue. Sanitising the fields before they're ever serialised
    // for the AI closes that gap regardless of what else it corrects.
    const fields: CaseFields = {
      caseName: 'KLH v Northern NSW Local Health District',
      reportType: 'reported',
      year: '2026',
      reportAbbreviation: 'Aust Torts Reports',
      startingPage: '¶83-437',
    }
    const clean = sanitizeFieldsForValidation(fields) as CaseFields
    expect(clean.startingPage).toBe('83-437')
    expect(clean.caseName).toBe('KLH v Northern NSW Local Health District')
  })

  it('leaves fields with no pilcrow untouched', () => {
    const fields: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
    }
    expect(sanitizeFieldsForValidation(fields)).toEqual(fields)
  })
})
