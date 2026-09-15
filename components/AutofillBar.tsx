'use client'

import { useEffect, useRef, useState } from 'react'
import { detectInputType } from '@/lib/autofill/detect'
import { AutofillResult } from '@/lib/autofill/types'
import { extractPDFMetadata, PdfExtractionError } from '@/lib/pdf-extract/client-extract'

interface AutofillBarProps {
  onAutofill: (result: AutofillResult) => void
  /** Fires whenever a fetch/upload/paste attempt starts or finishes, so a parent showing the
   *  previous citation's own state (eg a validation badge) can suppress it while this is true. */
  onLoadingChange?: (loading: boolean) => void
}

type BarStatus = 'idle' | 'loading' | 'success' | 'error'

const KNOWN_SOURCE_MESSAGES: Record<string, string> = {
  'austlii-case': 'Fetching from AustLII…',
  'austlii-legislation': 'Fetching from AustLII…',
  'crossref-doi': 'Looking up DOI…',
  'doi-url': 'Looking up DOI…',
}

const AI_EXTRACTION_TYPES = new Set(['generic-url', 'jade-case', 'au-legislation'])
const AI_MESSAGE_SWITCH_MS = 1200
const SUCCESS_RESET_MS = 2000
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
// A PDF (uploaded, or fetched from a URL that turns out to be one) can be hundreds of pages — long
// enough that the parse alone runs well past a second or two. If an attempt is still going after
// this long, say so, so the wait doesn't read as the tool having silently hung.
const SLOW_NOTICE_MS = 4000
const SLOW_NOTICE_TEXT = 'Larger documents take a little longer — still working…'

