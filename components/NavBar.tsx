'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from './Logo'

const TABS = [
  { label: 'Generate', href: '/generate', active: true },
  { label: 'Checker', href: '/checker', active: true },
  { label: 'Library', href: '/library', active: true },
  { label: 'Guide', href: '/guide', active: true },
]

// No display name anywhere in this app's auth (magic-link email only) — the avatar circle's
// initials come from the email's own local-part instead of a name field that doesn't exist.
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
        className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
      >
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-700 shadow-xs"
        title={email}
      >
        {getInitials(email)}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-white/70 transition-colors hover:text-white"
      >
        Sign out
      </button>
    </div>
  )
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-primary">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/generate">
          <Logo size="lg" onDark />
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="flex items-center gap-0.5 rounded-full bg-white/15 p-1">
            {TABS.map((tab) => {
              if (!tab.active) {
                return (
                  <div key={tab.label} className="group relative">
                    <span className="cursor-not-allowed rounded-full px-4 py-1.5 text-sm font-semibold text-white/40">
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
                    isCurrent ? 'bg-white text-gray-900 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          <div className="h-5 w-px bg-white/20" aria-hidden />

          <AuthControl />
        </div>
      </nav>
    </header>
  )
}
