'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Generate', href: '/generate', active: true },
  { label: 'Checker', href: '#', active: false },
  { label: 'Library', href: '#', active: false },
  { label: 'Guide', href: '/guide', active: true },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white" style={{ borderBottomWidth: '0.5px' }}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/generate" className="text-lg font-medium tracking-tight text-gray-900">
          pin<span className="text-primary">·</span>point
        </Link>

        <ul className="flex items-center gap-6">
          {TABS.map((tab) => {
            if (!tab.active) {
              return (
                <li key={tab.label} className="group relative">
                  <span className="cursor-not-allowed text-sm font-medium text-gray-400">{tab.label}</span>
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
                  className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
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
