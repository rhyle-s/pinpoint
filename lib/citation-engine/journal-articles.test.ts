import { describe, expect, it } from 'vitest'
import { generateJournalCitation } from './journal-articles'
import { JournalFields } from './types'

describe('generateJournalCitation', () => {
  it('RJ Ellicott — round-bracket, volume(issue)', () => {
    const fields: JournalFields = {
      authors: ['RJ Ellicott'],
      articleTitle: 'The Autochthonous Expedient and the Federal Court',
      year: '2008',
      volume: '82',
      issue: '10',
      journalName: 'Australian Law Journal',
      startingPage: '700',
    }
    expect(generateJournalCitation(fields).footnote).toBe(
      'RJ Ellicott, ‘The Autochthonous Expedient and the Federal Court’ (2008) 82(10) *Australian Law Journal* 700.',
    )
  })

  it('Jeremy Masters — with pinpoint', () => {
    const fields: JournalFields = {
      authors: ['Jeremy Masters'],
      articleTitle: 'Easing the Parting',
      year: '2008',
      volume: '82',
      issue: '11',
      journalName: 'Law Institute Journal',
      startingPage: '68',
      pinpoint: '69',
    }
    expect(generateJournalCitation(fields).footnote).toBe(
      'Jeremy Masters, ‘Easing the Parting’ (2008) 82(11) *Law Institute Journal* 68, 69.',
    )
  })

  it('John Kleinig — square-bracket, year-organised, no volume', () => {
    const fields: JournalFields = {
      authors: ['John Kleinig'],
      articleTitle: 'Paternalism and Personal Integrity',
      year: '1983',
      issue: '3',
      journalName: 'Bulletin of the Australian Society of Legal Philosophy',
      startingPage: '27',
    }
    expect(generateJournalCitation(fields).footnote).toBe(
      'John Kleinig, ‘Paternalism and Personal Integrity’ [1983] (3) *Bulletin of the Australian Society of Legal Philosophy* 27.',
    )
  })
})

describe('generateJournalCitation — subsequent references (AGLC4 r 1.4.1)', () => {
  it('defaults to a bare surname, no title — matching r 1.4.1\'s own default example (eg "50 MacMillan (n 48) 41.")', () => {
    const fields: JournalFields = {
      authors: ['RJ Ellicott'],
      articleTitle: 'The Autochthonous Expedient and the Federal Court',
      year: '2008',
      volume: '82',
      issue: '10',
      journalName: 'Australian Law Journal',
      startingPage: '700',
      footnoteNumber: '3',
      pinpoint: '705',
    }
    expect(generateJournalCitation(fields).subsequent).toBe('Ellicott (n 3) 705.')
  })

  it('joins multiple authors\' surnames the same way the footnote itself does, eg "Edelman and Bant (n 2)"', () => {
    const fields: JournalFields = {
      authors: ['James Edelman', 'Elise Bant'],
      articleTitle: 'An Article',
      year: '2016',
      journalName: 'Some Journal',
      startingPage: '1',
      footnoteNumber: '2',
    }
    expect(generateJournalCitation(fields).subsequent).toBe('Edelman and Bant (n 2).')
  })

  it('includes the quoted title only once the student has explicitly set a short title', () => {
    const fields: JournalFields = {
      authors: ['Kim Rubenstein'],
      articleTitle: 'Meanings of Membership: Mary Gaudron\'s Contributions to Australian Citizenship',
      year: '2004',
      volume: '15',
      issue: '4',
      journalName: 'Public Law Review',
      startingPage: '305',
      footnoteNumber: '58',
      shortTitle: 'Meanings of Membership',
    }
    expect(generateJournalCitation(fields).subsequent).toBe('Rubenstein, ‘Meanings of Membership’ (n 58).')
  })

  it('uses the title alone for an unsigned article (no author to stand in as a surname)', () => {
    const fields: JournalFields = {
      authors: [],
      articleTitle: 'Comment: A Note on Something',
      year: '2020',
      journalName: 'Some Journal',
      startingPage: '1',
      footnoteNumber: '7',
    }
    expect(generateJournalCitation(fields).subsequent).toBe('‘Comment: A Note on Something’ (n 7).')
  })
})
