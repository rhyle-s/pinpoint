import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { createClient } from '@/lib/supabase/server'
import { CitationFields, SourceType } from '@/lib/citation-engine/types'
import {
  BIBLIOGRAPHY_SECTION_LABELS,
  BIBLIOGRAPHY_SECTION_ORDER,
  bibliographySectionFor,
} from '@/lib/library-bibliography-sections'
import { UNCATEGORISED_COLLECTION } from '@/lib/library-types'

const CITATION_FONT = 'Times New Roman'
const CITATION_FONT_SIZE = 24 // half-points — 12pt

const LEADING_ARTICLE = /^(the|a|an)\s+/i

// Ignoring "The"/"A"/"An" for alphabetising, as requested — strips the engine's own '*' markers
// first so they never affect sort order.
function sortKey(bibliographyText: string): string {
  return bibliographyText.replace(/\*/g, '').trim().replace(LEADING_ARTICLE, '').toLowerCase()
}

// Splits on '*' and alternates italic/non-italic by the ORIGINAL split index — filtering empty
// segments (a leading/trailing/adjacent '*') has to happen after that index is captured, not
// before, or the alternation shifts and everything after the first empty segment gets the wrong
// italics.
function parseItalicsToRuns(text: string): TextRun[] {
  return text
    .split('*')
    .map((segment, index) => ({ segment, italics: index % 2 === 1 }))
    .filter(({ segment }) => segment.length > 0)
    .map(
      ({ segment, italics }) =>
        new TextRun({ text: segment, italics, font: CITATION_FONT, size: CITATION_FONT_SIZE }),
    )
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in to export your bibliography.' }, { status: 401 })
  }

  // Optional ?collection=<label> scopes the export to one collection (eg one assessment) instead
  // of the whole library — the Library page's export link passes this through when a collection
  // filter is active there, so "export just this assessment" and "export everything" are the same
  // endpoint with/without the param, not two separate routes.
  const collection = request.nextUrl.searchParams.get('collection')

  let query = supabase.from('citations').select('source_type, fields, bibliography_text').eq('user_id', user.id)
  if (collection === UNCATEGORISED_COLLECTION) query = query.is('label', null)
  else if (collection) query = query.eq('label', collection)

  const { data: citations, error } = await query

  if (error) {
    return NextResponse.json({ error: "Couldn't load your library — please try again." }, { status: 500 })
  }

  const rows = (citations ?? []) as { source_type: SourceType; fields: CitationFields; bibliography_text: string }[]

  // AGLC4 r 1.13: a bibliography is divided into lettered sections by source type, each entry
  // alphabetised within its own section (not across the whole document) — 'A' cases and 'B' cases
  // sort independently, so a Case-section entry starting with the same word as an unrelated
  // Legislation-section entry never interleaves with it.
  const sectionParagraphs = BIBLIOGRAPHY_SECTION_ORDER.flatMap((section) => {
    const entries = rows
      .filter((row) => bibliographySectionFor(row.source_type, row.fields) === section)
      .sort((a, b) => sortKey(a.bibliography_text).localeCompare(sortKey(b.bibliography_text)))

    if (entries.length === 0) return []

    return [
      new Paragraph({
        // Only the section name is italicised, per AGLC4's own r 1.13 heading style — the letter
        // itself stays roman. Neither run is bold — a plain-weight heading, not a bold one.
        children: [
          new TextRun({ text: `${section} `, size: CITATION_FONT_SIZE + 2 }),
          new TextRun({ text: BIBLIOGRAPHY_SECTION_LABELS[section], italics: true, size: CITATION_FONT_SIZE + 2 }),
        ],
        spacing: { before: 300, after: 200 },
      }),
      ...entries.map(
        (entry) =>
          new Paragraph({
            children: parseItalicsToRuns(entry.bibliography_text),
            indent: { left: 720, hanging: 720 }, // 0.5in hanging indent — standard bibliography format
            spacing: { after: 200 },
          }),
      ),
    ]
  })

  const bodyParagraphs =
    sectionParagraphs.length > 0
      ? sectionParagraphs
      : [
          new Paragraph({
            children: [new TextRun({ text: 'No citations saved yet.', font: CITATION_FONT, size: CITATION_FONT_SIZE })],
          }),
        ]

  const doc = new Document({
    sections: [
      {
        children: [
          // Not using the `heading: HeadingLevel.HEADING_1` shorthand here — it pulls in docx's
          // built-in Heading 1 style, which renders in the theme's accent colour (blue, by
          // default) in Word. Explicit runs with color: '000000' keep the title bold and large
          // without inheriting that colour, and use the same Times New Roman as the rest of the
          // document instead of the built-in style's own (different) heading font.
          new Paragraph({
            children: [new TextRun({ text: 'Bibliography', bold: true, size: 32, font: CITATION_FONT, color: '000000' })],
            spacing: { after: 300 },
          }),
          ...bodyParagraphs,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const date = new Date().toISOString().slice(0, 10)

  // Buffer is a Uint8Array subclass at runtime, but TS's BodyInit union here doesn't accept it
  // directly — an explicit Uint8Array wrap satisfies the type without copying semantics changing.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="pinpoint-bibliography-${date}.docx"`,
    },
  })
}
