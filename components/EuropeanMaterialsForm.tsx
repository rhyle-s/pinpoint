'use client'

import { EUCategory, EUEchrFormat, InternationalMaterialFields, OJSeries } from '@/lib/citation-engine/types'

interface EuropeanMaterialsFormProps {
  fields: InternationalMaterialFields
  onChange: (fields: InternationalMaterialFields) => void
}

const EU_CATEGORIES: { value: EUCategory; label: string }[] = [
  { value: 'officialJournal', label: 'Official Journal of the EU (r 14.2.1)' },
  { value: 'constitutiveTreaty', label: 'Constitutive Treaty of the EU (r 14.2.2)' },
  { value: 'court', label: 'Court of the European Union (r 14.2.3)' },
  { value: 'councilOfEuropeBasicDocument', label: 'Basic Document of the Council of Europe (r 14.3.1)' },
  { value: 'europeanCourtOfHumanRights', label: 'European Court of Human Rights (r 14.3.2)' },
  { value: 'europeanCommissionOfHumanRights', label: 'European Commission of Human Rights (r 14.3.3)' },
]

const ECHR_FORMATS: { value: EUEchrFormat; label: string }[] = [
  { value: 'reportedYearOrganised', label: 'Reported — from 1996 (Eur Court HR, year-organised)' },
  { value: 'reportedSeriesA', label: 'Reported — until end of 1995 (Eur Court HR (ser A))' },
  { value: 'unreported', label: 'Unreported' },
  { value: 'pleadings', label: 'Pleadings (Eur Court HR (ser B), until 1988)' },
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
  'w-full rounded-lg border border-transparent bg-gray-100 px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand'

export default function EuropeanMaterialsForm({ fields, onChange }: EuropeanMaterialsFormProps) {
  function update(patch: Partial<InternationalMaterialFields>) {
    onChange({ ...fields, ...patch })
  }

  const category = fields.euCategory
  const isTreatyLike = category === 'constitutiveTreaty' || category === 'councilOfEuropeBasicDocument'
  const echrFormat = fields.euEchrFormat ?? 'reportedYearOrganised'

  return (
    <div className="space-y-5">
      <Field label="Category">
        <select
          className={inputClass}
          value={category ?? ''}
          onChange={(e) => update({ euCategory: e.target.value as EUCategory })}
        >
          <option value="" disabled>
            Select a category
          </option>
          {EU_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {category === 'officialJournal' && (
        <>
          <Field label="Document title">
            <input
              className={inputClass}
              type="text"
              placeholder="Council Directive 93/13/EEC of 5 April 1993 on Unfair Terms in Consumer Contracts"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year of publication in the OJ" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="1993"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="OJ series" optional>
            <select
              className={inputClass}
              value={fields.ojSeries ?? ''}
              onChange={(e) => update({ ojSeries: (e.target.value || undefined) as OJSeries | undefined })}
            >
              <option value="">None (pre-1968, or title only)</option>
              <option value="L">L — legislative acts</option>
              <option value="C">C — information and notices</option>
              <option value="LI">LI — L subseries (from 2016)</option>
              <option value="CI">CI — C subseries (from 2016)</option>
              <option value="CA">CA — C subseries (from 2016)</option>
              <option value="S">S — invitations to tender (no starting page)</option>
            </select>
          </Field>
          <Field label="Issue number" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="95"
              value={fields.ojIssueNumber ?? ''}
              onChange={(e) => update({ ojIssueNumber: e.target.value })}
            />
          </Field>
          {fields.ojSeries !== 'S' && (
            <Field label="Starting page" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="29"
                value={fields.ojStartingPage ?? ''}
                onChange={(e) => update({ ojStartingPage: e.target.value })}
              />
            </Field>
          )}
          {fields.ojSeries === 'C' && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={fields.ojIsDigitalOnlyC ?? false}
                onChange={(e) => update({ ojIsDigitalOnlyC: e.target.checked })}
              />
              Digital-only part of the C series (from 2016) — uses an &lsquo;E/&rsquo; page prefix
            </label>
          )}
          <Field label="Special Edition year" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="1970 (pre-1974 documents only — parallel citation)"
              value={fields.ojSpecEdYear ?? ''}
              onChange={(e) => update({ ojSpecEdYear: e.target.value })}
            />
          </Field>
          <Field label="Special Edition starting page" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="623"
              value={fields.ojSpecEdStartingPage ?? ''}
              onChange={(e) => update({ ojSpecEdStartingPage: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="art 3(1)"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {isTreatyLike && (
        <>
          <Field label="Treaty title">
            <input
              className={inputClass}
              type="text"
              placeholder="Treaty on European Union"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Opened for signature" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="7 February 1992"
              value={fields.openedForSignature ?? ''}
              onChange={(e) => update({ openedForSignature: e.target.value })}
            />
          </Field>
          <Field label="Signed" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="18 April 1951 (use only if the source itself says 'signed', not 'opened for signature')"
              value={fields.signedDate ?? ''}
              onChange={(e) => update({ signedDate: e.target.value })}
            />
          </Field>
          <Field label="Treaty series (or OJ reference)" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="[2009] OJ C 115/13"
              value={fields.treatySeries ?? ''}
              onChange={(e) => update({ treatySeries: e.target.value })}
            />
          </Field>
          <Field label="Entered into force" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="1 November 1993"
              value={fields.enteredIntoForce ?? ''}
              onChange={(e) => update({ enteredIntoForce: e.target.value })}
            />
          </Field>
          <Field label="Short title" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="EU"
              value={fields.shortTitle ?? ''}
              onChange={(e) => update({ shortTitle: e.target.value })}
            />
          </Field>
          <Field label="Amended by" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Treaty of Amsterdam ..., opened for signature 2 October 1997, [1997] OJ C 340/1 (entered into force 1 May 1999)"
              value={fields.euAmendedByCitation ?? ''}
              onChange={(e) => update({ euAmendedByCitation: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="art 6"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {category === 'court' && (
        <>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fields.euCourtReported ?? false}
              onChange={(e) => update({ euCourtReported: e.target.checked })}
            />
            Reported in the ECR / ECR-SC
          </label>
          <Field label="Parties' names">
            <input
              className={inputClass}
              type="text"
              placeholder="Huawei Technologies Co Ltd v ZTE Corporation"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Case number">
            <input
              className={inputClass}
              type="text"
              placeholder="C-170/13"
              value={fields.euCaseNumber ?? ''}
              onChange={(e) => update({ euCaseNumber: e.target.value })}
            />
          </Field>
          {fields.euCourtReported ? (
            <>
              <Field label="Year">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="1964"
                  value={fields.year ?? ''}
                  onChange={(e) => update({ year: e.target.value })}
                />
              </Field>
              <Field label="Volume" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2 (rare — most ECR citations have none)"
                  value={fields.volume ?? ''}
                  onChange={(e) => update({ volume: e.target.value })}
                />
              </Field>
              <Field label="Report series">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="ECR"
                  value={fields.reportAbbreviation ?? ''}
                  onChange={(e) => update({ reportAbbreviation: e.target.value })}
                />
              </Field>
              <Field label="Starting page">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="585 (or 'II-197' for ECR-SC)"
                  value={fields.startingPage ?? ''}
                  onChange={(e) => update({ startingPage: e.target.value })}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Court name">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Court of Justice of the European Union"
                  value={fields.euCourtName ?? ''}
                  onChange={(e) => update({ euCourtName: e.target.value })}
                />
              </Field>
              <Field label="ECLI" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="ECLI:EU:C:2015:477"
                  value={fields.euEcli ?? ''}
                  onChange={(e) => update({ euEcli: e.target.value })}
                />
              </Field>
              <Field label="Full date">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="16 July 2015"
                  value={fields.date ?? ''}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="[9]"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {category === 'europeanCourtOfHumanRights' && (
        <>
          <Field label="Format">
            <select
              className={inputClass}
              value={echrFormat}
              onChange={(e) => update({ euEchrFormat: e.target.value as EUEchrFormat })}
            >
              {ECHR_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          {echrFormat === 'pleadings' && (
            <Field label="Document title" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="The Case of Gerard Richard Lawless — Memorial Submitted by the European Commission of Human Rights"
                value={fields.euDocumentTitle ?? ''}
                onChange={(e) => update({ euDocumentTitle: e.target.value })}
              />
            </Field>
          )}

          <Field label="Parties' names">
            <input
              className={inputClass}
              type="text"
              placeholder="Bouchelkia v France"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>

          <Field label="Phase" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Preliminary Objections"
              value={fields.euPhase ?? ''}
              onChange={(e) => update({ euPhase: e.target.value })}
            />
          </Field>

          {(echrFormat === 'reportedSeriesA' || echrFormat === 'reportedYearOrganised' || echrFormat === 'pleadings') && (
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="1997"
                value={fields.year ?? ''}
                onChange={(e) => update({ year: e.target.value })}
              />
            </Field>
          )}

          {(echrFormat === 'reportedSeriesA' || echrFormat === 'reportedYearOrganised') && (
            <Field label="Volume" optional={echrFormat === 'reportedSeriesA'}>
              <input
                className={inputClass}
                type="text"
                placeholder={echrFormat === 'reportedSeriesA' ? '310, or 320-B for a lettered part' : 'I (Roman numeral)'}
                value={fields.volume ?? ''}
                onChange={(e) => update({ volume: e.target.value })}
              />
            </Field>
          )}

          {(echrFormat === 'reportedYearOrganised' || echrFormat === 'pleadings') && (
            <Field label="Starting page" optional={echrFormat === 'reportedYearOrganised'}>
              <input
                className={inputClass}
                type="text"
                placeholder="47"
                value={fields.startingPage ?? ''}
                onChange={(e) => update({ startingPage: e.target.value })}
              />
            </Field>
          )}

          {echrFormat === 'reportedSeriesA' && (
            <Field label="Judge" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Judge Pettiti"
                value={fields.judge ?? ''}
                onChange={(e) => update({ judge: e.target.value })}
              />
            </Field>
          )}

          {echrFormat === 'unreported' && (
            <>
              <Field label="Chamber">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Grand Chamber"
                  value={fields.euChamber ?? ''}
                  onChange={(e) => update({ euChamber: e.target.value })}
                />
              </Field>
              <Field label="Application number(s)">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="No 30562/04, or Nos 30562/04 and 30566/04"
                  value={fields.euApplicationNumber ?? ''}
                  onChange={(e) => update({ euApplicationNumber: e.target.value })}
                />
              </Field>
              <Field label="Full date">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="4 December 2008"
                  value={fields.date ?? ''}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </Field>
            </>
          )}

          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder={echrFormat === 'reportedSeriesA' || echrFormat === 'reportedYearOrganised' || echrFormat === 'pleadings' ? '67' : '[125]'}
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {category === 'europeanCommissionOfHumanRights' && (
        <>
          <Field label="Parties' names">
            <input
              className={inputClass}
              type="text"
              placeholder="Klass v Federal Republic of Germany"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1978"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Volume">
            <input
              className={inputClass}
              type="text"
              placeholder="1"
              value={fields.volume ?? ''}
              onChange={(e) => update({ volume: e.target.value })}
            />
          </Field>
          <Field label="Starting page">
            <input
              className={inputClass}
              type="text"
              placeholder="20"
              value={fields.startingPage ?? ''}
              onChange={(e) => update({ startingPage: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="29"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
