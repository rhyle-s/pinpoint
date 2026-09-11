import 'server-only'
import {
  EUIdentifier,
  bestEffortCaseParties,
  cleanOJDocumentTitle,
  deriveCourtCaseFromCelex,
  deriveNewSchemeOJIdentifierFromCelex,
  deriveOJSeriesFromCelex,
  deriveOJYear,
  extractExpressionTitle,
  findEnglishExpressionCellarId,
  findOldSchemeOJReference,
  findOwnEcli,
  findOwnOJIdentifier,
  parseWorkDate,
} from './eu-cellar-parse'
import { AutofillResult } from './types'
import { InternationalMaterialFields, OJSeries } from '../citation-engine/types'

// Deliberately no import from './ai-extract' here, even though the only two callers of this
// module (index.ts, for a EUR-Lex URL, and ai-extract.ts's own aiExtractFromPdfMetadata, for a
// EUR-Lex PDF upload whose filename carries a CELEX number) both want to fall back to the ordinary
// AI-extraction path on failure — ai-extract.ts importing this module AND this module importing
// ai-extract.ts would be a circular import. Each caller supplies its own fallback instead (see
// fetchEuropeanUnionByIdentifier's return type: null, not a placeholder result, on failure).

// eur-lex.europa.eu itself is genuinely AWS-WAF-blocked (HTTP 202, empty body, `x-amzn-waf-action:
// challenge`, regardless of User-Agent — confirmed by direct testing) — every URL form the user
// pastes is only ever used here to extract a CELEX/OJ identifier (see extractEuIdentifierFromUrl),
// never fetched directly. All real fetching goes to publications.europa.eu's Cellar repository
// instead, which is NOT blocked.
const CELLAR_TIMEOUT_MS = 20_000
const CELLAR_HEADERS = { Accept: 'application/xml; notice=object' }

async function fetchCellarXml(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CELLAR_TIMEOUT_MS)
    try {
      const response = await fetch(url, { headers: CELLAR_HEADERS, signal: controller.signal })
      if (!response.ok) return undefined
      return await response.text()
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return undefined
  }
}

function resolveUrlFor(identifier: EUIdentifier): string {
  return identifier.type === 'celex'
    ? `https://publications.europa.eu/resource/celex/${identifier.value}`
    : `https://publications.europa.eu/resource/oj/${identifier.value}`
}

async function fetchEnglishTitle(workXml: string, identifier: EUIdentifier): Promise<string | undefined> {
  let cellarId = findEnglishExpressionCellarId(workXml, identifier)
  // Cellar links a document's per-language expressions under only ONE of its two identifier
  // schemes ('celex' or the post-2023 'oj' one), and which one isn't consistent — see
  // findOwnOJIdentifier's own comment. When the CELEX-based lookup comes back empty, fall back to
  // the document's own OJ identifier and retry.
  if (!cellarId && identifier.type === 'celex') {
    // First try: an explicit 'oj'-type sibling next to the document's own top-level CELEX SAMEAS
    // block (present for eg the AI Act). Second try: some post-2023-scheme documents don't have
    // that top-level sibling at all — confirmed live on a real 2026 Regulation, where the OJ
    // identifier exists ONLY inside each per-language WORK_HAS_EXPRESSION block — so derive it
    // directly from the CELEX number itself instead of searching for it.
    const ojIdentifier = findOwnOJIdentifier(workXml, identifier.value) ?? deriveNewSchemeOJIdentifierFromCelex(identifier.value)
    if (ojIdentifier) cellarId = findEnglishExpressionCellarId(workXml, { type: 'oj', value: ojIdentifier })
  }
  if (!cellarId) return undefined
  const exprXml = await fetchCellarXml(`https://publications.europa.eu/resource/cellar/${cellarId}`)
  return exprXml ? extractExpressionTitle(exprXml) : undefined
}

/** The document's own OJ series letter, derivable independently of whether the fuller old-scheme
 *  issue/page reference is available — an 'oj'-type identifier already starts with its series
 *  letter (eg 'L_202401689'); a 'celex' one needs `deriveOJSeriesFromCelex` (regulations/
 *  directives only — see that function's own comment for why a Decision isn't covered). */
function deriveOJSeries(identifier: EUIdentifier): 'L' | undefined {
  if (identifier.type === 'oj') {
    const match = identifier.value.match(/^([A-Z])_/)
    return match?.[1] === 'L' ? 'L' : undefined
  }
  return deriveOJSeriesFromCelex(identifier.value)
}

/**
 * Official Journal of the EU (r 14.2.1). Fills the document title (converted from EUR-Lex's own
 * sentence case to AGLC4's Title Case, r 1.7), the series (reliably derivable independently of
 * everything else — see deriveOJSeries), and, where the source uses the pre-2023 OJ numbering
 * scheme, the issue/starting page too. A document under the EU's post-2023 renumbering (a
 * sequential document number rather than issue/page — the AI Act's own third link is exactly this
 * case) gets the title and series only, with a note — AGLC4 (2018) predates that change and
 * defines no citation form for the sequential document number itself, matching what the user's
 * own worked example for that exact document expected (no full OJ pinpoint reference); the series
 * letter is still shown, since it's genuinely known and a real, live gap when it was left out
 * entirely — confirmed live on a real 2024 Regulation where the series came back blank even though
 * it was already being derived internally (to build the OJ identifier itself), just never surfaced
 * to the fields the student actually sees.
 */
