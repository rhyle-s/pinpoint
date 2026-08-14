import { CaseFields, CitationFields, LegislationFields, JournalFields, BookFields, ReportFields, ResearchPaperFields, WebsiteFields, TreatyFields, SourceType } from './citation-engine/types'

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

const TREATY_EXAMPLES: GuideExample[] = [
  {
    label: 'Open multilateral treaty',
    fields: {
      title: 'International Covenant on Economic, Social and Cultural Rights',
      treatyType: 'multilateral',
      openedForSignature: '16 December 1966',
      treatySeries: '993 UNTS 3',
      enteredIntoForce: '3 January 1976',
    } satisfies TreatyFields,
  },
  {
    label: 'With pinpoint',
    fields: {
      title: 'Convention on the Rights of the Child',
      treatyType: 'multilateral',
      openedForSignature: '20 November 1989',
      treatySeries: '1577 UNTS 3',
      enteredIntoForce: '2 September 1990',
      pinpoint: 'art 3',
    } satisfies TreatyFields,
  },
  {
    label: 'Multilateral, no pinpoint',
    fields: {
      title: 'Agreement on Trade-Related Aspects of Intellectual Property Rights',
      treatyType: 'multilateral',
      openedForSignature: '15 April 1994',
      treatySeries: '1869 UNTS 299',
      enteredIntoForce: '1 January 1995',
    } satisfies TreatyFields,
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
    sourceType: 'treaty',
    title: 'Treaties',
    chapterRef: 'AGLC4 ch 8',
    category: 'international',
    formatTemplate: '[Italic Treaty Title], opened for signature [Date], [Treaty Series] (entered into force [Date]) Pinpoint.',
    examples: TREATY_EXAMPLES,
    keyRules: [
      "Cite the treaty title exactly as it appears on the first page — don't shorten or paraphrase it.",
      'Bilateral and trilateral treaties join party names with an en dash (–), not a hyphen.',
      'Use conventional shortened state names, eg Australia rather than Commonwealth of Australia.',
    ],
  },
]

export const GUIDE_CATEGORIES: { key: GuideEntry['category']; label: string }[] = [
  { key: 'primary', label: 'Primary sources' },
  { key: 'secondary', label: 'Secondary sources' },
  { key: 'international', label: 'International' },
]
