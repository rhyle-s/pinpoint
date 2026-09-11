export type SourceType =
  | 'case'
  | 'legislation'
  | 'journal'
  | 'book'
  | 'report'
  | 'researchPaper'
  | 'website'
  | 'newspaper'
  | 'otherLegislativeMaterial'
  | 'internationalMaterial'
  | 'otherSources'

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
  // Not exposed in LegislationForm.tsx — matching this app's convention everywhere else, where
  // `footnoteNumber` is never a form field either, just a '1' template the student edits by hand
  // once they paste the citation into their own document. shortTitle defaults to the bare Act
  // title (year dropped) when not set, matching AGLC4's own default (r 1.4.4).
  footnoteNumber?: string
  shortTitle?: string
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
  authors?: string[]          // omit if not prominently indicated — often an organisation, not a person
  title: string
  documentType: string        // eg 'Report', 'Final Report', 'Interim Report', 'Discussion Paper', 'White Paper', 'Policy Document'
  seriesNumber?: string       // eg 'Report No 129'
  date: string                // full date where available eg 'December 2015'
  pinpoint?: string           // page and/or paragraph
  footnoteNumber?: string
  shortTitle?: string
  url?: string                 // omit if the report wasn't sourced from a URL (eg a PDF upload)
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

// AGLC4 r 7.11.2 — an article published by an online news publication/newspaper (a masthead with
// journalistic bylines, eg ABC News, The Sydney Morning Herald, The Guardian) — distinct from the
// generic 'website' type (r 7.15), which is the fallback for web content no more specific rule
// covers. The parenthetical is always '(online, Date)' — there is no print-edition variant here.
export interface NewspaperFields {
  authors?: string[]          // omit if not indicated (eg an unbylined wire-service report)
  articleTitle: string        // the headline
  newspaperName: string       // the masthead's own name, eg 'ABC News', 'The Sydney Morning Herald'
  date: string                 // full date eg '17 August 2026'
  pinpoint?: string
  url: string
  footnoteNumber?: string
  shortTitle?: string
}

// One source type covering five AGLC4 ch 3 categories that don't fit ordinary Acts, following the
// same "one interface, discriminant field, subtype-specific optional fields" shape as CaseFields
// (see cases.ts) rather than five separate SourceType values — they share a single UI entry point
// ("Other Legislative Material") with a badge naming whichever sub-category was detected.
export type OtherLegislativeMaterialSubtype = 'bill' | 'explanatoryMaterial' | 'gazette' | 'practiceDirection' | 'constitution'

export type ExplanatoryMaterialLabel = 'Explanatory Memorandum' | 'Explanatory Statement' | 'Explanatory Note' | 'Explanatory Notes'

export type PracticeDocumentType = 'Practice Note' | 'Practice Direction'

export interface OtherLegislativeMaterialFields {
  subtype: OtherLegislativeMaterialSubtype

  // Bill (r 3.2) — cited exactly like an Act (title + year + jurisdiction) except NEVER
  // italicised. Also the basis of an Explanatory Material citation (r 3.7), which cites the Bill
  // per r 3.2 with a label prefixed on — so 'explanatoryMaterial' reuses these same three fields
  // rather than duplicating them.
  billTitle?: string          // eg 'Corporations Amendment (Crowd-Sourced Funding) Bill' — no year in the title itself
  billYear?: string
  billJurisdiction?: JurisdictionCode

  // Explanatory Material (r 3.7)
  explanatoryLabel?: ExplanatoryMaterialLabel   // which of the four the jurisdiction actually calls it

  // Gazette (r 3.9.1) — [Author, ]['Article Title' in ]Jurisdiction, [Italic]Gazette Name, No X,
  // Date[, StartingPage[, Pinpoint]].
  gazetteAuthor?: string       // eg 'Minister for Lands (WA)' — omit for a whole-gazette citation with no specific notice
  gazetteArticleTitle?: string // the specific notice's own title, if citing one particular entry rather than the whole issue
  gazetteJurisdiction?: string // eg 'Commonwealth', 'Western Australia', 'Australian Capital Territory'
  gazetteName?: string         // eg 'Western Australian Government Gazette', 'Gazette: Special'
  gazetteNumber?: string       // eg 'No 27', 'No S 489'
  gazetteDate?: string
  gazetteStartingPage?: string // the notice's own starting page within the gazette issue — omit for a whole-gazette citation

  // Court Practice Direction/Note — Court, PracticeType No X of Year: Title, Date.
  court?: string               // eg 'Supreme Court of Victoria', 'High Court of Australia'
  practiceType?: PracticeDocumentType
  practiceNumber?: string      // eg 'No 9 of 2010'
  practiceTitle?: string       // eg 'Conduct of Group Proceedings'
  practiceDate?: string        // the direction/note's own issuing date, eg '29 November 2010'

