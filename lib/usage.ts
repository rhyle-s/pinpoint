import { createClient } from '@/lib/supabase/client'

const FREE_MONTHLY_LIMIT = 10
const LOCAL_STORAGE_KEY = 'pp_usage'

interface LocalUsage {
  count: number
  month: string // 'YYYY-MM'
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function readLocalUsage(): LocalUsage {
  if (typeof window === 'undefined') return { count: 0, month: currentMonthKey() }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return { count: 0, month: currentMonthKey() }
    const parsed = JSON.parse(raw) as LocalUsage
    if (parsed.month !== currentMonthKey()) return { count: 0, month: currentMonthKey() }
    return parsed
  } catch {
    // Corrupt or inaccessible localStorage (private browsing, quota) — fail open to "no usage
    // recorded yet" rather than blocking generation over a storage error.
    return { count: 0, month: currentMonthKey() }
  }
}

function writeLocalUsage(usage: LocalUsage): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(usage))
  } catch {
    // Nothing sensible to do if this fails — the user just won't be gated accurately this session.
  }
}

interface ProfileUsageRow {
  plan: string
  citations_this_month: number
  month_reset_at: string
}

// Shared by canGenerate/recordGeneration: fetches the caller's profile row, and if it's carrying
// over a count from a previous calendar month, resets it in the database before returning — so
// both the check and the increment always see this month's true count, not a stale one.
async function getCurrentMonthProfile(userId: string): Promise<ProfileUsageRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('plan, citations_this_month, month_reset_at')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const resetMonth = new Date(data.month_reset_at)
  const currentMonthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  const isStale =
    resetMonth.getUTCFullYear() !== currentMonthStart.getUTCFullYear() ||
    resetMonth.getUTCMonth() !== currentMonthStart.getUTCMonth()

  if (!isStale) return data

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ citations_this_month: 0, month_reset_at: currentMonthStart.toISOString() })
    .eq('id', userId)
    .select('plan, citations_this_month, month_reset_at')
    .single()

  return updateError || !updated ? { ...data, citations_this_month: 0 } : updated
}

/**
 * Checks whether the current visitor can generate another citation this month.
 *
 * A "generation" here means a distinct, completed citation reaching the output panel — see the
 * dedup logic in Generator.tsx's recordGeneration call site, not every keystroke while editing
 * fields. Unauthenticated usage is tracked client-side only (localStorage) since there's no user
 * row to attach it to; it resets if the browser storage is cleared, which is an accepted gap for
 * a soft/anti-abuse limit rather than a paywall.
 */
export async function canGenerate(userId: string | null): Promise<{
  allowed: boolean
  remaining: number | null
  requiresLogin: boolean
}> {
  if (!userId) {
    const usage = readLocalUsage()
    const remaining = Math.max(0, FREE_MONTHLY_LIMIT - usage.count)
    return { allowed: remaining > 0, remaining, requiresLogin: remaining <= 0 }
  }

  const profile = await getCurrentMonthProfile(userId)
  if (!profile) {
    // No profile row (shouldn't happen once the signup trigger has run) — fail open rather than
    // blocking a signed-in user over a transient read failure.
    return { allowed: true, remaining: null, requiresLogin: false }
  }

  if (profile.plan !== 'free') {
    return { allowed: true, remaining: null, requiresLogin: false }
  }

  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - profile.citations_this_month)
  return { allowed: remaining > 0, remaining, requiresLogin: false }
}

/** Records one generation against the current month's count. No-op for unlimited plans. */
export async function recordGeneration(userId: string | null): Promise<void> {
  if (!userId) {
    const usage = readLocalUsage()
    writeLocalUsage({ count: usage.count + 1, month: currentMonthKey() })
    return
  }

  const profile = await getCurrentMonthProfile(userId)
  if (!profile || profile.plan !== 'free') return

  const supabase = createClient()
  await supabase
    .from('profiles')
    .update({ citations_this_month: profile.citations_this_month + 1 })
    .eq('id', userId)
}
