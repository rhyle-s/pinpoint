'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatItalics } from '@/lib/citation-engine'
import { CitationFields, CitationResult, SourceType } from '@/lib/citation-engine/types'
import { getCitationTitle } from '@/lib/citation-title'
import { createClient } from '@/lib/supabase/client'

interface SaveToLibraryButtonProps {
  sourceType: SourceType
  fields: CitationFields
  result: CitationResult | null
}

type SaveStatus = 'idle' | 'checking' | 'confirming' | 'saving' | 'saved' | 'error'

const CREATE_NEW_VALUE = '__create_new__'

// Rendered below CitationOutput in Generator.tsx rather than folded into CitationOutput.tsx itself
// — CitationOutput is a pure display component today (result/rules/badge in, three panels out),
// and giving it its own sourceType/fields props just to know what to POST would tie a
// presentational component to the save feature for no real benefit.
//
// Collections: back here after two earlier rounds removed it (a free-text field with a <datalist>
// hint read as too easy to miss, twice). This uses the same real <select> dropdown-or-create
// pattern the Library page settled on for CollectionEditor, not a repeat of either earlier attempt.
export default function SaveToLibraryButton({ sourceType, fields, result }: SaveToLibraryButtonProps) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined) // undefined = still loading
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [existingCollections, setExistingCollections] = useState<string[]>([])
  const [collectionMode, setCollectionMode] = useState<'select' | 'create'>('select')
  const [collectionValue, setCollectionValue] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Same list every collection-picking control on the Library page draws from, just fetched here
  // too since this component doesn't share state with LibraryClient.
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('citations')
      .select('label')
      .eq('user_id', userId)
      .not('label', 'is', null)
      .then(({ data }) => {
        const names = Array.from(new Set((data ?? []).map((row) => row.label as string).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b),
        )
        setExistingCollections(names)
        setCollectionMode(names.length > 0 ? 'select' : 'create')
      })
  }, [userId])

  // Reset to idle whenever the citation itself changes — including out of 'confirming', since a
  // "you already have this" warning shouldn't linger once the student has moved on to editing a
  // genuinely different citation.
  useEffect(() => {
    setStatus('idle')
  }, [result?.footnote, result?.bibliography])

  if (!result || !result.footnote) return null

  // Matches on the source's *title* (case name, Act title, article title, ...), not the full
  // formatted bibliography text. Two problems with matching on the formatted text: it's sensitive
  // to the AI validator correcting a detail between one save and the next (two saves of the
  // genuinely same source can end up with slightly different bibliography_text and silently not
  // match), and it's more precise than what "a duplicate" actually means here — two citations to
  // the same case at different pinpoints should still warn, and they only share the same *title*,
  // not the same formatted text. getCitationTitle() returns undefined for a handful of otherSources
  // subtypes with no single clean title field (dictionary/legal encyclopedia entries) — those skip
  // the check entirely rather than falling back to a less reliable comparison.
  async function isDuplicate(): Promise<boolean> {
    if (!result || !userId) return false
    const title = getCitationTitle(sourceType, fields)
    if (!title) return false

    const supabase = createClient()
    const { data } = await supabase.from('citations').select('fields').eq('user_id', userId).eq('source_type', sourceType)

    const normalized = title.trim().toLowerCase()
    return (data ?? []).some((row) => {
      const existingTitle = getCitationTitle(sourceType, row.fields as CitationFields)
      return existingTitle?.trim().toLowerCase() === normalized
    })
  }

  async function performSave() {
    if (!result) return
    setStatus('saving')

    const label = collectionMode === 'create' ? collectionValue.trim() || null : collectionValue || null

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
          label,
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

  // Re-checks for a duplicate on every click except when already 'confirming' — a second click on
  // the "save anyway?" state should just save, not silently re-run the check. Anything else
  // ('idle', 'saved', 'error') re-checks: without this, clicking Save again shortly after a
  // previous successful save (status still 'saved', not yet reset) skipped the check entirely and
  // saved a real duplicate without ever warning.
  async function handleSave() {
    if (status !== 'confirming') {
      setStatus('checking')
      if (await isDuplicate()) {
        setStatus('confirming')
        return
      }
    }
    await performSave()
  }

  function handleCollectionSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CREATE_NEW_VALUE) {
      setCollectionMode('create')
      setCollectionValue('')
    } else {
      setCollectionValue(e.target.value)
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

  const busy = status === 'checking' || status === 'saving'
  const hasExistingCollections = existingCollections.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      {collectionMode === 'select' ? (
        <select
          value={collectionValue}
          onChange={handleCollectionSelectChange}
          disabled={busy}
          title="Add this citation to a collection"
          className="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60"
        >
          <option value="">No collection</option>
          {existingCollections.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={CREATE_NEW_VALUE}>+ Create new collection…</option>
        </select>
      ) : (
        <>
          <input
            type="text"
            value={collectionValue}
            onChange={(e) => setCollectionValue(e.target.value)}
            placeholder="eg Torts Assessment 2"
            disabled={busy}
            className="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand disabled:opacity-60"
          />
          {hasExistingCollections && (
            <button
              type="button"
              onClick={() => {
                setCollectionMode('select')
                setCollectionValue('')
              }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Choose existing
            </button>
          )}
        </>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          status === 'saved'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : status === 'error'
              ? 'bg-amber-600 hover:bg-amber-700'
              : status === 'confirming'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-primary hover:bg-[#1D4ED8]'
        }`}
      >
        {status === 'checking'
          ? 'Checking…'
          : status === 'confirming'
            ? 'Already saved — save anyway?'
            : status === 'saving'
              ? 'Saving…'
              : status === 'saved'
                ? 'Saved ✓'
                : status === 'error'
                  ? "Couldn't save — try again"
                  : 'Save to library'}
      </button>
    </div>
  )
}