  // Australian/State/Territory Constitution (r 3.6) — cited exactly like ordinary legislation, so
  // this delegates to generateLegislationCitation internally rather than duplicating its logic.
  // The bare Commonwealth 'Australian Constitution' has no year and no jurisdiction bracket at
  // all — never 'Australian Constitution (Cth)' — achieved simply by leaving constitutionYear
  // empty and constitutionJurisdiction 'none', the same way LegislationFields already handles it.
  constitutionTitle?: string   // eg 'Australian Constitution', 'Constitution Act', 'Constitution of Queensland'
  constitutionYear?: string    // omit for the bare 'Australian Constitution', which carries no year
  constitutionJurisdiction?: JurisdictionCode | 'none'
  constitutionPinpointType?: LegislationPinpointType
  constitutionPinpointValue?: string

  // Shared by bill / explanatoryMaterial / gazette / practiceDirection — a bare pinpoint with no
  // structured type (constitution uses its own structured constitutionPinpointType/Value above,
  // matching ordinary legislation's convention instead).
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export type TreatyType = 'multilateral' | 'bilateral' | 'trilateral'

// TreatyFields and UNDocumentFields are no longer part of the public SourceType/CitationFields
// surface — both were independent top-level source types until 'treaty' and 'unDocument' were
// merged into 'internationalMaterial' (see InternationalMaterialFields below), the same way
// OtherLegislativeMaterialFields already bundles five AGLC4 ch 3 categories under one type rather
// than five separate SourceTypes. Kept as their own interfaces purely because treaties.ts and
// un-documents.ts's existing, already-tested formatting functions still take these exact shapes —
// international-material.ts adapts InternationalMaterialFields into one of these before delegating
// to them, rather than those functions being rewritten to take the more loosely-typed merged shape
// directly.
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

// A UN General Assembly declaration or resolution (eg the Universal Declaration of Human Rights,
// the UN Declaration on the Rights of Indigenous Peoples) — distinct from a TreatyFields source
// even though both commonly turn up on the same instrument-listing sites (OHCHR, un.org):
// a declaration is *adopted*/*proclaimed* by a GA resolution vote, never opened for signature,
// ratified, acceded to, or "entered into force", and has no UNTS registration — confirmed on the
// UN's own UDHR page, which describes it only as "proclaimed by the United Nations General
// Assembly ... (General Assembly resolution 217 A)" with no treaty-mechanics language at all.
export interface UNDocumentFields {
  title: string               // eg 'Universal Declaration of Human Rights'
  resolutionNumber?: string   // eg '217A' or '61/295' — the GA resolution's own number, no 'GA Res' prefix
  // 'III' — the GA session, shown in parens after resolutionNumber. Only present under the older
  // Roman-numeral session-based numbering (eg '217A (III)'); the newer 'session/number' scheme
  // (eg '61/295') has no separate session field.
  session?: string
  // Whether to include the literal 'UN GAOR' element (r 9.2.4) — genuinely a separate, independent
  // element from `session` above, not derivable from it: r 9.2's own element table lists 'Official
  // Records' (9.2.4, the UN GAOR/SCOR/ESCOR/TCOR component) and 'Session (and Part) Number' (9.2.6)
  // as two different table rows, and r 9.2 itself says elements 9.2.4–9.2.9 (Official Records
  // included) 'may be omitted' whenever the document can be found via its own UN Doc number — which
  // AGLC4's own worked examples confirm is the norm for modern resolutions (eg UNDRIP, GA
  // Res 61/295, omits it entirely) even though an older resolution like the UDHR (GA Res 217A
  // (III)) still includes it. An earlier version of this app wrongly inferred this purely from
  // whether the old-style Roman-numeral `session` field above was filled in — which happened to
  // match both of the two examples on hand at the time, but conflates two independent rule
  // elements; this is now its own explicit field so the student states it directly. Defaults to
  // omitted (unchecked) in the UI, matching the modern/majority convention.
  includeOfficialRecords?: boolean
  unDocSymbol?: string        // eg 'A/810' or 'A/RES/61/295' — often not stated on general-audience pages, leave empty rather than guess
  date: string                 // the resolution/document's own formal date, eg '10 December 1948' or '2 October 2007'
  // A UN document is sometimes formally dated later than the actual General Assembly vote that
  // adopted it (eg UNDRIP: document A/RES/61/295 is dated 2 October 2007, but the resolution was
  // adopted by vote on 13 September 2007) — when the source states both, this is the earlier
  // adoption date, rendered as a trailing ', adopted [date]' after the main date.
  adoptedDate?: string
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

// The single UI entry point ("International Material") for AGLC4's international-sources
// material — mirrors OtherLegislativeMaterialFields's shape exactly: one discriminant plus every
// subtype's own optional fields flattened into one interface, with a badge naming whichever was
// detected. Requested by the user specifically so Treaty and UN Materials (previously two
// independent tabs) plus a new Foreign Domestic Sources category all live under one badge-driven
// tab instead.
export type InternationalMaterialSubtype = 'treaty' | 'unDocument' | 'foreignDomestic' | 'europeanUnion'

// Foreign Domestic Sources (AGLC4 Part V) — a foreign case or piece of legislation, cited in the
// style of its own jurisdiction of origin. China/France/Germany are deliberately NOT covered here
// — AGLC4 cites those in a fundamentally different shape (original-language text with bracketed
// English translations, guillemets, no italics on non-English titles) that doesn't fit this
// Latin-script field/form pattern at all; that's a separate follow-up. The eight jurisdictions
// below all follow some variant of "cases per AGLC4 ch 2, legislation per a ch 3-like shape", so
// share this one flattened field set the same way the ch 2/ch 3-style domestic types already do.
export type ForeignCountry = 'Canada' | 'NewZealand' | 'UK' | 'US' | 'HongKong' | 'Malaysia' | 'Singapore' | 'SouthAfrica'

export type ForeignCategory =
  | 'case'
  | 'legislation'
  | 'delegatedLegislation'      // NZ (r 21.2.2), UK (r 24.3)
  | 'legislationSessionLaw'     // US only (r 25.3) — 'legislation' is the US Code (r 25.2)
  | 'constitution'              // US only (r 25.4) — every other country's constitution is cited
                                 // as ordinary legislation (or, for Hong Kong, has its own fixed
                                 // bare-title form not yet built — see CLAUDE.md)

export type CanadaStatuteVolumeType = 'RS' | 'S'
export type UKJurisdiction = 'UK' | 'NI' | 'Scot' | 'Wales' | 'Imp' | 'none'
export type UKInstrumentType = 'SI' | 'SR' | 'SR & O'

export interface InternationalMaterialFields {
  subtype: InternationalMaterialSubtype
  title?: string               // shared by all three subtypes — the instrument/document/case-or-Act's own title

