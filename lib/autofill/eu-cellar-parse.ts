/**
 * Pure parsing helpers for the EU Publications Office's 'Cellar' metadata repository
 * (publications.europa.eu) — the data source behind European Union Materials autofill (Official
 * Journal documents and Courts of the EU decisions, AGLC4 r 14.2.1/14.2.3). Zero network calls,
 * zero risky imports — see eu-cellar.ts (the 'server-only' orchestration layer that actually
 * fetches) for why this split exists, matching every other *-parse.ts module in this directory.
 *
 * Background (confirmed by direct testing, not assumed): eur-lex.europa.eu itself is genuinely
 * WAF-blocked (AWS WAF bot challenge — HTTP 202, empty body, `x-amzn-waf-action: challenge` —
 * same class of block as Semantic Scholar/APO/OHCHR elsewhere in this app), regardless of
 * User-Agent. publications.europa.eu's Cellar repository — the EU Publications Office's own
 * structured-metadata backend, which eur-lex.europa.eu itself is built on top of — is NOT blocked,
 * and resolves a CELEX number (or a post-2023 OJ document identifier) via a plain 303 redirect to
 * a `cellar/{WORK_UUID}` resource, from which an XML metadata document is available via content
 * negotiation.
 */

const ENGLISH_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export type EUIdentifier = { type: 'celex'; value: string } | { type: 'oj'; value: string }

/**
 * The user's own worked examples cover every URL shape eur-lex.europa.eu actually serves for a
 * document: `?uri=CELEX:XXXXX` (both 'CELEX' and lower-case 'celex' seen live), `/eli/dir|reg/
 * YYYY/NNN/oj/eng` (ELI URLs, which map deterministically onto a CELEX number for directives ('L')
 * and regulations ('R') — confirmed against real Directive 93/13 and GDPR/AI Act URLs), and the
 * newer `?uri=OJ:L_YYYYNNNNN` form used for documents published under the EU's post-2023 Official
 * Journal renumbering (the AI Act's own third link) — which is NOT a CELEX number at all, but
 * Cellar's own new-style OJ document identifier, resolved through a different endpoint
 * (`/resource/oj/{id}` rather than `/resource/celex/{id}` — see eu-cellar.ts).
 */
export function extractEuIdentifierFromUrl(url: string): EUIdentifier | undefined {
  // A URL copied straight from the browser's own address bar often percent-encodes the colon
  // (eg 'uri=CELEX%3A32026R1395' rather than 'uri=CELEX:32026R1395') — confirmed as a real, live
  // bug: a valid, real CELEX URL with an encoded colon and a trailing '&qid=...' tracking param
  // (both genuinely common in an address-bar-copied EUR-Lex link, unlike the plainer URLs first
  // tested this feature against) silently failed to match at all, since the regexes below only
  // ever looked for a literal ':'. Decoding first makes both forms match identically; wrapped in
  // try/catch since a malformed '%' sequence would otherwise throw on `decodeURIComponent`.
  let decoded = url
  try {
    decoded = decodeURIComponent(url)
  } catch {
    // Leave `decoded` as the raw url — matching against that is still strictly better than
    // failing outright, even though it won't catch a percent-encoded colon.
  }

  const celexMatch = decoded.match(/uri=celex:([a-z0-9]+)/i)
  if (celexMatch) return { type: 'celex', value: celexMatch[1].toUpperCase() }

  const ojMatch = decoded.match(/uri=oj:([a-z0-9_]+)/i)
  if (ojMatch) return { type: 'oj', value: ojMatch[1].toUpperCase() }

  // ELI URLs — '/eli/dir/1993/13/oj/eng' -> CELEX '31993L0013' (sector 3, type 'L'); '/eli/reg/
  // 2016/679/oj/eng' -> '32016R0679' (type 'R'). Only directives and regulations are supported —
  // the two ELI types the user's own worked examples actually cover; an ELI URL for some other
  // legislative act type (eg a Decision, '/eli/dec/...') falls through to the AI-hinted fallback
  // rather than risk guessing a wrong CELEX type letter with no worked example to confirm it against.
  const eliMatch = decoded.match(/\/eli\/(dir|reg)\/(\d{4})\/(\d+)\/oj/i)
  if (eliMatch) {
    const [, eliType, year, number] = eliMatch
    const typeLetter = eliType.toLowerCase() === 'dir' ? 'L' : 'R'
    return { type: 'celex', value: `3${year}${typeLetter}${number.padStart(4, '0')}` }
  }

  return undefined
}

