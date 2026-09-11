import { BookFields, CitationResult } from './types'
import {
  ensureFullStop,
  formatAuthorList,
  formatBibliographyAuthorList,
  formatSubsequentAuthorList,
  italicize,
  joinParts,
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
  const footnoteNumber = fields.footnoteNumber || '1'

  // AGLC4 r 1.4.1's own default for a secondary source is a BARE 'Author Surname (n X) Pinpoint'
  // (surnames only, not the full names the footnote itself uses — confirmed by '5 Edelman and Bant
  // (n 2) 260.') — a title is only added when several works by the same author are cited, which
  // this app has no way to detect (each citation is generated independently); the student's own
  // explicit shortTitle is treated as the signal they already know they need to disambiguate.
  // Where there's no author at all, the title stands in for the author's surname entirely.
  const surnames = formatSubsequentAuthorList(fields.authors ?? [])
  const subsequent = !surnames
    ? ensureFullStop(`${italicize(fields.shortTitle || fields.title)} (n ${footnoteNumber})${pinpoint}`)
    : ensureFullStop(
        `${surnames}${fields.shortTitle ? `, ${italicize(fields.shortTitle)}` : ''} (n ${footnoteNumber})${pinpoint}`,
      )

  return {
    footnote: ensureFullStop(`${authorPrefix}${titleItalic} ${publication}${pinpoint}`),
    bibliography: stripTrailingFullStop(`${bibliographyAuthorPrefix}${titleItalic} ${publication}`),
    subsequent,
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

  const surnames = formatSubsequentAuthorList(fields.chapterAuthors ?? [])
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const subsequent = !surnames
    ? ensureFullStop(`${quote(fields.shortTitle || fields.chapterTitle || '')} (n ${footnoteNumber})${pinpoint}`)
    : ensureFullStop(
        `${surnames}${fields.shortTitle ? `, ${quote(fields.shortTitle)}` : ''} (n ${footnoteNumber})${pinpoint}`,
      )

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