  // Treaty (AGLC4 r 8.1–8.7) — see TreatyFields above, which this maps onto internally.
  treatyType?: TreatyType
  parties?: string[]
  openedForSignature?: string
  signedDate?: string
  treatySeries?: string
  enteredIntoForce?: string

  // UN Materials, ie a UN General Assembly declaration/resolution (AGLC4 r 9.2.4) — see
  // UNDocumentFields above, which this maps onto internally.
  resolutionNumber?: string
  session?: string
  includeOfficialRecords?: boolean
  unDocSymbol?: string
  date?: string
  adoptedDate?: string

  // Foreign Domestic Sources (AGLC4 Part V, chs 15/19/20/21/22/23/24/25) — dispatched by
  // foreignCountry then foreignCategory, see foreign-domestic.ts. Every case-type field below
  // reuses the shared `title`/`pinpoint`/`footnoteNumber`/`shortTitle` fields above for the case
  // name / pinpoint / subsequent-reference machinery, exactly like the treaty/unDocument subtypes
  // already do — only genuinely country-specific elements get their own field here.
  foreignCountry?: ForeignCountry
  foreignCategory?: ForeignCategory

  // Shared across every "chapter 2"-style foreign case (Canada/NZ/UK/HK/Malaysia/Singapore/South
  // Africa) — same core shape as the domestic CaseFields 'reported' format (Case Name (Year)
  // Volume ReportAbbr StartingPage, Pinpoint (Judge)), plus an optional trailing court-name
  // parenthetical several countries' own examples show (AGLC4 r 2.6-style).
  year?: string
  volume?: string
  reportAbbreviation?: string
  startingPage?: string
  courtName?: string
  judge?: string

