import Link from 'next/link'

interface UsageGateProps {
  requiresLogin: boolean
}

// Shown in place of CitationOutput once the monthly free-generation limit is hit — see
// lib/usage.ts for what counts as "a generation" and Generator.tsx for where this is wired in.
export default function UsageGate({ requiresLogin }: UsageGateProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 text-center">
      <p className="text-sm text-gray-700">
        {requiresLogin ? (
          <>
            You&rsquo;ve used your 10 free citations this month.{' '}
            <Link href="/auth/login" className="font-medium text-primary underline hover:text-[#1D4ED8]">
              Sign in
            </Link>{' '}
            to continue.
          </>
        ) : (
          <>You&rsquo;ve used your 10 free citations this month. Upgrade to Student plan for unlimited citations.</>
        )}
      </p>
    </div>
  )
}
