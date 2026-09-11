/**
 * abc.net.au/news hosts both ordinary text articles AND video/TV content (eg Four Corners
 * episodes) under the exact same URL shape and domain — confirmed live: the app's existing
 * generic newspaper-article autofill was misclassifying a Four Corners episode page as a
 * newspaper article, since nothing distinguished them. ABC's own pages carry a genuinely reliable,
 * deterministic discriminator: an `ABC.ContentType` meta tag ('Article' for a real article,
 * 'video' for anything video-based) — confirmed against a real article and two real video pages.
 * The video pages also embed a `__NEXT_DATA__` JSON blob with the episode's own title and, at
 * `primaryContext.title`, the name of the program/series it belongs to (eg 'Four Corners') — no
 * meta tag carries this, it's only ever present as prose text ('Four Corners is the home of...')
 * otherwise, which isn't reliably parseable. No `'server-only'` import, matching every other
 * `*-parse.ts` file in this directory.
 */
export interface ABCVideoCitation {
  episodeTitle: string
  seriesTitle: string
  date: string // bare year, per AGLC4 r 7.14.1/7.14.3's own worked examples for TV
}

export function isABCVideoContentType(contentType: string): boolean {
  return contentType.trim().toLowerCase() === 'video'
}

/**
 * Deliberately narrow: only returns a result when `primaryContext.title` (the program/series
 * name) is genuinely present, since that's the one piece of information this whole dedicated
 * route exists to recover — without it, there's nothing this parser does better than falling
 * through to the generic AI-extraction path, so it declines rather than guessing.
 */
export function parseABCVideoNextData(nextData: unknown): ABCVideoCitation | undefined {
  if (typeof nextData !== 'object' || nextData === null) return undefined

  const headline = (nextData as Record<string, unknown>)
  const media = getPath(headline, ['props', 'pageProps', 'document', 'loaders', 'media', 'headlinePrepared'])
  if (typeof media !== 'object' || media === null) return undefined

  const episodeTitle = getPath(media as Record<string, unknown>, ['title'])
  const seriesTitle = getPath(media as Record<string, unknown>, ['primaryContext', 'title'])
  const published = getPath(media as Record<string, unknown>, ['firstUpdated']) ?? getPath(media as Record<string, unknown>, ['lastUpdated'])

  if (typeof episodeTitle !== 'string' || !episodeTitle.trim()) return undefined
  if (typeof seriesTitle !== 'string' || !seriesTitle.trim()) return undefined
  if (typeof published !== 'string') return undefined

  const year = published.match(/^(\d{4})-/)?.[1]
  if (!year) return undefined

  return { episodeTitle: episodeTitle.trim(), seriesTitle: seriesTitle.trim(), date: year }
}

function getPath(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

export function isABCNewsUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?abc\.net\.au\/news\//i.test(url)
}