  // Unreported foreign cases — every one of the 8 Foreign Domestic Sources jurisdictions cites
  // cases "in accordance with chapter 2" generally, which AGLC4's own country chapters confirm
  // extends to ch 2's unreported forms too (r 2.3.1/2.3.2) for the countries with no dedicated
  // 'unreported' sub-rule of their own (Canada, Hong Kong, South Africa), and which NZ (r 21.1.3),
  // UK (r 24.1.5), Malaysia (r 20.1.2) and Singapore (r 22.1.3) each explicitly confirm by name —
  // each supplying its own table of valid unique court identifiers for the MNC form (a table this
  // app doesn't enforce, matching how report-series abbreviations are already free text). Reuses
  // the shared `year`/`courtName`/`judge`/`date`/`pinpoint`/`title` fields above wherever the
  // underlying concept matches, the same field-reuse discipline every other subtype here follows.
  // Defaults to 'reported' — a country's own case formatter branches on this.
  foreignCaseReportType?: CaseReportType
  foreignCourtCode?: string      // unreported-MNC only — the unique court identifier, eg 'NZHC', 'EWCA Civ', 'FCA' (Canada has no fixed table of its own; use whatever the source states)
  foreignCaseNumber?: string     // unreported-MNC only — the judgment number; for the US's own distinct r 25.1.7 form (see below), the docket/reference number instead

  // US Unreported Cases (r 25.1.7) — genuinely different from every other country's unreported
  // form: no medium-neutral-citation concept exists for US courts at all. 'Parties' Names
  // (Jurisdiction and Court/District, Docket or Reference No, Full Date) slip op Pinpoint
  // (Judge).' Reuses `usJurisdictionCourt` (already below), `foreignCaseNumber` (the docket
  // number), the shared `date`, `pinpoint` (the literal 'slip op ' prefix is added by the
  // formatter, and — confirmed by AGLC4's own r 25.1.7 examples — omitted entirely when there's
  // no pinpoint at all) and `judge`.

  // Canada Legislation (r 15.2) — Title, StatuteVolumeType+JurisdictionAbbrev Year[SessionOrSupp],
  // c Chapter, Pinpoint. Eg 'Privacy Act, RSC 1985, c P-21'.
  canadaStatuteVolumeType?: CanadaStatuteVolumeType   // 'RS' (Revised/Re-enacted Statutes) or 'S' (sessional/annual volumes)
  canadaJurisdictionAbbrev?: string                    // eg 'C' (federal), 'O' (Ontario), 'BC' — see r 15.2.2's table
  canadaSessionOrSupp?: string                         // eg '1st Supp', '2nd Sess' — rare, omit when not applicable
  canadaChapter?: string                                // eg 'P-21', 'C-46', '19'

  // New Zealand Delegated Legislation (r 21.2.2) — Title Year (NZ) SR Year/Number, Pinpoint.
  nzStatutoryRuleNumber?: string                        // eg '2003/288' (the 'SR ' prefix is added by the formatter)

  // UK Legislation (r 24.2) / Delegated Legislation (r 24.3).
  //
  // r 24.2.3 (confirmed directly against the AGLC4 text, not the earlier — wrong — assumption this
  // app briefly shipped with): the regnal year AND chapter number are included ONLY for statutes
  // enacted before 1 January 1963. They are NOT included for any statute from that date onward —
  // confirmed by every one of r 24.2.2's own worked examples, none of which carries a number at
  // all ('Human Rights Act 1998 (UK) s 6(1).', 'Appropriation Act 2004 (UK).', 'Libraries Act
  // (Northern Ireland) 2008 (NI).', 'Dog Fouling (Scotland) Act 2003 (Scot).', 'Learner Travel
  // (Wales) Measure 2008 (Wales).'). An earlier version of this app invented a whole 'asp' (Act of
  // the Scottish Parliament) / 'nawm' / 'anaw' / 'asc' (Wales, by era) instrument-number scheme,
  // fed by real legislation.gov.uk breadcrumb text ('2003 asp 12') — that IS the real-world citation
  // those Parliaments/Assemblies use, but a direct search of the entire AGLC4 PDF confirms 'asp',
  // 'nawm', 'anaw' and 'asc' do not appear anywhere in the guide at all: AGLC4 simply omits any
  // such number for post-1963 legislation, full stop. The chapter is always literally 'c' and only
  // ever appears when `ukRegnalYear` is also set (pre-1963 — Scot/Wales/NI's own devolved
  // legislatures didn't exist before then, so this can only actually arise for 'UK'/'Imp'/'none').
  ukJurisdiction?: UKJurisdiction                       // which bracket (or none, for pre-1963 UK Parliament Acts) follows the year
  ukRegnalYear?: string                                 // pre-1963 UK Acts only, eg '9 & 10 Eliz 2' — presence of this is what gates the chapter number below; omit both for modern Acts
  ukNumberValue?: string                                // the chapter number (pre-1963 Acts only, alongside ukRegnalYear) — the formatter supplies the literal 'c' abbreviation itself
  ukInstrumentType?: UKInstrumentType                    // delegated legislation only
  ukInstrumentNumber?: string                            // eg '2007/809' (the type prefix is added by the formatter)

