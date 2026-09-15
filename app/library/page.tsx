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
      <LibraryClient userId={user.id} />
    </main>
  )
}
