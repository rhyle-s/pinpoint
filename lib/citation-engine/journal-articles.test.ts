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
