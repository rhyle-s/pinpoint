'use client'

import { useState } from 'react'
import { GUIDE_CATEGORIES, GUIDE_ENTRIES } from '@/lib/guide-content'

export default function GuideNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 lg:hidden"
      >
        Jump to section
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      <div className={`${open ? 'block' : 'hidden'} space-y-6 lg:block`}>
        {GUIDE_CATEGORIES.map((category) => {
          const entries = GUIDE_ENTRIES.filter((entry) => entry.category === category.key)
          return (
            <div key={category.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{category.label}</p>
              <ul className="space-y-1">
                {entries.map((entry) => (
                  <li key={entry.sourceType}>
                    <a
                      href={`#${entry.sourceType}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-primary-tint hover:text-primary"
                    >
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
