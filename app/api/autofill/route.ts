import { NextRequest, NextResponse } from 'next/server'
import { autofill } from '@/lib/autofill'
import { matchBlockedDatabase } from '@/lib/autofill/detect'
import { AutofillResult } from '@/lib/autofill/types'

// Must stay comfortably above ai-extract.ts's own FETCH_TIMEOUT_MS (20s) plus room for the AI
// call itself — a PDF fetch can involve two sequential requests (see fetch.ts's User-Agent
// fallback) on top of the download and parse, so the fetch phase alone can approach 20s. Bumped
// from 28s to 40s for extra headroom on top of that — a fast, tiny (sub-200KB) PDF was confirmed
// live to still occasionally need most of a 12s round trip just for the AI extraction call once
// the fetch itself is done, and 28s left too little margin for that call to have a slow moment.
const REQUEST_TIMEOUT_MS = 40_000
const MAX_INPUT_LENGTH = 500

// The route enforces its own REQUEST_TIMEOUT_MS cap above via Promise.race; this only stops the
// *platform* from killing the function first. Vercel's default function timeout is 300s on all
// plans as of early 2026, so 60s leaves generous headroom over the internal cap without being
// anywhere near a real ceiling.
export const maxDuration = 60

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
