import { describe, expect, it } from 'vitest'
import { generateOtherLegislativeMaterialCitation, otherLegislativeMaterialBadge } from './other-legislative-material'
import { OtherLegislativeMaterialFields } from './types'

describe('generateOtherLegislativeMaterialCitation — bill (r 3.2)', () => {
  it('Corporations Amendment (Crowd-Sourced Funding) Bill 2015 (Cth)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'bill',
      billTitle: 'Corporations Amendment (Crowd-Sourced Funding) Bill',
      billYear: '2015',
      billJurisdiction: 'Cth',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Corporations Amendment (Crowd-Sourced Funding) Bill 2015 (Cth).',
    )
  })

  it('Criminal Code (Dangerous Driving) and Other Legislation Amendment Bill 2026 (Qld)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'bill',
      billTitle: 'Criminal Code (Dangerous Driving) and Other Legislation Amendment Bill',
      billYear: '2026',
      billJurisdiction: 'Qld',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Criminal Code (Dangerous Driving) and Other Legislation Amendment Bill 2026 (Qld).',
    )
  })

  it('is never italicised, unlike an ordinary Act', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'bill',
      billTitle: 'Animal Care and Protection Bill',
      billYear: '2001',
      billJurisdiction: 'Qld',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).not.toContain('*')
  })

  it('uses a bare-space clause pinpoint, matching legislation pinpoint spacing', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'bill',
      billTitle: 'Bail and Crimes Amendment Bill',
      billYear: '2024',
      billJurisdiction: 'NSW',
      pinpoint: 'cl 5',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Bail and Crimes Amendment Bill 2024 (NSW) cl 5.',
    )
  })
})

describe('generateOtherLegislativeMaterialCitation — explanatory material (r 3.7)', () => {
  it('Explanatory Memorandum, Animal Care and Protection Bill 2001 (Qld)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'explanatoryMaterial',
      explanatoryLabel: 'Explanatory Memorandum',
      billTitle: 'Animal Care and Protection Bill',
      billYear: '2001',
      billJurisdiction: 'Qld',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Explanatory Memorandum, Animal Care and Protection Bill 2001 (Qld).',
    )
  })

  it('Explanatory Notes, Animal Care and Protection Bill 2001 (Qld)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'explanatoryMaterial',
      explanatoryLabel: 'Explanatory Notes',
      billTitle: 'Animal Care and Protection Bill',
      billYear: '2001',
      billJurisdiction: 'Qld',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Explanatory Notes, Animal Care and Protection Bill 2001 (Qld).',
    )
  })

  it('Explanatory Statement, Human Rights Bill 2003 (ACT) 3', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'explanatoryMaterial',
      explanatoryLabel: 'Explanatory Statement',
      billTitle: 'Human Rights Bill',
      billYear: '2003',
      billJurisdiction: 'ACT',
      pinpoint: '3',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Explanatory Statement, Human Rights Bill 2003 (ACT) 3.',
    )
  })

  it('Explanatory Memorandum, Charter of Human Rights and Responsibilities Bill 2006 (Vic)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'explanatoryMaterial',
      explanatoryLabel: 'Explanatory Memorandum',
      billTitle: 'Charter of Human Rights and Responsibilities Bill',
      billYear: '2006',
      billJurisdiction: 'Vic',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Explanatory Memorandum, Charter of Human Rights and Responsibilities Bill 2006 (Vic).',
    )
  })
})

describe('generateOtherLegislativeMaterialCitation — gazette (r 3.9.1)', () => {
  it('Commonwealth, Gazette: Special, No S 489, 1 December 2004 — whole-gazette citation', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'gazette',
      gazetteJurisdiction: 'Commonwealth',
      gazetteName: 'Gazette: Special',
      gazetteNumber: 'No S 489',
      gazetteDate: '1 December 2004',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Commonwealth, *Gazette: Special*, No S 489, 1 December 2004.',
    )
  })

  it("'Australian Capital Territory Teaching Service' in Australian Capital Territory, Australian Capital Territory Gazette, No 1, 24 May 1989, 3", () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'gazette',
      gazetteArticleTitle: 'Australian Capital Territory Teaching Service',
      gazetteJurisdiction: 'Australian Capital Territory',
      gazetteName: 'Australian Capital Territory Gazette',
      gazetteNumber: 'No 1',
      gazetteDate: '24 May 1989',
      gazetteStartingPage: '3',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      '‘Australian Capital Territory Teaching Service’ in Australian Capital Territory, *Australian Capital Territory Gazette*, No 1, 24 May 1989, 3.',
    )
  })

  it('Minister for Lands (WA) — author, notice title, starting page, and pinpoint', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'gazette',
      gazetteAuthor: 'Minister for Lands (WA)',
      gazetteArticleTitle:
        'Land Acquisition and Public Works Act 1902 - Native Title Act 1993 (Commonwealth) - Notice of Intention to Take Land for a Public Work',
      gazetteJurisdiction: 'Western Australia',
      gazetteName: 'Western Australian Government Gazette',
      gazetteNumber: 'No 27',
      gazetteDate: '18 February 1997',
      gazetteStartingPage: '1142',
      pinpoint: '1143',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Minister for Lands (WA), ‘Land Acquisition and Public Works Act 1902 - Native Title Act 1993 (Commonwealth) - Notice of Intention to Take Land for a Public Work’ in Western Australia, *Western Australian Government Gazette*, No 27, 18 February 1997, 1142, 1143.',
    )
  })
})

