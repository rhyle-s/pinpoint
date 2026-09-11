import { describe, expect, it } from 'vitest'
import { foreignDomesticBadge, foreignDomesticRuleLabel, generateForeignDomesticCitation } from './foreign-domestic'
import { InternationalMaterialFields } from './types'

// Every expected string below is taken directly from AGLC4's own worked examples (Melbourne Law
// School's PDF, Part V), not derived — including the couple of cases where AGLC4's own example
// text differs slightly from an informally-quoted version (eg 'R v Sharpe [2001] 1 SCR 45', not
// '... SCR 5').

describe('Canada (ch 15)', () => {
  it('formats a reported case (square bracket — SCR)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'case',
      title: 'R v Sharpe',
      year: '2001',
      volume: '1',
      reportAbbreviation: 'SCR',
      startingPage: '45',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*R v Sharpe* [2001] 1 SCR 45.')
  })

  it('formats a reported case with a court name (round bracket — DLR)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'case',
      title: 'Bangoura v Washington Post',
      year: '2005',
      volume: '258',
      reportAbbreviation: 'DLR (4th)',
      startingPage: '341',
      courtName: 'Ontario Court of Appeal',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Bangoura v Washington Post* (2005) 258 DLR (4th) 341 (Ontario Court of Appeal).',
    )
  })

  it('formats legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'legislation',
      title: 'Privacy Act',
      canadaStatuteVolumeType: 'RS',
      canadaJurisdictionAbbrev: 'C',
      year: '1985',
      canadaChapter: 'P-21',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Privacy Act*, RSC 1985, c P-21.')
  })

  it('formats legislation with a supplement number and pinpoint', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'legislation',
      title: 'Criminal Law Amendment Act',
      canadaStatuteVolumeType: 'RS',
      canadaJurisdictionAbbrev: 'C',
      year: '1985',
      canadaSessionOrSupp: '1st Supp',
      canadaChapter: '27',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Criminal Law Amendment Act*, RSC 1985 (1st Supp), c 27.')
  })

  it("strips a leading 'The' from a legislation title, inside the italics", () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'legislation',
      title: 'The Agri-Food Amendment Act',
      canadaStatuteVolumeType: 'S',
      canadaJurisdictionAbbrev: 'S',
      year: '1997',
      canadaChapter: '27',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Agri-Food Amendment Act*, SS 1997, c 27.')
  })

  it('has the right AGLC4 rule reference', () => {
    expect(foreignDomesticRuleLabel({ subtype: 'foreignDomestic', foreignCountry: 'Canada', foreignCategory: 'legislation' })).toBe(
      'AGLC4 r 15.2',
    )
  })
})

describe('New Zealand (ch 21)', () => {
  it('formats a reported case', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'case',
      title: 'Haylock v Patek',
      year: '2009',
      volume: '1',
      reportAbbreviation: 'NZLR',
      startingPage: '351',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Haylock v Patek* [2009] 1 NZLR 351.')
  })

  it('formats a case with both a judge and a court name', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'case',
      title: 'Buchanan v Jennings',
      year: '2000',
      reportAbbreviation: 'NZAR',
      startingPage: '113',
      judge: 'Randerson and Neazor JJ',
      courtName: 'High Court',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Buchanan v Jennings* [2000] NZAR 113 (Randerson and Neazor JJ) (High Court).',
    )
  })

  it('formats legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'legislation',
      title: 'Companies Act',
      year: '1993',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Companies Act 1993* (NZ).')
  })

  it('formats delegated legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'delegatedLegislation',
      title: 'Electronic Transactions Regulations',
      year: '2003',
      nzStatutoryRuleNumber: '2003/288',
      pinpoint: 'reg 4',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Electronic Transactions Regulations 2003* (NZ) SR 2003/288, reg 4.',
    )
  })
})

