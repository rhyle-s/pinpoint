'use client'

import { JournalFields } from '@/lib/citation-engine/types'

interface JournalFormProps {
  fields: JournalFields
  onChange: (fields: JournalFields) => void
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
  'w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand'

export default function JournalForm({ fields, onChange }: JournalFormProps) {
  function update(patch: Partial<JournalFields>) {
    onChange({ ...fields, ...patch })
  }

  function updateAuthor(index: number, value: string) {
    const authors = [...fields.authors]
    authors[index] = value
    update({ authors })
  }

  function addAuthor() {
    update({ authors: [...fields.authors, ''] })
  }

  function removeAuthor(index: number) {
    update({ authors: fields.authors.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-5">
      <Field label="Authors">
        <div className="space-y-2">
          {fields.authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClass}
                type="text"
                placeholder="RJ Ellicott"
                value={author}
                onChange={(e) => updateAuthor(index, e.target.value)}
              />
              {fields.authors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAuthor(index)}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAuthor}
            className="text-sm font-medium text-primary hover:underline"
          >
            + Add author
          </button>
        </div>
      </Field>

      <Field label="Article title">
        <input
          className={inputClass}
          type="text"
          placeholder="The Autochthonous Expedient and the Federal Court"
          value={fields.articleTitle}
          onChange={(e) => update({ articleTitle: e.target.value })}
        />
      </Field>

      <Field label="Year">
        <input
          className={inputClass}
          type="text"
          placeholder="2008"
          value={fields.year}
          onChange={(e) => update({ year: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Volume" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="82"
            value={fields.volume ?? ''}
            onChange={(e) => update({ volume: e.target.value })}
          />
        </Field>

        <Field label="Issue" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="10"
            value={fields.issue ?? ''}
            onChange={(e) => update({ issue: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Journal name">
        <input
          className={inputClass}
          type="text"
          placeholder="Australian Law Journal"
          value={fields.journalName}
          onChange={(e) => update({ journalName: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starting page">
          <input
            className={inputClass}
            type="text"
            placeholder="700"
            value={fields.startingPage}
            onChange={(e) => update({ startingPage: e.target.value })}
          />
        </Field>

        <Field label="Pinpoint" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="705"
            value={fields.pinpoint ?? ''}
            onChange={(e) => update({ pinpoint: e.target.value })}
          />
        </Field>
      </div>
    </div>
  )
}
