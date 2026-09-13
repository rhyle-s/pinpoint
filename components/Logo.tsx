// Pinpoint wordmark — "Precision Mark" (chosen from the 8-direction exploration; see
// pinpoint-brand-spec.md's Logo section for the full rationale). One ink colour throughout, no
// two-tone split — a small blue full stop stands in for "pin" and for the name's own meaning.
// Never italicise, outline, stretch, or rotate; never render below 14px (the `sm` size is the floor).
const SIZES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
} as const

interface LogoProps {
  size?: keyof typeof SIZES
  /** Use on a dark or blue background — swaps to light text and a lighter accent dot. */
  onDark?: boolean
  /** Adds a short underline rule beneath the mark, echoed in the accent colour — a hero/marketing
   *  flourish, not for compact contexts like the nav bar (default off). */
  rule?: boolean
}

export default function Logo({ size = 'md', onDark = false, rule = false }: LogoProps) {
  const ink = onDark ? '#F1F5FF' : '#1C1C1A'
  const accent = onDark ? '#93C5FD' : '#2563EB'

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <span className={`font-sans font-bold ${SIZES[size]}`} style={{ letterSpacing: '-0.03em', color: ink }}>
        pinpoint
        <span style={{ color: accent, marginLeft: 1 }}>.</span>
      </span>
      {rule && (
        <span
          aria-hidden
          style={{ width: '2.4em', height: 3, borderRadius: 2, background: accent, display: 'block' }}
        />
      )}
    </span>
  )
}
