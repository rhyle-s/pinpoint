import 'server-only'
import { generateCitationSync } from './index'
import { validateCitation } from './validator'
import { CitationFields, CitationResult, SourceType } from './types'

/**
 * Runs the deterministic rules engine, then asks the AI validation layer to check the result
 * against AGLC4. Falls back to the unvalidated rules-engine output if validation errors.
 * Server-only: calls the Anthropic API, must not be imported by client components.
 */
export async function generateCitation(sourceType: SourceType, fields: CitationFields): Promise<CitationResult> {
  const base = generateCitationSync(sourceType, fields)

  try {
    const validation = await validateCitation(base, sourceType, fields)

    if (validation.isCorrect) {
      return { ...base, validationStatus: 'validated' }
    }

    const { correctedFootnote, correctedSubsequent, correctedBibliography } = validation
    if (correctedFootnote || correctedSubsequent || correctedBibliography) {
      return {
        ...base,
        footnote: correctedFootnote ?? base.footnote,
        subsequent: correctedSubsequent ?? base.subsequent,
        bibliography: correctedBibliography ?? base.bibliography,
        validationStatus: 'corrected',
      }
    }

    return base
  } catch {
    return base
  }
}
