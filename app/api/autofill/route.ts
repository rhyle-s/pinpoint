import { NextRequest, NextResponse } from 'next/server'
import { autofill } from '@/lib/autofill'
import { matchBlockedDatabase } from '@/lib/autofill/detect'
import { AutofillResult } from '@/lib/autofill/types'

// Must stay comfortably above ai-extract.ts's own FETCH_TIMEOUT_MS (20s) plus room for the AI
// call itself — a PDF fetch can involve two sequential requests (see fetch.ts's User-Agent
// fallback) on top of the download and parse, so the fetch phase alone can approach 20s.
const REQUEST_TIMEOUT_MS = 28_000
const MAX_INPUT_LENGTH = 500

// The route enforces its own 28s cap above via Promise.race; this only stops the *platform* from
// killing the function first — Vercel's default is 10s on Hobby, well under REQUEST_TIMEOUT_MS, so
// without this a slow (large-PDF) fetch would be cut off before the graceful timeoutResult() could
// ever return. 45s leaves headroom over the internal cap without approaching any plan's ceiling.
export const maxDuration = 45

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

  if (typeof input !== 'string' || input.trim().length === 0) {
    return NextResponse.json({ error: 'Please provide a URL or DOI under 500 characters.' })
  }

  // Known blocked databases (SSRN, HeinOnline, Lexis+, ...) can produce URLs that blow well past
  // this cap on their own — eg SSRN's pre-signed S3 query string, or Lexis+'s doc-locator params —
  // so a length check this early would reject them before detectInputType() ever gets a chance to
  // recognise them and return its explanatory message. Safe to let through unchecked: that path
  // never fetches the URL, so there's no actual cost to accepting the long input.
  if (input.length > MAX_INPUT_LENGTH && !matchBlockedDatabase(input)) {
    return NextResponse.json({ error: 'Please provide a URL or DOI under 500 characters.' })
  }

  const result = await Promise.race([
    autofill(input),
    new Promise<AutofillResult>((resolve) => setTimeout(() => resolve(timeoutResult()), REQUEST_TIMEOUT_MS)),
  ])

  return NextResponse.json(result)
}
