export type SourceType =
  | 'case'
  | 'legislation'
  | 'journal'
  | 'book'
  | 'report'
  | 'researchPaper'
  | 'website'
  | 'treaty'

export type CaseReportType = 'reported' | 'unreported-mnc' | 'unreported-no-mnc'

export type JurisdictionCode =
  | 'Cth' | 'Vic' | 'NSW' | 'Qld' | 'WA' | 'SA' | 'Tas' | 'ACT' | 'NT'

export type LegislationPinpointType =
  | 's' | 'ss' | 'sch' | 'pt' | 'div' | 'reg'

export interface CaseFields {
  caseName: string
  reportType: CaseReportType
  year: string
  // Reported
  volume?: string
  reportAbbreviation?: string
  startingPage?: string
  // Unreported MNC
  courtCode?: string
  caseNumber?: string
  // Unreported no MNC
  court?: string
  date?: string
  // All types
  pinpoint?: string
  pinpointType?: 'page' | 'paragraph'
  judge?: string
  footnoteNumber?: string        // for subsequent references
  shortTitle?: string            // for subsequent references
}

export interface LegislationFields {
  actTitle: string
  year: string
  jurisdiction: JurisdictionCode | 'none'
  pinpointType?: LegislationPinpointType
  pinpointValue?: string
}

export interface JournalFields {
  authors: string[]           // array of author names as written eg ['RJ Ellicott', 'Jane Smith']
  articleTitle: string
  year: string
  volume?: string             // omit if journal is year-organised
  issue?: string              // eg '1' for issue 1
  journalName: string
  startingPage: string
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export type BookType = 'book' | 'chapter'

export interface BookFields {
  bookType: BookType
  // For whole books
  authors?: string[]
  title: string
  edition?: string            // eg '2nd ed', 'rev ed' — omit if first edition
  publisher: string
  year: string
  pinpoint?: string
  // For book chapters
  chapterAuthors?: string[]
  chapterTitle?: string
  editors?: string[]          // eg ['John Smith', 'Jane Lee']
  startingPage?: string       // starting page of the chapter
  footnoteNumber?: string
  shortTitle?: string
}

export interface ReportFields {
  authors?: string[]          // omit if not prominently indicated
  title: string
  documentType: string        // eg 'Report', 'Final Report', 'Interim Report'
  seriesNumber?: string       // eg 'Report No 129'
  date: string                // full date where available eg 'December 2015'
  pinpoint?: string           // page and/or paragraph
  footnoteNumber?: string
  shortTitle?: string
}

// Covers conference papers, theses, and working/research papers — all "described" sources that
// share the same AGLC4 shape (Author, 'Title' (DocumentType, Institution, Date) Pinpoint), unlike
// a report's italicised title, they take single-quoted titles like a journal article.
export type ResearchPaperDocumentType =
  | 'Conference Paper'
  | 'PhD Thesis'
  | 'Masters Thesis'
  | 'Honours Thesis'
  | 'Working Paper'
  | 'Research Paper'

export interface ResearchPaperFields {
  authors?: string[]          // omit if not prominently indicated
  title: string
  documentType: string        // one of ResearchPaperDocumentType, or free text
  seriesNumber?: string       // eg 'Working Paper No 5' — mainly for working/research papers
  institution: string         // university (thesis) / conference name (conference paper) / publishing body (working paper)
  date: string                // full date for conference papers; year is usually enough for a thesis
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export interface WebsiteFields {
  authors?: string[]          // omit if not indicated or same as site name
  documentTitle: string       // title of the specific page/post
  websiteName: string         // name of the website/publication
  documentType: 'Web Page' | 'Blog Post' | 'Forum Post'
  date?: string                // date of last update or creation — omit if unavailable
  pinpoint?: string
  url: string
  footnoteNumber?: string
  shortTitle?: string
}

export type TreatyType = 'multilateral' | 'bilateral' | 'trilateral'

export interface TreatyFields {
  title: string               // as it appears on the first page of the treaty
  treatyType: TreatyType
  parties?: string[]          // for bilateral/trilateral only, if not in title
  openedForSignature?: string // eg '16 December 1966'
  signedDate?: string         // alternative to openedForSignature
  treatySeries: string        // eg '993 UNTS 3' or 'ATS 2'
  enteredIntoForce?: string   // eg '3 January 1976'
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export interface CitationResult {
  footnote: string
  subsequent: string
  bibliography: string
  sourceType: SourceType
  validationStatus: 'unvalidated' | 'validated' | 'corrected'
}

export type CitationFields =
  | CaseFields
  | LegislationFields
  | JournalFields
  | BookFields
  | ReportFields
  | ResearchPaperFields
  | WebsiteFields
  | TreatyFields
