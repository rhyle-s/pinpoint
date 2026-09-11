const ROUND_BRACKET_SERIES = [
  'CLR', 'FCR', 'VR', 'NSWLR', 'ALR', 'ALJR', 'FLR', 'ACTR', 'A Crim R',
  'ACSR', 'IR', 'IPR', 'WAR', 'SASR', 'NTLR', 'HCA', 'FCA', 'FCAFC',
  'NSWCA', 'NSWCCA', 'VSCA', 'QCA', 'WASCA',
  // Foreign Domestic Sources (AGLC4 Part V) — additive only, no Australian entries touched.
  'DLR',                          // Canada (r 15.1.2) — volume-organised
  'NZBLC', 'NZCPR', 'PRNZ',       // New Zealand (r 21.1.2) — volume-organised
  'HKPLR', 'HKCFAR',              // Hong Kong (r 19.1) — volume-organised
  // Note: Malaysia's MLJ (r 20.1.2) is deliberately NOT listed here — it switched from
  // volume-organised to year-organised in 1966, so a single static bracket type would be wrong
  // for one era or the other. See formatMalaysiaCase() in foreign-domestic.ts, which branches on
  // year directly instead of using getBracketType().
]

const SQUARE_BRACKET_SERIES = [
  'Qd R', 'NZLR', 'AC', 'QB', 'WLR', 'All ER', 'EWCA Civ', 'EWCA Crim', 'EWHC',
  // Foreign Domestic Sources (AGLC4 Part V) — additive only, no Australian entries touched.
  'SCR', 'FC', 'Ex CR',           // Canada (r 15.1.2) — year-organised
  'NZAR', 'NZFLR',                // New Zealand (r 21.1.2) — year-organised
  'HKLRD', 'HKC', 'HKDCLR',       // Hong Kong (r 19.1) — year-organised
  'CLJ',                          // Malaysia (r 20.1.2) — year-organised (always, unlike MLJ)
  'SLR',                          // Singapore (r 22.1.2) — year-organised
  'SA',                           // South Africa (r 23.1.2) — year-organised
]

const BRACKET_TYPE_MAP: Record<string, 'round' | 'square'> = {}
for (const abbr of ROUND_BRACKET_SERIES) BRACKET_TYPE_MAP[abbr] = 'round'
for (const abbr of SQUARE_BRACKET_SERIES) BRACKET_TYPE_MAP[abbr] = 'square'

export function getBracketType(abbreviation: string): 'round' | 'square' {
  return BRACKET_TYPE_MAP[abbreviation?.trim()] ?? 'round'
}

/**
 * Whether an abbreviation is one this engine actually recognises as an AGLC4 report series. Not
 * exhaustive of every series AustLII covers (tribunal series, older/specialist reporters), so a
 * `false` here means "unverified", not "wrong" — callers use it to gate confidence, not to reject.
 */
export function isKnownReportSeries(abbreviation: string): boolean {
  return !!BRACKET_TYPE_MAP[abbreviation?.trim() ?? '']
}

const JOURNAL_SQUARE_BRACKET_SERIES = ['Bulletin of the Australian Society of Legal Philosophy']

const JOURNAL_BRACKET_TYPE_MAP: Record<string, 'round' | 'square'> = {}
for (const journal of JOURNAL_SQUARE_BRACKET_SERIES) JOURNAL_BRACKET_TYPE_MAP[journal] = 'square'

export function getJournalBracketType(journalName: string): 'round' | 'square' {
  return JOURNAL_BRACKET_TYPE_MAP[journalName?.trim()] ?? 'round'
}
