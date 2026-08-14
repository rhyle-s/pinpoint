'use client'

import { BookFields, BookType } from '@/lib/citation-engine/types'

interface BookFormProps {
  fields: BookFields
  onChange: (fields: BookFields) => void
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

function AuthorList({
  label,
  authors,
  onChange,
  placeholder,
}: {
  label: string
  authors: string[]
  onChange: (authors: string[]) => void
  placeholder: string
}) {
  function updateAt(index: number, value: string) {
    const next = [...authors]
    next[index] = value
    onChange(next)
  }

  function add() {
    onChange([...authors, ''])
  }

  function removeAt(index: number) {
    onChange(authors.filter((_, i) => i !== index))
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        {authors.map((author, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={inputClass}
              type="text"
              placeholder={placeholder}
              value={author}
              onChange={(e) => updateAt(index, e.target.value)}
            />
            {authors.length > 1 && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={add} className="text-sm font-medium text-primary hover:underline">
          + Add
        </button>
      </div>
    </Field>
  )
}

export default function BookForm({ fields, onChange }: BookFormProps) {
  function update(patch: Partial<BookFields>) {
    onChange({ ...fields, ...patch })
  }

  return (
    <div className="space-y-5">
      <Field label="Book type">
        <select
          className={inputClass}
          value={fields.bookType}
          onChange={(e) => update({ bookType: e.target.value as BookType })}
        >
          <option value="book">Whole book</option>
          <option value="chapter">Book chapter</option>
        </select>
      </Field>

      {fields.bookType === 'book' && (
        <>
          <AuthorList
            label="Authors"
            authors={fields.authors ?? ['']}
            onChange={(authors) => update({ authors })}
            placeholder="Catharine MacMillan"
          />
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Mistakes in Contract Law"
              value={fields.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Edition" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="2nd ed"
              value={fields.edition ?? ''}
              onChange={(e) => update({ edition: e.target.value })}
            />
          </Field>
          <Field label="Publisher">
            <input
              className={inputClass}
              type="text"
              placeholder="Hart Publishing"
              value={fields.publisher}
              onChange={(e) => update({ publisher: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="2010"
              value={fields.year}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="9"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.bookType === 'chapter' && (
        <>
          <AuthorList
            label="Chapter authors"
            authors={fields.chapterAuthors ?? ['']}
            onChange={(chapterAuthors) => update({ chapterAuthors })}
            placeholder="Simon Evans"
          />
          <Field label="Chapter title">
            <input
              className={inputClass}
              type="text"
              placeholder="Reading Down Statutes"
              value={fields.chapterTitle ?? ''}
              onChange={(e) => update({ chapterTitle: e.target.value })}
            />
          </Field>
          <AuthorList
            label="Editors"
            authors={fields.editors ?? ['']}
            onChange={(editors) => update({ editors })}
            placeholder="Adrienne Stone"
          />
          <Field label="Book title">
            <input
              className={inputClass}
              type="text"
              placeholder="The High Court at the Crossroads"
              value={fields.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Publisher">
            <input
              className={inputClass}
              type="text"
              placeholder="Federation Press"
              value={fields.publisher}
              onChange={(e) => update({ publisher: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="2000"
              value={fields.year}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Starting page">
            <input
              className={inputClass}
              type="text"
              placeholder="83"
              value={fields.startingPage ?? ''}
              onChange={(e) => update({ startingPage: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="90"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
