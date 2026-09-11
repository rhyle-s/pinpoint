import { describe, expect, it } from 'vitest'
import { europeanMaterialsBadge, europeanMaterialsRuleLabel, generateEuropeanMaterialsCitation } from './european-materials'
import { InternationalMaterialFields } from './types'

// Every expected string below is taken directly from AGLC4's own worked examples (Melbourne Law
// School's PDF, ch 14.2/14.3), or from the user's own real-world worked examples (Huawei v ZTE,
// Bouchelkia v France, the GDPR) — not derived from memory.

describe('Official Journal of the EU (r 14.2.1)', () => {
  it('formats a document with full OJ reference and pinpoint', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'Commission Decision of 18 December 2002 Relating to National Provisions on Limiting the Importation and Placement on the Market of Certain NK Fertilisers of High Nitrogen Content and Containing Chlorine Notified by France Pursuant to Article 95(5) of the EC Treaty',
      year: '2003',
      ojSeries: 'L',
      ojIssueNumber: '1',
      ojStartingPage: '72',
      pinpoint: '79',
    }
    const result = generateEuropeanMaterialsCitation(fields)
    expect(result.footnote).toBe(
      '*Commission Decision of 18 December 2002 Relating to National Provisions on Limiting the Importation and Placement on the Market of Certain NK Fertilisers of High Nitrogen Content and Containing Chlorine Notified by France Pursuant to Article 95(5) of the EC Treaty* [2003] OJ L 1/72, 79.',
    )
  })

  it('formats the GDPR (user-provided worked example)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title:
        'Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the Protection of Natural Persons with Regard to the Processing of Personal Data and on the Free Movement of Such Data, and Repealing Directive 95/46/EC (General Data Protection Regulation)',
      year: '2016',
      ojSeries: 'L',
      ojIssueNumber: '119',
      ojStartingPage: '1',
    }
    const result = generateEuropeanMaterialsCitation(fields)
    expect(result.footnote).toBe(
      '*Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the Protection of Natural Persons with Regard to the Processing of Personal Data and on the Free Movement of Such Data, and Repealing Directive 95/46/EC (General Data Protection Regulation)* [2016] OJ L 119/1.',
    )
  })

  it('formats a bare title with no OJ reference at all', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'Council Directive 93/13/EEC of 5 April 1993 on Unfair Terms in Consumer Contracts',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Council Directive 93/13/EEC of 5 April 1993 on Unfair Terms in Consumer Contracts*.',
    )
  })

  it('omits the OJ fragment entirely when only the series is known, not a bare "OJ L" (post-2023-scheme autofill)', () => {
    // A real, live rendering bug: a post-2023-scheme document's autofill fills in the series
    // (reliably known independently of the sequential document number AGLC4 defines no form for)
    // but never an issue number — the series alone used to be enough to emit a dangling, broken-
    // looking 'OJ L' with nothing after it. The series stays visible in the form field itself; it
    // just shouldn't render into the generated citation text on its own.
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'Regulation (EU) 2024/1624 of the European Parliament and of the Council of 31 May 2024 on the Prevention of the Use of the Financial System for the Purposes of Money Laundering or Terrorist Financing',
      year: '2024',
      ojSeries: 'L',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Regulation (EU) 2024/1624 of the European Parliament and of the Council of 31 May 2024 on the Prevention of the Use of the Financial System for the Purposes of Money Laundering or Terrorist Financing*.',
    )
  })

  it('formats an invitation to tender (S series, no starting page)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'Contract Notice — Switzerland-Chur: Engineering Services',
      year: '2016',
      ojSeries: 'S',
      ojIssueNumber: '240',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Contract Notice — Switzerland-Chur: Engineering Services* [2016] OJ S 240.',
    )
  })

  it('formats a digital-only C series document', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'European Parliament — 2008–2009 Session — Sittings of 20 to 23 October 2008 — Strasbourg — Minutes — Proceedings of the Sitting',
      year: '2009',
      ojSeries: 'C',
      ojIssueNumber: '3',
      ojStartingPage: '1',
      ojIsDigitalOnlyC: true,
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*European Parliament — 2008–2009 Session — Sittings of 20 to 23 October 2008 — Strasbourg — Minutes — Proceedings of the Sitting* [2009] OJ C 3 E/1.',
    )
  })

  it('formats a pre-1974 document with a parallel Special Edition citation', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title: 'Regulation (EEC) No 2005/70 of the Commission of 6 October 1970 on the Classification of Vine Varieties',
      year: '1970',
      ojSeries: 'L',
      ojIssueNumber: '224',
      ojStartingPage: '1',
      ojSpecEdYear: '1970',
      ojSpecEdStartingPage: '623',
      pinpoint: 'art 2(1), annex',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Regulation (EEC) No 2005/70 of the Commission of 6 October 1970 on the Classification of Vine Varieties* [1970] OJ L 224/1; [1970] OJ Spec Ed 623, art 2(1), annex.',
    )
  })

  it('has the correct badge and rule label', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion', euCategory: 'officialJournal' }
    expect(europeanMaterialsBadge(fields)).toBe('Official Journal of the EU')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 r 14.2.1')
  })
})

