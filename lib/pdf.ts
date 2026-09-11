import 'server-only'
import { extractText, getDocumentProxy } from 'unpdf'

// unpdf doesn't re-export pdf.js's own PDFDocumentProxy type, so it's derived from
// getDocumentProxy's own return type instead of a direct import.
type PDFDocumentProxy = Awaited<ReturnType<typeof getDocumentProxy>>

export function isPdfContentType(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes('application/pdf')
}

// Many official/legal documents (court practice directions/notes, signed reports, treaties) place
// their own issuing/signing date in a signature block at the very end, not near the title —
// confirmed on a real practice note where that date sat at character ~14078 of a 14094-character
// document, hopelessly past any reasonable leading-text budget. A small trailing sample is worth
// far more here than the same number of characters spent deeper into a document's middle body.
const TRAILING_SAMPLE_LENGTH = 300

// A citation's own details (title, issuing agency/author, date) are overwhelmingly on the cover
// page or in the first few pages of front matter — a 200+ page annual report or a full Act with
// every schedule never needs its body read to be cited. Past this many pages, extractPdfText
// switches from unpdf's mergePages extraction (which walks and lays out every single page — the
// dominant cost for a genuinely huge PDF, well beyond the network download itself, see
// MAX_FETCH_BYTES's own comment in ai-extract.ts) to reading only a leading slice plus a small
// trailing slice (in case a signature block/closing date sits at the very end, the same reasoning
// TRAILING_SAMPLE_LENGTH already applies at the character level for shorter documents) — skipping
// the body entirely rather than parsing pages that were never going to matter for a citation.
const LARGE_PDF_PAGE_THRESHOLD = 30
const LARGE_PDF_LEADING_PAGES = 12
const LARGE_PDF_TRAILING_PAGES = 3

/** Same item-joining pdf.js/unpdf itself uses internally for a single page (str + '\n' on EOL, no separator). */
async function pageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const content = await (await pdf.getPage(pageNumber)).getTextContent()
  return content.items
    .filter((item): item is typeof item & { str: string } => 'str' in item && item.str != null)
    .map((item) => item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ''))
    .join('')
}

async function pageRangeText(pdf: PDFDocumentProxy, from: number, to: number): Promise<string> {
  const pages = await Promise.all(Array.from({ length: to - from + 1 }, (_, i) => pageText(pdf, from + i)))
  return pages.join('\n')
}

/**
 * Extracts plain text from a PDF's bytes, capped to charLimit characters. For a document longer
 * than that budget, the tail end of this sample is a short excerpt from the very end of the
 * document (see TRAILING_SAMPLE_LENGTH) rather than more of the middle — a signature block or
 * closing date is far more likely to matter for a citation than another paragraph of body text.
 */
export async function extractPdfText(buffer: ArrayBuffer, charLimit: number): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))

  let text: string
  if (pdf.numPages > LARGE_PDF_PAGE_THRESHOLD) {
    const leading = await pageRangeText(pdf, 1, Math.min(LARGE_PDF_LEADING_PAGES, pdf.numPages))
    const trailingFrom = pdf.numPages - LARGE_PDF_TRAILING_PAGES + 1
    const trailing = trailingFrom > LARGE_PDF_LEADING_PAGES ? await pageRangeText(pdf, trailingFrom, pdf.numPages) : ''
    text = trailing ? `${leading}\n\n[${pdf.numPages - LARGE_PDF_LEADING_PAGES - LARGE_PDF_TRAILING_PAGES} pages omitted]\n\n${trailing}` : leading
  } else {
    ;({ text } = await extractText(pdf, { mergePages: true }))
  }

  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= charLimit) return clean

  const trailing = clean.slice(-TRAILING_SAMPLE_LENGTH).trim()
  const label = '\n\n[Document end]: '
  const leadingLength = Math.max(charLimit - trailing.length - label.length, 0)
  return `${clean.slice(0, leadingLength)}${label}${trailing}`
}
