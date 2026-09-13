'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

const TABS = [
  { label: 'Generate', href: '/generate', active: true },
  { label: 'Checker', href: '#', active: false },
  { label: 'Library', href: '#', active: false },
  { label: 'Guide', href: '/guide', active: true },
]

// Brand & Design System v2.0 (LOCKED): blue nav (#2563EB) + white wordmark — see
// pinpoint-brand-spec-v2.md §5. Height is fixed at 56px per spec rather than left to padding, so
// it stays exact regardless of font metrics.
export default function NavBar() {
  const pathname = usePathname()

  return (
    <header style={{ height: 56 }} className="bg-primary">
      <nav className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-7">
        <Link href="/generate" className="shrink-0">
          <Logo variant="white" size="md" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <ul className="flex items-center gap-3 sm:gap-6">
            {TABS.map((tab) => {
              if (!tab.active) {
                // Not yet built, and not worth the space on a narrow viewport — kept for desktop
                // only; Generate/Guide (the two real, working tabs) always stay visible.
                return (
                  <li key={tab.label} className="hidden sm:block">
                    <span
                      title="Coming soon"
                      className="pointer-events-none cursor-default text-[13px] font-medium text-white/40"
                    >
                      {tab.label}
                    </span>
                  </li>
                )
              }

              const isCurrent = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

              return (
                <li key={tab.label}>
                  <Link
                    href={tab.href}
                    className={`whitespace-nowrap text-[13px] ${
                      isCurrent ? 'font-bold text-white' : 'font-medium text-white/75 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* No dedicated signup/landing flow exists in the app yet — points at the tool itself,
              the closest thing to a "get started" destination today. Redirect this once there's a
              real target (a marketing page, a saved-citations library sign-up, etc). */}
          <Link
            href="/generate"
            className="hidden shrink-0 whitespace-nowrap rounded-md bg-white/15 px-4 py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-white/25 sm:inline-block"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}
