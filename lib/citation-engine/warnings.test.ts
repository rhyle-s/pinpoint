import { describe, expect, it } from 'vitest'
import { getConferencePaperDateWarning, getMissingFieldsWarning, getUnreportedCaseWarning } from './warnings'
import {
  BookFields,
  CaseFields,
  InternationalMaterialFields,
  JournalFields,
  LegislationFields,
  NewspaperFields,
  OtherLegislativeMaterialFields,
  OtherSourcesFields,
  ReportFields,
  ResearchPaperFields,
  WebsiteFields,
} from './types'

describe('getMissingFieldsWarning', () => {
  it('flags nothing for a fully-populated reported case', () => {
    const fields: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
    }
    expect(getMissingFieldsWarning('case', fields)).toBeUndefined()
  })

  it('never flags a missing pinpoint on an otherwise-complete case', () => {
    const fields: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
      pinpoint: '',
    }
    expect(getMissingFieldsWarning('case', fields)).toBeUndefined()
  })

  it('flags a missing law report abbreviation for a reported case', () => {
    const fields: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: '',
      startingPage: '1',
    }
    const warning = getMissingFieldsWarning('case', fields)
    expect(warning).toContain('Law report abbreviation')
  })

  it('requires Judge for an unreported-no-mnc case (r 2.3.2 core element) but not for reported', () => {
    const unreportedNoMnc: CaseFields = {
      caseName: 'Doe v Roe',
      reportType: 'unreported-no-mnc',
      year: '1989',
      court: 'Supreme Court of Victoria',
      date: '29 June 1989',
    }
    expect(getMissingFieldsWarning('case', unreportedNoMnc)).toContain('Judge')

    const reported: CaseFields = {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
      // no judge — should not be flagged for the reported form
    }
    expect(getMissingFieldsWarning('case', reported)).toBeUndefined()
  })

  it('flags a missing year for ordinary legislation', () => {
    const fields: LegislationFields = { actTitle: 'Privacy Act', year: '', jurisdiction: 'Cth' }
    expect(getMissingFieldsWarning('legislation', fields)).toContain('Year')
  })

  it('does not flag a missing year for the bare Commonwealth Constitution (jurisdiction none)', () => {
    const fields: LegislationFields = { actTitle: 'Australian Constitution', year: '', jurisdiction: 'none' }
    expect(getMissingFieldsWarning('legislation', fields)).toBeUndefined()
  })

  it('flags missing journal fields but never volume/issue', () => {
    const fields: JournalFields = {
      authors: [],
      articleTitle: '',
      year: '2008',
      journalName: 'Australian Law Journal',
      startingPage: '700',
    }
    const warning = getMissingFieldsWarning('journal', fields)
    expect(warning).toContain('Authors')
    expect(warning).toContain('Article title')
    expect(warning).not.toContain('Volume')
    expect(warning).not.toContain('Issue')
  })

  it('checks the right fields for a whole book vs a book chapter', () => {
    const wholeBook: BookFields = { bookType: 'book', title: '', publisher: 'Hart Publishing', year: '2010' }
    expect(getMissingFieldsWarning('book', wholeBook)).toContain('Title')

    const chapter: BookFields = {
      bookType: 'chapter',
      title: 'The High Court at the Crossroads',
      publisher: 'Federation Press',
      year: '2000',
      chapterAuthors: ['Simon Evans'],
      chapterTitle: 'Reading Down Statutes',
      editors: ['Adrienne Stone'],
      startingPage: '',
    }
    expect(getMissingFieldsWarning('book', chapter)).toContain('Starting page')
  })

  it('does not flag report authors (institutional reports routinely have none)', () => {
    const fields: ReportFields = { title: 'Traditional Rights and Freedoms', documentType: 'Report', date: 'December 2015' }
    expect(getMissingFieldsWarning('report', fields)).toBeUndefined()
  })

  it('flags missing researchPaper fields', () => {
    const fields: ResearchPaperFields = { title: '', documentType: '', institution: '', date: '' }
    const warning = getMissingFieldsWarning('researchPaper', fields)
    expect(warning).toContain('Title')
    expect(warning).toContain('Document type')
    expect(warning).toContain('Institution')
    expect(warning).toContain('Date')
  })

  it('flags missing website fields but not date (r 7.15 allows omitting it)', () => {
    const fields: WebsiteFields = { documentTitle: '', websiteName: '', documentType: 'Web Page', url: '' }
    const warning = getMissingFieldsWarning('website', fields)
    expect(warning).toContain('Document title')
    expect(warning).toContain('Website name')
    expect(warning).toContain('URL')
    expect(warning).not.toContain('Date')
  })

  it('does not flag newspaper authors (unbylined wire reports are normal)', () => {
    const fields: NewspaperFields = { articleTitle: 'Headline', newspaperName: 'ABC News', date: '17 August 2026', url: 'https://example.com' }
    expect(getMissingFieldsWarning('newspaper', fields)).toBeUndefined()
  })

  it('checks the right otherLegislativeMaterial fields per subtype', () => {
    const gazette: OtherLegislativeMaterialFields = {
      subtype: 'gazette',
      gazetteJurisdiction: 'Western Australia',
      gazetteName: '',
      gazetteNumber: 'No 27',
      gazetteDate: '18 February 1997',
    }
    expect(getMissingFieldsWarning('otherLegislativeMaterial', gazette)).toContain('Gazette name')

    // A whole-gazette citation correctly has neither gazetteAuthor nor gazetteArticleTitle — not
    // a gap.
    expect(getMissingFieldsWarning('otherLegislativeMaterial', gazette)).not.toContain('Author')
  })

  it('does not flag a missing constitution year (bare Constitution has none) but does flag a missing title', () => {
    const fields: OtherLegislativeMaterialFields = { subtype: 'constitution', constitutionTitle: '' }
    const warning = getMissingFieldsWarning('otherLegislativeMaterial', fields)
    expect(warning).toContain('Title')
    expect(warning).not.toContain('Year')
  })

  it('does not flag treatySeries as missing (frequently and legitimately unavailable)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'treaty',
      title: 'International Covenant on Economic, Social and Cultural Rights',
      treatyType: 'multilateral',
      openedForSignature: '16 December 1966',
      treatySeries: '',
    }
    expect(getMissingFieldsWarning('internationalMaterial', fields)).toBeUndefined()
  })

  it('flags a missing signed date for a bilateral treaty but opened-for-signature for a multilateral one', () => {
    const bilateral: InternationalMaterialFields = { subtype: 'treaty', title: 'Treaty', treatyType: 'bilateral', signedDate: '' }
    expect(getMissingFieldsWarning('internationalMaterial', bilateral)).toContain('Signed date')

    const multilateral: InternationalMaterialFields = { subtype: 'treaty', title: 'Treaty', treatyType: 'multilateral', openedForSignature: '' }
    expect(getMissingFieldsWarning('internationalMaterial', multilateral)).toContain('Opened for signature')
  })

  it('does not flag the UN Charter as missing its date, but flags an ordinary unDocument missing one', () => {
    const charter: InternationalMaterialFields = { subtype: 'unDocument', title: 'Charter of the United Nations', date: '' }
    expect(getMissingFieldsWarning('internationalMaterial', charter)).toBeUndefined()

    const udhr: InternationalMaterialFields = { subtype: 'unDocument', title: 'Universal Declaration of Human Rights', date: '' }
    expect(getMissingFieldsWarning('internationalMaterial', udhr)).toContain('Date')
  })

  it('does not attempt to check foreignDomestic or europeanUnion subtypes (deliberately out of scope)', () => {
    const foreignDomestic: InternationalMaterialFields = { subtype: 'foreignDomestic' }
    expect(getMissingFieldsWarning('internationalMaterial', foreignDomestic)).toBeUndefined()

    const eu: InternationalMaterialFields = { subtype: 'europeanUnion' }
    expect(getMissingFieldsWarning('internationalMaterial', eu)).toBeUndefined()
  })

  it('requires exactly one of the two dictionary "modes" (hard copy vs online), not both', () => {
    const neither: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryEntryTitle: 'demise',
    }
    expect(getMissingFieldsWarning('otherSources', neither)).toContain('Edition/year (hard copy) or retrieval date (online)')

    const hardCopy: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryEntryTitle: 'demise',
      dictionaryYear: '2009',
    }
    expect(getMissingFieldsWarning('otherSources', hardCopy)).toBeUndefined()
  })

  it('flags missing speech fields', () => {
    const fields: OtherSourcesFields = { subtype: 'speech', speechAuthor: '', speechTitle: '', speechForum: '', speechDate: '' }
    const warning = getMissingFieldsWarning('otherSources', fields)
    expect(warning).toContain('Author')
    expect(warning).toContain('Title')
    expect(warning).toContain('Institution / forum')
    expect(warning).toContain('Date')
  })
})

