import { describe, expect, it } from 'vitest'
import { isUSCodeUrl, parseUSCodeTitleTag } from './us-code-parse'

// Every <title> string below was confirmed by direct fetch against the real law.cornell.edu page,
// not invented — see CLAUDE.md for why this bypasses the AI-based extraction path entirely.
describe('parseUSCodeTitleTag', () => {
  it('parses an ordinary section citation', () => {
    expect(
      parseUSCodeTitleTag('12 U.S. Code § 1811 - Federal Deposit Insurance Corporation | U.S. Code | US Law | LII'),
    ).toEqual({ titleNumber: '12', section: '1811' })
  })

  it('parses a section number containing a hyphen without mistaking it for the heading separator', () => {
    expect(parseUSCodeTitleTag('15 U.S. Code § 78j-1 - Audit requirements | U.S. Code | US Law | LII')).toEqual({
      titleNumber: '15',
      section: '78j-1',
    })
  })

  it('parses a long, punctuation-heavy heading correctly', () => {
    expect(
      parseUSCodeTitleTag(
        '42 U.S. Code § 4332 - Cooperation of agencies; reports; availability of information; recommendations; international and national coordination of efforts | U.S. Code | US Law | LII',
      ),
    ).toEqual({ titleNumber: '42', section: '4332' })
  })

  it('returns undefined for text that does not match the expected shape', () => {
    expect(parseUSCodeTitleTag('Not a US Code page at all')).toBeUndefined()
  })
})

describe('isUSCodeUrl', () => {
  it('recognises Cornell LII US Code section URLs', () => {
    expect(isUSCodeUrl('https://www.law.cornell.edu/uscode/text/12/1811')).toBe(true)
  })

  it('does not match other Cornell LII pages', () => {
    expect(isUSCodeUrl('https://www.law.cornell.edu/wex/tort')).toBe(false)
  })
})