describe('United Kingdom (ch 24)', () => {
  it('formats a reported case', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'case',
      title: 'CAS Nominees Ltd v Nottingham Forest FC plc',
      year: '2001',
      volume: '1',
      reportAbbreviation: 'All ER',
      startingPage: '954',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*CAS Nominees Ltd v Nottingham Forest FC plc* [2001] 1 All ER 954.')
  })

  // AGLC4 r 24.2.3: a chapter number is included ONLY for statutes enacted before 1 January
  // 1963 — every one of these four is a post-1963 UK/NI/Scot/Wales statute (r 24.2.2's own
  // worked examples confirm none of them carries any number at all). An earlier version of this
  // formatter always rendered a fabricated chapter/'asp'/'anaw'-style number regardless of era —
  // a direct search of the entire AGLC4 guide confirms none of those tokens appear in it anywhere.
  it('formats post-1963 UK legislation — no chapter number at all', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'legislation',
      title: 'Human Rights Act',
      year: '1998',
      ukJurisdiction: 'UK',
      pinpoint: 's 6(1)',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Human Rights Act 1998* (UK) s 6(1).')
  })

  it('formats pre-1963 legislation with no jurisdiction bracket and a regnal year + chapter', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'legislation',
      title: 'Factories Act',
      year: '1961',
      ukJurisdiction: 'none',
      ukRegnalYear: '9 & 10 Eliz 2',
      ukNumberValue: '34',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Factories Act 1961*, 9 & 10 Eliz 2, c 34.')
  })

  it("strips a leading 'The' from a legislation title, inside the italics", () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'delegatedLegislation',
      title: 'The Fertilisers (Amendment) Regulations',
      year: '1998',
      ukJurisdiction: 'UK',
      ukInstrumentType: 'SI',
      ukInstrumentNumber: '1998/2024',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Fertilisers (Amendment) Regulations 1998* (UK) SI 1998/2024.',
    )
  })

  it('formats Scottish legislation — no number, matching AGLC4 r 24.2.2\'s own "Dog Fouling (Scotland) Act 2003 (Scot)." example', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'legislation',
      title: 'Dog Fouling (Scotland) Act',
      year: '2003',
      ukJurisdiction: 'Scot',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Dog Fouling (Scotland) Act 2003* (Scot).')
  })

  it('formats Welsh legislation — no number, matching AGLC4 r 24.2.2\'s own "Learner Travel (Wales) Measure 2008 (Wales)." example', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'legislation',
      title: 'Senedd and Elections (Wales) Act',
      year: '2020',
      ukJurisdiction: 'Wales',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Senedd and Elections (Wales) Act 2020* (Wales).')
  })

  it('formats delegated legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'delegatedLegislation',
      title: 'Fertilisers (Amendment) Regulations',
      year: '1998',
      ukJurisdiction: 'UK',
      ukInstrumentType: 'SI',
      ukInstrumentNumber: '1998/2024',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Fertilisers (Amendment) Regulations 1998* (UK) SI 1998/2024.')
  })
})

