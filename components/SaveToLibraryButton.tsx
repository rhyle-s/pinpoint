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

// Remembered across saves in this browser so a student working through one assessment doesn't
// have to retype the same collection name for every citation — still just a starting point, not
// a hard default; they can clear or change it before any individual save.
const LAST_COLLECTION_KEY = 'pp_last_collection'

// Rendered below CitationOutput in Generator.tsx rather than folded into CitationOutput.tsx itself
// — CitationOutput is a pure display component today (result/rules/badge in, three panels out),
// and giving it its own sourceType/fields props just to know what to POST would tie a
// presentational component to the save feature for no real benefit.
export default function SaveToLibraryButton({ sourceType, fields, result }: SaveToLibraryButtonProps) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined) // undefined = still loading
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [collection, setCollection] = useState('')
  const [existingCollections, setExistingCollections] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    try {
      setCollection(window.localStorage.getItem(LAST_COLLECTION_KEY) ?? '')
    } catch {
      // Private browsing / storage disabled — the field just starts blank.
    }
  }, [])

  // Populates the <datalist> below with collections the student already has, so the field reads
  // as "pick from your existing assessments" rather than a mystery blank box — the single biggest
  // discoverability fix for a feature that was otherwise easy to miss entirely.
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('citations')
      .select('label')
      .eq('user_id', userId)
      .not('label', 'is', null)
      .then(({ data }) => {
        const names = Array.from(new Set((data ?? []).map((row) => row.label as string).filter(Boolean)))
        setExistingCollections(names.sort((a, b) => a.localeCompare(b)))
      })
  }, [userId])

  // Reset the transient "Saved ✓" state whenever the citation itself changes, so it can't linger
  // across a genuinely different citation.
  useEffect(() => {
    setStatus('idle')
  }, [result?.footnote, result?.bibliography])

  if (!result || !result.footnote) return null

  async function handleSave() {
    if (!result) return
    setStatus('saving')

    const trimmedCollection = collection.trim()
    try {
      window.localStorage.setItem(LAST_COLLECTION_KEY, trimmedCollection)
    } catch {
      // Non-fatal — just means the field won't be pre-filled next time.
    }

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
          label: trimmedCollection || null,
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
    <div className="rounded-xl border border-gray-200 p-4">
      <label htmlFor="save-collection" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
        Add to a collection <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="save-collection"
          type="text"
          list="save-collection-options"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          placeholder="eg Torts Assessment 2"
          disabled={status === 'saving'}
          className="min-w-[160px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60"
        />
        <datalist id="save-collection-options">
          {existingCollections.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            status === 'saved'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : status === 'error'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-primary hover:bg-[#1D4ED8]'
          }`}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : status === 'error' ? "Couldn't save — try again" : 'Save to library'}
        </button>
      </div>
    </div>
  )
}
