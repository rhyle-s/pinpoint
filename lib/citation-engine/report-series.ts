const ROUND_BRACKET_SERIES = [
  'CLR', 'FCR', 'VR', 'NSWLR', 'ALR', 'ALJR', 'FLR', 'ACTR', 'A Crim R',
  'ACSR', 'IR', 'IPR', 'WAR', 'SASR', 'NTLR', 'HCA', 'FCA', 'FCAFC',
  'NSWCA', 'NSWCCA', 'VSCA', 'QCA', 'WASCA',
]

const SQUARE_BRACKET_SERIES = [
  'Qd R', 'NZLR', 'AC', 'QB', 'WLR', 'All ER', 'EWCA Civ', 'EWCA Crim', 'EWHC',
]

const BRACKET_TYPE_MAP: Record<string, 'round' | 'square'> = {}
for (const abbr of ROUND_BRACKET_SERIES) BRACKET_TYPE_MAP[abbr] = 'round'
for (const abbr of SQUARE_BRACKET_SERIES) BRACKET_TYPE_MAP[abbr] = 'square'

export function getBracketType(abbreviation: string): 'round' | 'square' {
  return BRACKET_TYPE_MAP[abbreviation?.trim()] ?? 'round'
}

const JOURNAL_SQUARE_BRACKET_SERIES = ['Bulletin of the Australian Society of Legal Philosophy']

const JOURNAL_BRACKET_TYPE_MAP: Record<string, 'round' | 'square'> = {}
for (const journal of JOURNAL_SQUARE_BRACKET_SERIES) JOURNAL_BRACKET_TYPE_MAP[journal] = 'square'

export function getJournalBracketType(journalName: string): 'round' | 'square' {
  return JOURNAL_BRACKET_TYPE_MAP[journalName?.trim()] ?? 'round'
}
