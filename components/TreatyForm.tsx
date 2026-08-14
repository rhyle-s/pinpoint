'use client'

import { TreatyFields, TreatyType } from '@/lib/citation-engine/types'

interface TreatyFormProps {
  fields: TreatyFields
  onChange: (fields: TreatyFields) => void
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

export default function TreatyForm({ fields, onChange }: TreatyFormProps) {
  function update(patch: Partial<TreatyFields>) {
    onChange({ ...fields, ...patch })
  }

  const isBilateralOrTrilateral = fields.treatyType === 'bilateral' || fields.treatyType === 'trilateral'
  const parties = fields.parties ?? []

  function updateParty(index: number, value: string) {
    const next = [...parties]
    next[index] = value
    update({ parties: next })
  }

  function addParty() {
    update({ parties: [...parties, ''] })
  }

  function removeParty(index: number) {
    update({ parties: parties.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-5">
      <Field label="Treaty type">
        <select
          className={inputClass}
          value={fields.treatyType}
          onChange={(e) => update({ treatyType: e.target.value as TreatyType })}
        >
          <option value="multilateral">Multilateral</option>
          <option value="bilateral">Bilateral</option>
          <option value="trilateral">Trilateral</option>
        </select>
      </Field>

      <Field label="Treaty title">
        <input
          className={inputClass}
          type="text"
          placeholder="International Covenant on Economic, Social and Cultural Rights"
          value={fields.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>

      {isBilateralOrTrilateral && (
        <Field label="Parties" optional>
          <div className="space-y-2">
            {parties.map((party, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Australia"
                  value={party}
                  onChange={(e) => updateParty(index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeParty(index)}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:border-gray-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addParty} className="text-sm font-medium text-primary hover:underline">
              + Add party
            </button>
          </div>
        </Field>
      )}

      {!isBilateralOrTrilateral && (
        <Field label="Opened for signature" optional>
          <input
            className={inputClass}
            type="text"
            placeholder="16 December 1966"
            value={fields.openedForSignature ?? ''}
            onChange={(e) => update({ openedForSignature: e.target.value })}
          />
        </Field>
      )}

      {isBilateralOrTrilateral && (
        <Field label="Signed date">
          <input
            className={inputClass}
            type="text"
            placeholder="20 May 2002"
            value={fields.signedDate ?? ''}
            onChange={(e) => update({ signedDate: e.target.value })}
          />
        </Field>
      )}

      <Field label="Treaty series">
        <input
          className={inputClass}
          type="text"
          placeholder="993 UNTS 3"
          value={fields.treatySeries}
          onChange={(e) => update({ treatySeries: e.target.value })}
        />
      </Field>

      <Field label="Entered into force" optional>
        <input
          className={inputClass}
          type="text"
          placeholder="3 January 1976"
          value={fields.enteredIntoForce ?? ''}
          onChange={(e) => update({ enteredIntoForce: e.target.value })}
        />
      </Field>

      <Field label="Pinpoint" optional>
        <input
          className={inputClass}
          type="text"
          placeholder="art 3"
          value={fields.pinpoint ?? ''}
          onChange={(e) => update({ pinpoint: e.target.value })}
        />
      </Field>
    </div>
  )
}
