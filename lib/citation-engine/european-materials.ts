import { CitationResult, InternationalMaterialFields } from './types'
import { ensureFullStop, formatPinpoint, italicize, joinParts, pinpointValue, quote, stripTrailingFullStop, wrapParens } from './utils'

/**
 * European Union / Council of Europe Materials (AGLC4 ch 14.2/14.3, 'Supranational Materials') —
 * six categories dispatched via `euCategory`. Every rule number and worked example cited below is
 * taken directly from the actual AGLC4 text (Melbourne Law School's own PDF, read via pymupdf —
 * including span-level font-flag checks to confirm italics/roman where the plain-text extraction
 * alone was ambiguous, eg the '(‘ShortTitle’)' short-title parenthetical), not memory.
 */

function subsequentAndSourceType(fields: InternationalMaterialFields, pinpointPart: string) {
  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'
  return {
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    sourceType: 'internationalMaterial' as const,
    validationStatus: 'unvalidated' as const,
  }
}

// A bare, space-prefixed (non-comma) pinpoint — used everywhere a paragraph pinpoint attaches
// directly after a closing parenthesis with no comma, confirmed against the Huawei v ZTE ('...
// 2015) [9].') and S v United Kingdom ('... 2008) [125].') worked examples.
function bareParagraphPinpoint(pinpoint?: string): string {
  return pinpoint ? ` ${pinpointValue(pinpoint, 'paragraph')}` : ''
}

// ---------------------------------------------------------------------------------------------
// 14.2.1 — Official Journal of the European Union
// ---------------------------------------------------------------------------------------------

/** The 'OJ ...' component itself, eg 'OJ L 95/29', 'OJ S 240' (no starting page), 'OJ C 3 E/1'
 *  (digital-only C series). Undefined if there's no issue number to build a real reference from —
 *  the bare-title case, eg the user's own Directive 93/13 example, which omits the OJ reference
 *  entirely (a departure from AGLC4's own worked example for that exact document, which DOES
 *  include '[1993] OJ L 95/29, art 3(1)'; both are supported, since a student may only have the
 *  title to hand), or a post-2023-scheme document autofill has filled in (see eu-cellar.ts) —
 *  where the series alone is reliably known but AGLC4 defines no citation form for the sequential
 *  document number that would normally follow it. The series is deliberately checked ALONE as
 *  insufficient to emit anything — a bare, dangling 'OJ L' with nothing after it (confirmed as a
 *  real, live rendering issue: exactly this happened before this guard was tightened) reads as a
 *  broken citation, not a partial one; the series is still visible and editable in the form
 *  itself, it just doesn't render into the generated text until there's an issue number too. */
function buildOJCore(fields: InternationalMaterialFields): string | undefined {
  if (!fields.ojIssueNumber) return undefined
  const seriesPart = fields.ojSeries ? ` ${fields.ojSeries}` : ''
  if (fields.ojSeries === 'S') {
    // Invitations to tender (r 14.2.1) — no starting page at all.
    return `OJ${seriesPart} ${fields.ojIssueNumber ?? ''}`
  }
  // The digital-only part of the C series (from 2016) space-joins the issue number to an 'E/'-
  // prefixed page ('OJ C 3 E/1'), unlike the ordinary unspaced-slash join every other series uses
  // ('OJ L 1/72') — confirmed against the '[2009] OJ C 3 E/1.' worked example.
  if (fields.ojIsDigitalOnlyC) {
    return `OJ${seriesPart} ${joinParts([fields.ojIssueNumber, `E/${fields.ojStartingPage ?? ''}`])}`
  }
  return `OJ${seriesPart} ${joinParts([fields.ojIssueNumber, fields.ojStartingPage], '/')}`
}

function buildOJPart(fields: InternationalMaterialFields): string {
  const core = buildOJCore(fields)
  if (!core) return ''
  const yearBracket = fields.year ? `[${fields.year}]` : ''
  const main = joinParts([yearBracket, core])
  // Pre-1974 parallel Special Edition citation, preceded by a semicolon (r 14.2.1) — eg '[1970]
  // OJ L 224/1; [1970] OJ Spec Ed 623'.
  const specEd = fields.ojSpecEdStartingPage
    ? `; [${fields.ojSpecEdYear || fields.year || ''}] OJ Spec Ed ${fields.ojSpecEdStartingPage}`
    : ''
  return ` ${main}${specEd}`
}

