'use client'

import { CaseFields, CaseReportType } from '@/lib/citation-engine/types'

interface CaseFormProps {
  fields: CaseFields
  onChange: (fields: CaseFields) => void
}

const REPORT_TYPES: { value: CaseReportType; label: string }[] = [
  { value: 'reported', label: 'Reported' },
  { value: 'unreported-mnc', label: 'Unreported — medium neutral citation' },
  { value: 'unreported-no-mnc', label: 'Unreported — no medium neutral citation' },
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

export default function CaseForm({ fields, onChange }: CaseFormProps) {
  function update(patch: Partial<CaseFields>) {
    onChange({ ...fields, ...patch })
  }

  return (
    <div className="space-y-5">
      <Field label="Report type">
        <select
          className={inputClass}
          value={fields.reportType}
          onChange={(e) => update({ reportType: e.target.value as CaseReportType })}
        >
          {REPORT_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Case name">
        <input
          className={inputClass}
          type="text"
          placeholder="Mabo v Queensland [No 2]"
          value={fields.caseName}
          onChange={(e) => update({ caseName: e.target.value })}
        />
      </Field>

      {fields.reportType === 'reported' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="1992"
                value={fields.year}
                onChange={(e) => update({ year: e.target.value })}
              />
            </Field>
            <Field label="Volume" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="175"
                value={fields.volume ?? ''}
                onChange={(e) => update({ volume: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Law report abbreviation">
              <input
                className={inputClass}
                type="text"
                placeholder="CLR"
                value={fields.reportAbbreviation ?? ''}
                onChange={(e) => update({ reportAbbreviation: e.target.value })}
              />
            </Field>
            <Field label="Starting page">
              <input
                className={inputClass}
                type="text"
                placeholder="1"
                value={fields.startingPage ?? ''}
                onChange={(e) => update({ startingPage: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <div className="flex gap-2">
              <input
                className={inputClass}
                type="text"
                placeholder="29"
                value={fields.pinpoint ?? ''}
                onChange={(e) => update({ pinpoint: e.target.value })}
              />
              {/* `inputClass` already carries `w-full` — appending `w-40` after it in the class
                  string doesn't give `w-40` priority the way it would with plain CSS, because
                  Tailwind's generated stylesheet orders `.w-full` after `.w-40` regardless of
                  where each class sits in the `class` attribute, so `w-full` was winning the
                  cascade and this select was rendering at the row's full width, not 10rem —
                  confirmed live (measured 478px, not 160px) before the `!` override below. The
                  `!` forces `!important` so `w-40`/`shrink-0` actually win. */}
              <select
                className={`${inputClass} !w-40 !shrink-0`}
                value={fields.pinpointType ?? 'page'}
                onChange={(e) => update({ pinpointType: e.target.value as 'page' | 'paragraph' })}
              >
                <option value="page">Page</option>
                <option value="paragraph">Paragraph</option>
              </select>
            </div>
          </Field>
          <Field label="Judge" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Brennan J"
              value={fields.judge ?? ''}
              onChange={(e) => update({ judge: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.reportType === 'unreported-mnc' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="1992"
                value={fields.year}
                onChange={(e) => update({ year: e.target.value })}
              />
            </Field>
            <Field label="Judge" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Mortimer J"
                value={fields.judge ?? ''}
                onChange={(e) => update({ judge: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Court code">
              <input
                className={inputClass}
                type="text"
                placeholder="FCA"
                value={fields.courtCode ?? ''}
                onChange={(e) => update({ courtCode: e.target.value })}
              />
            </Field>
            <Field label="Case number">
              <input
                className={inputClass}
                type="text"
                placeholder="358"
                value={fields.caseNumber ?? ''}
                onChange={(e) => update({ caseNumber: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Paragraph pinpoint" optional>
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

      {fields.reportType === 'unreported-no-mnc' && (
        <>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1992"
              value={fields.year}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Court">
              <input
                className={inputClass}
                type="text"
                placeholder="Supreme Court of Victoria"
                value={fields.court ?? ''}
                onChange={(e) => update({ court: e.target.value })}
              />
            </Field>
            <Field label="Judge">
              <input
                className={inputClass}
                type="text"
                placeholder="Hampel J"
                value={fields.judge ?? ''}
                onChange={(e) => update({ judge: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="29 June 1989"
                value={fields.date ?? ''}
                onChange={(e) => update({ date: e.target.value })}
              />
            </Field>
            <Field label="Page pinpoint" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="3"
                value={fields.pinpoint ?? ''}
                onChange={(e) => update({ pinpoint: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}
    </div>
  )
}
