import { CaseFields, CitationFields, LegislationFields, JournalFields, BookFields, ReportFields, ResearchPaperFields, WebsiteFields, NewspaperFields, OtherLegislativeMaterialFields, InternationalMaterialFields, OtherSourcesFields, SourceType } from './citation-engine/types'

export interface GuideExample {
  label: string
  fields: CitationFields
}

export interface GuideEntry {
  sourceType: SourceType
  title: string
  chapterRef: string
  category: 'primary' | 'secondary' | 'international'
  formatTemplate: string
  examples: GuideExample[]
  keyRules: string[]
}

const CASE_EXAMPLES: GuideExample[] = [
  {
    label: 'Reported case — CLR',
    fields: {
      caseName: 'Mabo v Queensland [No 2]',
      reportType: 'reported',
      year: '1992',
      volume: '175',
      reportAbbreviation: 'CLR',
      startingPage: '1',
      pinpoint: '29',
      pinpointType: 'page',
      judge: 'Brennan J',
    } satisfies CaseFields,
  },
  {
    label: 'Reported case — year-organised report',
    fields: {
      caseName: 'King v King',
      reportType: 'reported',
      year: '1974',
      reportAbbreviation: 'Qd R',
      startingPage: '253',
    } satisfies CaseFields,
  },
  {
    label: 'Unreported — medium neutral citation',
    fields: {
      caseName: 'Agius v South Australia [No 6]',
      reportType: 'unreported-mnc',
      year: '2018',
      courtCode: 'FCA',
      caseNumber: '358',
      pinpoint: '90',
      judge: 'Mortimer J',
    } satisfies CaseFields,
  },
  {
    label: 'Unreported — no medium neutral citation',
    fields: {
      caseName: 'Barton v Chibber',
      reportType: 'unreported-no-mnc',
      year: '1989',
      court: 'Supreme Court of Victoria',
      judge: 'Hampel J',
      date: '29 June 1989',
      pinpoint: '3',
      pinpointType: 'page',
    } satisfies CaseFields,
  },
]

const LEGISLATION_EXAMPLES: GuideExample[] = [
  {
    label: 'Single section',
    fields: {
      actTitle: 'Privacy Act',
      year: '1988',
      jurisdiction: 'Cth',
      pinpointType: 's',
      pinpointValue: '13',
    } satisfies LegislationFields,
  },
  {
    label: 'Multiple sections',
    fields: {
      actTitle: 'Crimes Act',
      year: '1958',
      jurisdiction: 'Vic',
      pinpointType: 'ss',
      pinpointValue: '3, 14',
    } satisfies LegislationFields,
  },
  {
    label: 'Australian Constitution — no jurisdiction brackets',
    fields: {
      actTitle: 'Australian Constitution',
      year: '',
      jurisdiction: 'none',
      pinpointType: 's',
      pinpointValue: '51(xxvi)',
    } satisfies LegislationFields,
  },
]

const JOURNAL_EXAMPLES: GuideExample[] = [
  {
    label: 'Volume-organised journal',
    fields: {
      authors: ['RJ Ellicott'],
      articleTitle: 'The Autochthonous Expedient and the Federal Court',
      year: '2008',
      volume: '82',
      issue: '10',
      journalName: 'Australian Law Journal',
      startingPage: '700',
    } satisfies JournalFields,
  },
  {
    label: 'With pinpoint',
    fields: {
      authors: ['Jeremy Masters'],
      articleTitle: 'Easing the Parting',
      year: '2008',
      volume: '82',
      issue: '11',
      journalName: 'Law Institute Journal',
      startingPage: '68',
      pinpoint: '69',
    } satisfies JournalFields,
  },
  {
    label: 'Year-organised journal',
    fields: {
      authors: ['John Kleinig'],
      articleTitle: 'Paternalism and Personal Integrity',
      year: '1983',
      issue: '3',
      journalName: 'Bulletin of the Australian Society of Legal Philosophy',
      startingPage: '27',
    } satisfies JournalFields,
  },
]

const BOOK_EXAMPLES: GuideExample[] = [
  {
    label: 'Whole book',
    fields: {
      bookType: 'book',
      authors: ['Catharine MacMillan'],
      title: 'Mistakes in Contract Law',
      publisher: 'Hart Publishing',
      year: '2010',
      pinpoint: '9',
    } satisfies BookFields,
  },
  {
    label: 'With edition',
    fields: {
      bookType: 'book',
      authors: ['Eric Barendt'],
      title: 'Freedom of Speech',
      edition: '2nd ed',
      publisher: 'Oxford University Press',
      year: '2005',
      pinpoint: '14',
    } satisfies BookFields,
  },
  {
    label: 'Book chapter',
    fields: {
      bookType: 'chapter',
      chapterAuthors: ['Simon Evans'],
      chapterTitle: 'Reading Down Statutes',
      editors: ['Adrienne Stone', 'George Williams'],
      title: 'The High Court at the Crossroads',
      publisher: 'Federation Press',
      year: '2000',
      startingPage: '83',
      pinpoint: '90',
    } satisfies BookFields,
  },
]

