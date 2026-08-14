import { describe, expect, it } from 'vitest'
import { formatItalics } from './index'

describe('formatItalics — typographic apostrophes', () => {
  it('converts a straight apostrophe in a contraction to the curly mark', () => {
    expect(formatItalics("who's responsible", 'plain')).toBe('who’s responsible')
  })

  it('converts a straight apostrophe in a possessive to the curly mark', () => {
    expect(formatItalics("Snoswell's argument", 'plain')).toBe('Snoswell’s argument')
  })

  it('opens and closes a nested quoted phrase with the correct directional marks', () => {
    expect(formatItalics("inside the 'black box'", 'plain')).toBe('inside the ‘black box’')
  })

  it('handles a title with both a contraction and a nested quoted phrase', () => {
    expect(formatItalics("what's inside the 'black box'", 'plain')).toBe('what’s inside the ‘black box’')
  })
})
