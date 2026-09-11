import {
  BookFields,
  CaseFields,
  CitationFields,
  InternationalMaterialFields,
  JournalFields,
  LegislationFields,
  NewspaperFields,
  OtherLegislativeMaterialFields,
  OtherSourcesFields,
  ReportFields,
  ResearchPaperFields,
  SourceType,
  WebsiteFields,
} from './types'
import { isUnitedNationsCharter } from './utils'

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0
}

function hasAny(values: (string | undefined)[] | undefined): boolean {
  return !!values && values.some((v) => !isBlank(v))
}

// One "missing" checker per source type, each returning the human-readable label of every core
// AGLC4 element left blank — deliberately never a pinpoint (page/paragraph reference, URL-only
// exceptions aside), since a pinpoint is something a student adds when they have a specific point
// to reference, never a default expectation of the citation itself; flagging its absence would be
// actively wrong, not helpful. "Core" here means: genuinely a fixed element of the AGLC4 form for
// this source type/branch, not a field the rule text (or, for the harder cases, validator.ts's own
// hand-verified guidance) already treats as commonly and legitimately absent.

function missingCaseFields(f: CaseFields): string[] {
  const missing: string[] = []
  if (isBlank(f.caseName)) missing.push('Case name')
  if (isBlank(f.year)) missing.push('Year')
  if (f.reportType === 'reported') {
    if (isBlank(f.volume)) missing.push('Volume')
    if (isBlank(f.reportAbbreviation)) missing.push('Law report abbreviation')
    if (isBlank(f.startingPage)) missing.push('Starting page')
  } else if (f.reportType === 'unreported-mnc') {
    if (isBlank(f.courtCode)) missing.push('Court code')
    if (isBlank(f.caseNumber)) missing.push('Case number')
  } else {
    // unreported-no-mnc — AGLC4 r 2.3.2's own form is '(Court, Judge(s), Full Date)', so unlike
    // the other two branches (where CaseForm.tsx itself marks Judge optional), Judge is a core
    // element of this specific form, not a free-standing addition.
    if (isBlank(f.court)) missing.push('Court')
    if (isBlank(f.judge)) missing.push('Judge')
    if (isBlank(f.date)) missing.push('Date')
  }
  return missing
}

function missingLegislationFields(f: LegislationFields): string[] {
  const missing: string[] = []
  if (isBlank(f.actTitle)) missing.push('Act title')
  // 'none' jurisdiction means the bare Commonwealth 'Australian Constitution' (see
  // LegislationForm.tsx's own dropdown label) — AGLC4 r 3.6 gives it no year or jurisdiction
  // bracket at all, by design, so neither is "missing" there. Every other Act needs both.
  if (f.jurisdiction !== 'none') {
    // 'unknown' is the deliberate "not selected / autofill couldn't tell" state (see types.ts) —
    // never silently defaulted, so it's flagged here instead. A real code ('Cth' etc) is fine.
    if (f.jurisdiction === 'unknown') missing.push('Jurisdiction')
    if (isBlank(f.year)) missing.push('Year')
  }
  return missing
}

function missingJournalFields(f: JournalFields): string[] {
  const missing: string[] = []
  if (!hasAny(f.authors)) missing.push('Authors')
  if (isBlank(f.articleTitle)) missing.push('Article title')
  if (isBlank(f.year)) missing.push('Year')
  if (isBlank(f.journalName)) missing.push('Journal name')
  if (isBlank(f.startingPage)) missing.push('Starting page')
  // volume/issue are both genuinely optional — a year-organised journal has no volume, and not
  // every journal numbers issues at all.
  return missing
}

function missingBookFields(f: BookFields): string[] {
  const missing: string[] = []
  if (f.bookType === 'book') {
    if (isBlank(f.title)) missing.push('Title')
    if (isBlank(f.publisher)) missing.push('Publisher')
    if (isBlank(f.year)) missing.push('Year')
    // authors optional (an institutional/anonymous work); edition optional (first edition, the
    // default, states none at all).
  } else {
    if (!hasAny(f.chapterAuthors)) missing.push('Chapter authors')
    if (isBlank(f.chapterTitle)) missing.push('Chapter title')
    if (!hasAny(f.editors)) missing.push('Editors')
    if (isBlank(f.title)) missing.push('Book title')
    if (isBlank(f.publisher)) missing.push('Publisher')
    if (isBlank(f.year)) missing.push('Year')
    if (isBlank(f.startingPage)) missing.push('Starting page')
  }
  return missing
}

