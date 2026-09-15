'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { generateCitationSync } from '@/lib/citation-engine'
import { otherLegislativeMaterialBadge } from '@/lib/citation-engine/other-legislative-material'
import { internationalMaterialBadge } from '@/lib/citation-engine/international-material'
import { foreignDomesticRuleLabel } from '@/lib/citation-engine/foreign-domestic'
import { europeanMaterialsRuleLabel } from '@/lib/citation-engine/european-materials'
import { otherSourcesBadge } from '@/lib/citation-engine/other-sources'
import { validateCitationAction } from '@/app/actions'
import { mapFieldsAcrossSourceType } from '@/lib/autofill/cross-type-map'
import { changedKeys, mergeAutofillFields } from '@/lib/autofill/merge'
import { AutofillFields, AutofillResult } from '@/lib/autofill/types'
import { SOURCE_TYPE_LABELS } from '@/lib/library-types'
import {
  BookFields,
  CaseFields,
  CitationFields,
  CitationResult,
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
} from '@/lib/citation-engine/types'
import AutofillBar from './AutofillBar'
import SaveToLibraryButton from './SaveToLibraryButton'
import SourceTypeSelector from './SourceTypeSelector'
import CaseForm from './CaseForm'
import LegislationForm from './LegislationForm'
import JournalForm from './JournalForm'
import BookForm from './BookForm'
import ReportForm from './ReportForm'
import ResearchPaperForm from './ResearchPaperForm'
import WebsiteForm from './WebsiteForm'
import NewspaperForm from './NewspaperForm'
import OtherLegislativeMaterialForm from './OtherLegislativeMaterialForm'
import InternationalMaterialForm from './InternationalMaterialForm'
import OtherSourcesForm from './OtherSourcesForm'
import CitationOutput from './CitationOutput'

const DEFAULT_CASE_FIELDS: CaseFields = {
  caseName: 'Mabo v Queensland [No 2]',
  reportType: 'reported',
  year: '1992',
  volume: '175',
  reportAbbreviation: 'CLR',
  startingPage: '1',
  pinpoint: '29',
  pinpointType: 'page',
  judge: 'Brennan J',
}

const DEFAULT_LEGISLATION_FIELDS: LegislationFields = {
  actTitle: 'Privacy Act',
  year: '1988',
  jurisdiction: 'Cth',
  pinpointType: 's',
  pinpointValue: '13',
}

const DEFAULT_JOURNAL_FIELDS: JournalFields = {
  authors: ['RJ Ellicott'],
  articleTitle: 'The Autochthonous Expedient and the Federal Court',
  year: '2008',
  volume: '82',
  issue: '10',
  journalName: 'Australian Law Journal',
  startingPage: '700',
}

const DEFAULT_BOOK_FIELDS: BookFields = {
  bookType: 'book',
  authors: ['Catharine MacMillan'],
  title: 'Mistakes in Contract Law',
  publisher: 'Hart Publishing',
  year: '2010',
  pinpoint: '9',
}

const DEFAULT_REPORT_FIELDS: ReportFields = {
  authors: ['Australian Law Reform Commission'],
  title: 'Traditional Rights and Freedoms',
  documentType: 'Report',
  seriesNumber: 'Report No 129',
  date: 'December 2015',
  pinpoint: '45',
}

const DEFAULT_RESEARCH_PAPER_FIELDS: ResearchPaperFields = {
  authors: ['Henry Fraser', 'Aaron J Snoswell'],
  title: 'AI Opacity and Explainability in Tort Litigation',
  documentType: 'Conference Paper',
  institution: '2022 ACM Conference on Fairness, Accountability, and Transparency (FAccT ’22)',
  date: '21 June 2022',
}

const DEFAULT_WEBSITE_FIELDS: WebsiteFields = {
  authors: ['James Edelman'],
  documentTitle: 'High Court of Australia',
  websiteName: 'High Court of Australia',
  documentType: 'Web Page',
  url: 'http://www.hcourt.gov.au/justices/current/justice-james-edelman',
}

