'use server'

import { generateCitation } from '@/lib/citation-engine/generate'
import { CitationFields, CitationResult, SourceType } from '@/lib/citation-engine/types'

/** Server Action: runs the rules engine + AI validation layer. Keeps the Anthropic API key server-side. */
export async function validateCitationAction(
  sourceType: SourceType,
  fields: CitationFields,
): Promise<CitationResult> {
  return generateCitation(sourceType, fields)
}
