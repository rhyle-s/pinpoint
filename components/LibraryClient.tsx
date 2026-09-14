'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatItalics } from '@/lib/citation-engine'
import { SourceType } from '@/lib/citation-engine/types'
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_PILL_CLASSES, SavedCitation } from '@/lib/library-types'
import { createClient } from '@/lib/supabase/client'

type SortOption = 'newest' | 'oldest' | 'type-az'
type TypeFilter = 'all' | SourceType

const DATE_FORMAT = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

async function copyRich(plainText: string, htmlText: string) {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([htmlText], { type: 'text/html' }),
        }),
      ])
      return true
    }
    await navigator.clipboard.writeText(plainText)
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(plainText)
      return true
    } catch {
      return false
    }
  }
}

function CitationCard({ citation, onDeleted }: { citation: SavedCitation; onDeleted: (id: string) => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [copiedField, setCopiedField] = useState<'footnote' | 'bibliography' | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCopy(field: 'footnote' | 'bibliography') {
    const plain = formatItalics(field === 'footnote' ? citation.footnote_text : citation.bibliography_text, 'plain')
    const html =
      (field === 'footnote' ? citation.footnote_html : citation.bibliography_html) ??
      formatItalics(field === 'footnote' ? citation.footnote_text : citation.bibliography_text, 'html')

    const ok = await copyRich(plain, html)
    if (ok) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }

    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('citations').delete().eq('id', citation.id)
    if (!error) {
      onDeleted(citation.id)
    } else {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${SOURCE_TYPE_PILL_CLASSES[citation.source_type]}`}
        >
          {SOURCE_TYPE_LABELS[citation.source_type]}
        </span>
        <span className="text-xs text-gray-400">{DATE_FORMAT.format(new Date(citation.created_at))}</span>
      </div>

      <p
        className="font-citation text-[15px] leading-[1.8] text-gray-900"
        dangerouslySetInnerHTML={{
          __html: citation.bibliography_html ?? formatItalics(citation.bibliography_text, 'html'),
        }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleCopy('footnote')}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            copiedField === 'footnote'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {copiedField === 'footnote' ? 'Copied ✓' : 'Copy footnote'}
        </button>
        <button
          type="button"
          onClick={() => handleCopy('bibliography')}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            copiedField === 'bibliography'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {copiedField === 'bibliography' ? 'Copied ✓' : 'Copy bibliography'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={`ml-auto rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            confirmingDelete
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {deleting ? 'Deleting…' : confirmingDelete ? 'Are you sure?' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

export default function LibraryClient({ userId }: { userId: string }) {
  const [citations, setCitations] = useState<SavedCitation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase
      .from('citations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setCitations((data as SavedCitation[]) ?? [])
          setLoading(false)
        }
      })

    // Keeps the list in sync across tabs/devices — a save in the generator (a different tab) or a
    // delete elsewhere shows up here without a manual refresh.
    const channel = supabase
      .channel('citations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citations', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCitations((prev) =>
            prev.some((c) => c.id === payload.new.id) ? prev : [payload.new as SavedCitation, ...prev],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'citations', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCitations((prev) => prev.filter((c) => c.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  function handleDeleted(id: string) {
    setCitations((prev) => prev.filter((c) => c.id !== id))
  }

  const visibleCitations = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = citations.filter((c) => {
      if (typeFilter !== 'all' && c.source_type !== typeFilter) return false
      if (!query) return true
      return c.footnote_text.toLowerCase().includes(query) || c.bibliography_text.toLowerCase().includes(query)
    })

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return b.created_at.localeCompare(a.created_at)
      if (sort === 'oldest') return a.created_at.localeCompare(b.created_at)
      return SOURCE_TYPE_LABELS[a.source_type].localeCompare(SOURCE_TYPE_LABELS[b.source_type])
    })

    return list
  }, [citations, search, sort, typeFilter])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your library…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search citations…"
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
        >
          <option value="newest">Date added (newest)</option>
          <option value="oldest">Date added (oldest)</option>
          <option value="type-az">Source type (A–Z)</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
        >
          <option value="all">All types</option>
          {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((type) => (
            <option key={type} value={type}>
              {SOURCE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <a
          href="/api/library/export"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Export bibliography (.docx)
        </a>
      </div>

      <p className="text-sm text-gray-500">
        {citations.length} {citations.length === 1 ? 'citation' : 'citations'} saved
      </p>

      {citations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">
            No citations saved yet. Generate a citation and click &ldquo;Save to library&rdquo; to add it here.
          </p>
        </div>
      ) : visibleCitations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No citations match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCitations.map((citation) => (
            <CitationCard key={citation.id} citation={citation} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