  // US Case (r 25.1) — Case Name, Volume ReportAbbr[SeriesNumber] StartingPage, Pinpoint
  // (Jurisdiction Court, Year). usJurisdictionCourt is omitted entirely for US Supreme Court
  // decisions (r 25.1.5.1) — leave blank for those.
  usSeriesNumber?: string                                // eg '2d', '3d', '4th'
  usJurisdictionCourt?: string                           // eg 'Fla', 'D Del', '11th Cir', 'Mass' — omit for SCOTUS

  // US Legislation: Code (r 25.2) — [StatuteTitle, ][OriginalPinpoint, ]TitleOrChapterNo CodeAbbrev
  // Pinpoint (PublisherOrEditor Year).
  usStatuteTitle?: string                                // often omitted — see r 25.2.1
  usOriginalPinpoint?: string
  usTitleOrChapterNumber?: string                        // eg '12' in '12 USC'
  usCodeAbbrev?: string                                  // eg 'USC', 'Ky Rev Stat Ann'
  usPublisherOrEditor?: string                            // eg 'West' — only for codes published by more than one house

  // US Legislation: Session Law (r 25.3) — [StatuteTitle, ][PubL/PrivL/ChNo, ][OriginalPinpoint,
  // ]VolumeOrYear AbbreviatedName StartingPage[, PagePinpoint][ (Year)]. Eg 'Freedom to Display the
  // American Flag Act of 2005, Pub L No 109-243, § 4, 120 Stat 572, 573 (2006).' Reuses the shared
  // `usOriginalPinpoint` field (already used the same way by r 25.2's Code format, r 25.3.3
  // confirms it's the same underlying concept) for the pre-volume locator (eg '§ 4', 'tit II'); an
  // earlier version of this formatter wrongly reused the ordinary `pinpoint` field for that role
  // instead and dropped both the comma r 25.3.3 requires after it AND the trailing page-level
  // pinpoint r 25.3.6 requires after the starting page entirely — confirmed missing against
  // AGLC4's own worked example, which has both.
  usPublicLawNumber?: string                              // eg 'Pub L No 109-243'
  usVolumeOrYear?: string                                 // eg '120' (Stat volume) or a session-law year
  usAbbreviatedName?: string                              // eg 'Stat', '2008 Ind Acts'
  usSessionLawPagePinpoint?: string                       // r 25.3.6 — the page(s) within the session laws volume, distinct from the pre-volume `usOriginalPinpoint` above, eg '573' or '1633–6'

  // Hong Kong Legislation (r 19.2) — Title (Hong Kong) cap ChapterNumber, Pinpoint. No year.
  hkChapterNumber?: string                                // eg '8', '167A' — omit for un-numbered/historical ordinances (year used instead, via the shared `year` field)

  // Singapore Legislation (r 22.2) — Title (Singapore, cap ChapterNumber, Year rev ed) Pinpoint,
  // or Title Year (Singapore) Pinpoint where no chapter number has been assigned.
  singaporeChapterNumber?: string
  singaporeRevisionYear?: string                          // the 'Year rev ed' — distinct from the shared `year` (year first passed)

  // South Africa Legislation (r 23.2) — Title Year (Jurisdiction) Pinpoint. Jurisdiction is
  // 'South Africa' or a provincial abbreviation (r 23.2.1's table) — reuses the shared `title`
  // and `year`, jurisdiction stored here since it isn't the ordinary domestic JurisdictionCode set.
  southAfricaJurisdiction?: string                        // eg 'South Africa', 'KZN', 'WC'

  // European Union / Council of Europe (AGLC4 ch 14.2/14.3, 'Supranational Materials' — a
  // genuinely different AGLC4 chapter from Foreign Domestic Sources above, not a ninth country to
  // add there) — six categories nested under `euCategory`, reusing the shared title/year/volume/
  // reportAbbreviation/startingPage/date/pinpoint fields above wherever the underlying concept
  // matches (matching the field-reuse discipline `otherSources` established), plus the
  // EU/Council-of-Europe-specific fields below.
  euCategory?: EUCategory

  // Official Journal of the EU (r 14.2.1) — [Italic title] [Year] OJ Series Issue/StartingPage[;
  // [SpecEdYear] OJ Spec Ed SpecEdStartingPage], Pinpoint. Reuses `title` (document title) and
  // `year` (OJ publication year, not necessarily the date within the title itself).
  ojSeries?: OJSeries
  ojIssueNumber?: string                                  // eg '95' in 'OJ L 95/29'
  ojStartingPage?: string                                 // omitted entirely for the 'S' series, which has none
  ojIsDigitalOnlyC?: boolean                               // the post-2016 digital-only part of the C series — '[Year] OJ C Issue E/Page' (an 'E/' prefix, not a plain '/')
  ojSpecEdYear?: string                                   // pre-1974 documents only — optional parallel citation to the English Special Edition
  ojSpecEdStartingPage?: string

