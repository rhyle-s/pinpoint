/** AGLC4 r 1.4.3 — 'Ibid' for a footnote repeating the immediately preceding source. */
export function formatIbid(pinpoint?: string): string {
  return pinpoint ? `Ibid ${pinpoint.trim()}.` : 'Ibid.'
}

/** AGLC4 r 1.4.4 — short-title 'above n' reference back to an earlier footnote. */
export function formatAboveN(italicShortTitle: string, footnoteNumber: string, pinpoint?: string): string {
  const suffix = pinpoint ? ` ${pinpoint.trim()}` : ''
  return `${italicShortTitle} (n ${footnoteNumber})${suffix}.`
}

/** Heuristic short title for a case: the party name before ' v '. */
export function deriveCaseShortTitle(caseName: string): string {
  const idx = caseName.indexOf(' v ')
  if (idx === -1) return caseName
  return caseName.slice(0, idx).trim()
}
