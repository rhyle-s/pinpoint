'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatItalics } from '@/lib/citation-engine'
import { CitationFields, CitationResult, SourceType } from '@/lib/citation-engine/types'
import { createClient } from '@/lib/supabase/client'

interface SaveToLibraryButtonProps {
  sourceType: SourceType
  fields: CitationFields
  result: CitationResult | null
}

// Rendered below CitationOutput in Generator.tsx rather than folded into CitationOutput.tsx itself
// — CitationOutput is a pure display component today (result/rules/badge in, three panels out),
// and giving it its own sourceType/fields props just to know what to POST would tie a
// presentational component to the save feature for no real benefit.
//
// Collections (organising saved citations, eg by assessment) are deliberately NOT offered here —
// an earlier version asked for a collection name at save time, but that put the same decision in
// two different places with two different flows. Assigning a citation to a collection now happens
// entirely on the Library page (the "+" action on each row), so there's one place to do it, after
// the citation is already saved and visible in context next to the others.
export default function SaveToLibraryButton({ sourceType, fields, result }: SaveToLibraryButtonProps) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined) // undefined = still loading
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Reset the transient "Saved ✓" state whenever the citation itself changes, so it can't linger
  // across a genuinely different citation.
  useEffect(() => {
    setStatus('idle')
  }, [result?.footnote, result?.bibliography])

  if (!result || !result.footnote) return null

  async function handleSave() {
    if (!result) return
    setStatus('saving')

    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          fields,
          footnoteText: result.footnote,
          bibliographyText: result.bibliography,
          subsequentText: result.subsequent,
          footnoteHtml: formatItalics(result.footnote, 'html'),
          bibliographyHtml: formatItalics(result.bibliography, 'html'),
        }),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  if (userId === undefined) return null // still resolving auth state — avoid a flash of the wrong prompt

  if (userId === null) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-primary-tint px-4 py-2.5 text-sm text-gray-700">
        <span>Save this citation and build an AGLC4 reference library.</span>
        <Link href="/auth/login" className="font-semibold text-primary hover:text-[#1D4ED8]">
          Sign in →
        </Link>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === 'saving'}
      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        status === 'saved'
          ? 'bg-emerald-600 hover:bg-emerald-700'
          : status === 'error'
            ? 'bg-amber-600 hover:bg-amber-700'
            : 'bg-primary hover:bg-[#1D4ED8]'
      }`}
    >
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : status === 'error' ? "Couldn't save — try again" : 'Save to library'}
    </button>
  )
}