  // Constitutive Treaties of the EU (r 14.2.2) and Basic Documents of the Council of Europe
  // (r 14.3.1) — both cited as ordinary treaties (ch 8), reusing `title`/`openedForSignature`/
  // `signedDate`/`treatySeries`/`enteredIntoForce`/`shortTitle` entirely (treatySeries holds
  // either a UNTS/ETS/CETS-style reference or an OJ-style one, whichever the source actually
  // cites — both are just pre-formatted text here, same as the plain 'treaty' subtype already
  // does). euAmendedByCitation is the optional trailing 'as amended by [Citation]' clause r
  // 14.2.2/14.3.1 both use for amendment chains.
  euAmendedByCitation?: string

  // Courts of the European Union (r 14.2.3, the CJEU/General Court/Civil Service Tribunal) — two
  // formats. Reported (in the ECR/ECR-SC): '*Parties* (CaseNumber) [Year] [Volume ]ReportAbbrev
  // StartingPage, Pinpoint' — reuses `title` (parties' names), `year`, `volume` (rare — most ECR
  // citations have none, eg 'Costa v ENEL', but some do, eg 'Grad v Finanzamt Traunstein (C-9/70)
  // [1970] 2 ECR 825'), `reportAbbreviation` ('ECR' or 'ECR-SC'), `startingPage` (carries a
  // Section-II prefix as typed for ECR-SC, eg 'II-197' — there's no separate section field),
  // `pinpoint`. Unreported: '*Parties* (CourtName, CaseNumber, ECLI, FullDate) [Pinpoint]' — reuses
  // `title`, `date` (full date), `pinpoint` (bare-space paragraph brackets, no comma — confirmed
  // against the Huawei v ZTE worked example, '... 2015) [9].', not '..., [9].').
  euCourtReported?: boolean
  euCaseNumber?: string                                   // eg 'C-170/13' ('C-' CJEU, 'T-' General Court, 'F-' Civil Service Tribunal) — included for both reported and unreported
  euEcli?: string                                          // unreported only, when available, eg 'ECLI:EU:C:2015:477'
  euCourtName?: string                                     // unreported only, exactly as it appears on the decision, eg 'Court of Justice of the European Union'

  // European Court of Human Rights (r 14.3.2) — four formats, nested under euEchrFormat. Reuses
  // `title` (Complainant v Respondent State), `year`, `volume`, `startingPage`, `date`, `pinpoint`.
  // Ser A (pre-1996) pinpoints and unreported/CJEU-style paragraph pinpoints are bare-space (no
  // comma) — confirmed against 'Nasri v France (1995) 320-B Eur Court HR (ser A) 28 (Judge
  // Pettiti).' and 'S v United Kingdom (... 4 December 2008) [125].' — while year-organised
  // (1996+) and Commission pinpoints ARE comma-prefixed, eg 'Boujlifa v France [1997] VI Eur Court
  // HR 2250, 2264.'; the shared `judge` field (already used the same way by foreign-domestic.ts)
  // covers the optional trailing '(Judge X)' ser A shows.
  euEchrFormat?: EUEchrFormat
  euPhase?: string                                         // eg 'Preliminary Objections', 'Just Satisfaction' — italicised, in parentheses after the parties' names, where a case has multiple reported phases
  euChamber?: string                                       // unreported only, eg 'Grand Chamber' or 'Chamber'
  euApplicationNumber?: string                             // unreported only — the FULL 'No 30562/04' or 'Nos 30562/04 and 30566/04' text (pre-formatted, like treatySeries elsewhere) — the formatter just prepends 'Application '
  euDocumentTitle?: string                                 // pleadings (ser B) only — the specific document's own title, quoted (not italicised), before the case name