function missingReportFields(f: ReportFields): string[] {
  const missing: string[] = []
  if (isBlank(f.title)) missing.push('Title')
  if (isBlank(f.documentType)) missing.push('Document type')
  if (isBlank(f.date)) missing.push('Date')
  // authors deliberately not checked — r 7.1 itself has the author omitted (no leading comma
  // either) whenever a report isn't prominently attributed to anyone, which is the common case for
  // institutional reports; seriesNumber/url are both genuinely optional.
  return missing
}

function missingResearchPaperFields(f: ResearchPaperFields): string[] {
  const missing: string[] = []
  if (isBlank(f.title)) missing.push('Title')
  if (isBlank(f.documentType)) missing.push('Document type')
  if (isBlank(f.institution)) missing.push('Institution')
  if (isBlank(f.date)) missing.push('Date')
  return missing
}

function missingWebsiteFields(f: WebsiteFields): string[] {
  const missing: string[] = []
  if (isBlank(f.documentTitle)) missing.push('Document title')
  if (isBlank(f.websiteName)) missing.push('Website name')
  if (isBlank(f.url)) missing.push('URL')
  // authors optional (omitted when not indicated, or identical to the website name); date
  // optional — r 7.15 itself allows omitting it when unavailable.
  return missing
}

function missingNewspaperFields(f: NewspaperFields): string[] {
  const missing: string[] = []
  if (isBlank(f.articleTitle)) missing.push('Article title')
  if (isBlank(f.newspaperName)) missing.push('Newspaper name')
  if (isBlank(f.date)) missing.push('Date')
  if (isBlank(f.url)) missing.push('URL')
  // authors deliberately not checked — an unbylined wire-service report is a normal, correctly-
  // empty case, not a gap.
  return missing
}

function missingOtherLegislativeMaterialFields(f: OtherLegislativeMaterialFields): string[] {
  const missing: string[] = []
  switch (f.subtype) {
    case 'bill':
      if (isBlank(f.billTitle)) missing.push('Bill title')
      if (isBlank(f.billYear)) missing.push('Year')
      break
    case 'explanatoryMaterial':
      if (isBlank(f.billTitle)) missing.push('Bill title')
      if (isBlank(f.billYear)) missing.push('Year')
      if (isBlank(f.explanatoryLabel)) missing.push('Label')
      break
    case 'gazette':
      // gazetteAuthor/gazetteArticleTitle are correctly both-or-neither (a whole-gazette-issue
      // citation has neither) — never flagged individually.
      if (isBlank(f.gazetteJurisdiction)) missing.push('Jurisdiction')
      if (isBlank(f.gazetteName)) missing.push('Gazette name')
      if (isBlank(f.gazetteNumber)) missing.push('Gazette number')
      if (isBlank(f.gazetteDate)) missing.push('Date')
      break
    case 'practiceDirection':
      if (isBlank(f.court)) missing.push('Court')
      if (isBlank(f.practiceType)) missing.push('Type')
      if (isBlank(f.practiceNumber)) missing.push('Number')
      if (isBlank(f.practiceTitle)) missing.push('Title')
      if (isBlank(f.practiceDate)) missing.push('Date')
      break
    case 'constitution':
      if (isBlank(f.constitutionTitle)) missing.push('Title')
      // constitutionYear is genuinely optional — the bare Commonwealth Constitution has none at
      // all, by design, not by omission.
      break
  }
  return missing
}