describe('United States (ch 25)', () => {
  it('formats a US Supreme Court case (no jurisdiction/court shown)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      title: 'Roper v Simmons',
      volume: '543',
      reportAbbreviation: 'US',
      startingPage: '551',
      year: '2005',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Roper v Simmons*, 543 US 551 (2005).')
  })

  it('formats a case with a judge and a pinpoint', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      title: 'Felder v Casey',
      volume: '487',
      reportAbbreviation: 'US',
      startingPage: '131',
      pinpoint: '142',
      judge: 'Brennan J',
      year: '1987',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Felder v Casey*, 487 US 131, 142 (Brennan J) (1987).')
  })

  it('formats a bare US Code citation with no title or year', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'legislation',
      usTitleOrChapterNumber: '35',
      usCodeAbbrev: 'USC',
      pinpoint: '§ 102',
    }
    const result = generateForeignDomesticCitation(fields)
    expect(result.footnote).toBe('35 USC § 102.')
    // A bare Code citation has no title to abbreviate for the usual italicised '(n X)'
    // back-reference — falls back to the bare, unitalicised Title+Code identifier instead of
    // italicising an empty string (confirmed live: this used to render as literal '**').
    expect(result.subsequent).toBe('35 USC (n 1) § 102.')
  })

  it('formats a US Code citation with a statute title and year', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'legislation',
      usStatuteTitle: 'Federal Deposit Insurance Act',
      usTitleOrChapterNumber: '12',
      usCodeAbbrev: 'USC',
      pinpoint: '§§ 1811–35a',
      year: '2006',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Federal Deposit Insurance Act*, 12 USC §§ 1811–35a (2006).')
  })

  // Matches AGLC4 r 25.3's own worked example exactly, including both pinpoints at once (the
  // original '§ 4' before the volume, AND the page-level '573' after the starting page) — an
  // earlier version of this formatter conflated the two into one field, dropping the comma
  // r 25.3.3 requires after the original pinpoint and the page-level pinpoint entirely.
  it('formats a federal session law with a Stat volume, both pinpoints, and a trailing year', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'legislationSessionLaw',
      title: 'Freedom to Display the American Flag Act of 2005',
      usPublicLawNumber: 'Pub L No 109-243',
      usOriginalPinpoint: '§ 4',
      usVolumeOrYear: '120',
      usAbbreviatedName: 'Stat',
      startingPage: '572',
      usSessionLawPagePinpoint: '573',
      year: '2006',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Freedom to Display the American Flag Act of 2005*, Pub L No 109-243, § 4, 120 Stat 572, 573 (2006).',
    )
  })

  it('formats a state session law where the year is the volume marker (no trailing year, no page pinpoint)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'legislationSessionLaw',
      title: 'An Act to Amend the Indiana Code concerning Pensions',
      usPublicLawNumber: 'Pub L No 5-2008',
      usOriginalPinpoint: '§ 2',
      usVolumeOrYear: '2008',
      usAbbreviatedName: 'Ind Acts',
      startingPage: '889',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*An Act to Amend the Indiana Code concerning Pensions*, Pub L No 5-2008, § 2, 2008 Ind Acts 889.',
    )
  })

  it('formats a bare constitution title', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'constitution',
      title: 'United States Constitution',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*United States Constitution*.')
  })
})

describe('Hong Kong (ch 19)', () => {
  it('formats a reported case', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'HongKong',
      foreignCategory: 'case',
      title: 'Ng Ka Ling v Director of Immigration',
      year: '1999',
      volume: '1',
      reportAbbreviation: 'HKLRD',
      startingPage: '337',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Ng Ka Ling v Director of Immigration* [1999] 1 HKLRD 337.')
  })

  it('formats legislation with a chapter number', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'HongKong',
      foreignCategory: 'legislation',
      title: 'Evidence Ordinance',
      hkChapterNumber: '8',
      pinpoint: 's 4',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Evidence Ordinance* (Hong Kong) cap 8, s 4.')
  })
})

describe('Malaysia (ch 20)', () => {
  it('formats a pre-1966 MLJ case (round bracket)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Malaysia',
      foreignCategory: 'case',
      title: 'Ratna Ammal v Tan Chow Soo',
      year: '1964',
      volume: '30',
      reportAbbreviation: 'MLJ',
      startingPage: '24',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Ratna Ammal v Tan Chow Soo* (1964) 30 MLJ 24.')
  })

  it('formats a post-1966 MLJ case with a court name (square bracket)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Malaysia',
      foreignCategory: 'case',
      title: 'Achieva Technology Sdn Bhd v Lam Yen Ling',
      year: '2009',
      volume: '8',
      reportAbbreviation: 'MLJ',
      startingPage: '625',
      courtName: 'High Court',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Achieva Technology Sdn Bhd v Lam Yen Ling* [2009] 8 MLJ 625 (High Court).',
    )
  })

  it('formats legislation with no comma before the pinpoint', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Malaysia',
      foreignCategory: 'legislation',
      title: 'Copyright Act',
      year: '1987',
      pinpoint: 's 7',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Copyright Act 1987* (Malaysia) s 7.')
  })
})

