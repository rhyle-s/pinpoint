// Pinpoint wordmark — Brand & Design System v2.0 (LOCKED). One ink colour throughout, no two-tone
// split — a trailing full stop stands in for "pin" and for the name's own meaning. Two variants,
// used contextually (never both on the same background): `white` for the blue nav (full white
// wordmark, the dot rendered as a faint white rather than the brand blue — the nav is already
// blue, so a blue dot there would disappear); `black` for white/light backgrounds (near-black
// wordmark, brand-blue dot). Never italicise, outline, stretch, or rotate; never render below
// 14px (the `sm` size is the floor).
type LogoVariant = 'white' | 'black'
type LogoSize = 'sm' | 'md' | 'lg'

const SIZES: Record<LogoSize, string> = { sm: '14px', md: '20px', lg: '28px' }

interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
}

export default function Logo({ variant = 'white', size = 'md' }: LogoProps) {
  const ink = variant === 'white' ? '#FFFFFF' : '#1C1C1A'
  const dot = variant === 'white' ? 'rgba(255,255,255,0.35)' : '#2563EB'

  return (
    <span
      className="font-sans font-bold"
      style={{ letterSpacing: '-0.5px', fontSize: SIZES[size], lineHeight: 1, display: 'inline-flex', alignItems: 'baseline' }}
    >
      <span style={{ color: ink }}>pinpoint</span>
      <span style={{ color: dot }}>.</span>
    </span>
  )
}
