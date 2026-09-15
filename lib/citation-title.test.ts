import { describe, expect, it } from 'vitest'
import { getCitationTitle } from './citation-title'

describe('getCitationTitle', () => {
  it('case -> caseName', () => {
    expect(getCitationTitle('case', { caseName: 'Mabo v Queensland [No 2]' } as never)).toBe('Mabo v Queensland [No 2]')
  })

  it('legislation -> actTitle', () => {
    expect(getCitationTitle('legislation', { actTitle: 'Native Title Act 1993' } as never)).toBe('Native Title Act 1993')
  })

  it('journal -> articleTitle', () => {
    expect(getCitationTitle('journal', { articleTitle: 'Some Article' } as never)).toBe('Some Article')
  })

  it('book: whole book -> title, chapter -> chapterTitle', () => {
    expect(getCitationTitle('book', { bookType: 'book', title: 'A Book' } as never)).toBe('A Book')
    expect(getCitationTitle('book', { bookType: 'chapter', chapterTitle: 'A Chapter', title: 'A Book' } as never)).toBe(
      'A Chapter',
    )
  })

  it('report -> title, researchPaper -> title', () => {
    expect(getCitationTitle('report', { title: 'A Report' } as never)).toBe('A Report')
    expect(getCitationTitle('researchPaper', { title: 'A Thesis' } as never)).toBe('A Thesis')
  })

  it('website -> documentTitle, newspaper -> articleTitle', () => {
    expect(getCitationTitle('website', { documentTitle: 'A Page' } as never)).toBe('A Page')
    expect(getCitationTitle('newspaper', { articleTitle: 'A Headline' } as never)).toBe('A Headline')
  })

  it('otherLegislativeMaterial splits by subtype', () => {
    expect(getCitationTitle('otherLegislativeMaterial', { subtype: 'bill', billTitle: 'A Bill' } as never)).toBe('A Bill')
    expect(
      getCitationTitle('otherLegislativeMaterial', { subtype: 'explanatoryMaterial', billTitle: 'A Bill' } as never),
    ).toBe('A Bill')
    expect(
      getCitationTitle('otherLegislativeMaterial', {
        subtype: 'gazette',
        gazetteArticleTitle: 'A Notice',
        gazetteName: 'WA Gazette',
      } as never),
    ).toBe('A Notice')
    expect(
      getCitationTitle('otherLegislativeMaterial', { subtype: 'gazette', gazetteName: 'WA Gazette' } as never),
    ).toBe('WA Gazette')
    expect(
      getCitationTitle('otherLegislativeMaterial', { subtype: 'practiceDirection', practiceTitle: 'A Direction' } as never),
    ).toBe('A Direction')
    expect(
      getCitationTitle('otherLegislativeMaterial', {
        subtype: 'constitution',
        constitutionTitle: 'Australian Constitution',
      } as never),
    ).toBe('Australian Constitution')
  })

  it('internationalMaterial -> title (shared across every subtype)', () => {
    expect(getCitationTitle('internationalMaterial', { subtype: 'treaty', title: 'A Treaty' } as never)).toBe('A Treaty')
  })

  it('otherSources splits by subtype, and returns undefined for dictionary/legalEncyclopedia', () => {
    expect(getCitationTitle('otherSources', { subtype: 'speech', speechTitle: 'A Speech' } as never)).toBe('A Speech')
    expect(getCitationTitle('otherSources', { subtype: 'pressRelease', pressReleaseTitle: 'A Release' } as never)).toBe(
      'A Release',
    )
    expect(getCitationTitle('otherSources', { subtype: 'abs', absTitle: 'ABS Stats' } as never)).toBe('ABS Stats')
    expect(getCitationTitle('otherSources', { subtype: 'filmOrMedia', mediaTitle: 'A Film' } as never)).toBe('A Film')
    expect(
      getCitationTitle('otherSources', { subtype: 'socialMedia', socialMediaTitle: 'A Post' } as never),
    ).toBe('A Post')
    expect(
      getCitationTitle('otherSources', { subtype: 'socialMedia', socialMediaUsername: '@someone' } as never),
    ).toBe('@someone')
    expect(getCitationTitle('otherSources', { subtype: 'dictionary', dictionaryTitle: 'A Dictionary' } as never)).toBe(
      undefined,
    )
    expect(
      getCitationTitle('otherSources', { subtype: 'legalEncyclopedia', encyclopediaTitle: 'An Encyclopedia' } as never),
    ).toBe(undefined)
  })
})
