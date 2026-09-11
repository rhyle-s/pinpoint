import { CitationResult, UNDocumentFields } from './types'
import { ensureFullStop, italicize, joinParts, stripTrailingFullStop } from './utils'

/** 'GA Res 217A (III)', or just 'GA Res 217A' if no session is known — undefined if there's no
 *  resolution number to build from at all. */
function buildResPart(fields: UNDocumentFields): string | undefined {
  if (!fields.resolutionNumber) return undefined
  return joinParts([`GA Res ${fields.resolutionNumber}`, fields.session ? `(${fields.session})` : undefined])
}

/** '(10 December 1948)', or '(2 October 2007, adopted 13 September 2007)' when the resolution's
 *  own formal document date differs from the date it was actually adopted by vote (see
 *  UNDocumentFields.adoptedDate) — or '' if no date is known at all. Built and appended separately
 *  from the comma-joined list below rather than as one more entry in it, the same way a treaty's
 *  '(entered into force ...)' clause is — it never takes a preceding comma, it just glues onto
 *  whatever the last real content turns out to be (the UN Doc symbol, the resolution number, or
 *  the title itself if none of those is known). */
function buildDatePart(fields: UNDocumentFields): string {
  if (!fields.date) return ''
  const adopted = fields.adoptedDate ? `, adopted ${fields.adoptedDate}` : ''
  return `(${fields.date}${adopted})`
}

// AGLC4 r 9.2.4's literal 'UN GAOR' component — a genuinely independent element from `session`
// (r 9.2's own element table lists 'Official Records' and 'Session (and Part) Number' as two
// separate rows), not derivable from it. An earlier version of this function inferred it purely
// from whether `session` (the older Roman-numeral scheme, eg '217A (III)') was present — which
// happened to match the only two worked examples on hand at the time (the UDHR includes 'UN
// GAOR', UNDRIP's newer '61/295' scheme omits it), but conflated two different rule elements.
// `includeOfficialRecords` is now its own explicit field — see the fuller comment on it in
// types.ts.
function buildCore(fields: UNDocumentFields): string {
  const titleItalic = italicize(fields.title)
  const listItems = [
    titleItalic,
    buildResPart(fields),
    fields.includeOfficialRecords ? 'UN GAOR' : undefined,
    fields.unDocSymbol ? `UN Doc ${fields.unDocSymbol}` : undefined,
  ]
  return joinParts([joinParts(listItems, ', '), buildDatePart(fields)])
}

export function generateUNDocumentCitation(fields: UNDocumentFields): CitationResult {
  const core = buildCore(fields)
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${core}${pinpoint}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpoint}`),
    bibliography: stripTrailingFullStop(core),
    // Overridden by international-material.ts's caller — 'unDocument' is no longer independently
    // a valid SourceType since it merged into 'internationalMaterial', but this function's own
    // return type still needs a valid placeholder.
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}
