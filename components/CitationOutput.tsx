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
  badge?: string
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

  if (!result) return null

  if (result.validationStatus === 'validated') {
    // A 'validated' verdict at medium/low confidence is a weaker claim than the model being sure
    // — styling it the same as a high-confidence pass would overstate it, so it borrows the
    // 'corrected' badge's amber treatment (and drops the checkmark) instead of green + tick.
    const unsure = result.confidence === 'medium' || result.confidence === 'low'
    return (
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          unsure ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-600'
        }`}
      >
        AGLC4 check passed{unsure ? ` · ${result.confidence} confidence` : ' ✓'}
      </span>
    )
  }

  if (result.validationStatus === 'corrected') {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Corrected{result.confidence ? ` · ${result.confidence} confidence` : ''}
      </span>
    )
  }

  // 'unvalidated': either the AI check hasn't run yet or it was attempted and failed (missing API
  // key, network error, rate limit, model refusal — generate.ts falls back to the rules-engine
  // output silently in that case). Shown explicitly rather than rendering nothing, so "no badge"
  // is never mistakeable for "checked and fine" — see CLAUDE.md for the reasoning.
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
      Not AGLC4-checked
    </span>
  )
}

// Deterministic, field-level notices (a core AGLC4 element left blank, or a substantive citation-
// practice reminder — see warnings.ts) — distinct from ValidationStatus above, which is about the
// *formatted text*'s own AGLC4 correctness per the AI check. Rendered as its own list rather than
// folded into the badge row: a badge is a one-word pill, these are full sentences a student needs
// to actually read, so they get the same amber note treatment CitationOutput already uses for a
// low-confidence validation pass, just full-width instead of pill-shaped.
function WarningNotes({ warnings }: { warnings: string[] | undefined }) {
  if (!warnings || warnings.length === 0) return null
  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          <span aria-hidden="true">⚠</span>
          <span>{warning}</span>
        </div>
      ))}
    </div>
  )
}

interface PanelProps {
  label: string
  rule: string
  text: string
}

function Panel({ label, rule, text }: PanelProps) {
  const [copied, setCopied] = useState(false)

  // Writes both a plain-text and an HTML flavour, so italics (case names, journal titles etc)
  // survive a paste into Word/Docs instead of coming through as flat text with literal asterisks
  // stripped. Falls back to plain text on browsers without the rich Clipboard API, or if the rich
  // write is rejected (eg no clipboard-write permission) — and that fallback is caught too, since
  // a denial there is a real possibility, not just the rich path's.
  async function handleCopy() {
    const plain = formatItalics(text, 'plain')
    let succeeded = true

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const html = formatItalics(text, 'html')
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([plain], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(plain)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(plain)
      } catch {
        succeeded = false
      }
    }

    if (succeeded) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">{label}</h3>
          <p className="text-xs text-gray-400">{rule}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!text}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            copied
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      {/* Times New Roman, 15px/1.8 line-height per the brand spec's citation-output typography —
          distinct from the app's own UI sans-serif everywhere else. formatItalics already renders
          case names/legislation/journal names etc as <em>, never bold. */}
      <p
        className="min-h-[1.5rem] font-citation text-[15px] leading-[1.8] text-gray-900"
        dangerouslySetInnerHTML={{ __html: text ? formatItalics(text, 'html') : '—' }}
      />
    </div>
  )
}

export default function CitationOutput({ result, validating, rules, badge }: CitationOutputProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ValidationStatus validating={validating} result={result} />
        {badge && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>
      <WarningNotes warnings={result?.warnings} />
      <Panel label="Footnote citation" rule={rules.footnote} text={result?.footnote ?? ''} />
      <Panel label="Subsequent reference" rule={rules.subsequent} text={result?.subsequent ?? ''} />
      <Panel label="Bibliography entry" rule={rules.bibliography} text={result?.bibliography ?? ''} />
    </div>
  )
}