  // European Commission of Human Rights (r 14.3.3) — one format, entirely reused fields: `title`
  // (Complainant v Respondent State), `year`, `volume`, `startingPage`, `pinpoint`. No dedicated
  // fields of its own.

  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export type EUCategory =
  | 'officialJournal'
  | 'constitutiveTreaty'
  | 'court'
  | 'councilOfEuropeBasicDocument'
  | 'europeanCourtOfHumanRights'
  | 'europeanCommissionOfHumanRights'

// 'L' (legislative acts) and 'C' (information/notices) are the two everyday series; 'LI'/'CI'/'CA'
// are subseries introduced in 2016; 'S' (invitations to tender) never has a starting page at all.
export type OJSeries = 'L' | 'C' | 'LI' | 'CI' | 'CA' | 'S'

export type EUEchrFormat = 'reportedSeriesA' | 'reportedYearOrganised' | 'unreported' | 'pleadings'

// AGLC4 ch 7 ('Other Sources') actually covers many more categories than this — Reports (r 7.1)
// and Research Papers/Theses (r 7.2) already have their own independent SourceTypes in this app
// (report/researchPaper, both older than this one) — this bundles the seven remaining ch 7
// categories the user specifically asked for under one badge-driven tab, the same "one interface,
// discriminant field, subtype-specific optional fields" shape as OtherLegislativeMaterialFields
// and InternationalMaterialFields above. Every field/rule below was read directly from the AGLC4
// guide PDF (chapter 7), not from memory — see other-sources.ts for the worked citations these
// were checked against.
export type OtherSourcesSubtype = 'dictionary' | 'legalEncyclopedia' | 'speech' | 'pressRelease' | 'abs' | 'filmOrMedia' | 'socialMedia'

// Only changes small wording conventions within the one shared Film/TV/Other Media shape (see
// other-sources.ts) — not a structural fork the way eg Foreign Domestic Sources' countries are.
export type FilmMediaFormat = 'film' | 'tvSeries' | 'radioOrPodcast'

export interface OtherSourcesFields {
  subtype: OtherSourcesSubtype

  // Dictionaries (r 7.6) — hard copy: [Dictionary Title] (Edition ed, Year) 'Entry' (def N).
  // Online: [Dictionary Title] (online at RetrievalDate) 'Entry' (def N). Which form applies is
  // decided by which of dictionaryYear/dictionaryRetrievalDate is populated, not a separate toggle.
  dictionaryTitle?: string
  dictionaryEdition?: string          // hard copy only — full string incl suffix, eg '5th ed' (r 7.6 defers to r 6.3.2, same convention as BookFields.edition)
  dictionaryYear?: string             // hard copy only
  dictionaryRetrievalDate?: string    // online only, eg '20 February 2018'
  dictionaryEntryTitle?: string       // the word/phrase defined, eg 'demise' — quoted, never italicised
  dictionaryEntryAbbrev?: string      // eg 'v2', 'n1', 'adj' — only when a dictionary has multiple entries for the same word
  dictionaryDefNumber?: string        // eg '4' or '2b' — the formatter adds the 'def ' prefix

  // Legal Encyclopedias (r 7.7) — hard copy: Publisher, [Encyclopedia Title], vol N (at Date)
  // TitleNumber Name of Title, 'ChapterNumber Name of Chapter' [Paragraph]. Online: Publisher,
  // [Encyclopedia Title] (online at RetrievalDate) TitleNumber Name of Title, 'ChapterNumber Name
  // of Chapter' [Paragraph]. Which form applies is decided by which of encyclopediaVolume/
  // encyclopediaRetrievalDate is populated.
  encyclopediaPublisher?: string
  encyclopediaTitle?: string
  encyclopediaVolume?: string         // hard copy only, eg '15' — the formatter adds the 'vol ' prefix
  encyclopediaAtDate?: string         // hard copy only — the cited volume's own currency date
  encyclopediaRetrievalDate?: string  // online only
  encyclopediaTitleNumber?: string    // eg '235', '2' — some encyclopedias (eg Halsbury's Laws of England) don't number titles at all; leave blank
  encyclopediaTitleName?: string      // eg 'Insurance', 'Administrative Law'
  encyclopediaChapterNumber?: string  // eg '2', '2.3'
  encyclopediaChapterName?: string    // eg 'General Principles'
  encyclopediaParagraph?: string      // the bracketed pinpoint, eg '235-270' — a required structural element of this citation, not the optional shared `pinpoint` below

  // Speeches (r 7.3) — Author, 'Title' (Speech, Institution/Forum, Full Date) Pinpoint.
  speechAuthor?: string
  speechTitle?: string
  speechLabel?: string    // 'Speech' (default) or a named lecture series, with any leading 'The' and ordinal number already stripped, eg 'Lucinda Lecture' not 'The 2013 Lucinda Lecture'
  speechForum?: string    // institution/forum, or — only if no forum is named — the city/town where delivered
  speechDate?: string

  // Press and Media Releases (r 7.4) — Author, 'Title' (ReleaseType DocumentNumber, Body, Full
  // Date) Pinpoint. Body is omitted whenever it's identical to the author.
  pressReleaseAuthor?: string
  pressReleaseTitle?: string
  pressReleaseType?: string           // as it appears on the source, eg 'Media Release' (default), 'Press Release', 'Press Statement'
  pressReleaseDocumentNumber?: string
  pressReleaseBody?: string
  pressReleaseDate?: string

