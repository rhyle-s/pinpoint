'use client'

import { WebsiteFields } from '@/lib/citation-engine/types'

interface WebsiteFormProps {
  fields: WebsiteFields
  onChange: (fields: WebsiteFields) => void
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
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand'

export default function WebsiteForm({ fields, onChange }: WebsiteFormProps) {
  function update(patch: Partial<WebsiteFields>) {
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
                placeholder="James Edelman"
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

      <Field label="Document title">
        <input
          className={inputClass}
          type="text"
          placeholder="High Court of Australia"
          value={fields.documentTitle}
          onChange={(e) => update({ documentTitle: e.target.value })}
        />
      </Field>

      <Field label="Website name">
        <input
          className={inputClass}
          type="text"
          placeholder="High Court of Australia"
          value={fields.websiteName}
          onChange={(e) => update({ websiteName: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Document type">
          <select
            className={inputClass}
            value={fields.documentType}
            onChange={(e) => update({ documentType: e.target.value as WebsiteFields['documentType'] })}
          >
            <option value="Web Page">Web Page</option>
            <option value="Blog Post">Blog Post</option>
            <option value="Forum Post">Forum Post</option>
          </select>
        </Field>

        <Field label="Date" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="18 October 2017"
            value={fields.date ?? ''}
            onChange={(e) => update({ date: e.target.value })}
          />
        </Field>
      </div>

      <Field label="URL">
        <input
          className={inputClass}
          type="text"
          placeholder="https://example.com/page"
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
