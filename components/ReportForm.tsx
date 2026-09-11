'use client'

import { ReportFields } from '@/lib/citation-engine/types'

interface ReportFormProps {
  fields: ReportFields
  onChange: (fields: ReportFields) => void
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

export default function ReportForm({ fields, onChange }: ReportFormProps) {
  function update(patch: Partial<ReportFields>) {
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
                placeholder="Australian Law Reform Commission"
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

      <Field label="Title">
        <input
          className={inputClass}
          type="text"
          placeholder="Traditional Rights and Freedoms"
          value={fields.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Document type">
          <input
            className={inputClass}
            type="text"
            placeholder="Report"
            value={fields.documentType}
            onChange={(e) => update({ documentType: e.target.value })}
          />
        </Field>

        <Field label="Series number" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="Report No 129"
            value={fields.seriesNumber ?? ''}
            onChange={(e) => update({ seriesNumber: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Date">
        <input
          className={inputClass}
          type="text"
          placeholder="December 2015"
          value={fields.date}
          onChange={(e) => update({ date: e.target.value })}
        />
      </Field>

      <Field label="URL" optional>
        <input
          className={inputClass}
          type="text"
          placeholder="https://example.com/report.pdf"
          value={fields.url ?? ''}
          onChange={(e) => update({ url: e.target.value })}
        />
      </Field>

      <Field label="Pinpoint" optional>
        <input
          className={inputClass}
          type="text"
          placeholder="45"
          value={fields.pinpoint ?? ''}
          onChange={(e) => update({ pinpoint: e.target.value })}
        />
      </Field>
    </div>
  )
}
