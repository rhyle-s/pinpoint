/**
 * Deliberately its own file with zero imports, not folded into `utils.ts` — `utils.ts` imports
 * Node's `crypto` (for `hashKey`), and `detect.ts` (which needs this indirectly, via
 * `x-post-parse.ts`/`youtube-parse.ts`'s own `isXUrl`/`isYouTubeWatchUrl`) is imported by
 * `AutofillBar.tsx`, a client component. Confirmed as a real regression, not a hypothetical one:
 * routing this through `utils.ts` once — before it was split out here — pushed `/generate`'s
 * client bundle from ~27kB to ~157kB (`npm run build`'s own First Load JS figures), because
 * webpack pulled in a `crypto` polyfill for the browser bundle. Keep this file free of *any*
 * import, ever, including from `utils.ts` itself.
 */

/**
 * AGLC4 r 7.16 wants the full date (and, to disambiguate multiple same-day posts, a time and —
 * only where the platform adjusts the displayed time to the viewer's own zone — time zone) that a
 * *viewer* would see a social media post as having been posted at. A page's own precise UTC (or
 * otherwise offset-qualified) timestamp is not what any particular viewer sees — but since this
 * whole app is scoped to AGLC4 (an Australian citation guide), converting to Australia/Sydney's
 * local time (which correctly tracks the AEST/AEDT daylight-saving switchover via the IANA tz
 * database, rather than a hand-rolled DST calculation that could easily get the cutover date
 * wrong) is the same assumption a student citing this from Australia would already be making by
 * reading the time their own browser displays. Shared by every social-media `*-parse.ts` module
 * (X/Twitter, YouTube, ...) rather than each reimplementing it.
 */
export function toAustralianDateTime(isoTimestamp: string): { date: string; time: string; timeZone: string } | undefined {
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) return undefined

  const date = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)

  // Intl inserts a space before 'am'/'pm' (eg '9:37 pm') — AGLC4's own worked example has none
  // ('9:37pm'), and lower-cases it to match.
  const time = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(parsed)
    .replace(/\s+/g, '')
    .toLowerCase()

  const timeZone =
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'short' })
      .formatToParts(parsed)
      .find((part) => part.type === 'timeZoneName')?.value ?? ''

  return { date, time, timeZone }
}