const REPORT_EXAMPLES: GuideExample[] = [
  {
    label: 'With series number',
    fields: {
      authors: ['Australian Law Reform Commission'],
      title: 'Traditional Rights and Freedoms',
      documentType: 'Report',
      seriesNumber: 'Report No 129',
      date: 'December 2015',
      pinpoint: '45',
    } satisfies ReportFields,
  },
  {
    label: 'No series number',
    fields: {
      authors: ['Royal Commission into Aged Care Quality and Safety'],
      title: 'Final Report: Care, Dignity and Respect',
      documentType: 'Report',
      date: 'March 2021',
      pinpoint: 'vol 1, 22',
    } satisfies ReportFields,
  },
  {
    label: 'No named author',
    fields: {
      title: "Closing the Gap: Prime Minister's Report 2021",
      documentType: 'Report',
      date: '2021',
      pinpoint: '12',
    } satisfies ReportFields,
  },
]

const RESEARCH_PAPER_EXAMPLES: GuideExample[] = [
  {
    label: 'Conference paper',
    fields: {
      authors: ['Henry Fraser', 'Aaron J Snoswell'],
      title: 'AI Opacity and Explainability in Tort Litigation',
      documentType: 'Conference Paper',
      institution: '2022 ACM Conference on Fairness, Accountability, and Transparency (FAccT ’22)',
      date: '21 June 2022',
    } satisfies ResearchPaperFields,
  },
  {
    label: 'PhD thesis',
    fields: {
      authors: ['Melissa Vogt'],
      title: 'The Concept of Territorial Sovereignty in International Law',
      documentType: 'PhD Thesis',
      institution: 'University of Melbourne',
      date: '2013',
      pinpoint: '45',
    } satisfies ResearchPaperFields,
  },
  {
    label: 'Working paper with a series number',
    fields: {
      authors: ['Ian Ramsay'],
      title: 'Corporate Governance and the Duties of Company Directors',
      documentType: 'Working Paper',
      seriesNumber: 'No 5',
      institution: 'University of Melbourne, Centre for Corporate Law and Securities Regulation',
      date: '1997',
    } satisfies ResearchPaperFields,
  },
]

const WEBSITE_EXAMPLES: GuideExample[] = [
  {
    label: 'Author, no date',
    fields: {
      authors: ['James Edelman'],
      documentTitle: 'High Court of Australia',
      websiteName: 'High Court of Australia',
      documentType: 'Web Page',
      url: 'http://www.hcourt.gov.au/justices/current/justice-james-edelman',
    } satisfies WebsiteFields,
  },
  {
    label: 'Blog post with date',
    fields: {
      authors: ['Martin Clark'],
      documentTitle: 'Koani v The Queen',
      websiteName: 'Opinions on High',
      documentType: 'Blog Post',
      date: '18 October 2017',
      url: 'http://blogs.unimelb.edu.au/opinionsonhigh/2017/10/18/koani-case-page/',
    } satisfies WebsiteFields,
  },
  {
    label: 'No named author',
    fields: {
      documentTitle: 'Privacy',
      websiteName: 'Office of the Australian Information Commissioner',
      documentType: 'Web Page',
      url: 'https://www.oaic.gov.au/privacy',
    } satisfies WebsiteFields,
  },
]

const NEWSPAPER_EXAMPLES: GuideExample[] = [
  {
    label: 'Two bylined authors',
    fields: {
      authors: ['Isobel Roe', 'Jamie McKinnell'],
      articleTitle: 'Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault',
      newspaperName: 'ABC News',
      date: '17 August 2026',
      url: 'https://www.abc.net.au/news/2026-08-17/alan-jones-complainant-c-ray-hadley-peter-fitzsimons/107045376',
    } satisfies NewspaperFields,
  },
  {
    label: 'Unbylined report — no author',
    fields: {
      articleTitle: 'Reserve Bank holds interest rates steady at August meeting',
      newspaperName: 'The Sydney Morning Herald',
      date: '5 August 2026',
      url: 'https://www.smh.com.au/business/economy/example-article',
    } satisfies NewspaperFields,
  },
]

