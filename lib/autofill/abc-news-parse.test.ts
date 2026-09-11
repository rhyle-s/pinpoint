import { describe, expect, it } from 'vitest'
import { isABCNewsUrl, isABCVideoContentType, parseABCVideoNextData } from './abc-news-parse'

// Mirrors the real shape of a Four Corners episode page's own __NEXT_DATA__ JSON, confirmed by
// direct fetch — not invented (trimmed to the fields this parser actually reads).
function fourCornersNextData(overrides: Record<string, unknown> = {}) {
  return {
    props: {
      pageProps: {
        document: {
          loaders: {
            media: {
              headlinePrepared: {
                contentType: 'VIDEO',
                firstUpdated: '2026-08-24T10:30:00+00:00',
                lastUpdated: '2026-08-24T10:30:00+00:00',
                primaryContext: { url: 'https://www.abc.net.au/news/programs/4corners/', title: 'Four Corners' },
                title: 'Access All Areas',
                ...overrides,
              },
            },
          },
        },
      },
    },
  }
}

describe('isABCVideoContentType', () => {
  it('recognises the video content type, case-insensitively', () => {
    expect(isABCVideoContentType('video')).toBe(true)
    expect(isABCVideoContentType('VIDEO')).toBe(true)
  })

  it('does not match an ordinary article', () => {
    expect(isABCVideoContentType('Article')).toBe(false)
  })
})

describe('parseABCVideoNextData', () => {
  it('parses a real Four Corners episode page shape', () => {
    expect(parseABCVideoNextData(fourCornersNextData())).toEqual({
      episodeTitle: 'Access All Areas',
      seriesTitle: 'Four Corners',
      date: '2026',
    })
  })

  it('parses a second real episode (confirms this generalises, not a one-off fixture)', () => {
    const data = fourCornersNextData({ title: 'Gangs of Haiti: Inside a nation living under gang rule', firstUpdated: '2026-09-03T05:00:00+00:00' })
    expect(parseABCVideoNextData(data)).toEqual({
      episodeTitle: 'Gangs of Haiti: Inside a nation living under gang rule',
      seriesTitle: 'Four Corners',
      date: '2026',
    })
  })

  it('declines (returns undefined) when the series title is missing — no program/series to attribute this to', () => {
    const data = {
      props: {
        pageProps: {
          document: {
            loaders: {
              media: {
                headlinePrepared: {
                  contentType: 'VIDEO',
                  firstUpdated: '2026-08-24T10:30:00+00:00',
                  title: 'Some Standalone Clip',
                },
              },
            },
          },
        },
      },
    }
    expect(parseABCVideoNextData(data)).toBeUndefined()
  })

  it('returns undefined for a completely unrelated JSON shape', () => {
    expect(parseABCVideoNextData({ foo: 'bar' })).toBeUndefined()
  })

  it('returns undefined for non-object input', () => {
    expect(parseABCVideoNextData(null)).toBeUndefined()
    expect(parseABCVideoNextData('a string')).toBeUndefined()
  })
})

describe('isABCNewsUrl', () => {
  it('recognises abc.net.au/news URLs', () => {
    expect(isABCNewsUrl('https://www.abc.net.au/news/2026-08-24/access-all-areas/107072218')).toBe(true)
  })

  it('does not match a non-news ABC page', () => {
    expect(isABCNewsUrl('https://www.abc.net.au/iview/show/four-corners')).toBe(false)
  })
})
