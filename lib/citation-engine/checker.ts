import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { SourceType } from './types'
import { RULES_BY_SOURCE_TYPE, BIBLIOGRAPHY_RULE, SUBSEQUENT_RULE } from './aglc4-rules'

const MODEL = 'claude-sonnet-4-6'

const CheckSchema = z.object({
  isCorrect: z.boolean(),
  correctedText: z.string().nullable(),
  issues: z.array(z.string()),
  rule: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type CitationForm = 'footnote' | 'subsequent' | 'bibliography'

export interface CheckResult {
  isCorrect: boolean
  correctedText?: string
  issues: string[]
  rule?: string
  confidence: 'high' | 'medium' | 'low'
}

const FORM_LABEL: Record<CitationForm, string> = {
  footnote: 'footnote citation',
  subsequent: 'subsequent reference',
  bibliography: 'bibliography entry',
}

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

// Unlike validateCitation() (which checks a citation Pinpoint just generated against a known,
// trusted `fields` object), this checks a citation a student wrote themselves — there is no
// ground truth beyond the text itself, so the prompt must never invent facts to fill perceived
// gaps, only judge whether what's actually there is correctly formatted.
export async function checkCitation(text: string, sourceType: SourceType, form: CitationForm): Promise<CheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const formRule = form === 'bibliography' ? BIBLIOGRAPHY_RULE : form === 'subsequent' ? SUBSEQUENT_RULE : ''

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You are checking whether a student-written AGLC4 citation is correctly formatted — you are given only the citation text itself, with no other known facts about the source. Never invent, assume, or guess at details the text doesn't state. Never flag an element as missing just because it isn't present — many elements are genuinely optional or absent depending on the source (the rules below note this extensively); only flag something as wrong when the rules say it's actually required, or when what's present is formatted incorrectly. Only propose a corrected version for genuine formatting, punctuation, bracket, italicisation, or structural errors.

${RULES_BY_SOURCE_TYPE[sourceType]}${formRule ? `\n\n${formRule}` : ''}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: {
      effort: 'low',
      format: zodOutputFormat(CheckSchema),
    },
    messages: [
      {
        role: 'user',
        content: `Check this AGLC4 ${FORM_LABEL[form]} for a ${sourceType} source. Return JSON only: { isCorrect: boolean, correctedText: string | null, issues: string[], rule: string | null, confidence: 'high' | 'medium' | 'low' }. Only set correctedText when there's a genuine error to fix — leave it null if the citation is already correct.

Citation text: ${text}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`Citation check did not return usable output (stop_reason: ${response.stop_reason})`)
  }

  const parsed = response.parsed_output
  return {
    isCorrect: parsed.isCorrect,
    correctedText: parsed.correctedText ?? undefined,
    issues: parsed.issues,
    rule: parsed.rule ?? undefined,
    confidence: parsed.confidence,
  }
}
