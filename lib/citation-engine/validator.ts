import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CitationFields, SourceType } from './types'

const MODEL = 'claude-sonnet-4-6'

const ValidationSchema = z.object({
  isCorrect: z.boolean(),
  correctedFootnote: z.string().nullable(),
  correctedSubsequent: z.string().nullable(),
  correctedBibliography: z.string().nullable(),
  issues: z.array(z.string()),
  rule: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
})

export interface CitationTexts {
  footnote: string
  subsequent: string
  bibliography: string
}

export interface ValidationResult {
  isCorrect: boolean
  correctedFootnote?: string
  correctedSubsequent?: string
  correctedBibliography?: string
  issues?: string[]
  rule?: string
  confidence: 'high' | 'medium' | 'low'
}

// AGLC4 rule text embedded directly — do not attempt to load the source PDF at runtime.
const RULES_BY_SOURCE_TYPE: Record<SourceType, string> = {
  case: `AGLC4 Chapter 2 — Cases.
Reported decisions (r 2.2): [Case Name] (Year) Volume ReportAbbreviation StartingPage, Pinpoint (Judge). Year is in round brackets for volume-organised report series (eg CLR, FCR, VR, NSWLR, ALR, HCA, FCA) and in square brackets for year-organised series (eg Qd R, NZLR). If a volume number is used it sits between the year and the report abbreviation. Case names are italicised; ordinal numbers appear in square brackets, eg [No 2]. Pinpoints follow the starting page after a comma; paragraph pinpoints are in square brackets, page pinpoints are bare numbers. No full stops in abbreviations (CLR not C.L.R.).
Unreported with medium neutral citation (r 2.3.1): [Case Name] [Year] CourtCode CaseNumber, [Paragraph] (Judge). Year always square-bracketed; pinpoint is always a paragraph number in square brackets.
Unreported without medium neutral citation (r 2.3.2): [Case Name] (Court, Judge(s), Full Date) Pinpoint. Pinpoint is a bare page number.
General (ch 1): every footnote ends with a full stop.`,
  legislation: `AGLC4 Chapter 3 — Legislation.
Statutes (r 3.1): [Act Title Year] (Jurisdiction) PinpointType PinpointValue. The Act title and year are italicised together as one unit, eg *Privacy Act 1988*. The jurisdiction abbreviation (Cth, Vic, NSW, Qld, WA, SA, Tas, ACT, NT) follows in round brackets with no full stops — Cth, never C'th. The Australian Constitution is cited without jurisdiction brackets, eg *Australian Constitution* s 51(xxvi). Pinpoint abbreviations (s, ss, sch, pt, div, reg) carry no full stops.`,
  journal: `AGLC4 Chapter 5 — Journal Articles.
Format (r 5.1-5.7): Author(s), 'Article Title' (Year) Volume(Issue) [Journal Name] StartingPage, Pinpoint. Multiple authors are joined with commas and 'and' before the last, no Oxford comma. The article title is in single quotation marks, never italicised. Year is in round brackets for volume-organised journals; square brackets for year-organised journals with no volume, in which case the issue number alone appears in round brackets after the year, eg [2000] (1). The journal name is italicised. Pinpoints follow the starting page after a comma.`,
  book: `AGLC4 Chapter 6 — Books.
Whole book (r 6.1-6.4): Author(s), [Title] (Publisher, Year) Pinpoint. If not a first edition: (Publisher, Edition, Year), eg (Oxford University Press, 2nd ed, 2005). The title is italicised. The pinpoint is a bare page number with no comma before it.
Book chapters in edited books (r 6.6.1): ChapterAuthor(s), 'Chapter Title' in Editor(s) (ed) or (eds), [Book Title] (Publisher, Year) StartingPage, Pinpoint. 'ed' for one editor, 'eds' for more than one. The book title is italicised; the chapter title is in single quotation marks.`,
  report: `AGLC4 Chapter 7, r 7.1 — Reports and Similar Documents.
Format (r 7.1.1): Author(s), [Title] (DocumentType or SeriesNumber, Date) Pinpoint. The author is omitted entirely (including the leading comma) when not prominently indicated, eg for a Prime Minister's report with no named author. If a series number is given (eg 'Report No 129') it replaces the plain document type inside the parenthetical, followed by a comma and the date. The title is italicised.`,
  researchPaper: `AGLC4 Chapter 7 — Conference Papers, Theses, and Working/Research Papers.
Format: Author(s), 'Title' (DocumentType, Institution, Date) Pinpoint. Unlike a report, the title is in single quotation marks — never italicised — because these are papers within or presented to a larger body (a conference, a university, a working paper series), not standalone publications. DocumentType is a short descriptor: 'Conference Paper' for a paper presented at a conference (the Institution field then holds the conference name and Date is the full date, eg '4 July 2015'); 'PhD Thesis', 'Masters Thesis', or 'Honours Thesis' for a thesis (Institution holds the university name and Date is usually just the year); 'Working Paper' or 'Research Paper' for an unpublished/preprint paper (Institution holds the publishing body, and a series number, if any, eg 'Working Paper No 5', is appended to the document type inside the brackets). The pinpoint is a bare page/paragraph number with no comma before it, matching a report or a whole book.`,
  website: `AGLC4 Chapter 7, r 7.15 — Internet Materials.
Format: Author(s), 'Document Title', [Website Name] (Document Type, Date) Pinpoint <URL>. The author is omitted entirely when not indicated, or when it is identical to the website name. The document title is in single quotation marks, not italicised; the website name is italicised. Document type (Web Page, Blog Post, Forum Post) and date sit in round brackets — if no date is available, just the document type with no comma. The URL sits in angle brackets at the end, before the full stop. This rule is used only when no other AGLC4 rule applies to the source.`,
  treaty: `AGLC4 Chapter 8 — International Treaties.
Open multilateral treaties (r 8.1-8.3): [Treaty Title], opened for signature [Date], [Treaty Series] (entered into force [Date]) Pinpoint. If the treaty is not yet in force, the '(entered into force ...)' clause is omitted entirely.
Bilateral or trilateral treaties where the parties are not already in the title (r 8.4-8.7): [Treaty Title], [Party]-[Party], signed [Date], [Treaty Series] (entered into force [Date]) Pinpoint. Parties are joined with an en dash (not a hyphen), using conventional shortened state names, eg 'Australia' not 'Commonwealth of Australia'. In both forms the treaty title is always italicised.`,
}

