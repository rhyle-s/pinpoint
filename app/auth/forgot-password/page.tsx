'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60'
const primaryButtonClass =
  'w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setStatus('idle')
      setError(resetError.message)
      return
    }

    setStatus('sent')
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-base text-gray-500">Enter your email and we&rsquo;ll send you a link to reset your password.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          {status === 'sent' ? (
            <p className="text-sm text-gray-700">
              Check your email — we&rsquo;ve sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
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
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm font-medium text-amber-700">{error}</p>}

              <button type="submit" disabled={status === 'loading' || !email.trim()} className={primaryButtonClass}>
                {status === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
