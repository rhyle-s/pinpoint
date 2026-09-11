'use client'

import { NewspaperFields } from '@/lib/citation-engine/types'

interface NewspaperFormProps {
  fields: NewspaperFields
  onChange: (fields: NewspaperFields) => void
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="ml-1 text-gray-400">(optional)</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export default function NewspaperForm({ fields, onChange }: NewspaperFormProps) {
  function update(patch: Partial<NewspaperFields>) {
    onChange({ ...fields, ...patch })
  }

  const authors = fields.authors ?? []

  function updateAuthor(index: number, value: string) {
    const next = [...authors]
    next[index] = value
    update({ authors: next })
  }

  function addAuthor() {
    update({ authors: [...authors, ''] })
  }

  function removeAuthor(index: number) {
    update({ authors: authors.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-5">
      <Field label="Authors" optional>
        <div className="space-y-2">
          {authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClass}
                type="text"
                placeholder="Isobel Roe"
                value={author}
                onChange={(e) => updateAuthor(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeAuthor(index)}
                className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300"
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addAuthor} className="text-sm font-medium text-primary hover:underline">
            + Add author
          </button>
        </div>
      </Field>

      <Field label="Article title">
        <input
          className={inputClass}
          type="text"
          placeholder="Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault"
          value={fields.articleTitle}
          onChange={(e) => update({ articleTitle: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Newspaper name">
          <input
            className={inputClass}
            type="text"
            placeholder="ABC News"
            value={fields.newspaperName}
            onChange={(e) => update({ newspaperName: e.target.value })}
          />
        </Field>

        <Field label="Date">
          <input
            className={inputClass}
            type="text"
            placeholder="17 August 2026"
            value={fields.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </Field>
      </div>

      <Field label="URL">
        <input
          className={inputClass}
          type="text"
          placeholder="https://example.com/news/article"
          value={fields.url}
          onChange={(e) => update({ url: e.target.value })}
        />
      </Field>

      <Field label="Pinpoint" optional>
        <input
          className={inputClass}
          type="text"
          placeholder="3"
          value={fields.pinpoint ?? ''}
          onChange={(e) => update({ pinpoint: e.target.value })}
        />
      </Field>
    </div>
  )
}
