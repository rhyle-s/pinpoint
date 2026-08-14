'use client'

import { useState } from 'react'
import { formatItalics } from '@/lib/citation-engine'
import { CitationResult } from '@/lib/citation-engine/types'

interface CitationOutputProps {
  result: CitationResult | null
  validating: boolean
  rules: {
    footnote: string
    subsequent: string
    bibliography: string
  }
}

function ValidationStatus({ validating, result }: { validating: boolean; result: CitationResult | null }) {
  if (validating) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
        Verifying…
      </div>
    )
  }

  if (result?.validationStatus === 'validated') {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        AGLC4 verified ✓
      </span>
    )
  }

  if (result?.validationStatus === 'corrected') {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Corrected
      </span>
    )
  }

  return null
}

interface PanelProps {
  label: string
  rule: string
  text: string
}

function Panel({ label, rule, text }: PanelProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(formatItalics(text, 'plain'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
          <p className="text-xs text-gray-400">{rule}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!text}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            copied
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p
        className="min-h-[1.5rem] font-serif text-base leading-relaxed text-gray-900"
        dangerouslySetInnerHTML={{ __html: text ? formatItalics(text, 'html') : '—' }}
      />
    </div>
  )
}

export default function CitationOutput({ result, validating, rules }: CitationOutputProps) {
  return (
    <div className="space-y-4">
      <ValidationStatus validating={validating} result={result} />
      <Panel label="Footnote citation" rule={rules.footnote} text={result?.footnote ?? ''} />
      <Panel label="Subsequent reference" rule={rules.subsequent} text={result?.subsequent ?? ''} />
      <Panel label="Bibliography entry" rule={rules.bibliography} text={result?.bibliography ?? ''} />
    </div>
  )
}
