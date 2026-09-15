'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatItalics } from '@/lib/citation-engine'
import { SourceType } from '@/lib/citation-engine/types'
import {
  SOURCE_TYPE_ACCENT_CLASSES,
  SOURCE_TYPE_LABELS,
  SOURCE_TYPE_PILL_CLASSES,
  SavedCitation,
  UNCATEGORISED_COLLECTION,
} from '@/lib/library-types'
import { createClient } from '@/lib/supabase/client'

type SortOption = 'newest' | 'oldest' | 'type-az'
type TypeFilter = 'all' | SourceType

const DATE_FORMAT = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

// Sentinel <option> value for "+ Create new collection…" in CollectionEditor's dropdown — distinct
// from a real collection name (which could theoretically collide with a literal string otherwise).
const CREATE_NEW_VALUE = '__create_new__'

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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

// "All citations" sidebar entry — a stack/layers glyph rather than FolderIcon, since it represents
// every citation rather than one collection.
function LayersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 3.3l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

// Export is now its own choice at click time (entire library vs one collection) instead of
// silently reading whatever the collection filter above happens to be set to — that reliance is
// what the "exports your whole library by default…" note existed to explain, and asking the
// question directly here means the note isn't needed at all.
function ExportMenu({ collectionNames, hasUncategorised }: { collectionNames: string[]; hasUncategorised: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const hasCollections = collectionNames.length > 0 || hasUncategorised

  if (!hasCollections) {
    return (
      <a
        href="/api/library/export"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
      >
        Export bibliography (.docx)
      </a>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
      >
        Export bibliography (.docx)
        <ChevronIcon expanded={open} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <a
            href="/api/library/export"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Entire library
          </a>
          <div className="my-1 border-t border-gray-100" />
          {collectionNames.map((name) => (
            <a
              key={name}
              href={`/api/library/export?collection=${encodeURIComponent(name)}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block truncate px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {name}
            </a>
          ))}
          {hasUncategorised && (
            <a
              href={`/api/library/export?collection=${encodeURIComponent(UNCATEGORISED_COLLECTION)}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Uncategorised
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// Small icon button shared by the row-level and expanded-detail copy/delete/collection controls —
// text is screen-reader-only (aria-label) so the row stays dense, with a native title tooltip for
// sighted hover users. `tone="blue"` is the resting style for the row's three action buttons
// (copy/add-to-collection/delete); `active`/`danger` still override it for a state that means
// something (copied, confirming delete) rather than just "this button exists".
function IconButton({
  label,
  onClick,
  active,
  danger,
  tone,
  children,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  active?: boolean
  danger?: boolean
  tone?: 'blue'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
          : danger
            ? 'border-red-200 bg-red-50 text-red-600'
            : tone === 'blue'
              ? 'border-brand-200 bg-primary-tint text-primary hover:bg-brand-100'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function DetailPanel({ label, rule, text, html }: { label: string; rule?: string; text: string; html: string | null }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyRich(formatItalics(text, 'plain'), html ?? formatItalics(text, 'html'))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (!text) return null

  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p className="text-xs font-medium text-gray-500">
          {label}
          {rule && <span className="ml-1.5 font-normal text-gray-400">{rule}</span>}
        </p>
        <p
          className="mt-0.5 font-citation text-[15px] leading-[1.7] text-gray-900"
          dangerouslySetInnerHTML={{ __html: html ?? formatItalics(text, 'html') }}
        />
      </div>
      <IconButton label={`Copy ${label.toLowerCase()}`} onClick={handleCopy} active={copied}>
        <CopyIcon />
      </IconButton>
    </div>
  )
}

// Triggered by the row's "+" action, not by expanding the row — a dedicated, lightweight way to
// assign a citation to a collection (new or existing) without pulling up the full citation detail.
// The <datalist> offers every collection the student already has, so typing a new name and
// picking an existing one are the same field, not two different controls.
function CollectionEditor({
  citation,
  collectionOptions,
  onLabelChanged,
  onClose,
}: {
  citation: SavedCitation
  collectionOptions: string[]
  onLabelChanged: (id: string, label: string | null) => void
  onClose: () => void
}) {
  // 'select' shows a dropdown of existing collections (plus "No collection" and "+ Create new") —
  // only meaningful when there's at least one existing collection to pick from. 'create' is a
  // plain text input for typing a brand new name; it's the only mode at all when there are no
  // existing collections yet, since a dropdown with nothing but "+ Create new" in it would be a
  // pointless extra click.
  const hasExisting = collectionOptions.length > 0
  const [mode, setMode] = useState<'select' | 'create'>(hasExisting ? 'select' : 'create')
  const [value, setValue] = useState(citation.label ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaving(true)
    const trimmed = value.trim()
    const supabase = createClient()
    const { error } = await supabase.from('citations').update({ label: trimmed || null }).eq('id', citation.id)
    setSaving(false)
    if (!error) {
      onLabelChanged(citation.id, trimmed || null)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 900)
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CREATE_NEW_VALUE) {
      setMode('create')
      setValue('')
    } else {
      setValue(e.target.value)
    }
  }

  return (
    <div className="flex items-center gap-2 py-2" onClick={(e) => e.stopPropagation()}>
      <p className="w-32 shrink-0 text-xs font-medium text-gray-500">Collection</p>
      {mode === 'select' ? (
        <select
          value={value}
          onChange={handleSelectChange}
          autoFocus
          className="min-w-[180px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
        >
          <option value="">No collection</option>
          {collectionOptions.map((name) => (
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="eg Torts Assessment 2"
            autoFocus
            className="min-w-[180px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
          />
          {hasExisting && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMode('select')
                setValue(citation.label ?? '')
              }}
              className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Choose existing
            </button>
          )}
        </>
      )}
      <IconButton label="Save collection" onClick={handleSave} active={saved} tone="blue">
        {saving ? <span className="text-[10px]">…</span> : saved ? '✓' : '↵'}
      </IconButton>
    </div>
  )
}

function CitationRow({
  citation,
  expanded,
  showCollectionEditor,
  collectionOptions,
  selected,
  onToggle,
  onToggleCollectionEditor,
  onToggleSelect,
  onDeleted,
  onLabelChanged,
}: {
  citation: SavedCitation
  expanded: boolean
  showCollectionEditor: boolean
  collectionOptions: string[]
  selected: boolean
  onToggle: () => void
  onToggleCollectionEditor: () => void
  onToggleSelect: () => void
  onDeleted: (id: string) => void
  onLabelChanged: (id: string, label: string | null) => void
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [copiedBiblio, setCopiedBiblio] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleQuickCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await copyRich(
      formatItalics(citation.bibliography_text, 'plain'),
      citation.bibliography_html ?? formatItalics(citation.bibliography_text, 'html'),
    )
    if (ok) {
      setCopiedBiblio(true)
      setTimeout(() => setCopiedBiblio(false), 1500)
    }
  }

  function handleToggleCollectionEditor(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleCollectionEditor()
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
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
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-l-4 border-gray-200 last:border-b-0 hover:bg-gray-50 ${SOURCE_TYPE_ACCENT_CLASSES[citation.source_type]}`}
      >
        <td className="whitespace-nowrap py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${formatItalics(citation.bibliography_text, 'plain')}`}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-brand-600"
          />
        </td>
        <td className="whitespace-nowrap py-2.5 pr-3">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_TYPE_PILL_CLASSES[citation.source_type]}`}
            >
              {SOURCE_TYPE_LABELS[citation.source_type]}
            </span>
            {citation.label && (
              <span className="inline-flex w-fit items-center rounded-full bg-primary-tint px-2 py-0.5 text-xs font-medium text-primary">
                {citation.label}
              </span>
            )}
          </div>
        </td>
        <td className="max-w-0 w-full py-2.5 pr-3">
          <p
            className="truncate font-citation text-[15px] text-gray-900"
            title={formatItalics(citation.bibliography_text, 'plain')}
            dangerouslySetInnerHTML={{
              __html: citation.bibliography_html ?? formatItalics(citation.bibliography_text, 'html'),
            }}
          />
        </td>
        <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-gray-400">
          {DATE_FORMAT.format(new Date(citation.created_at))}
        </td>
        <td className="whitespace-nowrap py-2.5 pr-4">
          <div className="flex items-center justify-end gap-1.5">
            <IconButton label="Copy bibliography" onClick={handleQuickCopy} active={copiedBiblio} tone="blue">
              <CopyIcon />
            </IconButton>
            <IconButton label="Add to collection" onClick={handleToggleCollectionEditor} tone="blue">
              <PlusIcon />
            </IconButton>
            <IconButton
              label={confirmingDelete ? 'Confirm delete' : 'Delete'}
              onClick={handleDelete}
              danger={confirmingDelete}
              tone="blue"
            >
              {deleting ? <span className="text-[10px]">…</span> : <TrashIcon />}
            </IconButton>
            <ChevronIcon expanded={expanded} />
          </div>
        </td>
      </tr>
      {showCollectionEditor && (
        <tr className="border-b border-gray-200 bg-primary-tint last:border-0">
          <td colSpan={5} className="px-4 py-1">
            <CollectionEditor
              citation={citation}
              collectionOptions={collectionOptions}
              onLabelChanged={onLabelChanged}
              onClose={onToggleCollectionEditor}
            />
          </td>
        </tr>
      )}
      {expanded && (
        <tr className="border-b border-gray-200 bg-gray-50 last:border-0">
          <td colSpan={5} className="px-4 py-1">
            <div className="divide-y divide-gray-200">
              <DetailPanel label="Footnote citation" text={citation.footnote_text} html={citation.footnote_html} />
              {citation.subsequent_text && (
                <DetailPanel label="Subsequent reference" text={citation.subsequent_text} html={null} />
              )}
              <DetailPanel label="Bibliography entry" text={citation.bibliography_text} html={citation.bibliography_html} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// "Delete" here means removing the collection as a grouping, not the citations in it — every
// citation that had this label goes back to "No collection" (label: null), same end state as if
// each had been individually un-assigned via CollectionEditor, just done in one bulk update
// instead of one row at a time. Rename is the same shape, bulk-updating every row's label from the
// old name to the new one in one call.
function ManageCollectionsPanel({
  userId,
  collectionCounts,
  onCollectionDeleted,
  onCollectionRenamed,
}: {
  userId: string
  collectionCounts: { name: string; count: number }[]
  onCollectionDeleted: (name: string) => void
  onCollectionRenamed: (oldName: string, newName: string) => void
}) {
  const [confirmingName, setConfirmingName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [savingRename, setSavingRename] = useState(false)

  async function handleDelete(name: string) {
    if (confirmingName !== name) {
      setConfirmingName(name)
      return
    }

    setDeletingName(name)
    const supabase = createClient()
    const { error } = await supabase.from('citations').update({ label: null }).eq('user_id', userId).eq('label', name)
    setDeletingName(null)
    setConfirmingName(null)
    if (!error) onCollectionDeleted(name)
  }

  function startRename(name: string) {
    setRenamingName(name)
    setRenameValue(name)
  }

  async function handleConfirmRename(oldName: string) {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === oldName) {
      setRenamingName(null)
      return
    }

    setSavingRename(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('citations')
      .update({ label: trimmed })
      .eq('user_id', userId)
      .eq('label', oldName)
    setSavingRename(false)
    setRenamingName(null)
    if (!error) onCollectionRenamed(oldName, trimmed)
  }

  if (collectionCounts.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-gray-500">No collections yet — use the + button on a citation to create one.</p>
  }

  return (
    <ul>
      {collectionCounts.map(({ name, count }) =>
        renamingName === name ? (
          <li key={name} className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 last:border-0">
            <FolderIcon className="shrink-0 text-primary" />
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              className="min-w-[160px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
            />
            <IconButton
              label="Save new name"
              onClick={() => handleConfirmRename(name)}
              tone="blue"
            >
              {savingRename ? <span className="text-[10px]">…</span> : '✓'}
            </IconButton>
            <button
              type="button"
              onClick={() => setRenamingName(null)}
              className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </li>
        ) : (
          <li
            key={name}
            className="group flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FolderIcon className="shrink-0 text-primary" />
              <span className="truncate text-sm font-medium text-gray-900">{name}</span>
              <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {count}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <IconButton label="Rename collection" onClick={() => startRename(name)} tone="blue">
                <EditIcon />
              </IconButton>
              <IconButton
                label={confirmingName === name ? 'Confirm delete collection' : 'Delete collection'}
                onClick={() => handleDelete(name)}
                danger={confirmingName === name}
                tone="blue"
              >
                {deletingName === name ? <span className="text-[10px]">…</span> : <TrashIcon />}
              </IconButton>
            </div>
          </li>
        ),
      )}
    </ul>
  )
}

// Same dropdown-or-create shape as CollectionEditor, but applies to every selected citation at
// once via onAssign rather than one row's own PATCH — deliberately doesn't pre-fill a "current"
// value the way CollectionEditor does, since a multi-selection can span citations that already
// have different (or no) collections.
function BulkCollectionAssigner({
  count,
  collectionOptions,
  onAssign,
}: {
  count: number
  collectionOptions: string[]
  onAssign: (label: string | null) => Promise<void>
}) {
  const hasExisting = collectionOptions.length > 0
  const [mode, setMode] = useState<'select' | 'create'>(hasExisting ? 'select' : 'create')
  const [value, setValue] = useState('')
  const [applying, setApplying] = useState(false)

  async function handleApply() {
    setApplying(true)
    await onAssign(value.trim() || null)
    setApplying(false)
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CREATE_NEW_VALUE) {
      setMode('create')
      setValue('')
    } else {
      setValue(e.target.value)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode === 'select' ? (
        <select
          value={value}
          onChange={handleSelectChange}
          className="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
        >
          <option value="">No collection</option>
          {collectionOptions.map((name) => (
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="eg Torts Assessment 2"
            className="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand"
          />
          {hasExisting && (
            <button
              type="button"
              onClick={() => {
                setMode('select')
                setValue('')
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
        onClick={handleApply}
        disabled={applying}
        className="rounded-lg border border-brand-200 bg-primary-tint px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {applying ? 'Applying…' : `Assign ${count} to collection`}
      </button>
    </div>
  )
}

export default function LibraryClient({ userId }: { userId: string }) {
  const [citations, setCitations] = useState<SavedCitation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [collectionFilter, setCollectionFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [collectionEditorId, setCollectionEditorId] = useState<string | null>(null)
  const [managingCollections, setManagingCollections] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)

  // If the selection itself changes while a bulk-delete confirm is pending, drop the pending
  // confirm rather than let a second click delete a different set than the one that was confirmed.
  useEffect(() => {
    setConfirmingBulkDelete(false)
  }, [selectedIds])

  // Drops any selected id that no longer exists (deleted here, deleted elsewhere and synced via
  // realtime, etc) — without this a stale id sits invisibly in the set, e.g. making "3 selected"
  // read wrong after one of those 3 was removed by some other route.
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => citations.some((c) => c.id === id)))
      return next.size === prev.size ? prev : next
    })
  }, [citations])

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
      // Covers both a single CollectionEditor rename and a bulk "delete collection" (every row
      // with that label set to null at once) — without this, either only shows up locally in the
      // tab that made the change, not in any other open tab/device.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'citations', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCitations((prev) => prev.map((c) => (c.id === payload.new.id ? (payload.new as SavedCitation) : c)))
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
    setExpandedId((current) => (current === id ? null : current))
    setCollectionEditorId((current) => (current === id ? null : current))
  }

  function handleLabelChanged(id: string, label: string | null) {
    setCitations((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)))
  }

  function handleCollectionDeleted(name: string) {
    setCitations((prev) => prev.map((c) => (c.label === name ? { ...c, label: null } : c)))
    setCollectionFilter((current) => (current === name ? 'all' : current))
  }

  function handleCollectionRenamed(oldName: string, newName: string) {
    setCitations((prev) => prev.map((c) => (c.label === oldName ? { ...c, label: newName } : c)))
    setCollectionFilter((current) => (current === oldName ? newName : current))
  }

  // Distinct collection names actually present, alphabetised — drives both the filter dropdown's
  // options and whether "Uncategorised" is worth offering at all (only if some citation has no
  // label yet).
  const collections = useMemo(() => {
    const names = new Set<string>()
    let uncategorisedCount = 0
    for (const c of citations) {
      if (c.label) names.add(c.label)
      else uncategorisedCount++
    }
    return {
      names: Array.from(names).sort((a, b) => a.localeCompare(b)),
      hasUncategorised: uncategorisedCount > 0,
      uncategorisedCount,
    }
  }, [citations])

  const collectionCounts = useMemo(
    () => collections.names.map((name) => ({ name, count: citations.filter((c) => c.label === name).length })),
    [collections.names, citations],
  )

  const visibleCitations = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = citations.filter((c) => {
      if (typeFilter !== 'all' && c.source_type !== typeFilter) return false
      if (collectionFilter === UNCATEGORISED_COLLECTION && c.label) return false
      if (collectionFilter !== 'all' && collectionFilter !== UNCATEGORISED_COLLECTION && c.label !== collectionFilter)
        return false
      if (!query) return true
      return c.footnote_text.toLowerCase().includes(query) || c.bibliography_text.toLowerCase().includes(query)
    })

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return b.created_at.localeCompare(a.created_at)
      if (sort === 'oldest') return a.created_at.localeCompare(b.created_at)
      return SOURCE_TYPE_LABELS[a.source_type].localeCompare(SOURCE_TYPE_LABELS[b.source_type])
    })

    return list
  }, [citations, search, sort, typeFilter, collectionFilter])

  const allVisibleSelected = visibleCitations.length > 0 && visibleCitations.every((c) => selectedIds.has(c.id))
  const someVisibleSelected = visibleCitations.some((c) => selectedIds.has(c.id))

  // Native <input type="checkbox"> has no JSX prop for the indeterminate visual state — it's only
  // settable imperatively via the DOM node.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected
    }
  }, [someVisibleSelected, allVisibleSelected])

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // "Select all" only ever acts on the currently visible (filtered/searched) rows, not the whole
  // library — selecting everything while a search is active shouldn't silently reach outside it.
  function handleToggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleCitations.forEach((c) => next.delete(c.id))
      } else {
        visibleCitations.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  async function handleBulkAssign(label: string | null) {
    const ids = Array.from(selectedIds)
    const supabase = createClient()
    const { error } = await supabase.from('citations').update({ label }).in('id', ids)
    if (!error) {
      setCitations((prev) => prev.map((c) => (selectedIds.has(c.id) ? { ...c, label } : c)))
      setSelectedIds(new Set())
    }
  }

  async function handleBulkDelete() {
    if (!confirmingBulkDelete) {
      setConfirmingBulkDelete(true)
      return
    }

    setBulkDeleting(true)
    const ids = Array.from(selectedIds)
    const supabase = createClient()
    const { error } = await supabase.from('citations').delete().in('id', ids)
    setBulkDeleting(false)
    setConfirmingBulkDelete(false)
    if (!error) {
      setCitations((prev) => prev.filter((c) => !selectedIds.has(c.id)))
      setSelectedIds(new Set())
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your library…</p>
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-gray-900">Library</h1>
          <p className="mt-1 text-sm text-gray-500">Your saved AGLC4 citations</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-xs transition-colors focus-within:border-brand-600 focus-within:shadow-ring-brand">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search citations…"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        <nav className="space-y-0.5">
          <button
            type="button"
            onClick={() => setCollectionFilter('all')}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              collectionFilter === 'all' ? 'bg-primary-tint text-primary' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayersIcon />
              All citations
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                collectionFilter === 'all' ? 'bg-white text-primary shadow-xs' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {citations.length}
            </span>
          </button>

          {(collections.names.length > 0 || collections.hasUncategorised) && (
            <>
              <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">Collections</p>
              {collectionCounts.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCollectionFilter(name)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    collectionFilter === name ? 'bg-primary-tint text-primary' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FolderIcon className="shrink-0 text-primary" />
                    <span className="truncate">{name}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      collectionFilter === name ? 'bg-white text-primary shadow-xs' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
              {collections.hasUncategorised && (
                <button
                  type="button"
                  onClick={() => setCollectionFilter(UNCATEGORISED_COLLECTION)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    collectionFilter === UNCATEGORISED_COLLECTION
                      ? 'bg-primary-tint text-primary'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FolderIcon className="shrink-0 text-gray-300" />
                    <span className="truncate">Uncategorised</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      collectionFilter === UNCATEGORISED_COLLECTION ? 'bg-white text-primary shadow-xs' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {collections.uncategorisedCount}
                  </span>
                </button>
              )}
            </>
          )}
        </nav>

        {collections.names.length > 0 && (
          <button
            type="button"
            onClick={() => setManagingCollections((v) => !v)}
            aria-pressed={managingCollections}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              managingCollections ? 'bg-primary-tint text-primary' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <GearIcon />
            Manage collections
          </button>
        )}
      </aside>

      <div className="space-y-5">
        {managingCollections && (
          <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
            <div className="border-b border-gray-200 bg-primary-tint px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">Manage collections</p>
              <p className="mt-1 text-xs text-gray-500">
                Deleting a collection doesn&rsquo;t delete its citations — they&rsquo;re just left uncategorised.
              </p>
            </div>
            <ManageCollectionsPanel
              userId={userId}
              collectionCounts={collectionCounts}
              onCollectionDeleted={handleCollectionDeleted}
              onCollectionRenamed={handleCollectionRenamed}
            />
          </div>
        )}

        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-primary-tint p-3">
            <span className="text-sm font-medium text-gray-700">{selectedIds.size} selected</span>
            <BulkCollectionAssigner count={selectedIds.size} collectionOptions={collections.names} onAssign={handleBulkAssign} />
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                confirmingBulkDelete
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {bulkDeleting ? 'Deleting…' : confirmingBulkDelete ? 'Are you sure?' : 'Delete selected'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-primary-tint py-1 pl-1 pr-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {citations.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {citations.length === 1 ? 'citation saved' : 'citations saved'}
              </span>
            </div>
            {collections.names.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-xs">
                <FolderIcon className="text-gray-400" />
                {collections.names.length} {collections.names.length === 1 ? 'collection' : 'collections'}
              </span>
            )}
            <div className="flex-1" />
            <ExportMenu collectionNames={collections.names} hasUncategorised={collections.hasUncategorised} />
          </div>
        )}

        {citations.length > 0 && visibleCitations.length !== 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xs">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === 'all' ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All types
            </button>
            {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${
                  SOURCE_TYPE_PILL_CLASSES[type]
                } ${typeFilter === type ? 'ring-2 ring-inset ring-gray-900' : ''}`}
              >
                {SOURCE_TYPE_LABELS[type]}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 outline-none transition-colors focus:border-brand-600 focus:shadow-ring-brand"
              >
                <option value="newest">Date added (newest)</option>
                <option value="oldest">Date added (oldest)</option>
                <option value="type-az">Source type (A–Z)</option>
              </select>
            </div>
          </div>
        )}

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
          <div className="overflow-x-auto rounded-xl border border-gray-300 bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-primary-tint text-xs font-semibold uppercase tracking-wide text-gray-900">
                  <th className="whitespace-nowrap py-2 pl-4 pr-2">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all visible citations"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-brand-600"
                    />
                  </th>
                  <th className="whitespace-nowrap py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Citation</th>
                  <th className="whitespace-nowrap py-2 pr-3">Saved</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {visibleCitations.map((citation) => (
                  <CitationRow
                    key={citation.id}
                    citation={citation}
                    expanded={expandedId === citation.id}
                    showCollectionEditor={collectionEditorId === citation.id}
                    collectionOptions={collections.names}
                    selected={selectedIds.has(citation.id)}
                    onToggle={() => setExpandedId((current) => (current === citation.id ? null : citation.id))}
                    onToggleCollectionEditor={() =>
                      setCollectionEditorId((current) => (current === citation.id ? null : citation.id))
                    }
                    onToggleSelect={() => handleToggleSelect(citation.id)}
                    onDeleted={handleDeleted}
                    onLabelChanged={handleLabelChanged}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