  // Australian Bureau of Statistics Materials (r 7.1.5) — Australian Bureau of Statistics, [Title]
  // (Catalogue No N, Full Date) Pinpoint. Author is always the literal fixed string 'Australian
  // Bureau of Statistics', not a student-entered field — see other-sources.ts.
  absTitle?: string
  absCatalogueNumber?: string         // eg '4512.0' — the formatter adds the 'Catalogue No ' prefix
  absDate?: string

  // Film, Television and Other Media (r 7.14) — ['Episode Title', ][Film/Series Title] (Version
  // Details, Studio/Production Company/Producer, Date) Pinpoint <URL>. One flattened shape covers
  // all three sub-rules; mediaFormat only changes wording conventions, not the overall structure.
  mediaFormat?: FilmMediaFormat
  mediaEpisodeTitle?: string   // omit entirely for a film (r 7.14.2); for TV type the literal AGLC4-prescribed text directly, eg 'Season 9, Episode 10' or 'Episode 10' (r 7.14.3) when there's no real episode title; for radio/podcasts, the episode's own title exactly as on the source (r 7.14.4)
  mediaTitle?: string          // the film/series title
  mediaVersionDetails?: string // only when citing a non-standard version, eg 'Director's Cut' — omit for the standard/theatrical version
  mediaStudio?: string         // studio/production company/producer — for a podcast, omit if identical to the series title
  mediaDate?: string           // a bare year for film/TV; a full date for radio/podcasts (r 7.14.4)
  mediaUrl?: string            // optional (r 7.14.1: 'may be included')

  // Social Media Posts (r 7.16) — Username[ (Real Name)][, 'Title'] (Platform, Full Date[, Time][
  // TimeZone]) Pinpoint <URL>.
  socialMediaUsername?: string
  socialMediaRealName?: string  // only if not already clear from the username
  socialMediaTitle?: string     // omit entirely if the post has no title of its own
  socialMediaPlatform?: string  // eg 'Twitter', 'Instagram', 'YouTube'
  socialMediaDate?: string
  socialMediaTime?: string      // only needed to disambiguate multiple same-day posts
  socialMediaTimeZone?: string  // eg 'AEDT' — only if the platform adjusts the displayed time to the viewer's local time zone
  socialMediaUrl?: string

  // Shared by every subtype above except Legal Encyclopedias, which structurally requires its own
  // bracketed Paragraph pinpoint (encyclopediaParagraph) instead — a bare pinpoint with no comma
  // before it, matching a report/whole-book/research-paper pinpoint; for Film/Social Media this is
  // always a point in time or time span (r 1.11.3-1.11.4), never a page number.
  pinpoint?: string
  footnoteNumber?: string
  shortTitle?: string
}

export interface CitationResult {
  footnote: string
  subsequent: string
  bibliography: string
  sourceType: SourceType
  // 'unvalidated' covers two genuinely different situations that look the same to a caller: the
  // AI check hasn't run yet, and the AI check was attempted but failed (no API key, network error,
  // rate limit, model refusal — see the try/catch in generate.ts). Both cases correctly mean "no
  // AI opinion exists", so they share one status rather than needing a fourth value.
  validationStatus: 'unvalidated' | 'validated' | 'corrected'
  // The AI validator's own self-reported confidence in its isCorrect/corrected* verdict — only
  // set alongside 'validated'/'corrected' (never 'unvalidated', since no verdict exists to be
  // confident about). Surfaced in CitationOutput.tsx so a 'validated' badge doesn't overstate a
  // low-confidence pass as flatly as a high-confidence one.
  confidence?: 'high' | 'medium' | 'low'
  // Deterministic, non-AI notices about the *fields themselves* rather than the formatted text —
  // a core AGLC4 element left blank (see warnings.ts's getMissingFieldsWarning; deliberately never
  // a pinpoint, which is optional by nature), or a substantive citation-practice reminder (see
  // getUnreportedCaseWarning). Populated in generateCitationSync itself, so — unlike
  // validationStatus/confidence — these are always present the instant a citation is generated,
  // with no dependency on the AI validation call succeeding, being fast, or even being reachable.
  warnings?: string[]
}

export type CitationFields =
  | CaseFields
  | LegislationFields
  | JournalFields
  | BookFields
  | ReportFields
  | ResearchPaperFields
  | WebsiteFields
  | NewspaperFields
  | OtherLegislativeMaterialFields
  | InternationalMaterialFields
  | OtherSourcesFields
