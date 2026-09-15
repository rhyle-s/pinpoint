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

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

// Full-width banner rather than a small pill — the same 5 states as before (validating / validated
// high-confidence / validated but unsure / corrected / unvalidated), just given more presence since
// it's the first thing a student should read about the result.
function ValidationStatus({ validating, result }: { validating: boolean; result: CitationResult | null }) {
  if (validating) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
        Verifying…
      </div>
    )
  }

  if (!result) return null

  if (result.validationStatus === 'validated') {
    // A 'validated' verdict at medium/low confidence is a weaker claim than the model being sure
    // — styling it the same as a high-confidence pass would overstate it, so it borrows the
    // 'corrected' banner's amber treatment (and drops the checkmark) instead of green + tick.
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

  if (result.validationStatus === 'corrected') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        <ShieldCheckIcon />
        Corrected{result.confidence ? ` · ${result.confidence} confidence` : ''}
      </div>
    )
  }

  // 'unvalidated': either the AI check hasn't run yet or it was attempted and failed (missing API
  // key, network error, rate limit, model refusal — generate.ts falls back to the rules-engine
  // output silently in that case). Shown explicitly rather than rendering nothing, so "no badge"
  // is never mistakeable for "checked and fine" — see CLAUDE.md for the reasoning.
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500">
      <ShieldCheckIcon />
      Not AGLC4-checked
    </div>
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
  accent: string
}

function Panel({ label, rule, text, accent }: PanelProps) {
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
    <div className={`border-l-4 px-5 py-4 ${accent}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-gray-900">{label}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{rule}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!text}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            copied
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-brand-200 bg-primary-tint text-primary hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
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
      <ValidationStatus validating={validating} result={result} />
      {badge && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
      <WarningNotes warnings={result?.warnings} />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        <Panel label="Footnote citation" rule={rules.footnote} text={result?.footnote ?? ''} accent="border-brand-600" />
        <div className="border-t border-gray-100">
          <Panel label="Subsequent reference" rule={rules.subsequent} text={result?.subsequent ?? ''} accent="border-brand-400" />
        </div>
        <div className="border-t border-gray-100">
          <Panel label="Bibliography entry" rule={rules.bibliography} text={result?.bibliography ?? ''} accent="border-gray-300" />
        </div>
      </div>
    </div>
  )
}
