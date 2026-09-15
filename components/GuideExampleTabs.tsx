'use client'

import Link from 'next/link'
import { useState } from 'react'

interface TabExample {
  label: string
  html: string
}

interface GuideExampleTabsProps {
  examples: TabExample[]
  sourceType: string
}

// Used for any source type with a manageable number of worked examples (see TABS_MAX_EXAMPLES in
// GuideSection.tsx) — switches between them instead of stacking every one as its own card, so a
// section with several examples reads as one compact reference block rather than a long scroll.
export default function GuideExampleTabs({ examples, sourceType }: GuideExampleTabsProps) {
  const [active, setActive] = useState(0)
  const current = examples[active] ?? examples[0]

  return (
    <div>
      <div className="flex flex-wrap border-b border-gray-200">
        {examples.map((example, index) => (
          <button
            key={example.label}
            type="button"
            onClick={() => setActive(index)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              index === active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-b-xl border border-t-0 border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <p
          className="font-citation text-[15px] leading-[1.8] text-gray-900"
          dangerouslySetInnerHTML={{ __html: current.html }}
        />
        <Link
          href={`/generate?type=${sourceType}`}
          className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
        >
          Try this →
        </Link>
      </div>
    </div>
  )
}
