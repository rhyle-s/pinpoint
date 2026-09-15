import { describe, expect, it } from 'vitest'
import { bibliographySectionFor } from './library-bibliography-sections'

describe('bibliographySectionFor — AGLC4 r 1.13 divisions', () => {
  it('cases -> B', () => {
    expect(bibliographySectionFor('case', {} as never)).toBe('B')
  })

  it('legislation and otherLegislativeMaterial -> C', () => {
    expect(bibliographySectionFor('legislation', {} as never)).toBe('C')
    expect(bibliographySectionFor('otherLegislativeMaterial', {} as never)).toBe('C')
  })

  it('journal/book/report/researchPaper/newspaper -> A', () => {
    for (const type of ['journal', 'book', 'report', 'researchPaper', 'newspaper'] as const) {
      expect(bibliographySectionFor(type, {} as never)).toBe('A')
    }
  })

  it('website and otherSources -> E', () => {
    expect(bibliographySectionFor('website', {} as never)).toBe('E')
    expect(bibliographySectionFor('otherSources', {} as never)).toBe('E')
  })

  it('internationalMaterial: treaty -> D, unDocument -> E', () => {
    expect(bibliographySectionFor('internationalMaterial', { subtype: 'treaty' } as never)).toBe('D')
    expect(bibliographySectionFor('internationalMaterial', { subtype: 'unDocument' } as never)).toBe('E')
  })

  it('internationalMaterial: foreignDomestic splits on foreignCategory', () => {
    expect(
      bibliographySectionFor('internationalMaterial', { subtype: 'foreignDomestic', foreignCategory: 'case' } as never),
    ).toBe('B')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'foreignDomestic', foreignCategory: 'legislation' } as never,
      ),
    ).toBe('C')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'foreignDomestic', foreignCategory: 'constitution' } as never,
      ),
    ).toBe('C')
  })

  it('internationalMaterial: europeanUnion splits on euCategory', () => {
    expect(
      bibliographySectionFor('internationalMaterial', { subtype: 'europeanUnion', euCategory: 'court' } as never),
    ).toBe('B')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'europeanUnion', euCategory: 'europeanCourtOfHumanRights' } as never,
      ),
    ).toBe('B')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'europeanUnion', euCategory: 'officialJournal' } as never,
      ),
    ).toBe('C')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'europeanUnion', euCategory: 'constitutiveTreaty' } as never,
      ),
    ).toBe('D')
    expect(
      bibliographySectionFor(
        'internationalMaterial',
        { subtype: 'europeanUnion', euCategory: 'councilOfEuropeBasicDocument' } as never,
      ),
    ).toBe('D')
  })
})