/**
 * The OJ series a document is published in, derived from its own CELEX type letter — 'R'
 * (Regulation) and 'L' (Directive) are always published in the 'L' (legislative acts) series,
 * confirmed live against Cellar's own `document-collection/OJ-L` classification for a real 2024
 * Regulation. A Decision ('D') can legitimately land in either the 'L' or 'C' series depending on
 * whether it's a legislative act, which isn't recoverable from the CELEX number alone, so this
 * deliberately returns undefined rather than guess wrong — same reasoning
 * `deriveNewSchemeOJIdentifierFromCelex` below already applies, factored out so BOTH the old- and
 * new-scheme paths can show a document's own series even when nothing else about its OJ reference
 * is derivable (see eu-cellar.ts's handleOfficialJournal) — confirmed as a real, live gap: a
 * post-2023-scheme document was previously left with no series shown at all, not just no
 * issue/page, even though the series itself was already reliably known internally.
 */
export function deriveOJSeriesFromCelex(celex: string): 'L' | undefined {
  const match = celex.match(/^\d\d{4}([A-Z])\d{3,4}$/)
  if (!match) return undefined
  return match[1] === 'R' || match[1] === 'L' ? 'L' : undefined
}

/**
 * Derives a document's own post-2023-scheme OJ identifier directly from its CELEX number, eg
 * '32026R1395' -> 'L_202601395' (year '2026' + the CELEX number's own 4-digit sequence, zero-
 * padded to 5 — '1395' -> '01395' — confirmed live against a real 2026 Regulation, where
 * 'L_202601395.ENG' is exactly this) — a fallback for when `findOwnOJIdentifier` (which looks for
 * an explicit 'oj'-type sibling next to the document's own top-level CELEX SAMEAS block) comes up
 * empty, which is a real, live, confirmed case: some post-2023-scheme documents list their OJ
 * identifier ONLY per-language, inside each WORK_HAS_EXPRESSION block, with no top-level sibling
 * at all (unlike the AI Act, which has both). Only regulations and directives are covered, same
 * restriction and reasoning as `deriveOJSeriesFromCelex` above.
 */
export function deriveNewSchemeOJIdentifierFromCelex(celex: string): string | undefined {
  const series = deriveOJSeriesFromCelex(celex)
  if (!series) return undefined
  const match = celex.match(/^\d(\d{4})[A-Z](\d{3,4})$/)
  if (!match) return undefined
  const [, year, number] = match
  return `L_${year}${number.padStart(5, '0')}`
}

// A CELEX number itself: 1-digit sector + 4-digit year + 1-2 letter type + a zero-padded number
// (legislation, eg '31993L0013') or, for case-law, sector '6' + year + a 2-letter decision-type
// code + case number (eg '62013CJ0170', see deriveCourtCaseFromCelex below).
const CELEX_PATTERN = /(\d{4}\d[A-Z]{1,2}\d{3,4})/i

/**
 * EUR-Lex's own PDF export filename convention is `CELEX_<code>_<LANG>_<TYPE>.pdf` (eg
 * 'CELEX_31993L0013_EN_TXT.pdf', confirmed against a real user-downloaded file) — a reliable
 * signal a student's uploaded PDF is a EUR-Lex document at all, entirely independent of the PDF's
 * own internal metadata/text (which for a EUR-Lex export is often sparse or ambiguous — a real,
 * confirmed-live case: this exact Directive 93/13 PDF has no embedded Title at all, and its page-1
 * text opens with 'Official Journal of the European Communities', which is reasonable, if
 * incorrect, grounds for a text-only AI extractor to misclassify it as a Gazette citation instead
 * of the legislative act itself). Deliberately anchored to the 'CELEX' prefix in the filename
 * (not just any CELEX-shaped digit run) to avoid false-positiving on an unrelated PDF that happens
 * to have a similar-looking number somewhere in its own filename.
 */
