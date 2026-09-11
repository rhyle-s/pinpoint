import { CitationResult, TreatyFields } from './types'
import { ensureFullStop, italicize, joinParts, stripTrailingFullStop } from './utils'

/**
 * r 8.3.2's merged form: where a bilateral/trilateral treaty's signature date and entry-into-
 * force date are the SAME, the ordinary 'signed Date, Series (entered into force Date)' shape
 * collapses to 'Series (signed and entered into force Date)' — the separate 'signed Date,' clause
 * is dropped entirely, not just glued onto the merged parenthetical, confirmed against AGLC4's own
 * worked example: 'Agreement Relating to Co-operation on Antitrust Matters, Australia–United
 * States of America, 1369 UNTS 43 (signed and entered into force 29 June 1982).' Only applies to
 * the 'signed by all parties' form (r 8.3.2's own heading) — an 'opened for signature' multilateral
 * treaty (r 8.3.1) has no equivalent merged form in AGLC4 at all, so this is deliberately scoped to
 * non-multilateral treaties only.
 */
function hasSameSignedAndForceDate(fields: TreatyFields): boolean {
  return (
    fields.treatyType !== 'multilateral' &&
    !!fields.signedDate &&
    !!fields.enteredIntoForce &&
    fields.signedDate.trim() === fields.enteredIntoForce.trim()
  )
}

function buildForcePart(fields: TreatyFields): string {
  if (hasSameSignedAndForceDate(fields)) return `(signed and entered into force ${fields.enteredIntoForce})`
  return fields.enteredIntoForce ? `(entered into force ${fields.enteredIntoForce})` : ''
}

// treatySeries is legitimately blank for a treaty sourced from a document that predates UN
// registration (eg the treaty's own signed text, or a depositary/agency circular reproducing it,
// confirmed on a real IAEA INFCIRC circular with no UNTS number to extract). The "(entered into
// force ...)" clause never takes a preceding comma — it always attaches as a plain suffix to
// whichever piece of content ends up last (the series number when there is one, otherwise the
// date directly). So it's deliberately built and appended *outside* the comma-joined list of
// "Title, [parties,] [opened for signature/signed Date,] [Series]" pieces below, rather than
// being one more entry in that list — treating it as just another list item was tried first and
// still left a stray comma stranded in front of the parenthetical whenever treatySeries was
// missing, since every other item in a comma-joined list gets a comma whether or not the
// following item exists.
function buildCore(fields: TreatyFields): string {
  const titleItalic = italicize(fields.title)
  const forcePart = buildForcePart(fields)
  const mergedDate = hasSameSignedAndForceDate(fields)

  const listItems =
    fields.treatyType === 'multilateral'
      ? [
          titleItalic,
          fields.openedForSignature ? `opened for signature ${fields.openedForSignature}` : undefined,
          fields.treatySeries || undefined,
        ]
      : [
          titleItalic,
          fields.parties && fields.parties.length > 0 ? fields.parties.join('–') : undefined,
          // Dropped entirely (not just left blank in the list) when the merged form applies —
          // the date itself only appears once, inside forcePart's own '(signed and entered into
          // force ...)' parenthetical.
          !mergedDate && fields.signedDate ? `signed ${fields.signedDate}` : undefined,
          fields.treatySeries || undefined,
        ]

  return joinParts([joinParts(listItems, ', '), forcePart])
}

export function generateTreatyCitation(fields: TreatyFields): CitationResult {
  const core = buildCore(fields)
  const pinpoint = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title)
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${core}${pinpoint}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpoint}`),
    bibliography: stripTrailingFullStop(core),
    // Overridden by international-material.ts's caller — 'treaty' is no longer independently a
    // valid SourceType since it merged into 'internationalMaterial', but this function's own
    // return type still needs a valid placeholder.
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}