describe('Constitutive Treaties of the EU / Basic Documents of the Council of Europe (r 14.2.2 / 14.3.1)', () => {
  it('formats the Treaty on European Union with a short title', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'constitutiveTreaty',
      title: 'Treaty on European Union',
      openedForSignature: '7 February 1992',
      treatySeries: '[2009] OJ C 115/13',
      enteredIntoForce: '1 November 1993',
      shortTitle: 'EU',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Treaty on European Union*, opened for signature 7 February 1992, [2009] OJ C 115/13 (entered into force 1 November 1993) (‘*EU*’).',
    )
  })

  it('formats the ECSC Treaty (signed, not opened for signature)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'councilOfEuropeBasicDocument',
      title: 'Treaty Instituting the European Coal and Steel Community',
      signedDate: '18 April 1951',
      treatySeries: '261 UNTS 140',
      enteredIntoForce: '23 July 1952',
      shortTitle: 'ECSC Treaty',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Treaty Instituting the European Coal and Steel Community*, signed 18 April 1951, 261 UNTS 140 (entered into force 23 July 1952) (‘*ECSC Treaty*’).',
    )
  })

  it('formats the ECHR with an amendment clause', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'councilOfEuropeBasicDocument',
      title: 'Convention for the Protection of Human Rights and Fundamental Freedoms',
      openedForSignature: '4 November 1950',
      treatySeries: '213 UNTS 221',
      enteredIntoForce: '3 September 1953',
      euAmendedByCitation:
        'Protocol No 11 to the Convention for the Protection of Human Rights and Fundamental Freedoms, opened for signature 11 May 1994, ETS No 155 (entered into force 1 November 1998)',
      shortTitle: 'ECHR',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Convention for the Protection of Human Rights and Fundamental Freedoms*, opened for signature 4 November 1950, 213 UNTS 221 (entered into force 3 September 1953), as amended by Protocol No 11 to the Convention for the Protection of Human Rights and Fundamental Freedoms, opened for signature 11 May 1994, ETS No 155 (entered into force 1 November 1998) (‘*ECHR*’).',
    )
    // ^ Note the short title sits AFTER the amendment clause, not directly after the base treaty's
    // own '(entered into force ...)' — confirmed against AGLC4's real worked example 51.
  })

  it('has the correct badge and rule label for a Council of Europe document', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion', euCategory: 'councilOfEuropeBasicDocument' }
    expect(europeanMaterialsBadge(fields)).toBe('Council of Europe Basic Document')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 r 14.3.1')
  })
})

describe('Courts of the European Union (r 14.2.3)', () => {
  it('formats a reported CJEU case (Costa v ENEL)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: true,
      title: 'Costa v ENEL',
      euCaseNumber: 'C-6/64',
      year: '1964',
      reportAbbreviation: 'ECR',
      startingPage: '585',
      pinpoint: '594',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe('*Costa v ENEL* (C-6/64) [1964] ECR 585, 594.')
  })

  it('formats a reported case with a volume number (Grad v Finanzamt Traunstein)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: true,
      title: 'Grad v Finanzamt Traunstein',
      euCaseNumber: 'C-9/70',
      year: '1970',
      volume: '2',
      reportAbbreviation: 'ECR',
      startingPage: '825',
      pinpoint: '833',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Grad v Finanzamt Traunstein* (C-9/70) [1970] 2 ECR 825, 833.',
    )
  })

  it('formats a reported ECR-SC case (Vainker v European Parliament)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: true,
      title: 'Vainker v European Parliament',
      euCaseNumber: 'T-48/01',
      year: '2004',
      reportAbbreviation: 'ECR-SC',
      startingPage: 'II-197',
      pinpoint: 'II-207',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Vainker v European Parliament* (T-48/01) [2004] ECR-SC II-197, II-207.',
    )
  })

  it('formats an unreported case (Huawei v ZTE — user-provided worked example)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: false,
      title: 'Huawei Technologies Co Ltd v ZTE Corporation',
      euCourtName: 'Court of Justice of the European Union',
      euCaseNumber: 'C-170/13',
      euEcli: 'ECLI:EU:C:2015:477',
      date: '16 July 2015',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Huawei Technologies Co Ltd v ZTE Corporation* (Court of Justice of the European Union, C-170/13, ECLI:EU:C:2015:477, 16 July 2015).',
    )
  })

  it('formats an unreported case with a bare-space paragraph pinpoint (no comma)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: false,
      title: 'Huawei Technologies Co Ltd v ZTE Corporation',
      euCourtName: 'Court of Justice of the European Union',
      euCaseNumber: 'C-170/13',
      euEcli: 'ECLI:EU:C:2015:477',
      date: '16 July 2015',
      pinpoint: '9',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Huawei Technologies Co Ltd v ZTE Corporation* (Court of Justice of the European Union, C-170/13, ECLI:EU:C:2015:477, 16 July 2015) [9].',
    )
  })

  it('has the correct badge and rule label', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion', euCategory: 'court' }
    expect(europeanMaterialsBadge(fields)).toBe('Court of the European Union')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 r 14.2.3')
  })
})

