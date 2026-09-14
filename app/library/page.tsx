import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LibraryClient from '@/components/LibraryClient'

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/library')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My library</h1>
        <p className="mt-1 text-base text-gray-500">Your saved citations. Export them all as a formatted bibliography.</p>
      </div>
      <LibraryClient userId={user.id} />
    </main>
  )
}
