'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/generate'
  const initialError = searchParams.get('error') === 'auth_failed' ? 'That link is invalid or expired — please try again.' : ''

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState(initialError)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (signInError) {
      setStatus('idle')
      setError(signInError.message)
      return
    }

    setStatus('sent')
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Sign in to Pinpoint</h1>
          <p className="mt-2 text-base text-gray-500">
            Enter your email and we&rsquo;ll send you a magic link — no password needed.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-6">
          {status === 'sent' ? (
            <p className="text-sm text-gray-700">
              Check your email — we&rsquo;ve sent a magic link to <span className="font-medium text-gray-900">{email}</span>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60"
                />
              </div>

              {error && <p className="text-sm font-medium text-amber-700">{error}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : 'Send magic link'}
              </button>
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