export function extractCelexFromFilename(filename: string): string | undefined {
  const celexIndex = filename.toUpperCase().indexOf('CELEX')
  if (celexIndex === -1) return undefined
  const match = filename.slice(celexIndex).match(CELEX_PATTERN)
  return match?.[1]?.toUpperCase()
}

/**
 * Courts of the EU (r 14.2.3) case-law CELEX numbers take the form `6YYYYTTNNNN` — sector '6'
 * (case-law), a 4-digit year, a 2-letter decision-type code, and a zero-padded case number. Only
 * the three decision types AGLC4 r 14.2.3 itself names are mapped — 'CJ' (Court of Justice
 * judgment, 'C-' prefix), 'TJ' (General Court judgment, 'T-' prefix), 'FJ' (EU Civil Service
 * Tribunal judgment, 'F-' prefix) — confirmed live against real CELEX numbers for both a CJEU case
 * (Huawei v ZTE, 'C-170/13') and a General Court case (Vainker v European Parliament, 'T-48/01').
 * Orders, Advocate General opinions, and other decision types use different type codes this app
 * doesn't attempt to map — those fall through to a blank case number for the student to fill in.
 */
const CASE_TYPE_CODES: Record<string, { prefix: string; courtName: string }> = {
  CJ: { prefix: 'C', courtName: 'Court of Justice of the European Union' },
  TJ: { prefix: 'T', courtName: 'General Court of the European Union' },
  FJ: { prefix: 'F', courtName: 'European Union Civil Service Tribunal' },
}

/**
 * The OJ publication year, from the identifier alone — NOT a naive 'first 4 digits' regex, which
 * gets it wrong: a CELEX number glues its 1-digit sector code directly onto the 4-digit year with
 * no separator (eg '32016R0679' = sector '3' + year '2016' + type 'R' + number '0679'), so the
 * first 4 consecutive digits in the whole string are actually '3201', not the real year '2016' —
 * confirmed as a real, live bug caught during testing (the GDPR citation came back '[3201] OJ L
 * 119/1' instead of '[2016] ...'). The post-2023 'oj' scheme doesn't have this trap (its year
 * isn't preceded by a sector digit), but is handled by the same function for one shared call site.
 */
export function deriveOJYear(identifier: EUIdentifier): string | undefined {
  if (identifier.type === 'celex') {
    // sector digit (1) + year (4) — always this shape for a legislative CELEX number.
    const match = identifier.value.match(/^\d(\d{4})/)
    return match?.[1]
  }
  const match = identifier.value.match(/^[A-Z]_(\d{4})/)
  return match?.[1]
}

export function deriveCourtCaseFromCelex(celex: string): { caseNumber: string; courtName: string } | undefined {
  const match = celex.match(/^6(\d{4})([A-Z]{2})(\d+)$/)
  if (!match) return undefined
  const [, year, typeCode, number] = match
  const mapped = CASE_TYPE_CODES[typeCode]
  if (!mapped) return undefined
  return { caseNumber: `${mapped.prefix}-${parseInt(number, 10)}/${year.slice(2)}`, courtName: mapped.courtName }
}

/**
 * Locates the cellar sub-resource id for the ENGLISH-language expression of a work, from the
 * WORK-level metadata XML — every WORK_HAS_EXPRESSION block carries its own cellar id alongside a
 * SAMEAS entry identifying that specific language version (a '{CELEX}.ENG' identifier under
 * TYPE=celex for pre-2023-scheme documents, or a '{OJ id}.ENG' identifier under TYPE=oj for
 * post-2023-scheme ones — both forms confirmed live). Matched as one bounded block (not a
 * document-wide search) so this can't accidentally latch onto some unrelated *cited* work's own
 * English expression elsewhere in the same (often very large, citation-graph-heavy) document.
 */
// How far past the end of the English-expression's own WORK_HAS_EXPRESSION block to look for a
// sibling old-scheme OJ identifier — confirmed live to sit as the very next SAMEAS entry (either
// still inside the same block, or as the start of the next one) for both documents tested.
const OJ_SIBLING_SEARCH_WINDOW = 800

