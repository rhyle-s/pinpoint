import { CitationResult, OtherLegislativeMaterialFields } from './types'
import { generateLegislationCitation } from './legislation'
import { formatAboveN } from './subsequent'
import { ensureFullStop, italicize, joinParts, quote, stripTrailingFullStop } from './utils'

/** Bill title + year, joined but deliberately never italicised (r 3.2's key departure from an
 *  ordinary Act citation) — shared by the bill and explanatoryMaterial subtypes. */
function billCitationCore(fields: OtherLegislativeMaterialFields): string {
  const title = joinParts([fields.billTitle, fields.billYear])
  const jurisdiction = fields.billJurisdiction ? `(${fields.billJurisdiction})` : ''
  return joinParts([title, jurisdiction])
}

function formatBill(fields: OtherLegislativeMaterialFields): { footnote: string; bibliography: string } {
  const core = billCitationCore(fields)
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  return {
    footnote: ensureFullStop(`${core}${pinpoint}`),
    bibliography: stripTrailingFullStop(core),
  }
}

function formatExplanatoryMaterial(fields: OtherLegislativeMaterialFields): { footnote: string; bibliography: string } {
  const label = fields.explanatoryLabel || 'Explanatory Memorandum'
  const core = `${label}, ${billCitationCore(fields)}`
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  return {
    footnote: ensureFullStop(`${core}${pinpoint}`),
    bibliography: stripTrailingFullStop(core),
  }
}

/**
 * r 3.9.1 — [Author, ]['Article Title' in ]Jurisdiction, [Italic]Gazette Name, No X, Date[,
 * StartingPage[, Pinpoint]]. The starting page and pinpoint are both optional and independent: a
 * whole-gazette citation has neither, a citation to one notice usually has a starting page, and a
 * pinpoint to a specific point within that notice adds a second, comma-joined number after it.
 */
function formatGazette(fields: OtherLegislativeMaterialFields): { footnote: string; bibliography: string } {
  const authorPrefix = fields.gazetteAuthor ? `${fields.gazetteAuthor}, ` : ''
  const titlePrefix = fields.gazetteArticleTitle ? `${quote(fields.gazetteArticleTitle)} in ` : ''
  const core = joinParts(
    [fields.gazetteJurisdiction, italicize(fields.gazetteName ?? ''), fields.gazetteNumber, fields.gazetteDate],
    ', ',
  )
  const pageSuffix = fields.gazetteStartingPage
    ? fields.pinpoint
      ? `, ${fields.gazetteStartingPage.trim()}, ${fields.pinpoint.trim()}`
      : `, ${fields.gazetteStartingPage.trim()}`
    : ''
  const full = `${authorPrefix}${titlePrefix}${core}${pageSuffix}`
  return {
    footnote: ensureFullStop(full),
    bibliography: stripTrailingFullStop(full),
  }
}

/** The 'PracticeType No X: Title' segment — the direction/note's own name, italicised as a unit
 *  (confirmed: this was originally built without italics, but that's wrong — it's the name of the
 *  instrument itself, the same way an Act's or a gazette's own name is italicised). Court and date
 *  frame it but aren't part of the italicised span. */
function practiceDirectionCore(fields: OtherLegislativeMaterialFields): string {
  const type = fields.practiceType || 'Practice Note'
  return joinParts([joinParts([type, fields.practiceNumber]), fields.practiceTitle], ': ')
}

/** Court, [Italic]PracticeType No X of Year: Title[/Italic], Date. */
function formatPracticeDirection(fields: OtherLegislativeMaterialFields): { footnote: string; bibliography: string } {
  const full = joinParts([fields.court, italicize(practiceDirectionCore(fields)), fields.practiceDate], ', ')
  return {
    footnote: ensureFullStop(full),
    bibliography: stripTrailingFullStop(full),
  }
}

/**
 * r 3.6 — a constitution (the bare Commonwealth 'Australian Constitution', or a state/territory's
 * own constituting Act, eg 'Constitution Act 1902 (NSW)') is cited exactly like ordinary
 * legislation, so this delegates to generateLegislationCitation rather than reimplementing the
 * same title/year/jurisdiction/pinpoint formula a second time.
 */
function formatConstitution(fields: OtherLegislativeMaterialFields): CitationResult {
  const result = generateLegislationCitation({
    actTitle: fields.constitutionTitle ?? '',
    year: fields.constitutionYear ?? '',
    jurisdiction: fields.constitutionJurisdiction ?? 'none',
    pinpointType: fields.constitutionPinpointType,
    pinpointValue: fields.constitutionPinpointValue,
    // Passed through so a Constitution's subsequent reference can use the same shared
    // footnoteNumber/shortTitle fields every other subtype in this file already respects, now
    // that generateLegislationCitation itself correctly builds a '(n X)' cross-reference (AGLC4
    // r 1.4.1) instead of the placeholder-only subsequent reference it used to produce.
    footnoteNumber: fields.footnoteNumber,
    shortTitle: fields.shortTitle,
  })
  return { ...result, sourceType: 'otherLegislativeMaterial' }
}

function formatSubsequent(fields: OtherLegislativeMaterialFields, shortTitle: string): string {
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpoint = fields.pinpoint?.trim()
  return formatAboveN(shortTitle, footnoteNumber, pinpoint)
}

/** The UI badge naming which of the five sub-categories was detected/selected — as specific as
 *  the data allows (eg the exact 'Practice Note' vs 'Practice Direction', or which of the four
 *  explanatory-material labels), not just a generic category name. */
export function otherLegislativeMaterialBadge(fields: OtherLegislativeMaterialFields): string {
  switch (fields.subtype) {
    case 'bill':
      return 'Bill'
    case 'explanatoryMaterial':
      return fields.explanatoryLabel || 'Explanatory Memorandum'
    case 'gazette':
      return 'Gazette'
    case 'practiceDirection':
      return fields.practiceType || 'Practice Note'
    case 'constitution':
      return 'Constitution'
  }
}

export function generateOtherLegislativeMaterialCitation(fields: OtherLegislativeMaterialFields): CitationResult {
  if (fields.subtype === 'constitution') {
    return formatConstitution(fields)
  }

  const { footnote, bibliography } =
    fields.subtype === 'bill'
      ? formatBill(fields)
      : fields.subtype === 'explanatoryMaterial'
        ? formatExplanatoryMaterial(fields)
        : fields.subtype === 'gazette'
          ? formatGazette(fields)
          : formatPracticeDirection(fields)

  // Bill/explanatoryMaterial/gazette short titles are never italicised, matching their footnote
  // treatment (a Bill's title is plain per r 3.2; a gazette notice's title is quoted, not
  // italicised). A practice direction/note's own name *is* italicised — same as in its footnote —
  // so a student-supplied override goes through the same italicize() call as the derived default.
  const shortTitle =
    fields.subtype === 'practiceDirection'
      ? italicize(fields.shortTitle || practiceDirectionCore(fields))
      : fields.shortTitle ||
        (fields.subtype === 'bill' || fields.subtype === 'explanatoryMaterial'
          ? fields.billTitle ?? ''
          : fields.subtype === 'gazette'
            ? fields.gazetteArticleTitle || fields.gazetteName || ''
            : '')

  return {
    footnote,
    subsequent: formatSubsequent(fields, shortTitle),
    bibliography,
    sourceType: 'otherLegislativeMaterial',
    validationStatus: 'unvalidated',
  }
}
