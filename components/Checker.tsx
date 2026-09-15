'use client'

import { useState } from 'react'
import { checkCitationAction } from '@/app/actions'
import { CitationForm, CheckResult } from '@/lib/citation-engine/checker'
import { SourceType } from '@/lib/citation-engine/types'
import SourceTypeSelector from './SourceTypeSelector'
import { Panel } from './CitationOutput'

const FORM_OPTIONS: { value: CitationForm; label: string }[] = [
  { value: 'footnote', label: 'Footnote citation' },
  { value: 'subsequent', label: 'Subsequent reference' },
  { value: 'bibliography', label: 'Bibliography entry' },
]

type Status = 'idle' | 'checking' | 'error'

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ResultBanner({ result }: { result: CheckResult }) {
  if (result.isCorrect) {
    const unsure = result.confidence === 'medium' || result.confidence === 'low'
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
          unsure ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}
      >
        <ShieldCheckIcon />
        AGLC4 check passed{unsure ? ` · ${result.confidence} confidence` : ''}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
      <ShieldCheckIcon />
      Needs fixing{result.confidence ? ` · ${result.confidence} confidence` : ''}
    </div>
  )
}

export default function Checker() {
  const [sourceType, setSourceType] = useState<SourceType>('case')
  const [form, setForm] = useState<CitationForm>('footnote')
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorText, setErrorText] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)

  const isChecking = status === 'checking'
  const canCheck = !isChecking && text.trim().length > 0

  async function runCheck() {
    const trimmed = text.trim()
    if (!trimmed) return

    setStatus('checking')
    setErrorText('')
    setResult(null)

    try {
      const checkResult = await checkCitationAction(trimmed, sourceType, form)
      setResult(checkResult)
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorText("Couldn't check this citation — please try again.")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void runCheck()
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SourceTypeSelector selected={sourceType} onSelect={setSourceType} />

      <div className="flex flex-wrap justify-center gap-1 rounded-full bg-gray-100 p-1">
        {FORM_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setForm(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              form === option.value ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pl-4 pr-1.5 shadow-card transition-colors focus-within:border-brand-600 focus-within:shadow-ring-brand">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste the citation you wrote…"
            disabled={isChecking}
            className="w-full bg-transparent px-1 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void runCheck()}
            disabled={!canCheck}
            className="shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed"
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Checking…
              </span>
            ) : (
              'Check'
            )}
          </button>
        </div>
        {status === 'error' && <p className="mt-2 text-center text-xs font-medium text-amber-700">{errorText}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          <ResultBanner result={result} />

          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                >
                  <span aria-hidden="true">⚠</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {result.correctedText && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
              <Panel
                label="Corrected version"
                rule={result.rule ?? 'AGLC4'}
                text={result.correctedText}
                accent="border-brand-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
