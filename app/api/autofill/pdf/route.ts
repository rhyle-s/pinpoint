import { NextRequest, NextResponse } from 'next/server'
import { aiExtractFromPdfMetadata, PdfMetadataInput } from '@/lib/autofill/ai-extract'
import { AutofillResult } from '@/lib/autofill/types'

// Matches the other AI-extraction routes' generous headroom — a plain metadata+snippet call is
// usually fast, but AI response latency varies enough that 20s occasionally wasn't enough.
const REQUEST_TIMEOUT_MS = 28_000
// Second, server-side enforcement of the same cap the client already applies — never trust the
// client alone for a limit that exists to bound what gets sent to the AI provider.
const MAX_RAW_TEXT_LENGTH = 2000
const METADATA_KEYS = ['title', 'author', 'subject', 'keywords', 'creator', 'producer', 'rawText'] as const

function timeoutResult(): AutofillResult {
  return {
    detectedSourceType: 'website',
    fields: {},
    confidence: 'low',
    message: 'This took too long — please fill fields manually.',
  }
}

/**
 * The request body must be string fields only — this route exists specifically so the PDF file
 * and its full text never reach the server, so anything that isn't a plain string (binary data,
 * nested objects/arrays, etc) is rejected outright rather than coerced or ignored.
 */
function parseMetadata(body: unknown): PdfMetadataInput | null {
  if (typeof body !== 'object' || body === null || !('metadata' in body)) return null
  const raw = (body as { metadata: unknown }).metadata
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null

  const metadata: PdfMetadataInput = {}
  for (const key of METADATA_KEYS) {
    const value = (raw as Record<string, unknown>)[key]
    if (value === undefined) continue
    if (typeof value !== 'string') return null
    metadata[key] = value
  }
  return metadata
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' })
  }

  const metadata = parseMetadata(body)
  if (!metadata) {
    return NextResponse.json({ error: 'Invalid PDF metadata — expected text fields only.' })
  }
  if (metadata.rawText) {
    metadata.rawText = metadata.rawText.slice(0, MAX_RAW_TEXT_LENGTH)
  }

  // Deliberately no content in this log line — only that the route was hit.
  console.log('PDF metadata extraction requested')

  const result = await Promise.race([
    aiExtractFromPdfMetadata(metadata),
    new Promise<AutofillResult>((resolve) => setTimeout(() => resolve(timeoutResult()), REQUEST_TIMEOUT_MS)),
  ])

  return NextResponse.json(result)
}