async function handleOfficialJournal(identifier: EUIdentifier, workXml: string): Promise<AutofillResult> {
  const rawTitle = await fetchEnglishTitle(workXml, identifier)
  if (!rawTitle) {
    return {
      detectedSourceType: 'internationalMaterial',
      fields: { subtype: 'europeanUnion', euCategory: 'officialJournal' },
      confidence: 'low',
      message: "Pinpoint found this document in the EU's Cellar repository but could not extract its title — please fill in the fields manually.",
    }
  }

  const title = cleanOJDocumentTitle(rawTitle)
  const ojRef = findOldSchemeOJReference(workXml, identifier)

  const fields: Partial<InternationalMaterialFields> = {
    subtype: 'europeanUnion',
    euCategory: 'officialJournal',
    title,
    year: deriveOJYear(identifier),
  }

  if (ojRef) {
    return {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      fields: { ...fields, ojSeries: ojRef.series as OJSeries, ojIssueNumber: ojRef.issueNumber, ojStartingPage: ojRef.startingPage },
    }
  }

  const series = deriveOJSeries(identifier)

  return {
    detectedSourceType: 'internationalMaterial',
    confidence: 'medium',
    fields: series ? { ...fields, ojSeries: series } : fields,
    message:
      "This document uses the EU's post-2023 Official Journal numbering (a sequential document number, not the old issue/page system) — AGLC4 (2018) predates this change and doesn't define a citation form for it. Pinpoint has filled in the title" +
      (series ? ' and series' : '') +
      "; check with your instructor how they'd like the Official Journal reference itself handled, if at all.",
  }
}

/**
 * Courts of the European Union (r 14.2.3). The case number and court name are derived
 * deterministically from the CELEX number itself (see deriveCourtCaseFromCelex); the ECLI and
 * decision date come from the Cellar record directly; the parties' names are a best-effort
 * extraction from the source's own compound title (see bestEffortCaseParties) — genuinely lower
 * confidence, since it can't expand an abbreviated corporate suffix the source itself abbreviates.
 * Always fills the unreported format's fields (rather than the ECR/ECR-SC reported format) — the
 * ECR has only been published digitally since 2012 and stopped altogether not long after, so a
 * case reachable this way is overwhelmingly likely to be an unreported one; the student is told to
 * double-check and switch formats if the source turns out to actually be ECR-reported.
 */
async function handleCourtOfEU(celex: string, workXml: string): Promise<AutofillResult> {
  const courtCase = deriveCourtCaseFromCelex(celex)
  const date = parseWorkDate(workXml)
  const ecli = findOwnEcli(workXml, celex)
  const rawTitle = await fetchEnglishTitle(workXml, { type: 'celex', value: celex })
  const parties = rawTitle ? bestEffortCaseParties(rawTitle) : undefined

  if (!courtCase && !date) {
    return {
      detectedSourceType: 'internationalMaterial',
      fields: { subtype: 'europeanUnion', euCategory: 'court' },
      confidence: 'low',
      message: "Pinpoint found this case in the EU's Cellar repository but could not extract enough detail from it — please fill in the fields manually.",
    }
  }

  const fields: Partial<InternationalMaterialFields> = {
    subtype: 'europeanUnion',
    euCategory: 'court',
    euCourtReported: false,
    title: parties,
    euCaseNumber: courtCase?.caseNumber,
    euCourtName: courtCase?.courtName,
    euEcli: ecli,
    date,
  }

  return {
    detectedSourceType: 'internationalMaterial',
    confidence: parties ? 'medium' : 'low',
    fields,
    message: parties
      ? "Pinpoint filled in the case number, court, ECLI, and decision date, plus a best-effort guess at the parties' names — please check the names carefully (a source may abbreviate a corporate name, eg 'Corp', where AGLC4's own convention would use the fuller form, eg 'Corporation'), and confirm this decision isn't actually reported in the ECR/ECR-SC (rare for a case this recent, but if so, switch 'Reported' on and fill in the report details instead)."
      : "Pinpoint filled in the case number, court, ECLI, and decision date, but couldn't extract the parties' names from this source — please add them manually, and confirm this decision isn't actually reported in the ECR/ECR-SC.",
  }
}

/**
 * The shared Cellar lookup, callable with an identifier already in hand — from a EUR-Lex URL
 * (index.ts, via extractEuIdentifierFromUrl) or from a EUR-Lex PDF export's own filename, which
 * carries a CELEX number too (ai-extract.ts's aiExtractFromPdfMetadata, via
 * extractCelexFromFilename — both in eu-cellar-parse.ts). Returns null (never a low-confidence
 * placeholder) on any failure, so each caller can fall through to its own appropriate next step
 * (both currently fall back to the ordinary AI-extraction path) rather than this shared function
 * guessing what that should be.
 */
export async function fetchEuropeanUnionByIdentifier(identifier: EUIdentifier): Promise<AutofillResult | null> {
  const workXml = await fetchCellarXml(resolveUrlFor(identifier))
  if (!workXml) return null

  // Case-law CELEX numbers use sector '6' — structurally distinguishable from a legislative
  // document (sector '3') before any further parsing is needed. A post-2023-scheme 'oj'
  // identifier is never case-law (the CJEU/General Court don't use that numbering), so only a
  // 'celex' identifier is checked here.
  if (identifier.type === 'celex' && /^6\d{4}/.test(identifier.value)) {
    return handleCourtOfEU(identifier.value, workXml)
  }

  return handleOfficialJournal(identifier, workXml)
}
