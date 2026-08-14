import { CitationResult, LegislationFields } from './types'
import { ensureFullStop, italicize, joinParts, stripTrailingFullStop, wrapParens } from './utils'

function jurisdictionPart(fields: LegislationFields): string {
  return fields.jurisdiction === 'none' ? '' : wrapParens(fields.jurisdiction)
}

function pinpointPart(fields: LegislationFields): string {
  if (!fields.pinpointType || !fields.pinpointValue) return ''
  return joinParts([fields.pinpointType, fields.pinpointValue.trim()])
}

export function generateLegislationCitation(fields: LegislationFields): CitationResult {
  const fullTitle = italicize(joinParts([fields.actTitle, fields.year]))
  const shortTitle = italicize(fields.actTitle)
  const jurisdiction = jurisdictionPart(fields)
  const pinpoint = pinpointPart(fields)

  const footnote = ensureFullStop(joinParts([fullTitle, jurisdiction, pinpoint]))
  const bibliography = stripTrailingFullStop(joinParts([fullTitle, jurisdiction]))
  const subsequent = ensureFullStop(joinParts([shortTitle, jurisdiction, pinpoint]))

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'legislation',
    validationStatus: 'unvalidated',
  }
}
