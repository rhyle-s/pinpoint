'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'

const TABS = [
  { label: 'Generate', href: '/generate', active: true },
  { label: 'Checker', href: '#', active: false },
  { label: 'Library', href: '/library', active: true },
  { label: 'Guide', href: '/guide', active: true },
]

const EMAIL_TRUNCATE_LENGTH = 20

function truncateEmail(email: string): string {
  return email.length > EMAIL_TRUNCATE_LENGTH ? `${email.slice(0, EMAIL_TRUNCATE_LENGTH)}...` : email
}

// No display name anywhere in this app's auth (magic-link email only) — the avatar pill's initials
// come from the email's own local-part instead of a name field that doesn't exist.
function getInitials(email: string): string {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

function AuthControl() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null | undefined>(undefined) // undefined = still loading

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user?.email ?? null))
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/generate')
    router.refresh()
  }

  if (email === undefined) return null

  if (email === null) {
    return (
      <Link
        href="/auth/login"
        className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
      >
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 shadow-xs">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
          {getInitials(email)}
        </span>
        <span className="text-sm font-medium text-gray-700" title={email}>
          {truncateEmail(email)}
        </span>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  )
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/generate">
          <Logo size="lg" />
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-1">
            {TABS.map((tab) => {
              if (!tab.active) {
                return (
                  <div key={tab.label} className="group relative">
                    <span className="cursor-not-allowed rounded-full px-4 py-1.5 text-sm font-semibold text-gray-300">
                      {tab.label}
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Coming soon
                    </span>
                  </div>
                )
              }

              const isCurrent = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    isCurrent ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          <div className="h-5 w-px bg-gray-200" aria-hidden />

          <AuthControl />
        </div>
      </nav>
    </header>
  )
}
