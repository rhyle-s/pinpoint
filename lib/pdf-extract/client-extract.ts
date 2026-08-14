'use client'

import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

// pdfjs-dist references browser-only globals (eg DOMMatrix) at module-evaluation time, which
// crashes if the module is ever required in Node — and a plain top-level `import` gets evaluated
// during Next.js's server-side render of the page shell despite this file's 'use client'
// directive ('use client' marks a React Server Component boundary, it does not stop the
// underlying JS module from being loaded on the server for SSR). A dynamic `import()` inside the
// function body defers loading until extractPDFMetadata is actually invoked, which only ever
// happens from a browser event handler, so the module never touches the server at all.
let workerConfigured = false

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerConfigured) {
    // Served as a plain static file from /public (copied there by the "postinstall" script)
    // rather than resolved via `new URL(..., import.meta.url)` — Next.js's production build runs
    // Terser over anything pulled in that way, and Terser chokes on the worker bundle's
    // `import.meta` syntax. A static-asset reference sidesteps webpack/Terser entirely.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    workerConfigured = true
  }
  return pdfjs
}

const MAX_TEXT_LENGTH = 2000
const CITATION_BLOCK_MAX_LENGTH = 700

// Many publishers (ACM, IEEE, and others) print a ready-made "cite this paper as..." block on
// page 1 specifically so readers can cite it correctly — an unusually reliable source for year,
// venue, volume, and page info. But it doesn't always sit near the top of the page (a long
// author/affiliation block or abstract can easily push it past a few thousand characters in), so
// a blind "first N characters" window can miss it entirely. When one of these markers is found,
// its own small window is pulled in alongside the leading text rather than instead of it, with
// the leading window trimmed to keep the combined total within the same overall budget.
const CITATION_BLOCK_SIGNALS = [
  'Reference Format:',
  'Cite as:',
  'How to cite',
  'Please cite this article as',
  'Please cite this as',
  'Suggested citation:',
]

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  rawText?: string // page 1 text content only, capped at MAX_TEXT_LENGTH characters total
}

export type PdfExtractionFailureReason = 'password-protected' | 'no-text-layer' | 'invalid-pdf'

export class PdfExtractionError extends Error {
  reason: PdfExtractionFailureReason

  constructor(message: string, reason: PdfExtractionFailureReason) {
    super(message)
    this.reason = reason
  }
}

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item
}

function stringField(info: Record<string, unknown>, key: string): string | undefined {
  const value = info[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function findCitationBlock(fullText: string): string {
  for (const signal of CITATION_BLOCK_SIGNALS) {
    const index = fullText.indexOf(signal)
    if (index !== -1) return fullText.slice(index, index + CITATION_BLOCK_MAX_LENGTH).trim()
  }
  return ''
}

/**
 * Parses a PDF entirely in the browser — the file's bytes never leave the machine. Only a small,
 * text-only summary (embedded document properties, plus the first ~2000 characters of page 1's
 * text) is ever handed back to the caller, which is what gets sent to the server; the File object
 * and the rest of the document are never transmitted anywhere.
 */
export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  const { getDocument, PasswordException } = await loadPdfjs()
  const buffer = await file.arrayBuffer()

  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise.catch((error: unknown) => {
    if (error instanceof PasswordException) {
      throw new PdfExtractionError(
        'This PDF is password-protected — please remove the password and try again.',
        'password-protected',
      )
    }
    throw new PdfExtractionError('This file could not be read as a PDF.', 'invalid-pdf')
  })

  const { info } = await pdf.getMetadata()
  const infoRecord = info as Record<string, unknown>

  const page = await pdf.getPage(1)
  const textContent = await page.getTextContent()
  const fullText = textContent.items
    .filter(isTextItem)
    .map((item) => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  const citationBlock = findCitationBlock(fullText)
  const leadingLength = citationBlock ? Math.max(MAX_TEXT_LENGTH - citationBlock.length - 2, 0) : MAX_TEXT_LENGTH
  const leadingText = fullText.slice(0, leadingLength)
  const rawText = [leadingText, citationBlock].filter(Boolean).join('\n\n')

  if (!rawText) {
    throw new PdfExtractionError(
      "This PDF doesn't appear to have a readable text layer (it may be a scanned image) — please fill fields manually.",
      'no-text-layer',
    )
  }

  return {
    title: stringField(infoRecord, 'Title'),
    author: stringField(infoRecord, 'Author'),
    subject: stringField(infoRecord, 'Subject'),
    keywords: stringField(infoRecord, 'Keywords'),
    creator: stringField(infoRecord, 'Creator'),
    producer: stringField(infoRecord, 'Producer'),
    rawText,
  }
}