const DEFAULT_NEWSPAPER_FIELDS: NewspaperFields = {
  authors: ['Isobel Roe', 'Jamie McKinnell'],
  articleTitle: 'Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault',
  newspaperName: 'ABC News',
  date: '17 August 2026',
  url: 'https://www.abc.net.au/news/2026-08-17/alan-jones-complainant-c-ray-hadley-peter-fitzsimons/107045376',
}

const DEFAULT_OTHER_LEGISLATIVE_MATERIAL_FIELDS: OtherLegislativeMaterialFields = {
  subtype: 'bill',
  billTitle: 'Corporations Amendment (Crowd-Sourced Funding) Bill',
  billYear: '2015',
  billJurisdiction: 'Cth',
}

const DEFAULT_INTERNATIONAL_MATERIAL_FIELDS: InternationalMaterialFields = {
  subtype: 'treaty',
  title: 'International Covenant on Economic, Social and Cultural Rights',
  treatyType: 'multilateral',
  openedForSignature: '16 December 1966',
  treatySeries: '993 UNTS 3',
  enteredIntoForce: '3 January 1976',
}

const DEFAULT_OTHER_SOURCES_FIELDS: OtherSourcesFields = {
  subtype: 'dictionary',
  dictionaryTitle: 'Macquarie Dictionary',
  dictionaryEdition: '5th ed',
  dictionaryYear: '2009',
  dictionaryEntryTitle: 'demise',
  dictionaryDefNumber: '4',
}

// Truly-empty templates, distinct from the DEFAULT_* demo data above. Every autofill rebuilds
// a source type's fields from one of these rather than patching the current object in place, so
// that fields left over from a *previous, different* autofill (or the pre-filled demo values)
// don't linger when the new result doesn't address them — see mergeAutofillFields.
const BLANK_CASE_FIELDS: CaseFields = { caseName: '', reportType: 'reported', year: '' }
const BLANK_LEGISLATION_FIELDS: LegislationFields = { actTitle: '', year: '', jurisdiction: 'unknown' }
const BLANK_JOURNAL_FIELDS: JournalFields = {
  authors: [''],
  articleTitle: '',
  year: '',
  journalName: '',
  startingPage: '',
}
const BLANK_BOOK_FIELDS: BookFields = { bookType: 'book', title: '', publisher: '', year: '' }
const BLANK_REPORT_FIELDS: ReportFields = { title: '', documentType: 'Report', date: '' }
const BLANK_RESEARCH_PAPER_FIELDS: ResearchPaperFields = {
  title: '',
  documentType: 'Conference Paper',
  institution: '',
  date: '',
}
const BLANK_WEBSITE_FIELDS: WebsiteFields = { documentTitle: '', websiteName: '', documentType: 'Web Page', url: '' }
const BLANK_NEWSPAPER_FIELDS: NewspaperFields = { articleTitle: '', newspaperName: '', date: '', url: '' }
const BLANK_OTHER_LEGISLATIVE_MATERIAL_FIELDS: OtherLegislativeMaterialFields = { subtype: 'bill' }
const BLANK_INTERNATIONAL_MATERIAL_FIELDS: InternationalMaterialFields = { subtype: 'treaty' }
const BLANK_OTHER_SOURCES_FIELDS: OtherSourcesFields = { subtype: 'dictionary' }

