import { describe, expect, it } from 'vitest'
import { formatAuthorList, formatBibliographyAuthorList, quote, stripTrailingFullStop } from './utils'

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
})
