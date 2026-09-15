import Link from 'next/link'
import { formatItalics, generateCitationSync } from '@/lib/citation-engine'
import { FormatTemplateItem, GuideEntry } from '@/lib/guide-content'
import GuideExampleTabs from './GuideExampleTabs'

// Above this many worked examples, a tab switcher gets unwieldy (internationalMaterial has 22,
// otherSources has 12) — those stay as stacked cards, same as before this redesign. Every other
// source type (2-6 examples) switches to the more compact tabbed view.
const TABS_MAX_EXAMPLES = 8

const CATEGORY_CHIP_LABEL: Record<GuideEntry['category'], string> = {
  primary: 'Primary source',
  secondary: 'Secondary source',
  international: 'International',
}

function classifyToken(token: string): 'placeholder' | 'punctuation' | 'literal' {
  if (token === ',' || token === '.') return 'punctuation'
  if (/^\[.*\]$/.test(token) || /^<.*>$/.test(token) || /^'.*'$/.test(token)) return 'placeholder'
  return 'literal'
}

// Bracketed [...], angle-bracketed <...>, and quoted '...' segments are the genuinely variable
// parts of a template (they're also exactly the segments AGLC4 marks as italicised/quoted) — those
// get the accent colour; a bare word like Year or Pinpoint stays a muted literal so the line reads
// as one sentence with a few highlighted parts, not a wall of uniformly-blue text.
function CodeLine({ template }: { template: string }) {
  const parts = template.split(/(\[[^\]]*\]|<[^>]*>|'[^']*'|,|\.)/g).filter(Boolean)
  return (
    <p className="font-mono text-[13px] leading-relaxed">
      {parts.map((part, i) => {
        const kind = classifyToken(part)
        return (
          <span
            key={i}
            className={
              kind === 'placeholder'
                ? 'font-semibold text-primary'
                : kind === 'punctuation'
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }
          >
            {part}
          </span>
        )
      })}
    </p>
  )
}

// Most source types have one plain-string template — a single boxed code line. A source type
// bundling several unrelated AGLC4 formats (internationalMaterial, otherSources) instead passes a
// labelled array, rendered as a stack of small labelled code blocks rather than one wall of text.
function FormatTemplate({ template }: { template: string | FormatTemplateItem[] }) {
  if (typeof template === 'string') {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <CodeLine template={template} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {template.map((item) => (
        <div key={item.label} className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
          <CodeLine template={item.template} />
        </div>
      ))}
    </div>
  )
}

export default function GuideSection({ entry }: { entry: GuideEntry }) {
  const examples = entry.examples.map((example) => ({
    label: example.label,
    html: formatItalics(generateCitationSync(entry.sourceType, example.fields).footnote, 'html'),
  }))

  const useTabs = examples.length <= TABS_MAX_EXAMPLES

  return (
    <section id={entry.sourceType} className="scroll-mt-24 border-b border-gray-100 pb-10 last:border-b-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-medium text-gray-900">{entry.title}</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {CATEGORY_CHIP_LABEL[entry.category]}
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-400">{entry.chapterRef}</p>

      <FormatTemplate template={entry.formatTemplate} />

      <div className="mt-6">
        {useTabs ? (
          <GuideExampleTabs examples={examples} sourceType={entry.sourceType} />
        ) : (
          <div className="space-y-3">
            {examples.map((example) => (
              <div
                key={example.label}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">{example.label}</p>
                  <p
                    className="font-citation text-[15px] leading-[1.8] text-gray-900"
                    dangerouslySetInnerHTML={{ __html: example.html }}
                  />
                </div>
                <Link
                  href={`/generate?type=${entry.sourceType}`}
                  className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
                >
                  Try this →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <ul className="mt-6 space-y-2">
        {entry.keyRules.map((rule) => (
          <li key={rule} className="flex gap-2 text-sm leading-relaxed text-gray-600">
            <span className="text-gray-300" aria-hidden="true">
              —
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
