import { CitationResult, LegislationFields } from './types'
import { ensureFullStop, italicize, joinParts, stripTrailingFullStop, wrapParens } from './utils'
import { formatAboveN } from './subsequent'

function jurisdictionPart(fields: LegislationFields): string {
  // 'none' = deliberately omitted (Constitution); 'unknown' = not selected yet — render nothing
  // either way (the missing bracket for 'unknown' is surfaced via getMissingFieldsWarning).
  if (fields.jurisdiction === 'none' || fields.jurisdiction === 'unknown') return ''
  return wrapParens(fields.jurisdiction)
}

function pinpointPart(fields: LegislationFields): string {
  if (!fields.pinpointType || !fields.pinpointValue) return ''
  return joinParts([fields.pinpointType, fields.pinpointValue.trim()])
}

export function generateLegislationCitation(fields: LegislationFields): CitationResult {
  const fullTitle = italicize(joinParts([fields.actTitle, fields.year]))
  const jurisdiction = jurisdictionPart(fields)
  const pinpoint = pinpointPart(fields)

  const footnote = ensureFullStop(joinParts([fullTitle, jurisdiction, pinpoint]))
  const bibliography = stripTrailingFullStop(joinParts([fullTitle, jurisdiction]))

  // AGLC4 r 1.4.1: "For cases and legislation, a short title... may be used followed by a
  // cross-reference in parentheses" — confirmed against the Guide's own worked examples
  // ('ADJR Act (n 46) s 7.', explicitly annotated '[Not: ADJR Act s 7.]' for omitting '(n 46)').
  // The short title replaces the WHOLE 'Title Year (Jurisdiction)' portion in a subsequent
  // reference — both the year AND the jurisdiction are dropped, not just the year — confirmed by
  // that same example never showing '(Cth)' after 'ADJR Act'. A previous version of this function
  // built its own '[Short Title] (Jurisdiction) Pinpoint' subsequent reference with no footnote
  // cross-reference at all, which AGLC4's own '[Not: ...]' annotation directly rules out.
  const shortTitle = italicize(fields.shortTitle || fields.actTitle)
  const footnoteNumber = fields.footnoteNumber || '1'
  const subsequent = formatAboveN(shortTitle, footnoteNumber, pinpoint)

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'legislation',
    validationStatus: 'unvalidated',
  }
}