describe('Singapore (ch 22)', () => {
  it('formats a reported case', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Singapore',
      foreignCategory: 'case',
      title: 'Re Econ Corp Ltd',
      year: '2004',
      volume: '1',
      reportAbbreviation: 'SLR',
      startingPage: '273',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Re Econ Corp Ltd* [2004] 1 SLR 273.')
  })

  it('formats chapter-numbered legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Singapore',
      foreignCategory: 'legislation',
      title: 'Adoption of Children Act',
      singaporeChapterNumber: '4',
      singaporeRevisionYear: '1985',
      pinpoint: 's 5',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Adoption of Children Act* (Singapore, cap 4, 1985 rev ed) s 5.')
  })

  it('formats non-chapter-numbered legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Singapore',
      foreignCategory: 'legislation',
      title: 'Land Titles Ordinance',
      year: '1956',
      pinpoint: 'ss 28(2)(b)–(e)',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Land Titles Ordinance 1956* (Singapore) ss 28(2)(b)–(e).')
  })
})

describe('South Africa (ch 23)', () => {
  it('formats a reported case', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'SouthAfrica',
      foreignCategory: 'case',
      title: 'Christian Education South Africa v Minister of Education',
      year: '1999',
      volume: '2',
      reportAbbreviation: 'SA',
      startingPage: '83',
      courtName: 'Constitutional Court',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Christian Education South Africa v Minister of Education* [1999] 2 SA 83 (Constitutional Court).',
    )
  })

  it('formats legislation with the default South Africa jurisdiction', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'SouthAfrica',
      foreignCategory: 'legislation',
      title: 'Local Government Transition Act',
      year: '1993',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Local Government Transition Act 1993* (South Africa).')
  })

  it('formats provincial legislation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'SouthAfrica',
      foreignCategory: 'legislation',
      title: 'Land Administration Act',
      year: '2003',
      southAfricaJurisdiction: 'KZN',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe('*Land Administration Act 2003* (KZN).')
  })
})

// Every expected string below is again taken directly from AGLC4's own worked examples (Part V's
// own 'Unreported Cases' sub-rules for NZ/UK/Malaysia/Singapore, and the general domestic r
// 2.3.1/2.3.2 examples for the three countries — Canada, Hong Kong, South Africa — with no
// dedicated sub-rule of their own). This whole describe block covers a real, previously-confirmed
// gap: none of the 8 Foreign Domestic Sources jurisdictions could represent an unreported case at
// all before this — every 'case' formatter only ever built the reported chapterTwoCase shape.

describe('Unreported cases — medium neutral citation (r 2.3.1, incorporated across every jurisdiction)', () => {
  it('New Zealand (r 21.1.3) — Eight Mile Style LLC v New Zealand National Party', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-mnc',
      title: 'Eight Mile Style LLC v New Zealand National Party',
      year: '2017',
      foreignCourtCode: 'NZHC',
      foreignCaseNumber: '2603',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Eight Mile Style LLC v New Zealand National Party* [2017] NZHC 2603.',
    )
  })

  it('UK (r 24.1.5) — Four Seasons Holdings Inc v Brownlie, with pinpoint and judge', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-mnc',
      title: 'Four Seasons Holdings Inc v Brownlie',
      year: '2017',
      foreignCourtCode: 'UKSC',
      foreignCaseNumber: '80',
      pinpoint: '33',
      judge: 'Lady Hale',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Four Seasons Holdings Inc v Brownlie* [2017] UKSC 80, [33] (Lady Hale).',
    )
  })

  it('Singapore (r 22.1.3) — Prometheus Marine Pte Ltd v Ann Rita King, with pinpoint and judge', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Singapore',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-mnc',
      title: 'Prometheus Marine Pte Ltd v Ann Rita King',
      year: '2017',
      foreignCourtCode: 'SGCA',
      foreignCaseNumber: '61',
      pinpoint: '38',
      judge: 'Sundaresh Menon CJ for the Court',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Prometheus Marine Pte Ltd v Ann Rita King* [2017] SGCA 61, [38] (Sundaresh Menon CJ for the Court).',
    )
  })
})