function findEnglishExpressionMatchEnd(workXml: string, identifier: EUIdentifier): { cellarId: string; endIndex: number } | undefined {
  const escaped = identifier.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // The middle `(?:(?!</WORK_HAS_EXPRESSION>)[\s\S])*?` is doing real work here, not just being
  // thorough — a plain `[\s\S]{0,1500}?` lazy match has no concept of block boundaries, so it will
  // just as happily match a '.ENG' SAMEAS belonging to the NEXT WORK_HAS_EXPRESSION block as one
  // belonging to the block whose cellar id it just captured, pairing the wrong two together.
  // Confirmed as a real, live, wrong-language bug: a real Regulation (CELEX 32025R2458) has its
  // Spanish-language block immediately followed by its English one, close enough together that
  // the old pattern's cellar-id capture (from the SPANISH block) got paired with the '.ENG' match
  // (from the ENGLISH block right after it) — the citation came back entirely in Spanish. This
  // negative-lookahead form fails to match at all once it crosses a closing
  // '</WORK_HAS_EXPRESSION>' tag, so the '.ENG' identifier must genuinely be a SAMEAS *within* the
  // same block as the captured cellar id, never a sibling block's own.
  const re = new RegExp(
    `<WORK_HAS_EXPRESSION type="link">\\s*<URI>\\s*<VALUE>[^<]*</VALUE>\\s*<IDENTIFIER>([^<]+)</IDENTIFIER>\\s*<TYPE>cellar</TYPE>(?:(?!</WORK_HAS_EXPRESSION>)[\\s\\S])*?<IDENTIFIER>${escaped}\\.ENG</IDENTIFIER>\\s*<TYPE>(?:celex|oj)</TYPE>`,
  )
  const match = workXml.match(re)
  if (!match || match.index === undefined) return undefined
  return { cellarId: match[1], endIndex: match.index + match[0].length }
}

export function findEnglishExpressionCellarId(workXml: string, identifier: EUIdentifier): string | undefined {
  return findEnglishExpressionMatchEnd(workXml, identifier)?.cellarId
}

/**
 * The pre-2023 Official Journal numbering scheme's own identifiers — either the 'uriserv' form
 * ('OJ.L_.2016.119.01.0001.01.ENG', Series/Year/Issue/Page all embedded) or the 'oj' form
 * ('JOL_2016_119_R_0001.ENG', same information, different punctuation) — confirmed live that
 * EUR-Lex/Cellar uses one or the other (not consistently the same one) as the very next sibling
 * SAMEAS entry immediately after a document's own English-expression identifier, for both the
 * GDPR and Directive 93/13 records. A post-2023-scheme document (eg the AI Act) has neither
 * sibling present at all — this returns undefined for those, which callers should treat as 'leave
 * the OJ series/issue/page fields blank', not as a parse failure to retry.
 */
export function findOldSchemeOJReference(
  workXml: string,
  identifier: EUIdentifier,
): { series: string; issueNumber: string; startingPage: string } | undefined {
  const located = findEnglishExpressionMatchEnd(workXml, identifier)
  if (!located) return undefined
  const window = workXml.slice(located.endIndex, located.endIndex + OJ_SIBLING_SEARCH_WINDOW)

  const uriservMatch = window.match(/OJ\.([A-Z]{1,2})_\.(\d{4})\.(\d{3})\.\d+\.(\d+)\.\d+\.ENG/)
  if (uriservMatch) {
    const [, series, , issueNumber, page] = uriservMatch
    return { series, issueNumber: String(parseInt(issueNumber, 10)), startingPage: String(parseInt(page, 10)) }
  }

  const ojFormMatch = window.match(/JO([LC])_(\d{4})_(\d{3})_R_(\d+)/)
  if (ojFormMatch) {
    const [, series, , issueNumber, page] = ojFormMatch
    return { series, issueNumber: String(parseInt(issueNumber, 10)), startingPage: String(parseInt(page, 10)) }
  }

  return undefined
}

