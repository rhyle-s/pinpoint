'use client'

import { JurisdictionCode, LegislationFields, LegislationPinpointType } from '@/lib/citation-engine/types'

interface LegislationFormProps {
  fields: LegislationFields
  onChange: (fields: LegislationFields) => void
}

const JURISDICTIONS: { value: JurisdictionCode | 'none'; label: string }[] = [
  { value: 'Cth', label: 'Cth' },
  { value: 'Vic', label: 'Vic' },
  { value: 'NSW', label: 'NSW' },
  { value: 'Qld', label: 'Qld' },
  { value: 'WA', label: 'WA' },
  { value: 'SA', label: 'SA' },
  { value: 'Tas', label: 'Tas' },
  { value: 'ACT', label: 'ACT' },
  { value: 'NT', label: 'NT' },
  { value: 'none', label: 'None (eg Australian Constitution)' },
]

const PINPOINT_TYPES: { value: LegislationPinpointType | 'none'; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 's', label: 's — section' },
  { value: 'ss', label: 'ss — sections' },
  { value: 'sch', label: 'sch — schedule' },
  { value: 'pt', label: 'pt — part' },
  { value: 'div', label: 'div — division' },
  { value: 'reg', label: 'reg — regulation' },
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
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export default function LegislationForm({ fields, onChange }: LegislationFormProps) {
  function update(patch: Partial<LegislationFields>) {
    onChange({ ...fields, ...patch })
  }

  return (
    <div className="space-y-5">
      <Field label="Act title">
        <input
          className={inputClass}
          type="text"
          placeholder="Privacy Act"
          value={fields.actTitle}
          onChange={(e) => update({ actTitle: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <input
            className={inputClass}
            type="text"
            placeholder="1988"
            value={fields.year}
            onChange={(e) => update({ year: e.target.value })}
          />
        </Field>

        <Field label="Jurisdiction">
          <select
            className={inputClass}
            value={fields.jurisdiction}
            onChange={(e) => update({ jurisdiction: e.target.value as JurisdictionCode | 'none' })}
          >
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pinpoint type">
          <select
            className={inputClass}
            value={fields.pinpointType ?? 'none'}
            onChange={(e) => {
              const value = e.target.value as LegislationPinpointType | 'none'
              update({
                pinpointType: value === 'none' ? undefined : value,
                pinpointValue: value === 'none' ? undefined : fields.pinpointValue,
              })
            }}
          >
            {PINPOINT_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </Field>

        {fields.pinpointType && (
          <Field label="Pinpoint value">
            <input
              className={inputClass}
              type="text"
              placeholder="13"
              value={fields.pinpointValue ?? ''}
              onChange={(e) => update({ pinpointValue: e.target.value })}
            />
          </Field>
        )}
      </div>
    </div>
  )
}
