import { CitationResult, TreatyFields } from './types'
import { ensureFullStop, italicize, joinParts } from './utils'

function buildForcePart(fields: TreatyFields): string {
  return fields.enteredIntoForce ? ` (entered into force ${fields.enteredIntoForce})` : ''
}

function buildCore(fields: TreatyFields): string {
  const titleItalic = italicize(fields.title)
  const forcePart = buildForcePart(fields)

  if (fields.treatyType === 'multilateral') {
    return joinParts([
      `${titleItalic},`,
      fields.openedForSignature ? `opened for signature ${fields.openedForSignature},` : undefined,
      `${fields.treatySeries}${forcePart}`,
    ])
  }

  const partiesSegment = fields.parties && fields.parties.length > 0 ? `${fields.parties.join('–')},` : undefined
  return joinParts([
    `${titleItalic},`,
    partiesSegment,
    fields.signedDate ? `signed ${fields.signedDate},` : undefined,
    `${fields.treatySeries}${forcePart}`,
  ])
}

export function generateTreatyCitation(fields: TreatyFields): CitationResult {
  const core = buildCore(fields)
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${core}${pinpoint}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpoint}`),
    bibliography: ensureFullStop(core),
    sourceType: 'treaty',
    validationStatus: 'unvalidated',
  }
}
