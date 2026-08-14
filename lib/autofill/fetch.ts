import 'server-only'

const PRIMARY_USER_AGENT = 'Pinpoint/1.0 (aglcite.com.au)'
// Some sites front public, unauthenticated content with a WAF that rejects any non-browser
// User-Agent outright (eg archive.sclqld.org.au, confirmed by direct testing: our own UA gets a
// 403, an ordinary browser UA gets a clean 200) — there's no real access control being bypassed,
// just a coarse header filter. This does nothing for a genuine bot challenge (eg AustLII, or
// NSW/SA legislation's Cloudflare JS challenge), which blocks at the network level regardless of
// UA — those still fail exactly as before.
const FALLBACK_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

const MAX_REDIRECT_HOPS = 5
// A genuine "nothing here, go elsewhere" redirect has little or no body of its own. Confirmed by
// direct testing against WA's eCourts Portal: it 302s every request to a terms-of-use gate, but
// the 302 response itself already carries the full decision page (500KB+) — a plain fetch()
// silently follows the redirect and loses that content. A body past this length is treated as
// the real response instead of being discarded in favour of the redirect target.
const MIN_USEFUL_REDIRECT_BODY_LENGTH = 2000

async function fetchWithUserAgent(url: string, userAgent: string, init?: RequestInit): Promise<Response> {
  let currentUrl = url

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
      headers: { ...init?.headers, 'User-Agent': userAgent },
    })

    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get('location')
    if (!location) return response

    const bodyText = await response.text()
    if (bodyText.length >= MIN_USEFUL_REDIRECT_BODY_LENGTH) {
      // Synthesise a 200 carrying that body so callers — which all just check response.ok — treat
      // it exactly like a normal successful fetch, with no special-casing needed on their end.
      return new Response(bodyText, { status: 200, headers: response.headers })
    }

    currentUrl = new URL(location, currentUrl).toString()
  }

  return fetch(currentUrl, { ...init, headers: { ...init?.headers, 'User-Agent': userAgent } })
}

/**
 * Fetches with our own identifying User-Agent first, retrying with a browser UA only if that's
 * rejected — and along the way, follows redirects manually so a redirect whose own body already
 * contains the real page (see MIN_USEFUL_REDIRECT_BODY_LENGTH above) isn't silently discarded.
 */
export async function fetchWithUserAgentFallback(url: string, init?: RequestInit): Promise<Response> {
  const primary = await fetchWithUserAgent(url, PRIMARY_USER_AGENT, init)
  if (primary.ok) return primary

  return fetchWithUserAgent(url, FALLBACK_USER_AGENT, init)
}
