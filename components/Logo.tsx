// Pinpoint Brand & Design System v1.0 — wordmark: all lowercase, no icon, no separator.
// "pin" is brand blue, "point" is near-black; never italicise/outline/stretch/rotate, and never
// render below 14px (the `sm` size below is the floor). Uses the app's own `--font-sans` (Plus
// Jakarta Sans, loaded once in app/layout.tsx) rather than loading the font a second time here.
const SIZES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
} as const

interface LogoProps {
  size?: keyof typeof SIZES
  /** Use on a dark background — swaps to the light-blue / near-white pairing from the spec. */
  onDark?: boolean
}

export default function Logo({ size = 'md', onDark = false }: LogoProps) {
  const pin = onDark ? '#60A5FA' : '#2563EB'
  const point = onDark ? '#F1F5FF' : '#1C1C1A'

  return (
    <span className={`font-sans font-semibold tracking-tight ${SIZES[size]}`} style={{ letterSpacing: '-0.5px' }}>
      <span style={{ color: pin }}>pin</span>
      <span style={{ color: point }}>point</span>
    </span>
  )
}
