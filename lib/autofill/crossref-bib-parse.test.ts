import { describe, expect, it } from 'vitest'
import { BibCandidate, isAcceptableBibMatch, looksLikeSecondarySourceReference } from './crossref-bib-parse'

const parrots: BibCandidate = {
  type: 'proceedings-article',
  title: 'On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?',
  year: '2021',
  authorFamilyNames: ['Bender', 'Gebru', 'McMillan-Major', 'Shmitchell'],
  score: 82,
}

describe('isAcceptableBibMatch', () => {
  it('accepts a strong match corroborated by both author and year', () => {
    const text = 'Bender et al, On the Dangers of Stochastic Parrots: Can Language Models Be Too Big? (2021)'
    expect(isAcceptableBibMatch(parrots, text)).toBe(true)
  })

  it('accepts when only the year corroborates, given full title coverage', () => {
    const text = 'On the Dangers of Stochastic Parrots: Can Language Models Be Too Big? — a 2021 conference paper'
    expect(isAcceptableBibMatch(parrots, text)).toBe(true)
  })

  it('rejects when neither year nor author is present and the score is only moderate', () => {
    const text = 'On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?'
    expect(isAcceptableBibMatch({ ...parrots, score: 55 }, text)).toBe(false)
  })

  it('rejects a record type the citation builders do not handle', () => {
    const text = 'Bender et al, On the Dangers of Stochastic Parrots: Can Language Models Be Too Big? (2021)'
    expect(isAcceptableBibMatch({ ...parrots, type: 'book-chapter' }, text)).toBe(false)
    expect(isAcceptableBibMatch({ ...parrots, type: 'posted-content' }, text)).toBe(false)
  })

  it('rejects when the candidate title is largely absent from the pasted text', () => {
    const text = 'Bender 2021 — something about large language models and their environmental cost'
    expect(isAcceptableBibMatch(parrots, text)).toBe(false)
  })

  it('needs BOTH corroborating signals for a short / generic title', () => {
    const editorial: BibCandidate = {
      type: 'journal-article',
      title: 'Editorial',
      year: '2019',
      authorFamilyNames: ['Finkelstein'],
      score: 90,
    }
    expect(isAcceptableBibMatch(editorial, 'Finkelstein, Editorial (2019)')).toBe(true)
    expect(isAcceptableBibMatch(editorial, 'Editorial, 2019')).toBe(false) // author missing
    expect(isAcceptableBibMatch(editorial, 'Finkelstein, Editorial')).toBe(false) // year missing
  })

  it('rejects a low score even with author and year present', () => {
    const text = 'Bender et al, On the Dangers of Stochastic Parrots: Can Language Models Be Too Big? (2021)'
    expect(isAcceptableBibMatch({ ...parrots, score: 20 }, text)).toBe(false)
  })
})

describe('looksLikeSecondarySourceReference', () => {
  it('is true for an ordinary journal / conference reference', () => {
    expect(
      looksLikeSecondarySourceReference('Bender et al, On the Dangers of Stochastic Parrots (2021) ACM FAccT'),
    ).toBe(true)
    expect(looksLikeSecondarySourceReference('Ian Ramsay, The Role and Use of Debt Agreements (2008) 82 something')).toBe(
      true,
    )
  })

  it('is false for a case citation', () => {
    expect(looksLikeSecondarySourceReference('Smith v Jones [2021] HCA 12')).toBe(false)
    expect(looksLikeSecondarySourceReference('Mabo v Queensland [No 2] (1992) 175 CLR 1')).toBe(false)
  })

  it('is false for a statute reference', () => {
    expect(looksLikeSecondarySourceReference('Privacy Act 1988 (Cth) s 6')).toBe(false)
  })
})
