import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/generate'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // A password-reset email link carries a token_hash + type=recovery instead of a code — exchanging
  // it here gives the student a temporary session, then /auth/reset-password calls updateUser()
  // while that session is still active.
  if (tokenHash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