const CASE_RULES: Record<CaseFields['reportType'], { footnote: string; subsequent: string; bibliography: string }> = {
  reported: { footnote: 'AGLC4 r 2.2', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 2.2' },
  'unreported-mnc': { footnote: 'AGLC4 r 2.3.1', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 2.3.1' },
  'unreported-no-mnc': { footnote: 'AGLC4 r 2.3.2', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 2.3.2' },
}

const LEGISLATION_RULES = { footnote: 'AGLC4 r 3.1', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 3.1' }
const JOURNAL_RULES = { footnote: 'AGLC4 r 5.1–5.7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 5.1–5.7' }
const BOOK_RULES: Record<BookFields['bookType'], { footnote: string; subsequent: string; bibliography: string }> = {
  book: { footnote: 'AGLC4 r 6.1–6.4', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 6.1–6.4' },
  chapter: { footnote: 'AGLC4 r 6.6.1', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 6.6.1' },
}
const REPORT_RULES = { footnote: 'AGLC4 r 7.1.1', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.1.1' }
const RESEARCH_PAPER_RULES = { footnote: 'AGLC4 ch 7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 ch 7' }
const WEBSITE_RULES = { footnote: 'AGLC4 r 7.15', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.15' }
const NEWSPAPER_RULES = { footnote: 'AGLC4 r 7.11.2', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.11.2' }
const OTHER_LEGISLATIVE_MATERIAL_RULES: Record<
  OtherLegislativeMaterialFields['subtype'],
  { footnote: string; subsequent: string; bibliography: string }
> = {
  bill: { footnote: 'AGLC4 r 3.2', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 3.2' },
  explanatoryMaterial: { footnote: 'AGLC4 r 3.7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 3.7' },
  gazette: { footnote: 'AGLC4 r 3.9.1', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 3.9.1' },
  practiceDirection: { footnote: 'AGLC4 ch 3', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 ch 3' },
  constitution: { footnote: 'AGLC4 r 3.6', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 3.6' },
}
const INTERNATIONAL_MATERIAL_RULES: Record<
  Exclude<InternationalMaterialFields['subtype'], 'foreignDomestic' | 'europeanUnion'>,
  { footnote: string; subsequent: string; bibliography: string }
> = {
  treaty: { footnote: 'AGLC4 r 8.1–8.7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 8.1–8.7' },
  unDocument: { footnote: 'AGLC4 r 9.2.4', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 9.2.4' },
}
const OTHER_SOURCES_RULES: Record<
  OtherSourcesFields['subtype'],
  { footnote: string; subsequent: string; bibliography: string }
> = {
  dictionary: { footnote: 'AGLC4 r 7.6', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.6' },
  legalEncyclopedia: { footnote: 'AGLC4 r 7.7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.7' },
  speech: { footnote: 'AGLC4 r 7.3', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.3' },
  pressRelease: { footnote: 'AGLC4 r 7.4', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.4' },
  abs: { footnote: 'AGLC4 r 7.1.5', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.1.5' },
  filmOrMedia: { footnote: 'AGLC4 r 7.14', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.14' },
  socialMedia: { footnote: 'AGLC4 r 7.16', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 7.16' },
}

const VALIDATION_DEBOUNCE_MS = 800

const ALL_SOURCE_TYPES: SourceType[] = [
  'case',
  'legislation',
  'journal',
  'book',
  'report',
  'researchPaper',
  'website',
  'newspaper',
  'otherLegislativeMaterial',
  'internationalMaterial',
  'otherSources',
]

// Pinpoint fields identify a spot within *this particular* citation (a page, a section) rather
// than describing the source itself, so — unlike every other field — they must never carry over
// from whatever the student was citing last time a fresh autofill starts a new citation.
const PINPOINT_KEYS: Record<SourceType, readonly string[]> = {
  case: ['pinpoint', 'pinpointType'],
  legislation: ['pinpointType', 'pinpointValue'],
  journal: ['pinpoint'],
  book: ['pinpoint'],
  report: ['pinpoint'],
  researchPaper: ['pinpoint'],
  website: ['pinpoint'],
  newspaper: ['pinpoint'],
  otherLegislativeMaterial: ['pinpoint', 'constitutionPinpointType', 'constitutionPinpointValue'],
  internationalMaterial: ['pinpoint'],
  // Legal Encyclopedia's own structural pinpoint (encyclopediaParagraph) is a required part of the
  // citation itself, not a free-standing "where in this source" pinpoint like the shared `pinpoint`
  // field every other subtype here uses — see types.ts — so it's included here too.
  otherSources: ['pinpoint', 'encyclopediaParagraph'],
}

// Like pinpoint fields, these classify *what kind* of source this is rather than describing the
// source's own content — every fresh autofill should reflect that classification anew (a book
// autofill always defaults to a whole book, per mapFieldsToSourceType), even if the student
// manually switched the selector for whatever they were previously citing. Without this, a
// student who switches one book to "Book chapter" then uploads a second, unrelated book PDF
// would see it stuck on "Book chapter" too, since selecting the option marks `bookType` touched
// the same as typing into any other field.
const CLASSIFICATION_KEYS: Partial<Record<SourceType, readonly string[]>> = {
  book: ['bookType'],
  // jurisdiction isn't a "what kind of source" classifier like the others here, but it needs the
  // same never-carried-over treatment: a wrong jurisdiction is a serious, silent citation error,
  // so a fresh autofill must always reflect the new Act's own jurisdiction (or 'unknown' when it
  // can't be determined — see LegislationFields), never keep whatever the student picked for a
  // previous, unrelated citation.
  legislation: ['jurisdiction'],
  otherLegislativeMaterial: ['subtype'],
  // foreignCountry/foreignCategory are a second-level classification nested inside the
  // 'foreignDomestic' subtype (see ForeignDomesticForm.tsx); foreignCaseReportType is a
  // third-level classification nested inside foreignCategory === 'case' (reported vs either
  // unreported form); euCategory is the second-level equivalent for the 'europeanUnion' subtype
  // (see EuropeanMaterialsForm.tsx) — without these, correcting a wrong country/category/report-
  // type/euCategory guess would suffer the exact same "stuck on stale selection" bug already fixed
  // for bookType and subtype itself.
  internationalMaterial: ['subtype', 'foreignCountry', 'foreignCategory', 'foreignCaseReportType', 'euCategory'],
  // mediaFormat is a second-level classification nested inside the 'filmOrMedia' subtype (see
  // OtherSourcesForm.tsx) — same reasoning as foreignCountry/foreignCategory above.
  otherSources: ['subtype', 'mediaFormat'],
}

interface GeneratorProps {
  initialSourceType?: SourceType
}

export default function Generator({ initialSourceType }: GeneratorProps) {
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType>(initialSourceType ?? 'case')
  const [caseFields, setCaseFields] = useState<CaseFields>(DEFAULT_CASE_FIELDS)
  const [legislationFields, setLegislationFields] = useState<LegislationFields>(DEFAULT_LEGISLATION_FIELDS)
  const [journalFields, setJournalFields] = useState<JournalFields>(DEFAULT_JOURNAL_FIELDS)
  const [bookFields, setBookFields] = useState<BookFields>(DEFAULT_BOOK_FIELDS)
  const [reportFields, setReportFields] = useState<ReportFields>(DEFAULT_REPORT_FIELDS)
  const [researchPaperFields, setResearchPaperFields] = useState<ResearchPaperFields>(DEFAULT_RESEARCH_PAPER_FIELDS)
  const [websiteFields, setWebsiteFields] = useState<WebsiteFields>(DEFAULT_WEBSITE_FIELDS)
  const [newspaperFields, setNewspaperFields] = useState<NewspaperFields>(DEFAULT_NEWSPAPER_FIELDS)
  const [otherLegislativeMaterialFields, setOtherLegislativeMaterialFields] =
    useState<OtherLegislativeMaterialFields>(DEFAULT_OTHER_LEGISLATIVE_MATERIAL_FIELDS)
  const [internationalMaterialFields, setInternationalMaterialFields] = useState<InternationalMaterialFields>(
    DEFAULT_INTERNATIONAL_MATERIAL_FIELDS,
  )
  const [otherSourcesFields, setOtherSourcesFields] = useState<OtherSourcesFields>(DEFAULT_OTHER_SOURCES_FIELDS)

  // Tracks exactly which fields, per source type, the student has personally typed into — so a
  // fresh autofill can rebuild everything else from scratch while leaving those specific edits
  // alone. Only real keystrokes touch this; running autofill itself never does.
  const [touchedFields, setTouchedFields] = useState<Record<SourceType, Set<string>>>(() =>
    Object.fromEntries(ALL_SOURCE_TYPES.map((type) => [type, new Set<string>()])) as Record<SourceType, Set<string>>,
  )
  const touchedFieldsRef = useRef(touchedFields)
  touchedFieldsRef.current = touchedFields

  // Every field starts pre-filled with curated demo data (DEFAULT_*_FIELDS above), purely so a
  // student browsing the tabs before citing anything real sees a worked example rather than a
  // blank form — that demo data must never itself get cross-mapped between tabs (see
  // handleSourceTypeSelect), only real citation data (from an autofill or the student's own
  // typing). Tracked per type, not as one global flag: cross-mapping must also only ever happen
  // the *first* time a student arrives at a given type, never on a return visit — otherwise
  // switching Journal → Book → back to Journal would rebuild the journal fields from blank a
  // second time and silently drop volume/issue/journalName/startingPage, which have no equivalent
  // in the Book shape to map back from (confirmed live: exactly this happened before this map was
  // introduced). Flips permanently false→true per type on its first real autofill or keystroke,
  // or the first time it's the target of a cross-map.
  const [typeHasRealContent, setTypeHasRealContent] = useState<Record<SourceType, boolean>>(
    () => Object.fromEntries(ALL_SOURCE_TYPES.map((type) => [type, false])) as Record<SourceType, boolean>,
  )

  function markTypeHasRealContent(type: SourceType) {
    setTypeHasRealContent((prev) => (prev[type] ? prev : { ...prev, [type]: true }))
  }

  function markFieldsTouched(type: SourceType, keys: readonly string[]) {
    if (keys.length === 0) return
    markTypeHasRealContent(type)
    setTouchedFields((prev) => ({ ...prev, [type]: new Set(Array.from(prev[type]).concat(keys)) }))
  }

  // A fresh autofill should never protect a pinpoint field or a classification field, even if
  // the student touched it for a previous citation — see PINPOINT_KEYS and CLASSIFICATION_KEYS.
  function protectedKeysForAutofill(type: SourceType): Set<string> {
    const neverProtect = new Set([...PINPOINT_KEYS[type], ...(CLASSIFICATION_KEYS[type] ?? [])])
    return new Set(Array.from(touchedFieldsRef.current[type]).filter((key) => !neverProtect.has(key)))
  }

  const [result, setResult] = useState<CitationResult | null>(null)
  const [validating, setValidating] = useState(false)
  // While a fresh autofill is still being fetched/extracted, the output panel still shows the
  // *previous* citation and its validation badge — misleadingly, since that badge describes
  // content that's about to be replaced. Folding this into the same `validating` display as the
  // AI-check spinner keeps the panel from claiming anything about the outgoing citation while a
  // new one is on the way.
  const [autofillLoading, setAutofillLoading] = useState(false)
  // What the last autofill left the student to act on — a "review the fields" prompt (whenever the
  // result wasn't high-confidence), the "matched via CrossRef" note, and/or the verify link. Shown
  // as a slim banner right above the form it's about, rather than stacked under the autofill input.
  const [autofillNotice, setAutofillNotice] = useState<{
    message?: string
    verifyUrl?: string
    review: boolean
  } | null>(null)
  const requestIdRef = useRef(0)

  // A warning note (missing-field / unreported-case reminder — see warnings.ts) describes the
  // *previous* citation. The instant a new autofill fetch or paste-details attempt starts, that
  // note is stale — clear it immediately rather than leaving it on screen until the new citation's
  // fields actually land (which is the fields-watching effect below, and can be several seconds
  // away for a slow fetch). The rest of the citation panel deliberately stays put so the screen
  // doesn't go blank mid-fetch; only the warning goes.
  useEffect(() => {
    if (autofillLoading) {
      setResult((prev) => (prev?.warnings?.length ? { ...prev, warnings: undefined } : prev))
      // The previous autofill's notice is about content that's being replaced — clear it the
      // moment a new attempt starts, same as the stale warning above.
      setAutofillNotice(null)
    }
  }, [autofillLoading])

  const currentFields: CitationFields | null = useMemo(() => {
    switch (selectedSourceType) {
      case 'case':
        return caseFields
      case 'legislation':
        return legislationFields
      case 'journal':
        return journalFields
      case 'book':
        return bookFields
      case 'report':
        return reportFields
      case 'researchPaper':
        return researchPaperFields
      case 'website':
        return websiteFields
      case 'newspaper':
        return newspaperFields
      case 'otherLegislativeMaterial':
        return otherLegislativeMaterialFields
      case 'internationalMaterial':
        return internationalMaterialFields
      case 'otherSources':
        return otherSourcesFields
      default:
        return null
    }
  }, [
    selectedSourceType,
    caseFields,
    legislationFields,
    journalFields,
    bookFields,
    reportFields,
    researchPaperFields,
    websiteFields,
    newspaperFields,
    otherLegislativeMaterialFields,
    internationalMaterialFields,
    otherSourcesFields,
  ])

  useEffect(() => {
    if (!currentFields) {
      setResult(null)
      return
    }

    const syncResult = generateCitationSync(selectedSourceType, currentFields)
    setResult(syncResult)
    setValidating(true)

    const requestId = ++requestIdRef.current
    const timer = setTimeout(() => {
      validateCitationAction(selectedSourceType, currentFields)
        .then((validated) => {
          if (requestIdRef.current === requestId) {
            setResult(validated)
            setValidating(false)
          }
        })
        .catch(() => {
          if (requestIdRef.current === requestId) {
            setValidating(false)
          }
        })
    }, VALIDATION_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [selectedSourceType, currentFields])

  // Rebuilds a single source type's fields from `fields` (an autofill result, or a best-effort
  // carryover from a different type the student just switched away from), respecting whatever
  // that type's own protected/never-protected keys are. Shared by handleAutofill and
  // handleSourceTypeSelect so both routes into "this type's fields just changed" behave
  // identically rather than maintaining two parallel field-by-field switches.
  function applyFieldsForType(type: SourceType, fields: AutofillFields) {
    switch (type) {
      case 'case':
        setCaseFields((prev) =>
          mergeAutofillFields(BLANK_CASE_FIELDS, prev, fields as Partial<CaseFields>, protectedKeysForAutofill('case')),
        )
        break
      case 'legislation':
        setLegislationFields((prev) =>
          mergeAutofillFields(
            BLANK_LEGISLATION_FIELDS,
            prev,
            fields as Partial<LegislationFields>,
            protectedKeysForAutofill('legislation'),
          ),
        )
        break
      case 'journal':
        setJournalFields((prev) =>
          mergeAutofillFields(
            BLANK_JOURNAL_FIELDS,
            prev,
            fields as Partial<JournalFields>,
            protectedKeysForAutofill('journal'),
          ),
        )
        break
      case 'book':
        setBookFields((prev) =>
          mergeAutofillFields(BLANK_BOOK_FIELDS, prev, fields as Partial<BookFields>, protectedKeysForAutofill('book')),
        )
        break
      case 'report':
        setReportFields((prev) =>
          mergeAutofillFields(
            BLANK_REPORT_FIELDS,
            prev,
            fields as Partial<ReportFields>,
            protectedKeysForAutofill('report'),
          ),
        )
        break
      case 'researchPaper':
        setResearchPaperFields((prev) =>
          mergeAutofillFields(
            BLANK_RESEARCH_PAPER_FIELDS,
            prev,
            fields as Partial<ResearchPaperFields>,
            protectedKeysForAutofill('researchPaper'),
          ),
        )
        break
      case 'website':
        setWebsiteFields((prev) =>
          mergeAutofillFields(
            BLANK_WEBSITE_FIELDS,
            prev,
            fields as Partial<WebsiteFields>,
            protectedKeysForAutofill('website'),
          ),
        )
        break
      case 'newspaper':
        setNewspaperFields((prev) =>
          mergeAutofillFields(
            BLANK_NEWSPAPER_FIELDS,
            prev,
            fields as Partial<NewspaperFields>,
            protectedKeysForAutofill('newspaper'),
          ),
        )
        break
      case 'otherLegislativeMaterial':
        setOtherLegislativeMaterialFields((prev) =>
          mergeAutofillFields(
            BLANK_OTHER_LEGISLATIVE_MATERIAL_FIELDS,
            prev,
            fields as Partial<OtherLegislativeMaterialFields>,
            protectedKeysForAutofill('otherLegislativeMaterial'),
          ),
        )
        break
      case 'internationalMaterial':
        setInternationalMaterialFields((prev) =>
          mergeAutofillFields(
            BLANK_INTERNATIONAL_MATERIAL_FIELDS,
            prev,
            fields as Partial<InternationalMaterialFields>,
            protectedKeysForAutofill('internationalMaterial'),
          ),
        )
        break
      case 'otherSources':
        setOtherSourcesFields((prev) =>
          mergeAutofillFields(
            BLANK_OTHER_SOURCES_FIELDS,
            prev,
            fields as Partial<OtherSourcesFields>,
            protectedKeysForAutofill('otherSources'),
          ),
        )
        break
    }
  }

  function handleAutofill(autofillResult: AutofillResult) {
    markTypeHasRealContent(autofillResult.detectedSourceType)
    applyFieldsForType(autofillResult.detectedSourceType, autofillResult.fields)
    setSelectedSourceType(autofillResult.detectedSourceType)

    const review = autofillResult.confidence !== 'high'
    setAutofillNotice(
      review || autofillResult.message || autofillResult.verifyUrl
        ? { message: autofillResult.message, verifyUrl: autofillResult.verifyUrl, review }
        : null,
    )
  }

  // A student clicking a different source-type tab is usually correcting a wrong guess (the app
  // detected 'journal' but it's actually a book chapter) rather than starting an unrelated new
  // citation, so — unlike a fresh autofill, which deliberately discards the previous source's
  // pinpoint via PINPOINT_KEYS — this carries over whatever cross-type concepts apply (see
  // mapFieldsAcrossSourceType) and reuses the same protected-key merge as a real autofill, so it
  // never clobbers anything the student already typed into the target type. Only fires the
  // *first* time the target type is visited (typeHasRealContent), and only once the *current*
  // type actually has something worth carrying over — both gates are needed: the first keeps a
  // later revisit from re-mapping over (and silently dropping) fields the target type has no
  // equivalent for, the second keeps this from firing while every tab is still on pristine demo
  // data.
  function handleSourceTypeSelect(type: SourceType) {
    if (type !== selectedSourceType && typeHasRealContent[selectedSourceType] && !typeHasRealContent[type] && currentFields) {
      applyFieldsForType(type, mapFieldsAcrossSourceType(selectedSourceType, currentFields, type))
      markTypeHasRealContent(type)
    }
    setSelectedSourceType(type)
  }

  const rules =
    selectedSourceType === 'case'
      ? CASE_RULES[caseFields.reportType]
      : selectedSourceType === 'legislation'
        ? LEGISLATION_RULES
        : selectedSourceType === 'journal'
          ? JOURNAL_RULES
          : selectedSourceType === 'book'
            ? BOOK_RULES[bookFields.bookType]
            : selectedSourceType === 'report'
              ? REPORT_RULES
              : selectedSourceType === 'researchPaper'
                ? RESEARCH_PAPER_RULES
                : selectedSourceType === 'website'
                  ? WEBSITE_RULES
                  : selectedSourceType === 'newspaper'
                    ? NEWSPAPER_RULES
                    : selectedSourceType === 'otherLegislativeMaterial'
                      ? OTHER_LEGISLATIVE_MATERIAL_RULES[otherLegislativeMaterialFields.subtype]
                      : selectedSourceType === 'internationalMaterial'
                        ? internationalMaterialFields.subtype === 'foreignDomestic'
                          ? {
                              footnote: foreignDomesticRuleLabel(internationalMaterialFields),
                              subsequent: 'AGLC4 r 1.4.4',
                              bibliography: foreignDomesticRuleLabel(internationalMaterialFields),
                            }
                          : internationalMaterialFields.subtype === 'europeanUnion'
                            ? {
                                footnote: europeanMaterialsRuleLabel(internationalMaterialFields),
                                subsequent: 'AGLC4 r 14.6',
                                bibliography: europeanMaterialsRuleLabel(internationalMaterialFields),
                              }
                            : INTERNATIONAL_MATERIAL_RULES[internationalMaterialFields.subtype]
                        : OTHER_SOURCES_RULES[otherSourcesFields.subtype]

  const badge =
    selectedSourceType === 'otherLegislativeMaterial'
      ? otherLegislativeMaterialBadge(otherLegislativeMaterialFields)
      : selectedSourceType === 'internationalMaterial'
        ? internationalMaterialBadge(internationalMaterialFields)
        : selectedSourceType === 'otherSources'
          ? otherSourcesBadge(otherSourcesFields)
          : undefined

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
              <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
            </svg>
          </span>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">Fill in details automatically</h2>
        </div>
        <AutofillBar onAutofill={handleAutofill} onLoadingChange={setAutofillLoading} />
      </section>

      {autofillNotice && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mt-0.5 shrink-0 text-amber-600"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div className="min-w-0 flex-1 space-y-1">
            {autofillNotice.message ? (
              <p className="text-amber-700">{autofillNotice.message}</p>
            ) : autofillNotice.review ? (
              <p className="font-medium text-amber-800">
                Autofilled — check the fields against the source before relying on them.
              </p>
            ) : null}
            {autofillNotice.verifyUrl && (
              <a
                href={autofillNotice.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline hover:text-[#1D4ED8]"
              >
                Open the source to check it&rsquo;s the right work
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAutofillNotice(null)}
            aria-label="Dismiss"
            className="-mr-1 shrink-0 text-amber-400 transition-colors hover:text-amber-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <SourceTypeSelector selected={selectedSourceType} onSelect={handleSourceTypeSelect} />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-gray-900">
              {SOURCE_TYPE_LABELS[selectedSourceType]} details
            </h2>
            {selectedSourceType === 'case' && (
              <CaseForm
                fields={caseFields}
                onChange={(fields) => {
                  markFieldsTouched('case', changedKeys(caseFields, fields))
                  setCaseFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'legislation' && (
              <LegislationForm
                fields={legislationFields}
                onChange={(fields) => {
                  markFieldsTouched('legislation', changedKeys(legislationFields, fields))
                  setLegislationFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'journal' && (
              <JournalForm
                fields={journalFields}
                onChange={(fields) => {
                  markFieldsTouched('journal', changedKeys(journalFields, fields))
                  setJournalFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'book' && (
              <BookForm
                fields={bookFields}
                onChange={(fields) => {
                  markFieldsTouched('book', changedKeys(bookFields, fields))
                  setBookFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'report' && (
              <ReportForm
                fields={reportFields}
                onChange={(fields) => {
                  markFieldsTouched('report', changedKeys(reportFields, fields))
                  setReportFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'researchPaper' && (
              <ResearchPaperForm
                fields={researchPaperFields}
                onChange={(fields) => {
                  markFieldsTouched('researchPaper', changedKeys(researchPaperFields, fields))
                  setResearchPaperFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'website' && (
              <WebsiteForm
                fields={websiteFields}
                onChange={(fields) => {
                  markFieldsTouched('website', changedKeys(websiteFields, fields))
                  setWebsiteFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'newspaper' && (
              <NewspaperForm
                fields={newspaperFields}
                onChange={(fields) => {
                  markFieldsTouched('newspaper', changedKeys(newspaperFields, fields))
                  setNewspaperFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'otherLegislativeMaterial' && (
              <OtherLegislativeMaterialForm
                fields={otherLegislativeMaterialFields}
                onChange={(fields) => {
                  markFieldsTouched('otherLegislativeMaterial', changedKeys(otherLegislativeMaterialFields, fields))
                  setOtherLegislativeMaterialFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'internationalMaterial' && (
              <InternationalMaterialForm
                fields={internationalMaterialFields}
                onChange={(fields) => {
                  markFieldsTouched('internationalMaterial', changedKeys(internationalMaterialFields, fields))
                  setInternationalMaterialFields(fields)
                }}
              />
            )}
            {selectedSourceType === 'otherSources' && (
              <OtherSourcesForm
                fields={otherSourcesFields}
                onChange={(fields) => {
                  markFieldsTouched('otherSources', changedKeys(otherSourcesFields, fields))
                  setOtherSourcesFields(fields)
                }}
              />
            )}
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <CitationOutput result={result} validating={validating || autofillLoading} rules={rules} badge={badge} />
          {currentFields && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-card">
              <SaveToLibraryButton sourceType={selectedSourceType} fields={currentFields} result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
