import {
  BookFields,
  CaseFields,
  JournalFields,
  LegislationFields,
  ReportFields,
  ResearchPaperFields,
  SourceType,
  TreatyFields,
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
  | Partial<TreatyFields>

export interface AutofillResult {
  detectedSourceType: SourceType
  fields: AutofillFields
  confidence: 'high' | 'medium' | 'low'
  message?: string
}