const OTHER_LEGISLATIVE_MATERIAL_EXAMPLES: GuideExample[] = [
  {
    label: 'Bill (r 3.2) — never italicised',
    fields: {
      subtype: 'bill',
      billTitle: 'Corporations Amendment (Crowd-Sourced Funding) Bill',
      billYear: '2015',
      billJurisdiction: 'Cth',
    } satisfies OtherLegislativeMaterialFields,
  },
  {
    label: 'Explanatory Memorandum (r 3.7) — cites the Bill per r 3.2',
    fields: {
      subtype: 'explanatoryMaterial',
      explanatoryLabel: 'Explanatory Memorandum',
      billTitle: 'Animal Care and Protection Bill',
      billYear: '2001',
      billJurisdiction: 'Qld',
    } satisfies OtherLegislativeMaterialFields,
  },
  {
    label: 'Gazette (r 3.9.1) — author, notice title, and pinpoint',
    fields: {
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
    } satisfies OtherLegislativeMaterialFields,
  },
  {
    label: 'Court Practice Direction/Note',
    fields: {
      subtype: 'practiceDirection',
      court: 'High Court of Australia',
      practiceType: 'Practice Direction',
      practiceNumber: 'No 2 of 2010',
      practiceTitle: 'Use of Initials or Pseudonyms in Applications',
      practiceDate: '2 November 2010',
    } satisfies OtherLegislativeMaterialFields,
  },
  {
    label: 'Australian Constitution (r 3.6) — no year, no jurisdiction bracket',
    fields: {
      subtype: 'constitution',
      constitutionTitle: 'Australian Constitution',
      constitutionJurisdiction: 'none',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '51(ii)',
    } satisfies OtherLegislativeMaterialFields,
  },
  {
    label: 'State Constitution — cited exactly like an ordinary Act',
    fields: {
      subtype: 'constitution',
      constitutionTitle: 'Constitution Act',
      constitutionYear: '1902',
      constitutionJurisdiction: 'NSW',
      constitutionPinpointType: 's',
      constitutionPinpointValue: '5',
    } satisfies OtherLegislativeMaterialFields,
  },
]

