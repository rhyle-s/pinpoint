import { toAustralianDateTime } from './date-format'

/**
 * x.com/twitter.com serves a fully server-rendered `<title>`/meta-tag set for a single post's
 * page even without JS — confirmed by direct testing, unlike the platform's own timeline/profile
 * views, which are client-rendered. `og:title` is 'RealName (@handle) on X' (or just '@handle on
 * X' when the account has no separate display name), `og:description` carries the post's full,
 * untruncated text (the plain `description`/`twitter:description` meta tags are sometimes
 * truncated with a trailing '…', so prefer `og:description`), and `article:published_time` is a
 * precise ISO 8601 UTC timestamp. No `'server-only'` import here, matching every other
 * `*-parse.ts` file in this directory, so this stays directly unit-testable under vitest.
 */
export interface XPostCitation {
  username: string // includes the leading '@'
  realName?: string
  text: string
  date: string
  time: string
  timeZone: string
}

const OG_TITLE_PATTERN = /^(.*?)\s+\((@[^)]+)\)\s+on X$/i
const BARE_HANDLE_PATTERN = /^(@\S+)\s+on X$/i

/** Extracts a citable post from an x.com/twitter.com status page's own `<head>` meta tags. */
export function parseXPost(ogTitle: string, ogDescription: string, publishedTime: string): XPostCitation | undefined {
  const dateTime = toAustralianDateTime(publishedTime)
  if (!dateTime || !ogDescription.trim()) return undefined

  const withRealName = ogTitle.match(OG_TITLE_PATTERN)
  if (withRealName) {
    return { realName: withRealName[1].trim(), username: withRealName[2], text: ogDescription.trim(), ...dateTime }
  }

  const bareHandle = ogTitle.match(BARE_HANDLE_PATTERN)
  if (bareHandle) {
    return { username: bareHandle[1], text: ogDescription.trim(), ...dateTime }
  }

  return undefined
}

export function isXUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?(?:x\.com|twitter\.com)\/[^/]+\/status\//i.test(url)
}
