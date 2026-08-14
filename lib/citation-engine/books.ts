import { BookFields, CitationResult } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  italicize,
  joinParts,
  lastName,
  quote,
  stripTrailingFullStop,
} from './utils'

function formatWholeBook(fields: BookFields): { footnote: string; bibliography: string; subsequent: string } {
  const authors = formatAuthorList(fields.authors ?? [])
  const authorPrefix = authors ? `${authors}, ` : ''
  const bibliographyAuthors = formatBibliographyAuthorList(fields.authors ?? [])
  const bibliographyAuthorPrefix = bibliographyAuthors ? `${bibliographyAuthors}, ` : ''
  const titleItalic = italicize(fields.title)
  const publication = `(${joinParts([fields.publisher, fields.edition, fields.year], ', ')})`
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${authorPrefix}${titleItalic} ${publication}${pinpoint}`),
    bibliography: stripTrailingFullStop(`${bibliographyAuthorPrefix}${titleItalic} ${publication}`),
    subsequent: ensureFullStop(`${authorPrefix}${shortTitle} (n ${footnoteNumber})${pinpoint}`),
  }
}

function formatBookChapter(fields: BookFields): { footnote: string; bibliography: string; subsequent: string } {
  const chapterAuthors = formatAuthorList(fields.chapterAuthors ?? [])
  const bibliographyChapterAuthors = formatBibliographyAuthorList(fields.chapterAuthors ?? [])
  const editors = formatAuthorList(fields.editors ?? [])
  const edLabel = (fields.editors?.length ?? 0) > 1 ? 'eds' : 'ed'
  const bookTitleItalic = italicize(fields.title)
  const publication = `(${joinParts([fields.publisher, fields.year], ', ')})`
  const pinpointPart = fields.pinpoint ? `, ${fields.pinpoint.trim()}` : ''

  const chapterTitle = quote(fields.chapterTitle ?? '')
  const startingPage = fields.startingPage ?? ''
  const core = joinParts([`in ${editors} (${edLabel}),`, bookTitleItalic, publication])
  const footnote = ensureFullStop(`${chapterAuthors}, ${chapterTitle} ${core} ${startingPage}${pinpointPart}`)
  const bibliography = stripTrailingFullStop(
    `${bibliographyChapterAuthors}, ${chapterTitle} ${core} ${startingPage}`,
  )

  const surname = lastName(fields.chapterAuthors?.[0] ?? '')
  const shortTitle = quote(fields.shortTitle || fields.chapterTitle || '')
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const subsequent = ensureFullStop(`${surname}, ${shortTitle} (n ${footnoteNumber})${pinpoint}`)

  return { footnote, bibliography, subsequent }
}

export function generateBookCitation(fields: BookFields): CitationResult {
  const { footnote, bibliography, subsequent } =
    fields.bookType === 'chapter' ? formatBookChapter(fields) : formatWholeBook(fields)

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'book',
    validationStatus: 'unvalidated',
  }
}
