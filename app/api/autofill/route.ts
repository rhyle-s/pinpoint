import { NextRequest, NextResponse } from 'next/server'
import { autofill } from '@/lib/autofill'
import { AutofillResult } from '@/lib/autofill/types'

// Must stay comfortably above ai-extract.ts's own FETCH_TIMEOUT_MS (20s) plus room for the AI
// call itself — a PDF fetch can involve two sequential requests (see fetch.ts's User-Agent
// fallback) on top of the download and parse, so the fetch phase alone can approach 20s.
const REQUEST_TIMEOUT_MS = 28_000
const MAX_INPUT_LENGTH = 500

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

  const input =
    typeof body === 'object' && body !== null && 'input' in body ? (body as { input: unknown }).input : undefined

  if (typeof input !== 'string' || input.trim().length === 0 || input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json({ error: 'Please provide a URL or DOI under 500 characters.' })
  }

  const result = await Promise.race([
    autofill(input),
    new Promise<AutofillResult>((resolve) => setTimeout(() => resolve(timeoutResult()), REQUEST_TIMEOUT_MS)),
  ])

  return NextResponse.json(result)
}