const INTERNATIONAL_MATERIAL_EXAMPLES: GuideExample[] = [
  {
    label: 'Treaty — open multilateral',
    fields: {
      subtype: 'treaty',
      title: 'International Covenant on Economic, Social and Cultural Rights',
      treatyType: 'multilateral',
      openedForSignature: '16 December 1966',
      treatySeries: '993 UNTS 3',
      enteredIntoForce: '3 January 1976',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Treaty — with pinpoint',
    fields: {
      subtype: 'treaty',
      title: 'Convention on the Rights of the Child',
      treatyType: 'multilateral',
      openedForSignature: '20 November 1989',
      treatySeries: '1577 UNTS 3',
      enteredIntoForce: '2 September 1990',
      pinpoint: 'art 3',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Treaty — multilateral, no pinpoint',
    fields: {
      subtype: 'treaty',
      title: 'Agreement on Trade-Related Aspects of Intellectual Property Rights',
      treatyType: 'multilateral',
      openedForSignature: '15 April 1994',
      treatySeries: '1869 UNTS 299',
      enteredIntoForce: '1 January 1995',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'UN Materials — older session-based numbering, includes UN GAOR',
    fields: {
      subtype: 'unDocument',
      title: 'Universal Declaration of Human Rights',
      resolutionNumber: '217A',
      session: 'III',
      unDocSymbol: 'A/810',
      date: '10 December 1948',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'UN Materials — newer numbering, separate adoption date, with pinpoint',
    fields: {
      subtype: 'unDocument',
      title: 'United Nations Declaration on the Rights of Indigenous Peoples',
      resolutionNumber: '61/295',
      unDocSymbol: 'A/RES/61/295',
      date: '2 October 2007',
      adoptedDate: '13 September 2007',
      pinpoint: 'art 3',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'UN Materials — no document symbol available',
    fields: {
      subtype: 'unDocument',
      title: 'Declaration on the Right to Development',
      resolutionNumber: '41/128',
      date: '4 December 1986',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'UN Materials — Charter of the United Nations, bare title only',
    fields: {
      subtype: 'unDocument',
      title: 'Charter of the United Nations',
      date: '',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — Canadian case',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'case',
      title: 'R v Sharpe',
      year: '2001',
      volume: '1',
      reportAbbreviation: 'SCR',
      startingPage: '45',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — Canadian legislation',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'Canada',
      foreignCategory: 'legislation',
      title: 'Privacy Act',
      canadaStatuteVolumeType: 'RS',
      canadaJurisdictionAbbrev: 'C',
      year: '1985',
      canadaChapter: 'P-21',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — New Zealand case',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'case',
      title: 'Haylock v Patek',
      year: '2009',
      volume: '1',
      reportAbbreviation: 'NZLR',
      startingPage: '351',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — New Zealand legislation',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'NewZealand',
      foreignCategory: 'legislation',
      title: 'Companies Act',
      year: '1993',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — UK case',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'case',
      title: 'CAS Nominees Ltd v Nottingham Forest FC plc',
      year: '2001',
      volume: '1',
      reportAbbreviation: 'All ER',
      startingPage: '954',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — UK legislation',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'UK',
      foreignCategory: 'legislation',
      title: 'Online Safety Act',
      year: '2023',
      ukJurisdiction: 'UK',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — US case',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'case',
      title: 'Roper v Simmons',
      volume: '543',
      reportAbbreviation: 'US',
      startingPage: '551',
      year: '2005',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — US legislation (Code)',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'legislation',
      usStatuteTitle: 'Federal Deposit Insurance Act',
      usTitleOrChapterNumber: '12',
      usCodeAbbrev: 'USC',
      pinpoint: '§§ 1811–35a',
      year: '2006',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'Foreign Domestic Sources — US Constitution',
    fields: {
      subtype: 'foreignDomestic',
      foreignCountry: 'US',
      foreignCategory: 'constitution',
      title: 'United States Constitution',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — Official Journal, with pinpoint',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'officialJournal',
      title:
        'Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the Protection of Natural Persons with Regard to the Processing of Personal Data and on the Free Movement of Such Data, and Repealing Directive 95/46/EC (General Data Protection Regulation)',
      year: '2016',
      ojSeries: 'L',
      ojIssueNumber: '119',
      ojStartingPage: '1',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — Constitutive Treaty, with short title',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'constitutiveTreaty',
      title: 'Treaty on European Union',
      openedForSignature: '7 February 1992',
      treatySeries: '[2009] OJ C 115/13',
      enteredIntoForce: '1 November 1993',
      shortTitle: 'EU',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — Court of the EU, unreported',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'court',
      euCourtReported: false,
      title: 'Huawei Technologies Co Ltd v ZTE Corporation',
      euCourtName: 'Court of Justice of the European Union',
      euCaseNumber: 'C-170/13',
      euEcli: 'ECLI:EU:C:2015:477',
      date: '16 July 2015',
      pinpoint: '9',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — Council of Europe Basic Document, with amendment',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'councilOfEuropeBasicDocument',
      title: 'Convention for the Protection of Human Rights and Fundamental Freedoms',
      openedForSignature: '4 November 1950',
      treatySeries: '213 UNTS 221',
      enteredIntoForce: '3 September 1953',
      euAmendedByCitation:
        'Protocol No 11 to the Convention for the Protection of Human Rights and Fundamental Freedoms, opened for signature 11 May 1994, ETS No 155 (entered into force 1 November 1998)',
      shortTitle: 'ECHR',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — European Court of Human Rights, year-organised',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'europeanCourtOfHumanRights',
      euEchrFormat: 'reportedYearOrganised',
      title: 'Bouchelkia v France',
      year: '1997',
      volume: 'I',
      startingPage: '47',
    } satisfies InternationalMaterialFields,
  },
  {
    label: 'European Union Materials — European Commission of Human Rights',
    fields: {
      subtype: 'europeanUnion',
      euCategory: 'europeanCommissionOfHumanRights',
      title: 'Klass v Federal Republic of Germany',
      year: '1978',
      volume: '1',
      startingPage: '20',
      pinpoint: '29',
    } satisfies InternationalMaterialFields,
  },
]

const OTHER_SOURCES_EXAMPLES: GuideExample[] = [
  {
    label: 'Dictionary (r 7.6) — hard copy, with a definition number',
    fields: {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryEdition: '5th ed',
      dictionaryYear: '2009',
      dictionaryEntryTitle: 'demise',
      dictionaryDefNumber: '4',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Dictionary — online',
    fields: {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryRetrievalDate: '20 February 2018',
      dictionaryEntryTitle: 'punctilious',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Legal Encyclopedia (r 7.7) — hard copy',
    fields: {
      subtype: 'legalEncyclopedia',
      encyclopediaPublisher: 'LexisNexis',
      encyclopediaTitle: 'Halsbury’s Laws of Australia',
      encyclopediaVolume: '15',
      encyclopediaAtDate: '25 May 2009',
      encyclopediaTitleNumber: '235',
      encyclopediaTitleName: 'Insurance',
      encyclopediaChapterNumber: '2',
      encyclopediaChapterName: 'General Principles',
      encyclopediaParagraph: '235-270',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Legal Encyclopedia — online, no title number',
    fields: {
      subtype: 'legalEncyclopedia',
      encyclopediaPublisher: 'LexisNexis',
      encyclopediaTitle: 'Halsbury’s Law of England',
      encyclopediaRetrievalDate: '20 February 2018',
      encyclopediaTitleName: 'Equitable Jurisdiction',
      encyclopediaChapterNumber: '4',
      encyclopediaChapterName: 'Principles of Equitable Jurisdiction',
      encyclopediaParagraph: '101',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Speech (r 7.3) — named lecture, not the literal word "Speech"',
    fields: {
      subtype: 'speech',
      speechAuthor: 'Virginia Bell',
      speechTitle: 'Section 80: The Great Constitutional Tautology',
      speechLabel: 'Lucinda Lecture',
      speechForum: 'Monash University',
      speechDate: '24 October 2013',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Press/Media Release (r 7.4) — author and body are the same, so body is omitted',
    fields: {
      subtype: 'pressRelease',
      pressReleaseAuthor: 'Department of Defence (Cth)',
      pressReleaseTitle: 'Highest East Timorese Honour for Army Officers',
      pressReleaseDocumentNumber: 'MSPA 172/09',
      pressReleaseDate: '22 May 2009',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'ABS Materials (r 7.1.5) — cited by catalogue number, author always fixed',
    fields: {
      subtype: 'abs',
      absTitle: 'Corrective Services, Australia, September Quarter 2017',
      absCatalogueNumber: '4512.0',
      absDate: '30 November 2017',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Film (r 7.14.2) — no episode title, non-standard version',
    fields: {
      subtype: 'filmOrMedia',
      mediaFormat: 'film',
      mediaTitle: 'Donnie Darko',
      mediaVersionDetails: 'Director’s Cut',
      mediaStudio: 'Newmarket Films',
      mediaDate: '2004',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Television series (r 7.14.3) — real episode title, time-span pinpoint, with URL',
    fields: {
      subtype: 'filmOrMedia',
      mediaFormat: 'tvSeries',
      mediaEpisodeTitle: 'The Paradise Papers',
      mediaTitle: 'Four Corners',
      mediaStudio: 'Australian Broadcasting Corporation',
      mediaDate: '2017',
      pinpoint: '0:40:00–0:45:00',
      mediaUrl: 'http://www.abc.net.au/4corners/the-paradise-papers/9124930',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Podcast (r 7.14.4) — full date, not just a year',
    fields: {
      subtype: 'filmOrMedia',
      mediaFormat: 'radioOrPodcast',
      mediaEpisodeTitle: 'S02 Episode 07: Hindsight, Part 1',
      mediaTitle: 'Serial',
      mediaStudio: 'This American Life',
      mediaDate: '18 February 2016',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Social Media Post (r 7.16) — username, real name, date/time/timezone, URL',
    fields: {
      subtype: 'socialMedia',
      socialMediaUsername: '@s_m_stephenson',
      socialMediaRealName: 'Scott Stephenson',
      socialMediaPlatform: 'Twitter',
      socialMediaDate: '17 July 2017',
      socialMediaTime: '9:37pm',
      socialMediaTimeZone: 'AEST',
      socialMediaUrl: 'https://twitter.com/s_m_stephenson/status/887169425551441921',
    } satisfies OtherSourcesFields,
  },
  {
    label: 'Social Media Post — no title of its own',
    fields: {
      subtype: 'socialMedia',
      socialMediaUsername: 'chapteriiibestbits',
      socialMediaPlatform: 'Instagram',
      socialMediaDate: '21 July 2016',
      socialMediaTimeZone: 'AEST',
    } satisfies OtherSourcesFields,
  },
]

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    sourceType: 'case',
    title: 'Cases',
    chapterRef: 'AGLC4 ch 2',
    category: 'primary',
    formatTemplate: '[Italic Case Name] (Year) Volume ReportAbbr StartingPage, Pinpoint (Judge).',
    examples: CASE_EXAMPLES,
    keyRules: [
      'Round brackets for year when the report series is organised by volume (eg CLR, FCR); square brackets when organised by year (eg Qd R).',
      "Ordinal numbers in a case name go in square brackets, eg [No 2] — they're part of the name, not a pinpoint.",
      "Ibid is only used when the immediately preceding footnote cites the same source and nothing else — never skip a footnote to reach it.",
    ],
  },
  {
    sourceType: 'legislation',
    title: 'Legislation',
    chapterRef: 'AGLC4 ch 3',
    category: 'primary',
    formatTemplate: '[Italic Act Title Year] (Jurisdiction) s Section.',
    examples: LEGISLATION_EXAMPLES,
    keyRules: [
      'Abbreviations carry no full stops — Cth, not C’th.',
      'The year is part of the italicised title, not a separate element after it.',
      'The Australian Constitution is cited without jurisdiction brackets at all.',
    ],
  },
  {
    sourceType: 'journal',
    title: 'Journal Articles',
    chapterRef: 'AGLC4 ch 5',
    category: 'secondary',
    formatTemplate: "Author, 'Article Title' (Year) Volume(Issue) [Italic Journal Name] StartingPage, Pinpoint.",
    examples: JOURNAL_EXAMPLES,
    keyRules: [
      'The article title sits in single quotation marks — it is never italicised, only the journal name is.',
      "Authors' given names are given in full, not reduced to initials, with no honorifics or post-nominals, eg Robert Ellicott not R Ellicott QC.",
      'Year-organised journals with no volume number put the issue alone in round brackets after the year, eg [2000] (1).',
    ],
  },
  {
    sourceType: 'book',
    title: 'Books',
    chapterRef: 'AGLC4 ch 6',
    category: 'secondary',
    formatTemplate: '[Author, Italic Title] (Publisher, Year) Pinpoint.',
    examples: BOOK_EXAMPLES,
    keyRules: [
      'Only state the edition if it is not the first, eg (Publisher, 2nd ed, Year).',
      'The pinpoint for a whole book is a bare page number — no comma and no "p" prefix.',
      "Book chapters use the 'in Editor(s) (ed/eds)' construction, and the chapter title takes single quotes, not italics.",
    ],
  },
  {
    sourceType: 'report',
    title: 'Reports',
    chapterRef: 'AGLC4 ch 7, r 7.1',
    category: 'secondary',
    formatTemplate: '[Author, Italic Title] (DocumentType/SeriesNo, Date) Pinpoint.',
    examples: REPORT_EXAMPLES,
    keyRules: [
      'Omit the author entirely (including the leading comma) when one is not prominently indicated on the report.',
      'Include the series number where one exists, eg Report No 129 — it replaces the plain document type in the brackets.',
      'Full dates are used where available; otherwise cite as much of the date as is given.',
    ],
  },
  {
    sourceType: 'researchPaper',
    title: 'Research Papers, Theses and Similar Documents',
    chapterRef: 'AGLC4 ch 7',
    category: 'secondary',
    formatTemplate: "Author, 'Title' (DocumentType, Institution, Date) Pinpoint.",
    examples: RESEARCH_PAPER_EXAMPLES,
    keyRules: [
      "The title sits in single quotation marks, like a journal article — never italicised, because it's a paper within a larger event or institution, not a standalone publication.",
      "Document type is a short descriptor (eg 'Conference Paper', 'PhD Thesis', 'Working Paper') — for a thesis the institution field is the university; for a conference paper it's the conference name.",
      'The pinpoint is a bare page/paragraph number with no comma before it, the same as a report or a whole book.',
    ],
  },
  {
    sourceType: 'website',
    title: 'Websites',
    chapterRef: 'AGLC4 ch 7, r 7.15',
    category: 'secondary',
    formatTemplate: "Author, 'Document Title', [Italic Website Name] (Document Type, Date) <URL>.",
    examples: WEBSITE_EXAMPLES,
    keyRules: [
      'Omit the author when none is indicated, or when the author is just the website name repeated.',
      'The URL always goes in angle brackets at the very end of the citation, before the full stop.',
      'This rule is a last resort — only cite something as a website if no other AGLC4 rule applies to the source.',
    ],
  },
  {
    sourceType: 'newspaper',
    title: 'Electronic Newspaper Articles',
    chapterRef: 'AGLC4 ch 7, r 7.11.2',
    category: 'secondary',
    formatTemplate: "Author, 'Article Title', [Italic Newspaper Name] (online, Date) <URL>.",
    examples: NEWSPAPER_EXAMPLES,
    keyRules: [
      'Omit the author entirely (including the leading comma) for an unbylined report, eg an unattributed wire-service article.',
      "The parenthetical is always the literal word 'online' followed by the full date — there is no page number the way a print newspaper article would have one.",
      'The URL always goes in angle brackets at the very end of the citation, before the full stop.',
    ],
  },
  {
    sourceType: 'otherLegislativeMaterial',
    title: 'Other Legislative Material',
    chapterRef: 'AGLC4 ch 3',
    category: 'primary',
    formatTemplate: 'Bills, Explanatory Memoranda, Gazettes, Court Practice Directions/Notes, and Constitutions — each with its own format; see the worked examples.',
    examples: OTHER_LEGISLATIVE_MATERIAL_EXAMPLES,
    keyRules: [
      "A Bill is cited exactly like an Act (r 3.1), except the title and year are NEVER italicised — that's the one deliberate departure r 3.2 makes.",
      "Explanatory Memoranda/Statements/Notes (r 3.7) cite the Bill they explain per r 3.2, with the label — whichever the jurisdiction actually calls it — placed in front, eg 'Explanatory Memorandum, Animal Care and Protection Bill 2001 (Qld)'.",
      "The bare Commonwealth 'Australian Constitution' takes no year and no jurisdiction bracket at all — never 'Australian Constitution (Cth)' — while every state/territory's own constituting Act is cited with its year and jurisdiction exactly like any other Act.",
    ],
  },
  {
    sourceType: 'internationalMaterial',
    title: 'International Material',
    chapterRef: 'AGLC4 ch 8, r 9.2.4, Part V, ch 14',
    category: 'international',
    formatTemplate:
      'Treaty: [Italic Title], opened for signature [Date], [Treaty Series] (entered into force [Date]) Pinpoint.  •  UN Materials: [Italic Title], GA Res [Resolution Number] ([Session]), UN GAOR, UN Doc [Symbol] ([Date][, adopted Adopted Date]) Pinpoint.  •  Foreign Domestic Sources: cited in the style of its own jurisdiction of origin — Canada/NZ/UK/US/Hong Kong/Malaysia/Singapore/South Africa each have their own AGLC4 rule; see the worked examples.  •  European Union / Council of Europe Materials: six formats under AGLC4 ch 14.2/14.3 — Official Journal, Constitutive Treaties, Courts of the EU, Council of Europe Basic Documents, the European Court of Human Rights, and the European Commission of Human Rights; see the worked examples.',
    examples: INTERNATIONAL_MATERIAL_EXAMPLES,
    keyRules: [
      "Treaty — cite the treaty title exactly as it appears on the first page, don't shorten or paraphrase it; bilateral and trilateral treaties join party names with an en dash (–), not a hyphen; use conventional shortened state names, eg Australia rather than Commonwealth of Australia.",
      "UN Materials — a UN General Assembly declaration or resolution — never opened for signature, ratified, or 'entered into force', and carries no treaty series number — is a different citation from a treaty, even though both are commonly hosted on the same instrument-listing sites.",
      "UN Materials — 'UN GAOR' appears only for the older Roman-numeral session-based numbering (eg '217A (III)'), never for the newer session/number scheme (eg '61/295', which has no separate session at all); adopted date is only needed when the resolution's own formal document date differs from the date it was actually adopted by vote.",
      "UN Materials — the Charter of the United Nations is a deliberate exception: cited by its bare title alone, with every other field — including the date — left empty, even though pages about it typically also state a signature/entry-into-force date the way a treaty's would.",
      "Foreign Domestic Sources — Canada, New Zealand, the UK, Hong Kong, Malaysia, Singapore, and South Africa all cite cases 'in accordance with chapter 2' (the same Case Name (Year) Volume ReportAbbr StartingPage shape as a domestic case), each with small jurisdiction-specific tweaks (eg the UK's 'plc'/'R (Party)' conventions, Malaysia's date-dependent MLJ bracket style). The US is structurally different (r 25.1): the case name takes a trailing comma, the volume comes before the report series, and jurisdiction/court sits in a final parenthetical with the year — omitted entirely for the US Supreme Court.",
      "Foreign Domestic Sources — legislation formats vary the most by country: Canada glues a statute-volume-type letter to a jurisdiction abbreviation before the year (eg 'RSC 1985'); the UK distinguishes UK/Northern Ireland/Scotland/Wales with different jurisdiction brackets and number types (c/asp/nawm); the US Code cites down to a section with a '§' marker and often no title at all; China/France/Germany are not yet covered — those need a fundamentally different, non-Latin-script field shape and are a separate follow-up.",
      "European Union Materials — Official Journal (r 14.2.1): the OJ series letter (L/C/LI/CI/CA/S) is only included for documents published from 1 January 1968; the 'S' series (invitations to tender) never has a starting page; the post-2016 digital-only part of the C series uses an 'E/' page prefix instead of the ordinary unspaced slash (eg '[2009] OJ C 3 E/1', not '3/1'); pre-1974 documents may carry a parallel Special Edition citation preceded by a semicolon.",
      "European Union Materials — Constitutive Treaties of the EU (r 14.2.2) and Basic Documents of the Council of Europe (r 14.3.1) are both cited as ordinary treaties (ch 8), with one addition: a short title, when given, is included inline in the FIRST citation itself (not just subsequent references) as '(‘Short Title’)' — confirmed against the actual AGLC4 PDF that the short title is italicised even inside its quote marks. An 'as amended by [Citation]' clause, when present, comes before the short title, not after.",
      "European Union Materials — Courts of the European Union (r 14.2.3): reported decisions (ECR/ECR-SC) look like '*Parties* (CaseNumber) [Year] ReportAbbrev StartingPage, Pinpoint'; unreported decisions look like '*Parties* (CourtName, CaseNumber, ECLI, FullDate) [Pinpoint]' — note the paragraph pinpoint here has NO comma before it (eg '... 2015) [9].', not '..., [9].'), unlike almost every other pinpoint in this app.",
      "European Union Materials — the European Court of Human Rights (r 14.3.2) has four distinct formats depending on era and reporting status: decisions until the end of 1995 ('Eur Court HR (ser A)') have NO starting page at all — the number shown after '(ser A)' is a bare pinpoint, not a page; decisions from 1996 ('Eur Court HR', year-organised) DO have a starting page and an ordinary comma-prefixed pinpoint; unreported decisions use a bare-space paragraph pinpoint like the CJEU; pleadings (ser B, until 1988) quote the document's own title before the case name.",
      "European Union Materials — the European Commission of Human Rights (r 14.3.3) has a single format, closely matching the ECtHR's year-organised form: '*Parties* (Year) Volume Eur Comm HR StartingPage, Pinpoint' — a volume number and starting page are always required here, unlike the CJEU/ECtHR formats above where they're sometimes genuinely absent.",
    ],
  },
  {
    sourceType: 'otherSources',
    title: 'Other Sources',
    chapterRef: 'AGLC4 ch 7',
    category: 'secondary',
    formatTemplate:
      "Dictionary: [Italic Dictionary Title] (Edition ed, Year) 'Entry' (def N).  •  Legal Encyclopedia: Publisher, [Italic Title], vol N (at Date) TitleNo Name, 'ChapterNo Name' [Paragraph].  •  Speech: Author, 'Title' (Speech, Forum, Date) Pinpoint.  •  Press/Media Release: Author, 'Title' (ReleaseType No, Body, Date) Pinpoint.  •  ABS Materials: Australian Bureau of Statistics, [Italic Title] (Catalogue No N, Date) Pinpoint.  •  Film/TV/Other Media: ['Episode', ][Italic Title] (Version, Studio, Date) Pinpoint <URL>.  •  Social Media Post: Username[, 'Title'] (Platform, Date[, Time][ TZ]) Pinpoint <URL>.",
    examples: OTHER_SOURCES_EXAMPLES,
    keyRules: [
      'A dictionary/encyclopedia title is italicised, exactly like a book title — but the specific entry word or chapter name it points to is quoted, never italicised, matching a journal article or research paper title instead.',
      "A hard-copy dictionary/encyclopedia takes an edition and year (or volume and 'at Date'); an online one takes a single retrieval date instead of both — never mix the two forms.",
      "A named lecture (eg 'Lucinda Lecture') replaces the literal word 'Speech' in a Speech citation — with any leading 'The' and its ordinal number in a lecture series both stripped, eg 'Sultan Azlan Shah Lecture', never 'The 27th Sultan Azlan Shah Lecture'.",
      "A Press/Media Release omits the releasing body entirely whenever it's the same as the author — a very common case, not a missing field.",
      "ABS Materials always cite the author as the fixed literal 'Australian Bureau of Statistics' and are identified by their own catalogue number (eg 'Catalogue No 4512.0'), not a report series number.",
      "Film, Television and Other Media share one format across three AGLC4 sub-rules: a film has no episode title at all; a TV episode with no title of its own is quoted as the literal text 'Episode 10' or 'Season 9, Episode 10'; a radio segment or podcast takes a full date rather than a bare year. Version details (eg 'Director's Cut') only appear for a non-standard version.",
      "A Social Media Post's title is dropped entirely — not left as an empty quoted string — when the post has none; a time is only added to disambiguate multiple same-day posts, and a time zone only when the platform adjusts the displayed time to the viewer's own zone.",
    ],
  },
]

export const GUIDE_CATEGORIES: { key: GuideEntry['category']; label: string }[] = [
  { key: 'primary', label: 'Primary sources' },
  { key: 'secondary', label: 'Secondary sources' },
  { key: 'international', label: 'International' },
]
