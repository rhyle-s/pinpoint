import { NextResponse } from 'next/server'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { createClient } from '@/lib/supabase/server'

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

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in to export your bibliography.' }, { status: 401 })
  }

  const { data: citations, error } = await supabase
    .from('citations')
    .select('bibliography_text')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: "Couldn't load your library — please try again." }, { status: 500 })
  }

  const sorted = [...(citations ?? [])].sort((a, b) =>
    sortKey(a.bibliography_text).localeCompare(sortKey(b.bibliography_text)),
  )

  const entryParagraphs =
    sorted.length > 0
      ? sorted.map(
          (citation) =>
            new Paragraph({
              children: parseItalicsToRuns(citation.bibliography_text),
              indent: { left: 720, hanging: 720 }, // 0.5in hanging indent — standard bibliography format
              spacing: { after: 200 },
            }),
        )
      : [
          new Paragraph({
            children: [new TextRun({ text: 'No citations saved yet.', font: CITATION_FONT, size: CITATION_FONT_SIZE })],
          }),
        ]

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Bibliography', heading: HeadingLevel.HEADING_1, spacing: { after: 300 } }),
          ...entryParagraphs,
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
