import { describe, expect, it } from 'vitest'
import { generateResearchPaperCitation } from './research-papers'
import { ResearchPaperFields } from './types'

describe('generateResearchPaperCitation', () => {
  it('conference paper', () => {
    const fields: ResearchPaperFields = {
      authors: ['Henry Fraser', 'Aaron J Snoswell', 'Rhyle Simcock'],
      title: 'AI Opacity and Explainability in Tort Litigation',
      documentType: 'Conference Paper',
      institution: '2022 ACM Conference on Fairness, Accountability, and Transparency (FAccT ’22)',
      date: '21 June 2022',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.footnote).toBe(
      'Henry Fraser, Aaron J Snoswell and Rhyle Simcock, ‘AI Opacity and Explainability in Tort Litigation’ (Conference Paper, 2022 ACM Conference on Fairness, Accountability, and Transparency (FAccT ’22), 21 June 2022).',
    )
    expect(result.bibliography).toBe(
      'Fraser, Henry, Aaron J Snoswell and Rhyle Simcock, ‘AI Opacity and Explainability in Tort Litigation’ (Conference Paper, 2022 ACM Conference on Fairness, Accountability, and Transparency (FAccT ’22), 21 June 2022)',
    )
  })

  it('PhD thesis', () => {
    const fields: ResearchPaperFields = {
      authors: ['Melissa Vogt'],
      title: 'The Concept of Territorial Sovereignty in International Law',
      documentType: 'PhD Thesis',
      institution: 'University of Melbourne',
      date: '2013',
      pinpoint: '45',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.footnote).toBe(
      'Melissa Vogt, ‘The Concept of Territorial Sovereignty in International Law’ (PhD Thesis, University of Melbourne, 2013) 45.',
    )
  })

  it('working paper with a series number', () => {
    const fields: ResearchPaperFields = {
      authors: ['Ian Ramsay'],
      title: 'Corporate Governance and the Duties of Company Directors',
      documentType: 'Working Paper',
      seriesNumber: 'No 5',
      institution: 'University of Melbourne, Centre for Corporate Law and Securities Regulation',
      date: '1997',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.footnote).toBe(
      'Ian Ramsay, ‘Corporate Governance and the Duties of Company Directors’ (Working Paper No 5, University of Melbourne, Centre for Corporate Law and Securities Regulation, 1997).',
    )
  })

  it('bibliography entry has no trailing full stop', () => {
    const fields: ResearchPaperFields = {
      title: 'A Paper With No Named Author',
      documentType: 'Research Paper',
      institution: 'Grattan Institute',
      date: '2020',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.bibliography.endsWith('.')).toBe(false)
    expect(result.bibliography).toBe('‘A Paper With No Named Author’ (Research Paper, Grattan Institute, 2020)')
  })

  it('subsequent reference uses every author\'s surname (not just the first), joined the same way the footnote itself is, with no title (AGLC4 r 1.4.1\'s own default)', () => {
    // Matches AGLC4's own r 1.4.1 worked example exactly in shape: '5 Edelman and Bant (n 2) 260.'
    const fields: ResearchPaperFields = {
      authors: ['Ian Ramsay', 'Cameron Sim'],
      title: 'The Role and Use of Debt Agreements',
      documentType: 'Research Paper',
      institution: 'University of Melbourne',
      date: '2011',
      footnoteNumber: '4',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.subsequent).toBe('Ramsay and Sim (n 4).')
  })

  it('subsequent reference includes the title when the student has explicitly set a short title', () => {
    const fields: ResearchPaperFields = {
      authors: ['Ian Ramsay', 'Cameron Sim'],
      title: 'The Role and Use of Debt Agreements',
      documentType: 'Research Paper',
      institution: 'University of Melbourne',
      date: '2011',
      footnoteNumber: '4',
      shortTitle: 'The Role and Use of Debt Agreements',
    }
    const result = generateResearchPaperCitation(fields)
    expect(result.subsequent).toBe('Ramsay and Sim, ‘The Role and Use of Debt Agreements’ (n 4).')
  })
})
