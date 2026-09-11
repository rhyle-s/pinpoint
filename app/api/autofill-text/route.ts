import { NextRequest, NextResponse } from 'next/server'
import { aiExtractFromPastedText } from '@/lib/autofill/ai-extract'
import { AutofillResult } from '@/lib/autofill/types'

const REQUEST_TIMEOUT_MS = 20_000
const MIN_TEXT_LENGTH = 20
const MAX_TEXT_LENGTH = 8000

// See app/api/autofill/route.ts — keeps the platform from killing the function before the internal
// Promise.race cap can return timeoutResult(). This path does no fetching (pasted text only), so a
// smaller ceiling than the URL/PDF routes is enough.
export const maxDuration = 30

function timeoutResult(): AutofillResult {
  return {
    detectedSourceType: 'website',
    fields: {},
    confidence: 'low',
    message: 'This took too long — please fill fields manually.',
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' })
  }

  const text = typeof body === 'object' && body !== null && 'text' in body ? (body as { text: unknown }).text : undefined

  if (typeof text !== 'string' || text.trim().length < MIN_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Please paste in a bit more detail — case name, citation, author, etc.' })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Please paste under ${MAX_TEXT_LENGTH.toLocaleString()} characters.` })
  }

  const result = await Promise.race([
    aiExtractFromPastedText(text.trim()),
    new Promise<AutofillResult>((resolve) => setTimeout(() => resolve(timeoutResult()), REQUEST_TIMEOUT_MS)),
  ])

  return NextResponse.json(result)
}
