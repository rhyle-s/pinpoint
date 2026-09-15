'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'password' | 'magic-link'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60'
const primaryButtonClass =
  'w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/generate'
  const initialError = searchParams.get('error') === 'auth_failed' ? 'That link is invalid or expired — please try again.' : ''

  const [activeTab, setActiveTab] = useState<Tab>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading'>('idle')
  const [passwordError, setPasswordError] = useState(initialError)

  // Unchanged from the original single-purpose version of this page, just moved under its own tab.
  const [magicEmail, setMagicEmail] = useState('')
  const [magicStatus, setMagicStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [magicError, setMagicError] = useState('')

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return

    setPasswordStatus('loading')
    setPasswordError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {
      setPasswordStatus('idle')
      setPasswordError(
        error.message.toLowerCase().includes('invalid login credentials') ? 'Invalid email or password.' : error.message,
      )
      return
    }

    router.push(next)
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!magicEmail.trim()) return

    setMagicStatus('loading')
    setMagicError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setMagicStatus('idle')
      setMagicError(error.message)
      return
    }

    setMagicStatus('sent')
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Sign in to Pinpoint</h1>
          <p className="mt-2 text-base text-gray-500">Sign in with your password, or use a magic link — no password needed.</p>
        </div>

        <div className="mb-6 flex justify-center gap-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'password' ? 'border-brand-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('magic-link')}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'magic-link' ? 'border-brand-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Magic link
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          {activeTab === 'password' ? (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={passwordStatus === 'loading'}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={passwordStatus === 'loading'}
                  className={inputClass}
                />
              </div>

              {passwordError && <p className="text-sm font-medium text-amber-700">{passwordError}</p>}

              <button
                type="submit"
                disabled={passwordStatus === 'loading' || !email.trim() || !password}
                className={primaryButtonClass}
              >
                {passwordStatus === 'loading' ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="space-y-1.5 text-center text-sm">
                <p>
                  <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </p>
                <p className="text-gray-500">
                  Don&rsquo;t have an account?{' '}
                  <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          ) : magicStatus === 'sent' ? (
            <p className="text-sm text-gray-700">
              Check your email — we&rsquo;ve sent a magic link to <span className="font-medium text-gray-900">{magicEmail}</span>.
            </p>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={magicStatus === 'loading'}
                  className={inputClass}
                />
              </div>

              {magicError && <p className="text-sm font-medium text-amber-700">{magicError}</p>}

              <button type="submit" disabled={magicStatus === 'loading' || !magicEmail.trim()} className={primaryButtonClass}>
                {magicStatus === 'loading' ? 'Sending…' : 'Send magic link'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Don&rsquo;t have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router — the fallback is invisible in
  // practice (this resolves on the same tick for a client navigation), but required regardless.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