describe('European Court of Human Rights (r 14.3.2)', () => {
  it('formats a ser A case with a pinpoint and judge (Nasri v France)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedSeriesA',
      title: 'Nasri v France',
      year: '1995',
      volume: '320-B',
      pinpoint: '28',
      judge: 'Judge Pettiti',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Nasri v France* (1995) 320-B Eur Court HR (ser A) 28 (Judge Pettiti).',
    )
  })

  it('formats a ser A case with a phase and no pinpoint (Loizidou v Turkey)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedSeriesA',
      title: 'Loizidou v Turkey',
      euPhase: 'Preliminary Objections',
      year: '1995',
      volume: '310',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Loizidou v Turkey* (*Preliminary Objections*) (1995) 310 Eur Court HR (ser A).',
    )
  })

  it('formats a year-organised case (Bouchelkia v France — user-provided worked example)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedYearOrganised',
      title: 'Bouchelkia v France',
      year: '1997',
      volume: 'I',
      startingPage: '47',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe('*Bouchelkia v France* [1997] I Eur Court HR 47.')
  })

  it('formats a year-organised case with a pinpoint (Boujlifa v France)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedYearOrganised',
      title: 'Boujlifa v France',
      year: '1997',
      volume: 'VI',
      startingPage: '2250',
      pinpoint: '2264',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Boujlifa v France* [1997] VI Eur Court HR 2250, 2264.',
    )
  })

  it('formats an unreported case (S v United Kingdom)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'unreported',
      title: 'S v United Kingdom',
      euChamber: 'Grand Chamber',
      euApplicationNumber: 'Nos 30562/04 and 30566/04',
      date: '4 December 2008',
      pinpoint: '125',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*S v United Kingdom* (European Court of Human Rights, Grand Chamber, Application Nos 30562/04 and 30566/04, 4 December 2008) [125].',
    )
  })

  it('formats a pleadings (ser B) citation (Lawless v Ireland)', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'pleadings',
      euDocumentTitle: 'The Case of Gerard Richard Lawless — Memorial Submitted by the European Commission of Human Rights',
      title: 'Lawless v Ireland',
      year: '1960–61',
      startingPage: '193',
      pinpoint: '201',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '‘The Case of Gerard Richard Lawless — Memorial Submitted by the European Commission of Human Rights’, *Lawless v Ireland* [1960–61] Eur Court HR (ser B) 193, 201.',
    )
  })

  it('has the correct badge and rule label', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion', euCategory: 'europeanCourtOfHumanRights' }
    expect(europeanMaterialsBadge(fields)).toBe('European Court of Human Rights')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 r 14.3.2')
  })
})

describe('European Commission of Human Rights (r 14.3.3)', () => {
  it('formats Klass v Federal Republic of Germany', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCommissionOfHumanRights',
      title: 'Klass v Federal Republic of Germany',
      year: '1978',
      volume: '1',
      startingPage: '20',
      pinpoint: '29',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe(
      '*Klass v Federal Republic of Germany* (1978) 1 Eur Comm HR 20, 29.',
    )
  })

  it('formats X v Austria', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCommissionOfHumanRights',
      title: 'X v Austria',
      year: '1979',
      volume: '17',
      startingPage: '80',
      pinpoint: '85–6',
    }
    expect(generateEuropeanMaterialsCitation(fields).footnote).toBe('*X v Austria* (1979) 17 Eur Comm HR 80, 85–6.')
  })

  it('has the correct badge and rule label', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion', euCategory: 'europeanCommissionOfHumanRights' }
    expect(europeanMaterialsBadge(fields)).toBe('European Commission of Human Rights')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 r 14.3.3')
  })
})

describe('subsequent references', () => {
  it('uses the italicised short title with an (n X) back-reference', () => {
    const fields: InternationalMaterialFields = {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedYearOrganised',
      title: 'Bouchelkia v France',
      year: '1997',
      volume: 'I',
      startingPage: '47',
      footnoteNumber: '12',
    }
    expect(generateEuropeanMaterialsCitation(fields).subsequent).toBe('*Bouchelkia v France* (n 12).')
  })
})

describe('no category selected', () => {
  it('returns a blank placeholder rather than crashing', () => {
    const fields: InternationalMaterialFields = { subtype: 'europeanUnion' }
    const result = generateEuropeanMaterialsCitation(fields)
    expect(result.footnote).toBe('')
    expect(europeanMaterialsBadge(fields)).toBe('European Union Materials')
    expect(europeanMaterialsRuleLabel(fields)).toBe('AGLC4 ch 14')
  })
})
