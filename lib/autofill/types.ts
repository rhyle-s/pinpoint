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
  SourceType,
  WebsiteFields,
} from '../citation-engine/types'

export type { AutofillInputType } from './detect'

export type AutofillFields =
  | Partial<CaseFields>
  | Partial<LegislationFields>
  | Partial<JournalFields>
  | Partial<BookFields>
  | Partial<ReportFields>
  | Partial<ResearchPaperFields>
  | Partial<WebsiteFields>
  | Partial<NewspaperFields>
  | Partial<OtherLegislativeMaterialFields>
  | Partial<InternationalMaterialFields>
  | Partial<OtherSourcesFields>

export interface AutofillResult {
  detectedSourceType: SourceType
  fields: AutofillFields
  confidence: 'high' | 'medium' | 'low'
  message?: string
  // A link the student can open to check the match is the right source — set by the CrossRef
  // title search (a fuzzy match), where "is this actually the work I meant?" is a real question.
  // Purely a verification aid shown in the autofill bar; never used in the citation itself.
  verifyUrl?: string
}