describe('generateOtherLegislativeMaterialCitation — court practice direction/note', () => {
  it('Supreme Court of Victoria, Practice Note No 9 of 2010: Conduct of Group Proceedings, 29 November 2010', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'practiceDirection',
      court: 'Supreme Court of Victoria',
      practiceType: 'Practice Note',
      practiceNumber: 'No 9 of 2010',
      practiceTitle: 'Conduct of Group Proceedings',
      practiceDate: '29 November 2010',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'Supreme Court of Victoria, *Practice Note No 9 of 2010: Conduct of Group Proceedings*, 29 November 2010.',
    )
  })

  it('High Court of Australia, Practice Direction No 2 of 2010: Use of Initials or Pseudonyms in Applications, 2 November 2010', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'practiceDirection',
      court: 'High Court of Australia',
      practiceType: 'Practice Direction',
      practiceNumber: 'No 2 of 2010',
      practiceTitle: 'Use of Initials or Pseudonyms in Applications',
      practiceDate: '2 November 2010',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      'High Court of Australia, *Practice Direction No 2 of 2010: Use of Initials or Pseudonyms in Applications*, 2 November 2010.',
    )
  })

  it('Supreme Court of Queensland, Practice Direction No 5 of 2025: Accuracy of References in Submissions', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'practiceDirection',
      court: 'Supreme Court of Queensland',
      practiceType: 'Practice Direction',
      practiceNumber: 'No 5 of 2025',
      practiceTitle: 'Accuracy of References in Submissions',
      practiceDate: '2025',
    }
    const result = generateOtherLegislativeMaterialCitation(fields)
    expect(result.footnote).toBe(
      'Supreme Court of Queensland, *Practice Direction No 5 of 2025: Accuracy of References in Submissions*, 2025.',
    )
    expect(result.bibliography).toBe(
      'Supreme Court of Queensland, *Practice Direction No 5 of 2025: Accuracy of References in Submissions*, 2025',
    )
    expect(result.subsequent).toBe('*Practice Direction No 5 of 2025: Accuracy of References in Submissions* (n 1).')
  })
})

describe('generateOtherLegislativeMaterialCitation — constitution (r 3.6)', () => {
  it('Australian Constitution — no year, no jurisdiction bracket, ever', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'constitution',
      constitutionTitle: 'Australian Constitution',
      constitutionJurisdiction: 'none',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '51(ii)',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe('*Australian Constitution* s 51(ii).')
  })

  it('Australian Capital Territory (Self-Government) Act 1988 (Cth)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'constitution',
      constitutionTitle: 'Australian Capital Territory (Self-Government) Act',
      constitutionYear: '1988',
      constitutionJurisdiction: 'Cth',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '22(1)',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe(
      '*Australian Capital Territory (Self-Government) Act 1988* (Cth) s 22(1).',
    )
  })

  it('Constitution Act 1902 (NSW)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'constitution',
      constitutionTitle: 'Constitution Act',
      constitutionYear: '1902',
      constitutionJurisdiction: 'NSW',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '5',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe('*Constitution Act 1902* (NSW) s 5.')
  })

  it('Constitution of Queensland 2001 (Qld)', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'constitution',
      constitutionTitle: 'Constitution of Queensland',
      constitutionYear: '2001',
      constitutionJurisdiction: 'Qld',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '3',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).footnote).toBe('*Constitution of Queensland 2001* (Qld) s 3.')
  })

  it('marks sourceType as otherLegislativeMaterial, not legislation, even though it delegates internally', () => {
    const fields: OtherLegislativeMaterialFields = {
      subtype: 'constitution',
      constitutionTitle: 'Australian Constitution',
      constitutionJurisdiction: 'none',
    }
    expect(generateOtherLegislativeMaterialCitation(fields).sourceType).toBe('otherLegislativeMaterial')
  })
})

describe('otherLegislativeMaterialBadge', () => {
  it('names the exact practice type, not a generic label', () => {
    expect(otherLegislativeMaterialBadge({ subtype: 'practiceDirection', practiceType: 'Practice Direction' })).toBe(
      'Practice Direction',
    )
    expect(otherLegislativeMaterialBadge({ subtype: 'practiceDirection', practiceType: 'Practice Note' })).toBe(
      'Practice Note',
    )
  })

  it('names the exact explanatory label, not a generic label', () => {
    expect(
      otherLegislativeMaterialBadge({ subtype: 'explanatoryMaterial', explanatoryLabel: 'Explanatory Statement' }),
    ).toBe('Explanatory Statement')
  })

  it('gives a fixed label for bill, gazette, and constitution', () => {
    expect(otherLegislativeMaterialBadge({ subtype: 'bill' })).toBe('Bill')
    expect(otherLegislativeMaterialBadge({ subtype: 'gazette' })).toBe('Gazette')
    expect(otherLegislativeMaterialBadge({ subtype: 'constitution' })).toBe('Constitution')
  })
})
