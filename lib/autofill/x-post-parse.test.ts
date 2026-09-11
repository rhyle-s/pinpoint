import { describe, expect, it } from 'vitest'
import { isXUrl, parseXPost } from './x-post-parse'

// Meta-tag values below are exactly what x.com's own server-rendered <head> returned for a real
// status page, confirmed by direct fetch — not invented.
describe('parseXPost', () => {
  it('parses a post with a real name distinct from the handle', () => {
    const result = parseXPost(
      'Joe Orrico (@JoeOrrico) on X',
      'These 12 WRs Will WIN Fantasy Football Leagues\n\n1. AJ Brown will likely see 8+ targets per game...',
      '2026-09-03T12:53:11.000Z',
    )
    expect(result).toEqual({
      username: '@JoeOrrico',
      realName: 'Joe Orrico',
      text: 'These 12 WRs Will WIN Fantasy Football Leagues\n\n1. AJ Brown will likely see 8+ targets per game...',
      date: '3 September 2026',
      time: '10:53pm',
      timeZone: 'AEST',
    })
  })

  it('parses a post with no separate real name (bare handle)', () => {
    const result = parseXPost('@JoeOrrico on X', 'Bare handle, no display name.', '2026-09-03T12:53:11.000Z')
    expect(result).toEqual({
      username: '@JoeOrrico',
      text: 'Bare handle, no display name.',
      date: '3 September 2026',
      time: '10:53pm',
      timeZone: 'AEST',
    })
  })

  it('converts a UTC timestamp during Australian daylight saving to AEDT', () => {
    // 15 January is well within AEDT (Oct–Apr) — a genuine DST-crossing case, not just AEST.
    const result = parseXPost('@JoeOrrico on X', 'Summer post.', '2026-01-15T03:00:00.000Z')
    expect(result?.timeZone).toBe('AEDT')
  })

  it('returns undefined when og:description is empty (no post text extracted)', () => {
    expect(parseXPost('Joe Orrico (@JoeOrrico) on X', '', '2026-09-03T12:53:11.000Z')).toBeUndefined()
  })

  it('returns undefined when the published-time timestamp is missing/invalid', () => {
    expect(parseXPost('Joe Orrico (@JoeOrrico) on X', 'Some text', '')).toBeUndefined()
  })

  it("returns undefined when og:title doesn't match the expected 'on X' shape", () => {
    expect(parseXPost('Some Unexpected Title', 'Some text', '2026-09-03T12:53:11.000Z')).toBeUndefined()
  })
})

describe('isXUrl', () => {
  it('recognises x.com and twitter.com status page URLs', () => {
    expect(isXUrl('https://x.com/JoeOrrico/status/2095495318984962245?s=20')).toBe(true)
    expect(isXUrl('https://twitter.com/JoeOrrico/status/2095495318984962245')).toBe(true)
    expect(isXUrl('https://www.x.com/JoeOrrico/status/2095495318984962245')).toBe(true)
  })

  it('does not match a bare profile URL (no status)', () => {
    expect(isXUrl('https://x.com/JoeOrrico')).toBe(false)
  })
})