function formatOfficialJournal(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const ojPart = buildOJPart(fields)
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${titleItalic}${ojPart}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// 14.2.2 / 14.3.1 — Constitutive Treaties of the EU / Basic Documents of the Council of Europe
// ---------------------------------------------------------------------------------------------

/** Both cited as ordinary treaties (ch 8), sharing one formatter — the only differences are the
 *  badge/rule label shown to the student, not the citation shape itself. A short title, when
 *  given, is included inline in the first citation per r 14.2.2's own table (EU treaties) or the
 *  general r 1.4.4 'may be given a short title' allowance r 14.6 extends to this chapter (Council
 *  of Europe documents) — confirmed via font-flag check that the short title itself IS italicised
 *  even inside its quote marks, eg '(entered into force 1 November 1998) (‘*ECHR*’).', not a bare
 *  roman '(‘ECHR’)'. */
function buildEUTreatyCore(fields: InternationalMaterialFields): string {
  const titleItalic = italicize(fields.title ?? '')
  const dateClause = fields.openedForSignature
    ? `opened for signature ${fields.openedForSignature}`
    : fields.signedDate
      ? `signed ${fields.signedDate}`
      : undefined
  const mainList = joinParts([titleItalic, dateClause, fields.treatySeries || undefined], ', ')
  const forcePart = fields.enteredIntoForce ? ` (entered into force ${fields.enteredIntoForce})` : ''
  // The amendment clause (r 14.2.2/14.3.1) takes a fully pre-formatted citation of the amending
  // treaty, the same way `treatySeries` elsewhere is pre-formatted free text rather than several
  // separate fields — a second nested treaty citation isn't worth its own field set for what's a
  // comparatively rare citation need.
  const amendedPart = fields.euAmendedByCitation ? `, as amended by ${fields.euAmendedByCitation}` : ''
  // The short title comes AFTER the amendment clause, not before it — confirmed against AGLC4's
  // own worked example 51 (ECHR as amended by Protocol No 11), where '(‘ECHR’)' sits at the very
  // end, following the amending treaty's own '(entered into force ...)' clause.
  const shortTitlePart = fields.shortTitle ? ` (${quote(italicize(fields.shortTitle))})` : ''
  return `${mainList}${forcePart}${amendedPart}${shortTitlePart}`
}

function formatEUTreaty(fields: InternationalMaterialFields): CitationResult {
  const core = buildEUTreatyCore(fields)
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// 14.2.3 — Courts of the European Union (CJEU / General Court / EU Civil Service Tribunal)
// ---------------------------------------------------------------------------------------------

/** Reported (in the ECR/ECR-SC) — '*Parties* (CaseNumber) [Year] [Volume ]ReportAbbrev
 *  StartingPage, Pinpoint.' Eg 'Costa v ENEL (C-6/64) [1964] ECR 585, 594.' / 'Grad v Finanzamt
 *  Traunstein (C-9/70) [1970] 2 ECR 825, 833.' (the rare optional volume number, via the shared
 *  `volume` field) / 'Vainker v European Parliament (T-48/01) [2004] ECR-SC II-197, II-207.' (the
 *  ECR-SC's Section II prefix typed directly into `startingPage`). */
function formatCJEUReported(fields: InternationalMaterialFields): CitationResult {
  const partiesItalic = italicize(fields.title ?? '')
  const caseNumPart = fields.euCaseNumber ? ` (${fields.euCaseNumber})` : ''
  const yearBracket = fields.year ? `[${fields.year}]` : ''
  const reportPart = joinParts([fields.volume, fields.reportAbbreviation, fields.startingPage])
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${partiesItalic}${caseNumPart} ${joinParts([yearBracket, reportPart])}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** Unreported — '*Parties* (CourtName, CaseNumber, ECLI, FullDate) [Pinpoint].' Eg 'Huawei
 *  Technologies Co Ltd v ZTE Corporation (Court of Justice of the European Union, C-170/13,
 *  ECLI:EU:C:2015:477, 16 July 2015) [9].' The ECLI is included only when available (r 14.2.3),
 *  preceded and followed by a comma — achieved here simply by joining it into the same
 *  comma-separated list as everything else. */
function formatCJEUUnreported(fields: InternationalMaterialFields): CitationResult {
  const partiesItalic = italicize(fields.title ?? '')
  const inner = joinParts([fields.euCourtName, fields.euCaseNumber, fields.euEcli, fields.date], ', ')
  const pinpointPart = bareParagraphPinpoint(fields.pinpoint)
  const core = `${partiesItalic} (${inner})`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

function formatCJEU(fields: InternationalMaterialFields): CitationResult {
  return fields.euCourtReported ? formatCJEUReported(fields) : formatCJEUUnreported(fields)
}

// ---------------------------------------------------------------------------------------------
// 14.3.2 — European Court of Human Rights
// ---------------------------------------------------------------------------------------------

function buildEchrParties(fields: InternationalMaterialFields): string {
  const partiesItalic = italicize(fields.title ?? '')
  const phasePart = fields.euPhase ? ` (${italicize(fields.euPhase)})` : ''
  return `${partiesItalic}${phasePart}`
}

/** Ser A (until end of 1995) — 'Parties (Phase) (Year) Volume[-Letter] Eur Court HR (ser A)
 *  [Pinpoint] [(Judge)].' No starting page (r 14.3.2 — the series' pagination restarts for each
 *  case, so what would otherwise be a starting page is instead a bare pinpoint), eg 'Nasri v
 *  France (1995) 320-B Eur Court HR (ser A) 28 (Judge Pettiti).' / 'Loizidou v Turkey (Preliminary
 *  Objections) (1995) 310 Eur Court HR (ser A).' (no pinpoint at all). */
function formatEchrSerA(fields: InternationalMaterialFields): CitationResult {
  const parties = buildEchrParties(fields)
  const core = `${parties} (${fields.year ?? ''}) ${joinParts([fields.volume, 'Eur Court HR (ser A)'])}`
  const pinpointPart = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const judgePart = fields.judge ? ` ${wrapParens(fields.judge)}` : ''

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}${judgePart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** Year-organised (from 1996) — 'Parties (Phase) [Year] VolumeRoman Eur Court HR StartingPage,
 *  Pinpoint.' Eg 'Bouchelkia v France [1997] I Eur Court HR 47, 67.' / 'MSS v Belgium [2011] I Eur
 *  Court HR 255.' (no pinpoint). */
function formatEchrYearOrganised(fields: InternationalMaterialFields): CitationResult {
  const parties = buildEchrParties(fields)
  const core = `${parties} [${fields.year ?? ''}] ${joinParts([fields.volume, 'Eur Court HR', fields.startingPage])}`
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** Unreported — 'Parties (Phase) (European Court of Human Rights, Chamber, Application No(s)
 *  Number, Full Date) [Pinpoint].' Eg 'S v United Kingdom (European Court of Human Rights, Grand
 *  Chamber, Application Nos 30562/04 and 30566/04, 4 December 2008) [125].' */
function formatEchrUnreported(fields: InternationalMaterialFields): CitationResult {
  const parties = buildEchrParties(fields)
  const applicationPart = fields.euApplicationNumber ? `Application ${fields.euApplicationNumber}` : ''
  const inner = joinParts(['European Court of Human Rights', fields.euChamber, applicationPart, fields.date], ', ')
  const pinpointPart = bareParagraphPinpoint(fields.pinpoint)
  const core = `${parties} (${inner})`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** Pleadings (ser B, until 1988) — ''Document Title', Complainant v Respondent State [Year] Eur
 *  Court HR (ser B) StartingPage, Pinpoint.' Eg ''The Case of Gerard Richard Lawless — Memorial
 *  Submitted by the European Commission of Human Rights', Lawless v Ireland [1960–61] Eur Court HR
 *  (ser B) 193, 201.' The document title is quoted, not italicised. */
function formatEchrPleadings(fields: InternationalMaterialFields): CitationResult {
  const docTitlePart = fields.euDocumentTitle ? `${quote(fields.euDocumentTitle)}, ` : ''
  const parties = buildEchrParties(fields)
  const core = `${docTitlePart}${parties} [${fields.year ?? ''}] Eur Court HR (ser B) ${fields.startingPage ?? ''}`
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

function formatEchr(fields: InternationalMaterialFields): CitationResult {
  switch (fields.euEchrFormat) {
    case 'reportedSeriesA':
      return formatEchrSerA(fields)
    case 'unreported':
      return formatEchrUnreported(fields)
    case 'pleadings':
      return formatEchrPleadings(fields)
    case 'reportedYearOrganised':
    default:
      return formatEchrYearOrganised(fields)
  }
}

// ---------------------------------------------------------------------------------------------
// 14.3.3 — European Commission of Human Rights
// ---------------------------------------------------------------------------------------------

/** One format only — 'Parties (Year) Volume Eur Comm HR StartingPage, Pinpoint.' Eg 'Klass v
 *  Federal Republic of Germany (1978) 1 Eur Comm HR 20, 29.' / 'X v Austria (1979) 17 Eur Comm HR
 *  80, 85–6.' Parties adhere to the same r 14.3.2 convention (r 14.3.3) — reuses buildEchrParties
 *  for the phase-parenthetical support, though a phase is genuinely rare for Commission decisions. */
function formatEuropeanCommission(fields: InternationalMaterialFields): CitationResult {
  const parties = buildEchrParties(fields)
  const core = `${parties} (${fields.year ?? ''}) ${joinParts([fields.volume, 'Eur Comm HR', fields.startingPage])}`
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------------------------

const BADGE_BY_EU_CATEGORY: Record<NonNullable<InternationalMaterialFields['euCategory']>, string> = {
  officialJournal: 'Official Journal of the EU',
  constitutiveTreaty: 'EU Constitutive Treaty',
  court: 'Court of the European Union',
  councilOfEuropeBasicDocument: 'Council of Europe Basic Document',
  europeanCourtOfHumanRights: 'European Court of Human Rights',
  europeanCommissionOfHumanRights: 'European Commission of Human Rights',
}

const RULE_LABEL_BY_EU_CATEGORY: Record<NonNullable<InternationalMaterialFields['euCategory']>, string> = {
  officialJournal: 'AGLC4 r 14.2.1',
  constitutiveTreaty: 'AGLC4 r 14.2.2',
  court: 'AGLC4 r 14.2.3',
  councilOfEuropeBasicDocument: 'AGLC4 r 14.3.1',
  europeanCourtOfHumanRights: 'AGLC4 r 14.3.2',
  europeanCommissionOfHumanRights: 'AGLC4 r 14.3.3',
}

/** A second-level badge, more specific than a flat 'European Union Materials' label — mirrors
 *  foreignDomesticBadge()/otherLegislativeMaterialBadge(). */
export function europeanMaterialsBadge(fields: InternationalMaterialFields): string {
  if (!fields.euCategory) return 'European Union Materials'
  return BADGE_BY_EU_CATEGORY[fields.euCategory]
}

/** The AGLC4 rule reference shown in the UI — mirrors foreignDomesticRuleLabel(). */
export function europeanMaterialsRuleLabel(fields: InternationalMaterialFields): string {
  if (!fields.euCategory) return 'AGLC4 ch 14'
  return RULE_LABEL_BY_EU_CATEGORY[fields.euCategory]
}

export function generateEuropeanMaterialsCitation(fields: InternationalMaterialFields): CitationResult {
  switch (fields.euCategory) {
    case 'officialJournal':
      return formatOfficialJournal(fields)
    case 'constitutiveTreaty':
    case 'councilOfEuropeBasicDocument':
      return formatEUTreaty(fields)
    case 'court':
      return formatCJEU(fields)
    case 'europeanCourtOfHumanRights':
      return formatEchr(fields)
    case 'europeanCommissionOfHumanRights':
      return formatEuropeanCommission(fields)
    default:
      // No category selected yet — a blank-ish placeholder so the output panel doesn't crash
      // before the student has picked one, matching generateForeignDomesticCitation's own default.
      return {
        footnote: '',
        subsequent: '',
        bibliography: '',
        sourceType: 'internationalMaterial',
        validationStatus: 'unvalidated',
      }
  }
}
