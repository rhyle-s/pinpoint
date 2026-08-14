'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { generateCitationSync } from '@/lib/citation-engine'
import { validateCitationAction } from '@/app/actions'
import { changedKeys, mergeAutofillFields } from '@/lib/autofill/merge'
import { AutofillResult } from '@/lib/autofill/types'
import {
  BookFields,
  CaseFields,
  CitationFields,
  CitationResult,
  JournalFields,
  LegislationFields,
  ReportFields,
  ResearchPaperFields,
  SourceType,
  TreatyFields,
  WebsiteFields,
} from '@/lib/citation-engine/types'
import AutofillBar from './AutofillBar'
import SourceTypeSelector from './SourceTypeSelector'
import CaseForm from './CaseForm'
import LegislationForm from './LegislationForm'
import JournalForm from './JournalForm'
import BookForm from './BookForm'
import ReportForm from './ReportForm'
import ResearchPaperForm from './ResearchPaperForm'
import WebsiteForm from './WebsiteForm'
import TreatyForm from './TreatyForm'
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

const DEFAULT_TREATY_FIELDS: TreatyFields = {
  title: 'International Covenant on Economic, Social and Cultural Rights',
  treatyType: 'multilateral',
  openedForSignature: '16 December 1966',
  treatySeries: '993 UNTS 3',
  enteredIntoForce: '3 January 1976',
}

// Truly-empty templates, distinct from the DEFAULT_* demo data above. Every autofill rebuilds
// a source type's fields from one of these rather than patching the current object in place, so
// that fields left over from a *previous, different* autofill (or the pre-filled demo values)
// don't linger when the new result doesn't address them — see mergeAutofillFields.
const BLANK_CASE_FIELDS: CaseFields = { caseName: '', reportType: 'reported', year: '' }
const BLANK_LEGISLATION_FIELDS: LegislationFields = { actTitle: '', year: '', jurisdiction: 'Cth' }
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
const BLANK_TREATY_FIELDS: TreatyFields = { title: '', treatyType: 'multilateral', treatySeries: '' }

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
const TREATY_RULES = { footnote: 'AGLC4 r 8.1–8.7', subsequent: 'AGLC4 r 1.4.4', bibliography: 'AGLC4 r 8.1–8.7' }

const VALIDATION_DEBOUNCE_MS = 800

const ALL_SOURCE_TYPES: SourceType[] = [
  'case',
  'legislation',
  'journal',
  'book',
  'report',
  'researchPaper',
  'website',
  'treaty',
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
  treaty: ['pinpoint'],
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
  const [treatyFields, setTreatyFields] = useState<TreatyFields>(DEFAULT_TREATY_FIELDS)

  // Tracks exactly which fields, per source type, the student has personally typed into — so a
  // fresh autofill can rebuild everything else from scratch while leaving those specific edits
  // alone. Only real keystrokes touch this; running autofill itself never does.
  const [touchedFields, setTouchedFields] = useState<Record<SourceType, Set<string>>>(() =>
    Object.fromEntries(ALL_SOURCE_TYPES.map((type) => [type, new Set<string>()])) as Record<SourceType, Set<string>>,
  )
  const touchedFieldsRef = useRef(touchedFields)
  touchedFieldsRef.current = touchedFields

  function markFieldsTouched(type: SourceType, keys: readonly string[]) {
    if (keys.length === 0) return
    setTouchedFields((prev) => ({ ...prev, [type]: new Set(Array.from(prev[type]).concat(keys)) }))
  }

  // A fresh autofill should never protect a pinpoint field, even if the student typed into it
  // for a previous citation — see PINPOINT_KEYS.
  function protectedKeysForAutofill(type: SourceType): Set<string> {
    const pinpointKeys = new Set(PINPOINT_KEYS[type])
    return new Set(Array.from(touchedFieldsRef.current[type]).filter((key) => !pinpointKeys.has(key)))
  }

  const [result, setResult] = useState<CitationResult | null>(null)
  const [validating, setValidating] = useState(false)
  // While a fresh autofill is still being fetched/extracted, the output panel still shows the
  // *previous* citation and its validation badge — misleadingly, since that badge describes
  // content that's about to be replaced. Folding this into the same `validating` display as the
  // AI-check spinner keeps the panel from claiming anything about the outgoing citation while a
  // new one is on the way.
  const [autofillLoading, setAutofillLoading] = useState(false)
  const requestIdRef = useRef(0)

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
      case 'treaty':
        return treatyFields
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
    treatyFields,
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

  function handleAutofill(autofillResult: AutofillResult) {
    const type = autofillResult.detectedSourceType

    switch (type) {
      case 'case':
        setCaseFields((prev) =>
          mergeAutofillFields(
            BLANK_CASE_FIELDS,
            prev,
            autofillResult.fields as Partial<CaseFields>,
            protectedKeysForAutofill('case'),
          ),
        )
        break
      case 'legislation':
        setLegislationFields((prev) =>
          mergeAutofillFields(
            BLANK_LEGISLATION_FIELDS,
            prev,
            autofillResult.fields as Partial<LegislationFields>,
            protectedKeysForAutofill('legislation'),
          ),
        )
        break
      case 'journal':
        setJournalFields((prev) =>
          mergeAutofillFields(
            BLANK_JOURNAL_FIELDS,
            prev,
            autofillResult.fields as Partial<JournalFields>,
            protectedKeysForAutofill('journal'),
          ),
        )
        break
      case 'book':
        setBookFields((prev) =>
          mergeAutofillFields(
            BLANK_BOOK_FIELDS,
            prev,
            autofillResult.fields as Partial<BookFields>,
            protectedKeysForAutofill('book'),
          ),
        )
        break
      case 'report':
        setReportFields((prev) =>
          mergeAutofillFields(
            BLANK_REPORT_FIELDS,
            prev,
            autofillResult.fields as Partial<ReportFields>,
            protectedKeysForAutofill('report'),
          ),
        )
        break
      case 'researchPaper':
        setResearchPaperFields((prev) =>
          mergeAutofillFields(
            BLANK_RESEARCH_PAPER_FIELDS,
            prev,
            autofillResult.fields as Partial<ResearchPaperFields>,
            protectedKeysForAutofill('researchPaper'),
          ),
        )
        break
      case 'website':
        setWebsiteFields((prev) =>
          mergeAutofillFields(
            BLANK_WEBSITE_FIELDS,
            prev,
            autofillResult.fields as Partial<WebsiteFields>,
            protectedKeysForAutofill('website'),
          ),
        )
        break
      case 'treaty':
        setTreatyFields((prev) =>
          mergeAutofillFields(
            BLANK_TREATY_FIELDS,
            prev,
            autofillResult.fields as Partial<TreatyFields>,
            protectedKeysForAutofill('treaty'),
          ),
        )
        break
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
                  : TREATY_RULES

  return (
    <div className="space-y-8">
      <AutofillBar onAutofill={handleAutofill} onLoadingChange={setAutofillLoading} />

      <SourceTypeSelector selected={selectedSourceType} onSelect={setSelectedSourceType} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-6">
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
          {selectedSourceType === 'treaty' && (
            <TreatyForm
              fields={treatyFields}
              onChange={(fields) => {
                markFieldsTouched('treaty', changedKeys(treatyFields, fields))
                setTreatyFields(fields)
              }}
            />
          )}
        </div>

        <div>
          <CitationOutput result={result} validating={validating || autofillLoading} rules={rules} />
        </div>
      </div>
    </div>
  )
}
