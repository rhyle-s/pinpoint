/**
 * Cornell Law School's Legal Information Institute (law.cornell.edu/uscode) is the most commonly
 * cited, freely-fetchable mirror of the federal United States Code — confirmed by direct testing
 * that uscode.house.gov (the official government source) isn't reachable from this environment at
 * all (connection times out), unlike Cornell's site, which is. Every section page's own <title>
 * (and <h1>) follows one fixed, reliable pattern: '<Title Number> U.S. Code § <Section> -
 * <Section Heading>' — eg '12 U.S. Code § 1811 - Federal Deposit Insurance Corporation', '15 U.S.
 * Code § 78j-1 - Audit requirements' (confirmed the section number itself can contain a hyphen,
 * so the split point is specifically ' - ' with surrounding spaces, not the first hyphen).
 * Deterministically parsed here rather than left to an LLM, the same "never trust an LLM to
 * reproduce a fact that can just be read directly" reasoning as canada-legislation-parse.ts and
 * uk-legislation-parse.ts.
 *
 * Scope is deliberately federal Code only (AGLC4 r 25.2) — session laws (r 25.3) and any state
 * code aren't covered; Cornell's own site doesn't host state codes under this URL shape anyway.
 */
export interface USCodeCitation {
  titleNumber: string
  section: string
}

export function parseUSCodeTitleTag(titleTagText: string): USCodeCitation | undefined {
  const match = titleTagText.trim().match(/^(\d+)\s+U\.S\.\s*Code\s*§\s*(\S+)\s+-\s+/i)
  if (!match) return undefined
  const [, titleNumber, section] = match
  return { titleNumber, section }
}

export function isUSCodeUrl(url: string): boolean {
  return /law\.cornell\.edu\/uscode\/text\//i.test(url)
}