export default function AutofillBar({ onAutofill, onLoadingChange }: AutofillBarProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<BarStatus>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [slowNotice, setSlowNotice] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const dragDepth = useRef(0)
  const aiMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slowNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
      if (slowNoticeTimer.current) clearTimeout(slowNoticeTimer.current)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  // Shows SLOW_NOTICE_TEXT under the loading message if an attempt is still running after
  // SLOW_NOTICE_MS — call at the start of a run that can be slow (a PDF parse), clear on completion.
  function startSlowNotice() {
    setSlowNotice('')
    slowNoticeTimer.current = setTimeout(() => setSlowNotice(SLOW_NOTICE_TEXT), SLOW_NOTICE_MS)
  }

  function clearSlowNotice() {
    if (slowNoticeTimer.current) clearTimeout(slowNoticeTimer.current)
    slowNoticeTimer.current = null
    setSlowNotice('')
  }

  useEffect(() => {
    onLoadingChange?.(status === 'loading')
  }, [status, onLoadingChange])

  // Shared by the URL and upload paths — everything past "here's the parsed response" is
  // identical, so both funnel through this rather than duplicating the success/partial handling.
  function handleResult(result: unknown, notFoundErrorText: string) {
    if (typeof result !== 'object' || result === null) {
      setStatus('error')
      setFeedbackText(notFoundErrorText)
      return
    }

    if ('error' in result) {
      setStatus('error')
      setFeedbackText(String((result as { error: unknown }).error))
      return
    }

    const autofillResult = result as AutofillResult
    onAutofill(autofillResult)

    // Everything the student needs to act on afterwards — a "review the fields" prompt, the
    // "matched via CrossRef" note, the verify link — is carried through `onAutofill` and shown by
    // the parent next to the form it's about (see Generator's autofill notice), not stacked under
    // this input. Here we only give a brief confirmation that then clears itself.
    setStatus('success')
    setFeedbackText(autofillResult.confidence === 'low' ? 'Some fields filled — review them' : 'Fields filled ✓')
    resetTimer.current = setTimeout(() => {
      setStatus('idle')
      setFeedbackText('')
    }, SUCCESS_RESET_MS)
  }

  async function runAutofill(input: string) {
    const trimmed = input.trim()
    if (!trimmed) return

    const type = detectInputType(trimmed)

    if (type === 'unknown') {
      setStatus('error')
      setFeedbackText("That doesn't look like a URL or DOI — please paste a link or fill fields manually.")
      return
    }

    setStatus('loading')

    if (AI_EXTRACTION_TYPES.has(type)) {
      setLoadingMessage('Reading page…')
      aiMessageTimer.current = setTimeout(() => setLoadingMessage('Extracting details…'), AI_MESSAGE_SWITCH_MS)
    } else {
      setLoadingMessage(KNOWN_SOURCE_MESSAGES[type] ?? 'Fetching…')
    }
    // A pasted URL can resolve to a large PDF (eg a government annual report), fetched and parsed
    // server-side — the same slow case as an uploaded PDF, so it gets the same "still working" note.
    startSlowNotice()

    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      })
      const result = await response.json()
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
      clearSlowNotice()
      handleResult(result, "Couldn't read this page — please fill manually.")
    } catch {
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
      clearSlowNotice()
      setStatus('error')
      setFeedbackText("Couldn't read this page — please fill manually.")
    }
  }

  // The File object itself is never passed to fetch() or any server endpoint — extractPDFMetadata
  // parses it entirely in the browser (see lib/pdf-extract/client-extract.ts), and only the small
  // text-only result of that (a handful of document-properties fields plus a short page-1 text
  // snippet) is sent to /api/autofill/pdf as JSON.
  async function runUpload(file: File) {
    if (file.type !== 'application/pdf') {
      setStatus('error')
      setFeedbackText('Please choose a PDF file.')
      return
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setStatus('error')
      setFeedbackText(`PDF is too large — please keep it under ${MAX_PDF_SIZE_BYTES / (1024 * 1024)}MB.`)
      return
    }

    setStatus('loading')
    setValue('')
    setLoadingMessage('Reading the PDF in your browser…')
    startSlowNotice()

    try {
      const metadata = await extractPDFMetadata(file)
      setLoadingMessage('Extracting details…')

      const response = await fetch('/api/autofill/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      })
      const result = await response.json()
      clearSlowNotice()
      handleResult(result, "Couldn't extract details from this PDF — please fill manually.")
    } catch (error) {
      clearSlowNotice()
      setStatus('error')
      setFeedbackText(
        error instanceof PdfExtractionError ? error.message : "Couldn't read this PDF — please fill manually.",
      )
    }
  }

  async function runPasteText(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    setStatus('loading')
    setLoadingMessage('Extracting details…')

    try {
      const response = await fetch('/api/autofill-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const result = await response.json()
      // Deliberately left in the box after a successful extract — the student may want to re-read
      // it against the filled fields, or tweak and re-run it.
      handleResult(result, "Couldn't extract details from that — please fill manually.")
    } catch {
      setStatus('error')
      setFeedbackText("Couldn't extract details from that — please fill manually.")
    }
  }

  // The single box now accepts a URL/DOI *or* pasted citation text — detectInputType already
  // returns 'unknown' for anything that isn't a recognisable URL/DOI shape (plain prose included),
  // so that one check is enough to route to the right one of the two fetches above without asking
  // the student to pick a mode themselves.
  function runSmartFill(input: string) {
    if (!input.trim()) return
    if (detectInputType(input.trim()) === 'unknown') void runPasteText(input)
    else void runAutofill(input)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return
    e.preventDefault()
    setValue(pasted)
    runSmartFill(pasted)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSmartFill(value)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void runUpload(file)
  }

  // Tracks nested drag-enter/leave depth rather than a plain boolean — a drag over a child element
  // (eg the dropzone's own icon/text) fires a 'dragleave' on the parent the instant it fires
  // 'dragenter' on the child, which a naive isDragging=false on every 'dragleave' would read as
  // "left the dropzone" and flicker the highlight off while the file is still being dragged over it.
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    if (isLoading) return
    dragDepth.current += 1
    setIsDraggingFile(true)
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDraggingFile(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragDepth.current = 0
    setIsDraggingFile(false)
    if (isLoading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void runUpload(file)
  }

  function handleClear() {
    if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setValue('')
    setStatus('idle')
    setFeedbackText('')
  }

  const isLoading = status === 'loading'
  const canClear = !isLoading && (value.trim().length > 0 || status !== 'idle')

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-brand-600 focus-within:bg-white focus-within:shadow-ring-brand">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
          <path d="M9 15l6-6" />
          <path d="M11 5l1-1a4 4 0 0 1 6 6l-1 1" />
          <path d="M13 19l-1 1a4 4 0 0 1-6-6l1-1" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste a URL, DOI, or any known details…"
          disabled={isLoading}
          className="w-full bg-transparent px-1 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
        />
        {canClear && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear"
            className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelected}
          disabled={isLoading}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => runSmartFill(value)}
          disabled={isLoading || !value.trim()}
          className="shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Citing…
            </span>
          ) : (
            'Cite'
          )}
        </button>

        {/* Icon + text rather than an icon alone — this used to be its own circle with a "PDF"
            caption underneath it for the same reason (a hover title alone says nothing at a glance,
            and nothing at all on touch); now that it sits inline in the bar there's no room for a
            caption below it, so the label moved inline next to the icon instead. */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isLoading}
          aria-label="Upload a PDF"
          title="Upload or drop a PDF — it's read in your browser and never uploaded to our servers"
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-dashed px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isDraggingFile
              ? 'border-brand-500 bg-brand-100 text-primary'
              : 'border-brand-200 bg-primary-tint text-primary hover:border-brand-400 hover:bg-brand-100'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 21h14" />
          </svg>
          PDF
        </button>
      </div>

      <p className="mt-2.5 flex items-start justify-center gap-1.5 text-center text-xs font-medium text-amber-700">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-px shrink-0"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        Automated extraction can get things wrong — always check the result before relying on it.
      </p>

      {isLoading && (
        <div className="mt-2 space-y-1 text-center">
          <p className={`text-xs ${loadingMessage === 'Extracting details…' ? 'font-medium text-primary' : 'text-gray-500'}`}>
            {loadingMessage}
          </p>
          {slowNotice && <p className="text-xs text-gray-500">{slowNotice}</p>}
        </div>
      )}

      {!isLoading && status === 'success' && (
        <p className="mt-2 text-center text-xs font-medium text-emerald-600">{feedbackText}</p>
      )}

      {!isLoading && status === 'error' && (
        <p className="mt-2 text-center text-xs font-medium text-amber-700">{feedbackText}</p>
      )}
    </div>
  )
}