describe('getUnreportedCaseWarning', () => {
  it('warns for an unreported-mnc case', () => {
    const fields: CaseFields = { caseName: 'X', reportType: 'unreported-mnc', year: '2020' }
    expect(getUnreportedCaseWarning('case', fields)).toMatch(/unreported/i)
  })

  it('warns for an unreported-no-mnc case', () => {
    const fields: CaseFields = { caseName: 'X', reportType: 'unreported-no-mnc', year: '1989' }
    expect(getUnreportedCaseWarning('case', fields)).toMatch(/unreported/i)
  })

  it('does not warn for a reported case', () => {
    const fields: CaseFields = { caseName: 'X', reportType: 'reported', year: '1992' }
    expect(getUnreportedCaseWarning('case', fields)).toBeUndefined()
  })

  it('does not apply to any non-case source type', () => {
    const fields: LegislationFields = { actTitle: 'X', year: '2000', jurisdiction: 'Cth' }
    expect(getUnreportedCaseWarning('legislation', fields)).toBeUndefined()
  })
})

describe('getConferencePaperDateWarning', () => {
  it('warns when a conference paper has only a year for its date', () => {
    const fields: ResearchPaperFields = {
      title: 'On the Dangers of Stochastic Parrots',
      documentType: 'Conference Paper',
      institution: 'ACM Conference on Fairness, Accountability, and Transparency',
      date: '2021',
    }
    expect(getConferencePaperDateWarning('researchPaper', fields)).toMatch(/r 7\.2/)
  })

  it('does not warn once a full conference date is present', () => {
    const fields: ResearchPaperFields = {
      title: 'On the Dangers of Stochastic Parrots',
      documentType: 'Conference Paper',
      institution: 'ACM Conference on Fairness, Accountability, and Transparency',
      date: '3–10 March 2021',
    }
    expect(getConferencePaperDateWarning('researchPaper', fields)).toBeUndefined()
  })

  it('does not warn for a thesis or working paper (year-only dates are normal there)', () => {
    const thesis: ResearchPaperFields = { title: 'X', documentType: 'PhD Thesis', institution: 'ANU', date: '2019' }
    expect(getConferencePaperDateWarning('researchPaper', thesis)).toBeUndefined()
  })

  it('does not warn when the date is blank (the missing-fields check covers that)', () => {
    const fields: ResearchPaperFields = { title: 'X', documentType: 'Conference Paper', institution: 'Y', date: '' }
    expect(getConferencePaperDateWarning('researchPaper', fields)).toBeUndefined()
  })
})