// Bibliography formatting diverges from footnote/subsequent formatting in ways not covered by
// the per-source-type rule text above, and without this the validator tends to "correct" an
// already-correct bibliography back toward footnote-style formatting (eg re-adding a trailing
// full stop, or truncating a long author list to 'et al').
const BIBLIOGRAPHY_RULE = `Bibliography entry formatting (applies across all source types, and overrides anything above where they conflict): every author is listed in full — 'et al' is never used in a bibliography, no matter how many authors there are. Only the first-listed author's name is inverted to 'Surname, Given Name(s)'; every other author stays in normal 'Given Name(s) Surname' order, eg 'Ramsay, Ian and Cameron Sim'. A bibliography entry ends with no trailing full stop — it ends immediately after the citation's own final character (a page number, a closing '>', or a closing parenthesis), never with an added '.'.`

// Without this, the model has nothing to go on for what a subsequent reference should look
// like beyond copying the bibliography rule immediately above — which is the opposite of
// correct, since a subsequent reference always keeps its full stop.
const SUBSEQUENT_RULE = `Subsequent reference formatting (applies across all source types): like a footnote, a subsequent reference always ends with a trailing full stop — never omit it the way a bibliography entry does. For legislation specifically, the subsequent reference is the Act's short title only (the same title, with the year dropped) followed by the jurisdiction and pinpoint, exactly as in the footnote minus the year — legislation subsequent references do not use an '(n X)' back-reference the way other source types do.`

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

export async function validateCitation(
  citation: CitationTexts,
  sourceType: SourceType,
  fields: CitationFields,
): Promise<ValidationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: `${RULES_BY_SOURCE_TYPE[sourceType]}\n\n${BIBLIOGRAPHY_RULE}\n\n${SUBSEQUENT_RULE}`,
    output_config: {
      effort: 'low',
      format: zodOutputFormat(ValidationSchema),
    },
    messages: [
      {
        role: 'user',
        content: `Validate these three AGLC4 citation forms for a ${sourceType} — they are the footnote, subsequent reference, and bibliography entry for the same source, and must be corrected consistently with each other. Return JSON only: { isCorrect: boolean, correctedFootnote: string | null, correctedSubsequent: string | null, correctedBibliography: string | null, issues: string[], rule: string, confidence: 'high' | 'medium' | 'low' }. Only set a corrected* field when that specific form has an error — leave it null if that form is already correct, even if the other forms need fixing.

Footnote citation: ${citation.footnote}
Subsequent reference: ${citation.subsequent}
Bibliography entry: ${citation.bibliography}

Source fields used to generate them: ${JSON.stringify(fields)}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`Citation validation did not return usable output (stop_reason: ${response.stop_reason})`)
  }

  const parsed = response.parsed_output
  return {
    isCorrect: parsed.isCorrect,
    correctedFootnote: parsed.correctedFootnote ?? undefined,
    correctedSubsequent: parsed.correctedSubsequent ?? undefined,
    correctedBibliography: parsed.correctedBibliography ?? undefined,
    issues: parsed.issues,
    rule: parsed.rule,
    confidence: parsed.confidence,
  }
}
