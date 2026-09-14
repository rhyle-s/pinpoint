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
      <Link href="/auth/login" className="text-base font-medium text-white/75 hover:text-white">
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-base font-medium text-white/75" title={email}>
        {truncateEmail(email)}
      </span>
      <button type="button" onClick={handleSignOut} className="text-base font-medium text-white/75 hover:text-white">
        Sign out
      </button>
    </div>
  )
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="bg-primary">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/generate">
          <Logo size="xl" onDark />
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <ul className="flex items-center gap-6">
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

          <div className="h-5 w-px bg-white/20" aria-hidden />

          <AuthControl />
        </div>
      </nav>
    </header>
  )
}