describe('Unreported cases — no medium neutral citation (r 2.3.2, incorporated across every jurisdiction)', () => {
  it('New Zealand (r 21.1.3) — Lowe v New Zealand Police', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Lowe v New Zealand Police',
      courtName: 'High Court of New Zealand',
      judge: 'Clifford J',
      date: '2 March 2010',
      pinpoint: '[11]–[12]',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Lowe v New Zealand Police* (High Court of New Zealand, Clifford J, 2 March 2010) [11]–[12].',
    )
  })

  it('UK (r 24.1.5) — Training for Tomorrow (Holdings) Ltd v The Corporate Services Group plc', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Training for Tomorrow (Holdings) Ltd v The Corporate Services Group plc',
      courtName: 'England and Wales High Court',
      judge: 'Langley J',
      date: '28 February 2000',
      pinpoint: '7–8',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Training for Tomorrow (Holdings) Ltd v The Corporate Services Group plc* (England and Wales High Court, Langley J, 28 February 2000) 7–8.',
    )
  })

  it('Malaysia (r 20.1.2) — Mohamed Musa bin Amanullah v Public Prosecutor', () => {
    // Malaysian courts don't issue medium neutral citations at all (AGLC4's own note) — the word
    // 'Unreported' is part of the source's own court-field text here, not special handling.
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Malaysia',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Mohamed Musa bin Amanullah v Public Prosecutor',
      courtName: 'Unreported, Malaysian Court of Appeal',
      judge: 'Hasan Lah, Sulong Matjeraie and Mohd Hishamudin Yunus JJCA',
      date: '1 March 2010',
      pinpoint: '[45]–[46]',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Mohamed Musa bin Amanullah v Public Prosecutor* (Unreported, Malaysian Court of Appeal, Hasan Lah, Sulong Matjeraie and Mohd Hishamudin Yunus JJCA, 1 March 2010) [45]–[46].',
    )
  })

  it('Canada — no dedicated sub-rule, general r 2.3.2 applies directly', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Smith v Jones',
      courtName: 'Ontario Superior Court of Justice',
      judge: 'Myers J',
      date: '4 May 2018',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Smith v Jones* (Ontario Superior Court of Justice, Myers J, 4 May 2018).',
    )
  })
})

describe('United States — unreported cases (r 25.1.7)', () => {
  it('Red Hat Inc v The SCO Group Inc — no pinpoint, so no trailing "slip op"', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Red Hat Inc v The SCO Group Inc',
      usJurisdictionCourt: 'D Del',
      foreignCaseNumber: 'Civ No 03-772-SLR',
      date: '6 April 2004',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Red Hat Inc v The SCO Group Inc* (D Del, Civ No 03-772-SLR, 6 April 2004).',
    )
  })

  it('Torres v Oklahoma — with a pinpoint, "slip op" prefix appears', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'Torres v Oklahoma',
      usJurisdictionCourt: 'Okla Ct Crim App',
      foreignCaseNumber: 'No PCD-04-442',
      date: '13 May 2004',
      pinpoint: '7',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Torres v Oklahoma* (Okla Ct Crim App, No PCD-04-442, 13 May 2004) slip op 7.',
    )
  })

  it('Charlesworth v Mack — starting page and further pinpoint together', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-mnc', // the US ignores this distinction — both map to the same r 25.1.7 form
      title: 'Charlesworth v Mack',
      usJurisdictionCourt: '1st Cir',
      foreignCaseNumber: 'No 90-567',
      date: '19 January 1991',
      pinpoint: '3458, 3464',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*Charlesworth v Mack* (1st Cir, No 90-567, 19 January 1991) slip op 3458, 3464.',
    )
  })

  it('City of Birmingham v Citigroup Inc — with a judge', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      foreignCaseReportType: 'unreported-no-mnc',
      title: 'City of Birmingham v Citigroup Inc',
      usJurisdictionCourt: 'ND Ala',
      foreignCaseNumber: 'No CV-09-BE-467-S',
      date: '19 August 2009',
      pinpoint: '3',
      judge: 'Bowdre J',
    }
    expect(generateForeignDomesticCitation(fields).footnote).toBe(
      '*City of Birmingham v Citigroup Inc* (ND Ala, No CV-09-BE-467-S, 19 August 2009) slip op 3 (Bowdre J).',
    )
  })
})

