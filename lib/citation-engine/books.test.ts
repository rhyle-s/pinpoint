import { describe, expect, it } from 'vitest'
import { generateBookCitation } from './books'
import { BookFields } from './types'

describe('generateBookCitation — whole book', () => {
  it('Catharine MacMillan', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Catharine MacMillan'],
      title: 'Mistakes in Contract Law',
      publisher: 'Hart Publishing',
      year: '2010',
      pinpoint: '9',
    }
    expect(generateBookCitation(fields).footnote).toBe('Catharine MacMillan, *Mistakes in Contract Law* (Hart Publishing, 2010) 9.')
  })

  it('Eric Barendt — with edition', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Eric Barendt'],
      title: 'Freedom of Speech',
      edition: '2nd ed',
      publisher: 'Oxford University Press',
      year: '2005',
      pinpoint: '14',
    }
    expect(generateBookCitation(fields).footnote).toBe(
      'Eric Barendt, *Freedom of Speech* (Oxford University Press, 2nd ed, 2005) 14.',
    )
  })

  it('Ralph H Folsom — no pinpoint', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Ralph H Folsom'],
      title: 'Principles of European Union Law',
      publisher: 'Thomson West',
      year: '2005',
    }
    expect(generateBookCitation(fields).footnote).toBe('Ralph H Folsom, *Principles of European Union Law* (Thomson West, 2005).')
  })
})

describe('generateBookCitation — book chapter', () => {
  it('Simon Evans', () => {
    const fields: BookFields = {
      bookType: 'chapter',
      chapterAuthors: ['Simon Evans'],
      chapterTitle: 'Reading Down Statutes',
      editors: ['Adrienne Stone', 'George Williams'],
      title: 'The High Court at the Crossroads',
      publisher: 'Federation Press',
      year: '2000',
      startingPage: '83',
      pinpoint: '90',
    }
    expect(generateBookCitation(fields).footnote).toBe(
      'Simon Evans, ‘Reading Down Statutes’ in Adrienne Stone and George Williams (eds), *The High Court at the Crossroads* (Federation Press, 2000) 83, 90.',
    )
  })
})

describe('generateBookCitation — subsequent references (AGLC4 r 1.4.1)', () => {
  it('whole book — defaults to a bare surname, no title, matching r 1.4.1\'s own example ("50 MacMillan (n 48) 41.")', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Catharine MacMillan'],
      title: 'Mistakes in Contract Law',
      publisher: 'Hart Publishing',
      year: '2010',
      footnoteNumber: '48',
      pinpoint: '41',
    }
    expect(generateBookCitation(fields).subsequent).toBe('MacMillan (n 48) 41.')
  })

  it('whole book — joins multiple authors\' surnames, eg "Rubenstein and Sim"', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Kim Rubenstein', 'Cameron Sim'],
      title: 'A Book',
      publisher: 'A Publisher',
      year: '2020',
      footnoteNumber: '9',
    }
    expect(generateBookCitation(fields).subsequent).toBe('Rubenstein and Sim (n 9).')
  })

  it('whole book — includes the italic title only once the student has explicitly set a short title', () => {
    const fields: BookFields = {
      bookType: 'book',
      authors: ['Kim Rubenstein'],
      title: 'Australian Citizenship Law in Context',
      publisher: 'Lawbook',
      year: '2002',
      footnoteNumber: '59',
      shortTitle: 'Australian Citizenship Law in Context',
      pinpoint: '48, 65–74',
    }
    expect(generateBookCitation(fields).subsequent).toBe(
      'Rubenstein, *Australian Citizenship Law in Context* (n 59) 48, 65–74.',
    )
  })

  it('book chapter — uses the chapter author\'s surname alone by default', () => {
    const fields: BookFields = {
      bookType: 'chapter',
      chapterAuthors: ['Simon Evans'],
      chapterTitle: 'Reading Down Statutes',
      editors: ['Adrienne Stone', 'George Williams'],
      title: 'The High Court at the Crossroads',
      publisher: 'Federation Press',
      year: '2000',
      footnoteNumber: '12',
      pinpoint: '90',
    }
    expect(generateBookCitation(fields).subsequent).toBe('Evans (n 12) 90.')
  })
})
