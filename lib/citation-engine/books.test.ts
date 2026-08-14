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
