import 'server-only'
import { extractText, getDocumentProxy } from 'unpdf'

export function isPdfContentType(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes('application/pdf')
}

/** Extracts plain text from a PDF's bytes, capped to charLimit characters. */
export async function extractPdfText(buffer: ArrayBuffer, charLimit: number): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text.replace(/\s+/g, ' ').trim().slice(0, charLimit)
}
