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

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="bg-primary">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/generate">
          <Logo size="xl" onDark />
        </Link>

        <ul className="hidden items-center gap-6 sm:flex">
          {TABS.map((tab) => {
            if (!tab.active) {
              return (
                <li key={tab.label} className="group relative">
                  <span className="cursor-not-allowed text-base font-medium text-white/40">{tab.label}</span>
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Coming soon
                  </span>
                </li>
              )
            }

            const isCurrent = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

            return (
              <li key={tab.label}>
                <Link
                  href={tab.href}
                  className={`text-base font-medium ${isCurrent ? 'text-white' : 'text-white/75 hover:text-white'}`}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
