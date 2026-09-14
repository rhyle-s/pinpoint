'use client'

import { InternationalMaterialFields, InternationalMaterialSubtype, TreatyType } from '@/lib/citation-engine/types'
import ForeignDomesticForm from './ForeignDomesticForm'
import EuropeanMaterialsForm from './EuropeanMaterialsForm'

interface InternationalMaterialFormProps {
  fields: InternationalMaterialFields
  onChange: (fields: InternationalMaterialFields) => void
}

const SUBTYPES: { value: InternationalMaterialSubtype; label: string }[] = [
  { value: 'treaty', label: 'Treaty' },
  { value: 'unDocument', label: 'UN Materials' },
  { value: 'foreignDomestic', label: 'Foreign Domestic Sources' },
  { value: 'europeanUnion', label: 'European Union / Council of Europe Materials' },
]

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

export default function InternationalMaterialForm({ fields, onChange }: InternationalMaterialFormProps) {
  function update(patch: Partial<InternationalMaterialFields>) {
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
      <Field label="Category">
        <select
          className={inputClass}
          value={fields.subtype}
          onChange={(e) => update({ subtype: e.target.value as InternationalMaterialSubtype })}
        >
          {SUBTYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {fields.subtype === 'treaty' && (
        <>
          <Field label="Treaty type">
            <select
              className={inputClass}
              value={fields.treatyType ?? 'multilateral'}
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
              value={fields.title ?? ''}
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Treaty series">
              <input
                className={inputClass}
                type="text"
                placeholder="993 UNTS 3"
                value={fields.treatySeries ?? ''}
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
          </div>

          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="art 3"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'unDocument' && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Universal Declaration of Human Rights"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Resolution number" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="217A"
                value={fields.resolutionNumber ?? ''}
                onChange={(e) => update({ resolutionNumber: e.target.value })}
              />
            </Field>

            <Field label="Session" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="III"
                value={fields.session ?? ''}
                onChange={(e) => update({ session: e.target.value })}
              />
            </Field>
          </div>

          {/* AGLC4 r 9.2.4 — a genuinely separate element from the session number above, not
              implied by it (see the field's own comment in types.ts). Elements 9.2.4–9.2.9 may be
              omitted whenever the document can be located via its own UN Doc number, which is the
              norm for modern resolutions — unchecked by default. */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fields.includeOfficialRecords ?? false}
              onChange={(e) => update({ includeOfficialRecords: e.target.checked })}
            />
            Include &lsquo;UN GAOR&rsquo; (document appears in the General Assembly&rsquo;s Official Records)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="UN document symbol" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="A/810"
                value={fields.unDocSymbol ?? ''}
                onChange={(e) => update({ unDocSymbol: e.target.value })}
              />
            </Field>

            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="10 December 1948"
                value={fields.date ?? ''}
                onChange={(e) => update({ date: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Adopted date" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="13 September 2007"
                value={fields.adoptedDate ?? ''}
                onChange={(e) => update({ adoptedDate: e.target.value })}
              />
            </Field>

            <Field label="Pinpoint" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="art 5"
                value={fields.pinpoint ?? ''}
                onChange={(e) => update({ pinpoint: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}

      {fields.subtype === 'foreignDomestic' && <ForeignDomesticForm fields={fields} onChange={onChange} />}
      {fields.subtype === 'europeanUnion' && <EuropeanMaterialsForm fields={fields} onChange={onChange} />}
    </div>
  )
}
