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

type BarStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error'

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

export default function AutofillBar({ onAutofill, onLoadingChange }: AutofillBarProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<BarStatus>('idle')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [confidence, setConfidence] = useState<AutofillResult['confidence'] | null>(null)
  const [note, setNote] = useState('')
  const [showPasteText, setShowPasteText] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const aiMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

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

    if (autofillResult.confidence === 'low') {
      setStatus('partial')
      setFeedbackText(autofillResult.message ?? 'Some fields filled — please review')
      return
    }

    setStatus('success')
    setFeedbackText('Fields filled ✓')
    setConfidence(autofillResult.confidence)

    // A note on an otherwise-successful autofill is actionable guidance (eg "add the pinpoint
    // manually") rather than decoration, so — unlike the plain success feedback — it stays on
    // screen instead of auto-clearing before the student has had a chance to read it.
    if (autofillResult.message) {
      setNote(autofillResult.message)
    } else {
      resetTimer.current = setTimeout(() => {
        setStatus('idle')
        setFeedbackText('')
        setConfidence(null)
      }, SUCCESS_RESET_MS)
    }
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
    setConfidence(null)
    setNote('')

    if (AI_EXTRACTION_TYPES.has(type)) {
      setLoadingMessage('Reading page…')
      aiMessageTimer.current = setTimeout(() => setLoadingMessage('Extracting details…'), AI_MESSAGE_SWITCH_MS)
    } else {
      setLoadingMessage(KNOWN_SOURCE_MESSAGES[type] ?? 'Fetching…')
    }

    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      })
      const result = await response.json()
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
      handleResult(result, "Couldn't read this page — please fill manually.")
    } catch {
      if (aiMessageTimer.current) clearTimeout(aiMessageTimer.current)
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
    setConfidence(null)
    setNote('')
    setValue('')
    setLoadingMessage('Reading PDF locally…')

    try {
      const metadata = await extractPDFMetadata(file)
      setLoadingMessage('Extracting details…')

      const response = await fetch('/api/autofill/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      })
      const result = await response.json()
      handleResult(result, "Couldn't extract details from this PDF — please fill manually.")
    } catch (error) {
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
    setConfidence(null)
    setNote('')
    setValue('')
    setLoadingMessage('Extracting details…')

    try {
      const response = await fetch('/api/autofill-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const result = await response.json()
      handleResult(result, "Couldn't extract details from that — please fill manually.")
      if (!('error' in result)) {
        setShowPasteText(false)
        setPasteText('')
      }
    } catch {
      setStatus('error')
      setFeedbackText("Couldn't extract details from that — please fill manually.")
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return
    e.preventDefault()
    setValue(pasted)
    void runAutofill(pasted)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void runAutofill(value)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void runUpload(file)
  }

  const isLoading = status === 'loading'

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste any URL, DOI, or AustLII link…"
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={() => runAutofill(value)}
          disabled={isLoading || !value.trim()}
          className="shrink-0 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#134b85] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Fill
            </span>
          ) : (
            'Fill ↵'
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <span>or</span>
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
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          upload a PDF
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => setShowPasteText((prev) => !prev)}
          disabled={isLoading}
          className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          paste citation details
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Your file is processed locally and never uploaded to our servers. By using this feature you
        confirm you have lawful access to this document. Pinpoint extracts citation metadata only.
      </p>

      {showPasteText && !isLoading && (
        <div className="mt-2 space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste the case name, citation, author, title, etc. copied from a source Pinpoint can't fetch directly (eg Lexis+, Westlaw)…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => runPasteText(pasteText)}
            disabled={!pasteText.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#134b85] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Extract details
          </button>
        </div>
      )}

      {isLoading && <p className="mt-2 text-xs text-gray-500">{loadingMessage}</p>}

      {!isLoading && status === 'success' && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-medium text-green-700">{feedbackText}</span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${confidence === 'high' ? 'bg-green-500' : 'bg-amber-500'}`}
              />
              {confidence === 'high' ? 'High confidence' : 'Please review fields'}
            </span>
          </div>
          {note && <p className="text-xs font-medium text-amber-700">{note}</p>}
        </div>
      )}

      {!isLoading && (status === 'partial' || status === 'error') && (
        <p className="mt-2 text-xs font-medium text-amber-700">{feedbackText}</p>
      )}
    </div>
  )
}
