import Link from 'next/link'
import { formatItalics, generateCitationSync } from '@/lib/citation-engine'
import { GuideEntry } from '@/lib/guide-content'

function FormatTemplate({ template }: { template: string }) {
  const parts = template.split(/([,.])/g).filter(Boolean)
  return (
    <p className="rounded-lg bg-primary-tint px-4 py-3 font-mono text-sm leading-relaxed">
      {parts.map((part, i) =>
        part === ',' || part === '.' ? (
          <span key={i} className="text-on-tint">
            {part}
          </span>
        ) : (
          <span key={i} className="font-medium text-primary">
            {part}
          </span>
        ),
      )}
    </p>
  )
}

export default function GuideSection({ entry }: { entry: GuideEntry }) {
  return (
    <section id={entry.sourceType} className="scroll-mt-24 border-b border-gray-100 pb-10 last:border-b-0">
      <div className="mb-4">
        <h2 className="text-xl font-medium text-gray-900">{entry.title}</h2>
        <p className="text-sm text-gray-400">{entry.chapterRef}</p>
      </div>

      <FormatTemplate template={entry.formatTemplate} />

      <div className="mt-6 space-y-3">
        {entry.examples.map((example) => {
          const result = generateCitationSync(entry.sourceType, example.fields)
          return (
            <div
              key={example.label}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">{example.label}</p>
                <p
                  className="font-serif text-base leading-relaxed text-gray-900"
                  dangerouslySetInnerHTML={{ __html: formatItalics(result.footnote, 'html') }}
                />
              </div>
              <Link
                href={`/generate?type=${entry.sourceType}`}
                className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
              >
                Try this →
              </Link>
            </div>
          )
        })}
      </div>

      <ul className="mt-6 space-y-2">
        {entry.keyRules.map((rule) => (
          <li key={rule} className="border-l-2 border-primary pl-3 text-sm text-gray-600">
            {rule}
          </li>
        ))}
      </ul>
    </section>
  )
}
