'use client'

import { ResearchPaperFields } from '@/lib/citation-engine/types'

interface ResearchPaperFormProps {
  fields: ResearchPaperFields
  onChange: (fields: ResearchPaperFields) => void
}

const DOCUMENT_TYPES = ['Conference Paper', 'PhD Thesis', 'Masters Thesis', 'Honours Thesis', 'Working Paper', 'Research Paper']

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

// The institution field means a different thing depending on the document type — a university
// for a thesis, the conference name for a conference paper, the publishing body otherwise — so
// its label and placeholder track the current selection rather than staying generically labelled.
function institutionCopy(documentType: string): { label: string; placeholder: string } {
  if (documentType.includes('Thesis')) return { label: 'University', placeholder: 'University of Melbourne' }
  if (documentType === 'Conference Paper') {
    return { label: 'Conference name', placeholder: 'Australasian Law Teachers Association Conference' }
  }
  return { label: 'Institution', placeholder: 'Grattan Institute' }
}

function dateCopy(documentType: string): { label: string; placeholder: string } {
  if (documentType.includes('Thesis')) return { label: 'Year', placeholder: '2013' }
  return { label: 'Date', placeholder: '4 July 2015' }
}

export default function ResearchPaperForm({ fields, onChange }: ResearchPaperFormProps) {
  function update(patch: Partial<ResearchPaperFields>) {
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

  const institution = institutionCopy(fields.documentType)
  const date = dateCopy(fields.documentType)
  const isWorkingOrResearchPaper = fields.documentType === 'Working Paper' || fields.documentType === 'Research Paper'

  return (
    <div className="space-y-5">
      <Field label="Authors" optional>
        <div className="space-y-2">
          {authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClass}
                type="text"
                placeholder="Melissa Vogt"
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
          placeholder="The Concept of Territorial Sovereignty in International Law"
          value={fields.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>

      <Field label="Document type">
        <select
          className={inputClass}
          value={fields.documentType}
          onChange={(e) => update({ documentType: e.target.value })}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      {isWorkingOrResearchPaper && (
        <Field label="Series number" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="No 5"
            value={fields.seriesNumber ?? ''}
            onChange={(e) => update({ seriesNumber: e.target.value })}
          />
        </Field>
      )}

      <Field label={institution.label}>
        <input
          className={inputClass}
          type="text"
          placeholder={institution.placeholder}
          value={fields.institution}
          onChange={(e) => update({ institution: e.target.value })}
        />
      </Field>

      <Field label={date.label}>
        <input
          className={inputClass}
          type="text"
          placeholder={date.placeholder}
          value={fields.date}
          onChange={(e) => update({ date: e.target.value })}
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
