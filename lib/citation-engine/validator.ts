import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CitationFields, SourceType } from './types'
import { sanitizeFieldsForValidation } from './utils'
import { RULES_BY_SOURCE_TYPE, BIBLIOGRAPHY_RULE, SUBSEQUENT_RULE } from './aglc4-rules'

const MODEL = 'claude-sonnet-4-6'

const ValidationSchema = z.object({
  isCorrect: z.boolean(),
  correctedFootnote: z.string().nullable(),
  correctedSubsequent: z.string().nullable(),
  correctedBibliography: z.string().nullable(),
  issues: z.array(z.string()),
  rule: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
})

export interface CitationTexts {
  footnote: string
  subsequent: string
  bibliography: string
}

export interface ValidationResult {
  isCorrect: boolean
  correctedFootnote?: string
  correctedSubsequent?: string
  correctedBibliography?: string
  issues?: string[]
  rule?: string
  confidence: 'high' | 'medium' | 'low'
}

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

export async function validateCitation(
  citation: CitationTexts,
  sourceType: SourceType,
  fields: CitationFields,
): Promise<ValidationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    // Byte-identical for every call against the same sourceType (this function runs on every
    // debounced keystroke in the generator, so that's extremely frequent) — cached for the same
    // latency/cost reason as ai-extract.ts's SYSTEM_PROMPT, see its own comment and CLAUDE.md.
    system: [
      {
        type: 'text',
        text: `${RULES_BY_SOURCE_TYPE[sourceType]}\n\n${BIBLIOGRAPHY_RULE}\n\n${SUBSEQUENT_RULE}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: {
      effort: 'low',
      format: zodOutputFormat(ValidationSchema),
    },
    messages: [
      {
        role: 'user',
        content: `Validate these three AGLC4 citation forms for a ${sourceType} — they are the footnote, subsequent reference, and bibliography entry for the same source, and must be corrected consistently with each other. Return JSON only: { isCorrect: boolean, correctedFootnote: string | null, correctedSubsequent: string | null, correctedBibliography: string | null, issues: string[], rule: string, confidence: 'high' | 'medium' | 'low' }. Only set a corrected* field when that specific form has an error — leave it null if that form is already correct, even if the other forms need fixing.

Footnote citation: ${citation.footnote}
Subsequent reference: ${citation.subsequent}
Bibliography entry: ${citation.bibliography}

Source fields used to generate them: ${JSON.stringify(sanitizeFieldsForValidation(fields))}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`Citation validation did not return usable output (stop_reason: ${response.stop_reason})`)
  }

  const parsed = response.parsed_output
  return {
    isCorrect: parsed.isCorrect,
    correctedFootnote: parsed.correctedFootnote ?? undefined,
    correctedSubsequent: parsed.correctedSubsequent ?? undefined,
    correctedBibliography: parsed.correctedBibliography ?? undefined,
    issues: parsed.issues,
    rule: parsed.rule,
    confidence: parsed.confidence,
  }
}
