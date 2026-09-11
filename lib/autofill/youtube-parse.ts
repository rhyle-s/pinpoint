import { toAustralianDateTime } from './date-format'

/**
 * youtube.com/watch pages embed real schema.org microdata even without JS — confirmed by direct
 * fetch of two unrelated videos, not just one. The channel sits in its own
 * `<span itemprop="author" itemscope itemtype="http://schema.org/Person">` block, with the
 * channel's display name at `link[itemprop="name"]` inside it — AGLC4's own r 7.16 worked example
 * for YouTube ('Brooking Creative Labs, ...') uses exactly this plain display name as the
 * 'Username' element, not an '@handle', so that's what this maps to `socialMediaUsername`, not
 * the separate `/@handle` URL sitting alongside it in the same block. `og:title` is the video's
 * own clean title (no channel-name suffix to strip, unlike eg ABC News's `<title>` tag), and
 * `meta[itemprop="datePublished"]` is a precise, offset-qualified ISO 8601 timestamp — only its
 * date is used, not a time/time zone (see the note below). No `'server-only'` import here,
 * matching every other `*-parse.ts` file in this directory.
 */
export interface YouTubeCitation {
  channelName: string
  title: string
  date: string
}

// Deliberately no time/time zone, unlike x-post-parse.ts — AGLC4's own r 7.16 worked example for
// YouTube ('Brooking Creative Labs, ... (YouTube, 20 July 2015)') has neither, even though its
// Twitter example does have both. Confirmed live: a first version of this file always included
// them (the same choice x-post-parse.ts makes, since both have equally precise metadata to draw
// on) — the AI validator flagged this specifically, with a real distinguishing reason, not the
// "second-guesses itself"/no-actual-difference noise this validator is otherwise known for (see
// CLAUDE.md): a time zone is only meaningful here per r 7.16 when "the social media platform
// adjusts the time based on the local time zone" for the *viewer* — X visibly does this (a
// viewer's own browser shows the post's time in their local zone), but YouTube's ordinary viewing
// experience never surfaces a time-of-day at all (just a date, or a relative "X days ago") — so
// there's no viewer-facing time being "adjusted" for a time zone to describe in the first place.
function toAustralianDate(isoTimestamp: string): string | undefined {
  return toAustralianDateTime(isoTimestamp)?.date
}

export function parseYouTubePage(
  ogTitle: string,
  channelName: string,
  datePublished: string,
): YouTubeCitation | undefined {
  const title = ogTitle.trim()
  const date = toAustralianDate(datePublished)
  if (!title || !channelName.trim() || !date) return undefined

  return { channelName: channelName.trim(), title, date }
}

export function isYouTubeWatchUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?youtube\.com\/watch\?.*\bv=/i.test(url) || /(?:^|\/\/)(?:www\.)?youtu\.be\//i.test(url)
}