// Only the two subtypes with a small, well-defined field set are covered here — Foreign Domestic
// Sources (8 countries × up to 5 categories each) and European/Council of Europe Materials (6
// categories) branch into far more combinations than can be modelled with confidence in one pass;
// a wrong "required" guess there would produce a false warning, which is worse than no warning at
// all. Left for a dedicated follow-up if wanted, not attempted half-correctly here.
function missingInternationalMaterialFields(f: InternationalMaterialFields): string[] {
  const missing: string[] = []
  if (f.subtype === 'treaty') {
    if (isBlank(f.title)) missing.push('Treaty title')
    if (f.treatyType === 'bilateral' || f.treatyType === 'trilateral') {
      if (isBlank(f.signedDate)) missing.push('Signed date')
    } else if (isBlank(f.openedForSignature)) {
      missing.push('Opened for signature')
    }
    // treatySeries deliberately not checked — validator.ts's own hand-verified AGLC4 guidance:
    // a treaty's own primary text routinely predates UN registration, so this is frequently and
    // legitimately unavailable, not an error when blank.
  } else if (f.subtype === 'unDocument') {
    if (isBlank(f.title)) missing.push('Title')
    // The Charter of the United Nations is cited by bare title alone (r 9.2.4's own commentary)
    // — every other field, date included, is correctly empty for it, not missing.
    if (!isUnitedNationsCharter(f.title ?? '') && isBlank(f.date)) missing.push('Date')
    // resolutionNumber/session/unDocSymbol/adoptedDate deliberately not checked — same reasoning,
    // per validator.ts: "frequently not all available from a general-audience source... not
    // itself an error".
  }
  return missing
}

function missingOtherSourcesFields(f: OtherSourcesFields): string[] {
  const missing: string[] = []
  switch (f.subtype) {
    case 'dictionary':
      if (isBlank(f.dictionaryTitle)) missing.push('Dictionary title')
      if (isBlank(f.dictionaryEntryTitle)) missing.push('Entry')
      // Exactly one of these two "modes" is needed, not both — hard copy (edition/year) or
      // online (retrieval date).
      if (isBlank(f.dictionaryYear) && isBlank(f.dictionaryRetrievalDate)) {
        missing.push('Edition/year (hard copy) or retrieval date (online)')
      }
      break
    case 'legalEncyclopedia':
      if (isBlank(f.encyclopediaPublisher)) missing.push('Publisher')
      if (isBlank(f.encyclopediaTitle)) missing.push('Encyclopedia title')
      if (isBlank(f.encyclopediaTitleName)) missing.push('Title name')
      if (isBlank(f.encyclopediaChapterName)) missing.push('Chapter name')
      // The bracketed paragraph is a required structural element of this citation (see types.ts),
      // not the optional free-standing pinpoint every other subtype uses — checked accordingly.
      if (isBlank(f.encyclopediaParagraph)) missing.push('Paragraph')
      if (isBlank(f.encyclopediaAtDate) && isBlank(f.encyclopediaRetrievalDate)) {
        missing.push('At date (hard copy) or retrieval date (online)')
      }
      break
    case 'speech':
      if (isBlank(f.speechAuthor)) missing.push('Author')
      if (isBlank(f.speechTitle)) missing.push('Title')
      if (isBlank(f.speechForum)) missing.push('Institution / forum')
      if (isBlank(f.speechDate)) missing.push('Date')
      break
    case 'pressRelease':
      if (isBlank(f.pressReleaseAuthor)) missing.push('Author')
      if (isBlank(f.pressReleaseTitle)) missing.push('Title')
      if (isBlank(f.pressReleaseDate)) missing.push('Date')
      break
    case 'abs':
      if (isBlank(f.absTitle)) missing.push('Title')
      if (isBlank(f.absCatalogueNumber)) missing.push('Catalogue number')
      if (isBlank(f.absDate)) missing.push('Date')
      break
    case 'filmOrMedia':
      if (isBlank(f.mediaTitle)) missing.push('Film / series title')
      if (isBlank(f.mediaStudio)) missing.push('Studio / production company / producer')
      if (isBlank(f.mediaDate)) missing.push('Date')
      break
    case 'socialMedia':
      if (isBlank(f.socialMediaUsername)) missing.push('Username')
      if (isBlank(f.socialMediaPlatform)) missing.push('Platform')
      if (isBlank(f.socialMediaDate)) missing.push('Date')
      break
  }
  return missing
}

