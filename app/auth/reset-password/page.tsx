'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60'
const primaryButtonClass =
  'w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50'

const MIN_PASSWORD_LENGTH = 8
const REDIRECT_DELAY_MS = 2000

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setStatus('loading')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setStatus('idle')
      setError(updateError.message)
      return
    }

    setStatus('success')
    setTimeout(() => router.push('/generate'), REDIRECT_DELAY_MS)
  }

  return (
    <main className="mx-auto flex max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Set a new password</h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          {status === 'success' ? (
            <p className="text-sm text-gray-700">Password updated. Redirecting…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={status === 'loading'}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={status === 'loading'}
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm font-medium text-amber-700">{error}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !password || !confirmPassword}
                className={primaryButtonClass}
              >
                {status === 'loading' ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