/** WORK_DATE_DOCUMENT's structured YEAR/MONTH/DAY fields, formatted 'D Month YYYY' — the full
 *  decision/publication date AGLC4 wants for an unreported CJEU decision (r 14.2.3) or an OJ
 *  document. Hand-formats from the raw digits rather than going through `Date` at all, so there's
 *  no timezone-parsing footgun for what's a plain calendar date, not a timestamp. */
export function parseWorkDate(workXml: string): string | undefined {
  const match = workXml.match(/<WORK_DATE_DOCUMENT[^>]*>\s*<VALUE>[^<]*<\/VALUE>\s*<YEAR>(\d{4})<\/YEAR>\s*<MONTH>(\d{2})<\/MONTH>\s*<DAY>(\d{2})<\/DAY>/)
  if (!match) return undefined
  const [, year, month, day] = match
  const monthName = ENGLISH_MONTH_NAMES[parseInt(month, 10) - 1]
  if (!monthName) return undefined
  return `${parseInt(day, 10)} ${monthName} ${year}`
}

/** The case's own ECLI (TYPE=ecli, at the WORK's top-level identifier block — not one of the many
 *  ECLIs belonging to *cited* cases elsewhere in the same document). Matched immediately after the
 *  document's own CELEX SAMEAS block, the same position confirmed live for Huawei v ZTE. */
export function findOwnEcli(workXml: string, celex: string): string | undefined {
  const escaped = celex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `<IDENTIFIER>${escaped}</IDENTIFIER>\\s*<TYPE>celex</TYPE>[\\s\\S]{0,400}?<IDENTIFIER>(ECLI:[^<]+)</IDENTIFIER>\\s*<TYPE>ecli</TYPE>`,
  )
  return workXml.match(re)?.[1]
}

/**
 * The document's own post-2023-scheme OJ identifier (TYPE=oj at the WORK's top-level identifier
 * block, eg 'L_202401689'), given its CELEX number — needed because Cellar links a document's own
 * per-language expressions to only ONE of its two identifier schemes, and which one it picks isn't
 * consistent: confirmed live that the EU AI Act (resolved via its ELI URL, which this app derives
 * a CELEX number from) links its English expression under the 'oj' identifier ONLY — there is no
 * '{celex}.ENG' anywhere in the document at all — while Directive 93/13 and the GDPR both link
 * theirs under the 'celex' identifier instead. Real, live bug this was written to fix: an AI Act
 * URL came back with 'could not extract its title' even though the title was reliably present,
 * because findEnglishExpressionCellarId was only ever tried with the CELEX identifier. Callers
 * should try this as a fallback identifier when the CELEX-based lookup comes back empty.
 */
export function findOwnOJIdentifier(workXml: string, celex: string): string | undefined {
  const escaped = celex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `<IDENTIFIER>${escaped}</IDENTIFIER>\\s*<TYPE>celex</TYPE>[\\s\\S]{0,400}?<IDENTIFIER>([A-Z]_\\d+)</IDENTIFIER>\\s*<TYPE>oj</TYPE>`,
  )
  return workXml.match(re)?.[1]
}

/** The English EXPRESSION_TITLE from the smaller, per-expression Cellar document (see
 *  eu-cellar.ts's second fetch) — present for Official Journal documents; often absent for older
 *  case-law records (confirmed live against a real 2004 General Court case), in which case the
 *  student is left to fill the parties' names in manually alongside the other autofilled fields. */
export function extractExpressionTitle(expressionXml: string): string | undefined {
  // The tag-name boundary here is deliberate, not cosmetic — Cellar's own schema also has a
  // distinct `EXPRESSION_TITLE_SHORT` element (eg 'Unfair Terms Directive' for Directive 93/13),
  // and an unanchored `EXPRESSION_TITLE[^>]*` would just as happily match that tag's own name,
  // silently swallowing the `_SHORT` suffix as if it were part of an attributes list — confirmed
  // as a real, live bug this exact regex caught during testing (a genuine student-facing wrong
  // title, not merely a style nit): the Directive 93/13 citation came back with the short title
  // as if it were the document's own full title. `(?:\s[^>]*)?` requires the character right
  // after 'EXPRESSION_TITLE' to be whitespace (the start of an attribute list) or the tag's own
  // closing '>' — never another word character — so 'EXPRESSION_TITLE_SHORT' can't match here.
  const match = expressionXml.match(/<EXPRESSION_TITLE(?:\s[^>]*)?>\s*<VALUE>([^<]*)<\/VALUE>/)
  return match?.[1]?.trim() || undefined
}

