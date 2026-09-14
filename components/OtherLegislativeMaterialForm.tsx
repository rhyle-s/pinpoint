'use client'

import {
  ExplanatoryMaterialLabel,
  JurisdictionCode,
  LegislationPinpointType,
  OtherLegislativeMaterialFields,
  OtherLegislativeMaterialSubtype,
  PracticeDocumentType,
} from '@/lib/citation-engine/types'

interface OtherLegislativeMaterialFormProps {
  fields: OtherLegislativeMaterialFields
  onChange: (fields: OtherLegislativeMaterialFields) => void
}

const SUBTYPES: { value: OtherLegislativeMaterialSubtype; label: string }[] = [
  { value: 'bill', label: 'Bill' },
  { value: 'explanatoryMaterial', label: 'Explanatory Memorandum / Statement / Note(s)' },
  { value: 'gazette', label: 'Gazette' },
  { value: 'practiceDirection', label: 'Court Practice Direction / Note' },
  { value: 'constitution', label: 'Australian / State / Territory Constitution' },
]

const JURISDICTIONS: JurisdictionCode[] = ['Cth', 'Vic', 'NSW', 'Qld', 'WA', 'SA', 'Tas', 'ACT', 'NT']

const EXPLANATORY_LABELS: ExplanatoryMaterialLabel[] = [
  'Explanatory Memorandum',
  'Explanatory Statement',
  'Explanatory Note',
  'Explanatory Notes',
]

const PRACTICE_TYPES: PracticeDocumentType[] = ['Practice Note', 'Practice Direction']

const LEGISLATION_PINPOINT_TYPES: LegislationPinpointType[] = ['s', 'ss', 'sch', 'pt', 'div', 'reg']

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

export default function OtherLegislativeMaterialForm({ fields, onChange }: OtherLegislativeMaterialFormProps) {
  function update(patch: Partial<OtherLegislativeMaterialFields>) {
    onChange({ ...fields, ...patch })
  }

  return (
    <div className="space-y-5">
      <Field label="Document type">
        <select
          className={inputClass}
          value={fields.subtype}
          onChange={(e) => update({ subtype: e.target.value as OtherLegislativeMaterialSubtype })}
        >
          {SUBTYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {(fields.subtype === 'bill' || fields.subtype === 'explanatoryMaterial') && (
        <>
          {fields.subtype === 'explanatoryMaterial' && (
            <Field label="Label">
              <select
                className={inputClass}
                value={fields.explanatoryLabel ?? 'Explanatory Memorandum'}
                onChange={(e) => update({ explanatoryLabel: e.target.value as ExplanatoryMaterialLabel })}
              >
                {EXPLANATORY_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Bill title">
            <input
              className={inputClass}
              type="text"
              placeholder="Corporations Amendment (Crowd-Sourced Funding) Bill"
              value={fields.billTitle ?? ''}
              onChange={(e) => update({ billTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="2015"
                value={fields.billYear ?? ''}
                onChange={(e) => update({ billYear: e.target.value })}
              />
            </Field>
            <Field label="Jurisdiction">
              <select
                className={inputClass}
                value={fields.billJurisdiction ?? 'Cth'}
                onChange={(e) => update({ billJurisdiction: e.target.value as JurisdictionCode })}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="cl 5"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'gazette' && (
        <>
          <Field label="Author" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Minister for Lands (WA)"
              value={fields.gazetteAuthor ?? ''}
              onChange={(e) => update({ gazetteAuthor: e.target.value })}
            />
          </Field>
          <Field label="Notice title" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Notice of Intention to Take Land for a Public Work"
              value={fields.gazetteArticleTitle ?? ''}
              onChange={(e) => update({ gazetteArticleTitle: e.target.value })}
            />
          </Field>
          <Field label="Jurisdiction">
            <input
              className={inputClass}
              type="text"
              placeholder="Western Australia"
              value={fields.gazetteJurisdiction ?? ''}
              onChange={(e) => update({ gazetteJurisdiction: e.target.value })}
            />
          </Field>
          <Field label="Gazette name">
            <input
              className={inputClass}
              type="text"
              placeholder="Western Australian Government Gazette"
              value={fields.gazetteName ?? ''}
              onChange={(e) => update({ gazetteName: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gazette number">
              <input
                className={inputClass}
                type="text"
                placeholder="No 27"
                value={fields.gazetteNumber ?? ''}
                onChange={(e) => update({ gazetteNumber: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="18 February 1997"
                value={fields.gazetteDate ?? ''}
                onChange={(e) => update({ gazetteDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting page" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="1142"
                value={fields.gazetteStartingPage ?? ''}
                onChange={(e) => update({ gazetteStartingPage: e.target.value })}
              />
            </Field>
            <Field label="Pinpoint" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="1143"
                value={fields.pinpoint ?? ''}
                onChange={(e) => update({ pinpoint: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}

      {fields.subtype === 'practiceDirection' && (
        <>
          <Field label="Court">
            <input
              className={inputClass}
              type="text"
              placeholder="Supreme Court of Victoria"
              value={fields.court ?? ''}
              onChange={(e) => update({ court: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className={inputClass}
                value={fields.practiceType ?? 'Practice Note'}
                onChange={(e) => update({ practiceType: e.target.value as PracticeDocumentType })}
              >
                {PRACTICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Number">
              <input
                className={inputClass}
                type="text"
                placeholder="No 9 of 2010"
                value={fields.practiceNumber ?? ''}
                onChange={(e) => update({ practiceNumber: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Conduct of Group Proceedings"
              value={fields.practiceTitle ?? ''}
              onChange={(e) => update({ practiceTitle: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              className={inputClass}
              type="text"
              placeholder="29 November 2010"
              value={fields.practiceDate ?? ''}
              onChange={(e) => update({ practiceDate: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'constitution' && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Australian Constitution"
              value={fields.constitutionTitle ?? ''}
              onChange={(e) => update({ constitutionTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Leave blank for the bare Australian Constitution"
                value={fields.constitutionYear ?? ''}
                onChange={(e) => update({ constitutionYear: e.target.value })}
              />
            </Field>
            <Field label="Jurisdiction">
              <select
                className={inputClass}
                value={fields.constitutionJurisdiction ?? 'none'}
                onChange={(e) =>
                  update({ constitutionJurisdiction: e.target.value as JurisdictionCode | 'none' })
                }
              >
                <option value="none">None (the Commonwealth Constitution)</option>
                {JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <div className="flex gap-2">
              <input
                className={inputClass}
                type="text"
                placeholder="51(ii)"
                value={fields.constitutionPinpointValue ?? ''}
                onChange={(e) => update({ constitutionPinpointValue: e.target.value })}
              />
              {/* `inputClass` already carries `w-full`, which — same bug as CaseForm's own
                  Pinpoint select — wins the cascade over a plain `w-28` appended after it,
                  since Tailwind's generated stylesheet orders `.w-full` after `.w-28`
                  regardless of `class`-attribute order. The `!` forces `!important` so
                  `w-28`/`shrink-0` actually win. */}
              <select
                className={`${inputClass} !w-28 !shrink-0`}
                value={fields.constitutionPinpointType ?? 's'}
                onChange={(e) => update({ constitutionPinpointType: e.target.value as LegislationPinpointType })}
              >
                {LEGISLATION_PINPOINT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </>
      )}
    </div>
  )
}