describe('Unreported case rule labels', () => {
  it('New Zealand, UK, Singapore point to their own dedicated sub-rule for both unreported forms', () => {
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'NewZealand',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-mnc',
      }),
    ).toBe('AGLC4 r 21.1.3')
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'UK',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-no-mnc',
      }),
    ).toBe('AGLC4 r 24.1.5')
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'Singapore',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-mnc',
      }),
    ).toBe('AGLC4 r 22.1.3')
  })

  it('Malaysia points to r 20.1.2 for the no-MNC form (its only unreported form)', () => {
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'Malaysia',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-no-mnc',
      }),
    ).toBe('AGLC4 r 20.1.2')
  })

  it('Canada, Hong Kong and South Africa fall back to the plain domestic r 2.3.1/2.3.2 label — they have no Foreign Domestic Sources sub-rule of their own for this', () => {
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'Canada',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-mnc',
      }),
    ).toBe('AGLC4 r 2.3.1')
    expect(
      foreignDomesticRuleLabel({
        subtype: 'foreignDomestic',
        foreignCountry: 'HongKong',
        foreignCategory: 'case',
        foreignCaseReportType: 'unreported-no-mnc',
      }),
    ).toBe('AGLC4 r 2.3.2')
  })

  it('the US always points to r 25.1.7 for either unreported value, and r 25.1 for reported', () => {
    expect(
      foreignDomesticRuleLabel({ subtype: 'foreignDomestic', foreignCountry: 'US', foreignCategory: 'case', foreignCaseReportType: 'unreported-mnc' }),
    ).toBe('AGLC4 r 25.1.7')
    expect(
      foreignDomesticRuleLabel({ subtype: 'foreignDomestic', foreignCountry: 'US', foreignCategory: 'case', foreignCaseReportType: 'unreported-no-mnc' }),
    ).toBe('AGLC4 r 25.1.7')
    expect(
      foreignDomesticRuleLabel({ subtype: 'foreignDomestic', foreignCountry: 'US', foreignCategory: 'case', foreignCaseReportType: 'reported' }),
    ).toBe('AGLC4 r 25.1')
  })
})

describe('foreignDomesticBadge', () => {
  it('names the specific country/category once both are selected', () => {
    expect(foreignDomesticBadge({ subtype: 'foreignDomestic', foreignCountry: 'Canada', foreignCategory: 'case' })).toBe(
      'Canadian Case',
    )
    expect(foreignDomesticBadge({ subtype: 'foreignDomestic', foreignCountry: 'US', foreignCategory: 'constitution' })).toBe(
      'US Constitution',
    )
  })

  it('falls back to the generic label before a country/category is chosen', () => {
    expect(foreignDomesticBadge({ subtype: 'foreignDomestic' })).toBe('Foreign Domestic Sources')
  })
})

describe('foreignDomesticRuleLabel', () => {
  it('names the specific AGLC4 rule once both are selected', () => {
    expect(foreignDomesticRuleLabel({ subtype: 'foreignDomestic', foreignCountry: 'US', foreignCategory: 'constitution' })).toBe(
      'AGLC4 r 25.4',
    )
  })
})