function formatMissingFieldsMessage(missing: string[]): string {
  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`
  const plural = missing.length > 1
  return `Missing from this citation: ${list}. Check whether ${plural ? 'these are' : "it's"} available from your source and add ${plural ? 'them' : 'it'} in.`
}

/**
 * Deterministic, field-level check for a core AGLC4 element left blank — distinct from (and not
 * dependent on) the AI validator, which only ever looks at the already-*formatted* citation text.
 * Never flags a pinpoint (see each per-type checker's own comments for why) or a field AGLC4/this
 * app's own validator guidance already treats as commonly and legitimately absent. Returns
 * undefined when nothing's missing, or the relevant subtype isn't covered yet (see
 * missingInternationalMaterialFields's own comment).
 */
export function getMissingFieldsWarning(sourceType: SourceType, fields: CitationFields): string | undefined {
  const missing = (() => {
    switch (sourceType) {
      case 'case':
        return missingCaseFields(fields as CaseFields)
      case 'legislation':
        return missingLegislationFields(fields as LegislationFields)
      case 'journal':
        return missingJournalFields(fields as JournalFields)
      case 'book':
        return missingBookFields(fields as BookFields)
      case 'report':
        return missingReportFields(fields as ReportFields)
      case 'researchPaper':
        return missingResearchPaperFields(fields as ResearchPaperFields)
      case 'website':
        return missingWebsiteFields(fields as WebsiteFields)
      case 'newspaper':
        return missingNewspaperFields(fields as NewspaperFields)
      case 'otherLegislativeMaterial':
        return missingOtherLegislativeMaterialFields(fields as OtherLegislativeMaterialFields)
      case 'internationalMaterial':
        return missingInternationalMaterialFields(fields as InternationalMaterialFields)
      case 'otherSources':
        return missingOtherSourcesFields(fields as OtherSourcesFields)
      default:
        return []
    }
  })()

  return missing.length > 0 ? formatMissingFieldsMessage(missing) : undefined
}

/**
 * A citation to an unreported case is exactly what a reported one exists to replace where
 * possible — AGLC4 r 2.2's own reported form is the preferred citation whenever an authorised
 * series (CLR, FCR, VR, and the like) has actually published the case; the unreported medium-
 * neutral (r 2.3.1) and no-medium-neutral (r 2.3.2) forms exist for cases that haven't been
 * reported at all, not as a shortcut around checking. Purely a reminder, not a field-completeness
 * check — fires regardless of whether the unreported citation is itself otherwise complete.
 */
export function getUnreportedCaseWarning(sourceType: SourceType, fields: CitationFields): string | undefined {
  if (sourceType !== 'case') return undefined
  const { reportType } = fields as CaseFields
  if (reportType === 'reported') return undefined
  return 'This is an unreported citation. Where the case has been published in an authorised report series (eg CLR, FCR, VR), AGLC4 prefers citing that reported version instead (r 2.2) — check whether one is available before relying on this form.'
}

/**
 * AGLC4 r 7.2: a conference/proceedings paper is cited with the FULL date of the conference (eg
 * '3–10 March 2021'), not just its year. Autofill frequently can't recover this — CrossRef's own
 * event metadata often carries only the conference name and year (confirmed on the ACM FAccT '21
 * proceedings), and the publisher's own page is often bot-blocked — so when the date has come
 * back as a bare year, remind the student to fill in the conference's actual dates by hand. Only
 * fires for a year-only date, not a blank one (that's already covered by the missing-fields
 * check), and not once a full date is present.
 */
export function getConferencePaperDateWarning(sourceType: SourceType, fields: CitationFields): string | undefined {
  if (sourceType !== 'researchPaper') return undefined
  const f = fields as ResearchPaperFields
  if (!/conference|proceedings/i.test(f.documentType ?? '')) return undefined
  if (!/^\s*\d{4}\s*$/.test(f.date ?? '')) return undefined
  return 'AGLC4 r 7.2 cites a conference paper with the full date of the conference (eg 3–10 March 2021), not just the year. Autofill often can only recover the year — check the conference’s actual dates and add them to the Date field.'
}
