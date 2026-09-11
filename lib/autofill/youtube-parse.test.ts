import { describe, expect, it } from 'vitest'
import { isYouTubeWatchUrl, parseYouTubePage } from './youtube-parse'

// Meta-tag/microdata values below are exactly what youtube.com's own server-rendered page
// returned for two real, unrelated videos, confirmed by direct fetch — not invented.
describe('parseYouTubePage', () => {
  it('parses a real video page', () => {
    const result = parseYouTubePage(
      'Arizona Sunshine - Official Gameplay Trailer',
      'GameTrailers',
      '2026-09-02T12:39:34-07:00',
    )
    expect(result).toEqual({
      channelName: 'GameTrailers',
      title: 'Arizona Sunshine - Official Gameplay Trailer',
      date: '3 September 2026',
    })
  })

  it('parses a second, unrelated real video page (confirms this generalises)', () => {
    const result = parseYouTubePage(
      'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)',
      'Rick Astley',
      '2009-10-24T23:57:33-07:00',
    )
    expect(result?.channelName).toBe('Rick Astley')
    expect(result?.title).toBe('Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)')
  })

  it('never includes a time or time zone, unlike x-post-parse.ts — AGLC4 r 7.16\'s own YouTube example has neither', () => {
    const result = parseYouTubePage(
      'Arizona Sunshine - Official Gameplay Trailer',
      'GameTrailers',
      '2026-09-02T12:39:34-07:00',
    )
    expect(result).not.toHaveProperty('time')
    expect(result).not.toHaveProperty('timeZone')
  })

  it('returns undefined when the channel name is missing — the exact bug this file exists to fix', () => {
    expect(parseYouTubePage('Arizona Sunshine - Official Gameplay Trailer', '', '2026-09-02T12:39:34-07:00')).toBeUndefined()
  })

  it('returns undefined when the title is empty', () => {
    expect(parseYouTubePage('', 'GameTrailers', '2026-09-02T12:39:34-07:00')).toBeUndefined()
  })

  it('returns undefined when the published date is missing/invalid', () => {
    expect(parseYouTubePage('Arizona Sunshine - Official Gameplay Trailer', 'GameTrailers', '')).toBeUndefined()
  })
})

describe('isYouTubeWatchUrl', () => {
  it('recognises youtube.com/watch URLs', () => {
    expect(isYouTubeWatchUrl('https://www.youtube.com/watch?v=f74XcGyZMCg')).toBe(true)
  })

  it('recognises youtu.be short links', () => {
    expect(isYouTubeWatchUrl('https://youtu.be/f74XcGyZMCg')).toBe(true)
  })

  it('does not match a channel or search page', () => {
    expect(isYouTubeWatchUrl('https://www.youtube.com/@GameTrailers')).toBe(false)
    expect(isYouTubeWatchUrl('https://www.youtube.com/results?search_query=arizona+sunshine')).toBe(false)
  })
})