// EUR-Lex's own titles routinely carry a trailing '(Text with EEA relevance)' marker that isn't
// part of the document's own title for citation purposes — confirmed absent from both the user's
// own worked GDPR/AI Act titles and AGLC4's own ch 14.2.1 worked examples.
const EEA_RELEVANCE_SUFFIX = /\s*\(text with eea relevance\)\.?\s*$/i

// Minor words r 1.7's Title Case convention leaves lower-case unless they're the first or last
// word of the title — a conventional, unremarkable Title Case word list, not an AGLC4-specific one.
const TITLE_CASE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'via', 'with',
])

/**
 * AGLC4 r 14.2.1 requires a document's title to be capitalised per r 1.7 (Title Case) — but
 * EUR-Lex/Cellar's own stored titles are plain sentence case (eg 'Regulation (EU) 2016/679 of the
 * European Parliament and of the council of 27 April 2016 on the protection of...'). A general
 * Title Case pass, capitalising every word except a fixed list of minor words (never the first or
 * last word of the title, matching ordinary Title Case convention) — imperfect for the occasional
 * genuinely-lower-case proper noun or acronym mid-title, but a much closer match to AGLC4's own
 * convention than leaving the raw sentence case untouched.
 */
export function toTitleCase(text: string): string {
  const words = text.split(' ')
  return words
    .map((word, index) => {
      if (!word) return word
      const isFirstOrLast = index === 0 || index === words.length - 1
      // A hyphenated word ('Trade-Related') gets each segment capitalised independently.
      const capitalise = (segment: string) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment)
      const lower = word.toLowerCase()
      if (!isFirstOrLast && TITLE_CASE_MINOR_WORDS.has(lower)) return lower
      return word.includes('-') ? word.split('-').map(capitalise).join('-') : capitalise(word)
    })
    .join(' ')
}

export function cleanOJDocumentTitle(rawTitle: string): string {
  return toTitleCase(rawTitle.replace(EEA_RELEVANCE_SUFFIX, '').trim())
}

/**
 * Best-effort extraction of a CJEU case's parties from its compound Formex-style title, eg
 * 'Judgment of the Court (Fifth Chamber) of 16 July 2015.#Huawei Technologies Co. Ltd v ZTE Corp.
 * and ZTE Deutschland GmbH.#Request for a preliminary ruling...' -> 'Huawei Technologies Co Ltd v
 * ZTE Corp'. Genuinely fragile — it strips full stops (r 1.6) and keeps only the first-named
 * respondent (matching this app's existing ECtHR/multi-party convention), but can't expand an
 * abbreviated corporate suffix the source text itself abbreviates (eg 'ZTE Corp' vs AGLC4's own
 * fuller 'ZTE Corporation' in its own worked example) — that's genuine outside knowledge no
 * mechanical parse of the source page can recover, so callers should treat this as a
 * medium-confidence starting point for the student to confirm, not a guaranteed-correct value.
 */
export function bestEffortCaseParties(rawTitle: string): string | undefined {
  const segments = rawTitle.split('#')
  const partiesSegment = (segments.length > 1 ? segments[1] : segments[0]).trim()
  if (!partiesSegment) return undefined

  const withoutTrailingStop = partiesSegment.replace(/\.\s*$/, '')
  const [plaintiff, ...rest] = withoutTrailingStop.split(' v ')
  if (rest.length === 0) return withoutTrailingStop.replace(/\./g, '').replace(/\s+/g, ' ').trim()

  const defendant = rest.join(' v ').split(/\s+and\s+/)[0]
  return `${plaintiff} v ${defendant}`.replace(/\./g, '').replace(/\s+/g, ' ').trim()
}
