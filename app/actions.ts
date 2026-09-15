'use server'

import { generateCitation } from '@/lib/citation-engine/generate'
import { CitationFields, CitationResult, SourceType } from '@/lib/citation-engine/types'
import { checkCitation, CitationForm, CheckResult } from '@/lib/citation-engine/checker'

/** Server Action: runs the rules engine + AI validation layer. Keeps the Anthropic API key server-side. */
export async function validateCitationAction(
  sourceType: SourceType,
  fields: CitationFields,
): Promise<CitationResult> {
  return generateCitation(sourceType, fields)
}

/** Server Action: checks a student-written citation against AGLC4. Keeps the Anthropic API key server-side. */
export async function checkCitationAction(
  text: string,
  sourceType: SourceType,
  form: CitationForm,
): Promise<CheckResult> {
  return checkCitation(text, sourceType, form)
}
