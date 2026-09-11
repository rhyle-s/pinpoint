'use client'

import type { PDFDocumentProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

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
// Journal offprints (the norm for SSRN downloads of already-published articles) typically give
// page 1 over entirely to title/author/abstract, with the journal name, volume, and starting page
// only appearing in a running header that starts on page 2 — eg 'SYDNEY LAW REVIEW [VOL 31: 411'
// — and the year often on a separate alternating header, eg '2009] ARTICLE TITLE 413'. Both are
// short and sit at the very start of the page's text stream, so a small fixed-size sample from
// each page is enough to catch them without meaningfully growing what's sent to the server.
const HEADER_SAMPLE_PAGES = [2, 3]
const HEADER_SAMPLE_LENGTH = 200

// A treaty's own closing/testimonium clause ('DONE in triplicate ... the first day of July, one
// thousand nine hundred and sixty-eight') sits at the very end of the operative text, right
// before the signature blocks — confirmed on a real multi-page treaty PDF where that clause was
// on the last page, well past both the leading-text budget and the page-2/3 header samples above
// (which exist for a different purpose — journal running headers — and don't reach a document's
// last page at all). The server-side PDF-fetch path already samples a document's tail for the
// same reason (a Practice Direction/Note's signing date, also typically at the very end) — this
// mirrors that with the same '[Document end]: ...' label so ai-extract.ts's existing prompt
// guidance for that label applies uniformly regardless of which path a PDF came in through.
const TRAILING_SAMPLE_LENGTH = 500

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

// Other publishers (Cambridge, Springer, ...) skip the labelled block above and instead print a
// bare 'Journal Name (Year), Volume, Pages doi:10.xxxx/...' footer with no "cite as" wording —
// confirmed on a real PDF where this footer sat at character ~3045 of a 3178-character page 1,
// well past the leading-text budget. The DOI itself is a strong enough signal on its own, and
// lets the server look the article up directly against CrossRef (see DOI_IN_TEXT_PATTERN in
// ai-extract.ts) for a far more reliable result than parsing this footer's text — but only if the
// DOI actually makes it into what gets sent, hence capturing it here at all.
const DOI_PATTERN = /\bdoi(?:\.org\/|:?\s*)10\.\d{4,}\/\S+/i
// The DOI is typically the *tail* of its citation footer, with the journal/volume/page text
// immediately before it — so the window starts this many characters earlier, not at the match.
const DOI_CONTEXT_BEFORE = 200

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  rawText?: string // page 1 text, plus small labelled samples of later pages' running headers and the document's last page, capped at MAX_TEXT_LENGTH characters total
  // The File object's own name, eg 'CELEX_31993L0013_EN_TXT.pdf' — EUR-Lex's own PDF-export
  // filename convention carries a CELEX number that's a far more reliable signal than anything
  // extractable from the PDF's own (often sparse or actively misleading) internal text/metadata —
  // see extractCelexFromFilename in eu-cellar-parse.ts. Just the filename string itself, not the
  // file — this whole module's point is that the file never leaves the browser.
  filename?: string
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
  const doiMatch = fullText.match(DOI_PATTERN)
  if (doiMatch?.index !== undefined) {
    const start = Math.max(doiMatch.index - DOI_CONTEXT_BEFORE, 0)
    return fullText.slice(start, start + CITATION_BLOCK_MAX_LENGTH).trim()
  }
  return ''
}

async function getPageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const textContent = await page.getTextContent()
  return textContent.items
    .filter(isTextItem)
    .map((item) => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Short leading-text samples from a couple of later pages, labelled by page number so the AI
 *  extractor can tell a running header apart from the article's own body text. */
async function sampleHeaders(pdf: PDFDocumentProxy): Promise<string> {
  const samples: string[] = []
  for (const pageNumber of HEADER_SAMPLE_PAGES) {
    if (pageNumber > pdf.numPages) break
    const text = await getPageText(pdf, pageNumber)
    if (text) samples.push(`[Page ${pageNumber} header]: ${text.slice(0, HEADER_SAMPLE_LENGTH)}`)
  }
  return samples.join('\n')
}

/** Trailing text from the document's last page, labelled the same way as the server-side PDF-fetch
 *  path's end-of-document sample — see TRAILING_SAMPLE_LENGTH above. */
async function sampleDocumentEnd(pdf: PDFDocumentProxy): Promise<string> {
  const text = await getPageText(pdf, pdf.numPages)
  if (!text) return ''
  return `[Document end]: ${text.slice(-TRAILING_SAMPLE_LENGTH)}`
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

  const fullText = await getPageText(pdf, 1)
  const headerSample = pdf.numPages > 1 ? await sampleHeaders(pdf) : ''
  const documentEnd = pdf.numPages > 1 ? await sampleDocumentEnd(pdf) : ''

  const citationBlock = findCitationBlock(fullText)
  const reserved = [citationBlock, headerSample, documentEnd].filter(Boolean).reduce((sum, s) => sum + s.length + 2, 0)
  const leadingLength = Math.max(MAX_TEXT_LENGTH - reserved, 0)
  const leadingText = fullText.slice(0, leadingLength)
  const rawText = [leadingText, citationBlock, headerSample, documentEnd].filter(Boolean).join('\n\n')

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
    filename: file.name || undefined,
  }
}
