import { CaseFields, CitationResult } from './types'
import { getBracketType } from './report-series'
import { ensureFullStop, formatPinpoint, italicize, joinParts, pinpointValue, stripPilcrow, wrapParens } from './utils'
import { deriveCaseShortTitle, formatAboveN } from './subsequent'

function formatReported(fields: CaseFields): { footnote: string; bibliography: string } {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  const yearPart = bracket === 'round' ? `(${fields.year})` : `[${fields.year}]`
  const citationCore = joinParts([yearPart, fields.volume, fields.reportAbbreviation, stripPilcrow(fields.startingPage)])
  const pinpointPart = formatPinpoint(fields.pinpoint, fields.pinpointType)
  const judgePart = fields.judge ? ` (${fields.judge})` : ''
  const caseNameItalic = italicize(fields.caseName)

  return {
    footnote: ensureFullStop(`${caseNameItalic} ${citationCore}${pinpointPart}${judgePart}`),
    // No trailing full stop in the bibliography entry — unlike the footnote, per the requested
    // formatting for case bibliography entries.
    bibliography: `${caseNameItalic} ${citationCore}`,
  }
}

function formatUnreportedMnc(fields: CaseFields): { footnote: string; bibliography: string } {
  const citationCore = joinParts([`[${fields.year}]`, fields.courtCode, fields.caseNumber])
  const pinpointPart = formatPinpoint(fields.pinpoint, 'paragraph')
  const judgePart = fields.judge ? ` (${fields.judge})` : ''
  const caseNameItalic = italicize(fields.caseName)

  return {
    footnote: ensureFullStop(`${caseNameItalic} ${citationCore}${pinpointPart}${judgePart}`),
    bibliography: `${caseNameItalic} ${citationCore}`,
  }
}

function formatUnreportedNoMnc(fields: CaseFields): { footnote: string; bibliography: string } {
  const parenthetical = wrapParens(joinParts([fields.court, fields.judge, fields.date], ', '))
  const pinpointPart = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const caseNameItalic = italicize(fields.caseName)

  return {
    footnote: ensureFullStop(`${caseNameItalic} ${parenthetical}${pinpointPart}`),
    bibliography: `${caseNameItalic} ${parenthetical}`,
  }
}

function formatSubsequent(fields: CaseFields): string {
  const shortTitle = italicize(fields.shortTitle || deriveCaseShortTitle(fields.caseName))
  const footnoteNumber = fields.footnoteNumber || '1'
  const pinpointType = fields.reportType === 'unreported-mnc' ? 'paragraph' : (fields.pinpointType ?? 'page')
  const pinpoint = pinpointValue(fields.pinpoint, pinpointType)
  return formatAboveN(shortTitle, footnoteNumber, pinpoint)
}

export function generateCaseCitation(fields: CaseFields): CitationResult {
  const { footnote, bibliography } =
    fields.reportType === 'reported'
      ? formatReported(fields)
      : fields.reportType === 'unreported-mnc'
        ? formatUnreportedMnc(fields)
        : formatUnreportedNoMnc(fields)

  return {
    footnote,
    subsequent: formatSubsequent(fields),
    bibliography,
    sourceType: 'case',
    validationStatus: 'unvalidated',
  }
}
