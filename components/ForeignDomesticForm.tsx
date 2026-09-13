'use client'

import {
  CanadaStatuteVolumeType,
  CaseReportType,
  ForeignCategory,
  ForeignCountry,
  InternationalMaterialFields,
  UKInstrumentType,
  UKJurisdiction,
} from '@/lib/citation-engine/types'

interface ForeignDomesticFormProps {
  fields: InternationalMaterialFields
  onChange: (fields: InternationalMaterialFields) => void
}

const COUNTRIES: { value: ForeignCountry; label: string }[] = [
  { value: 'Canada', label: 'Canada' },
  { value: 'NewZealand', label: 'New Zealand' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'HongKong', label: 'Hong Kong' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'SouthAfrica', label: 'South Africa' },
]

const CATEGORIES_BY_COUNTRY: Record<ForeignCountry, { value: ForeignCategory; label: string }[]> = {
  Canada: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
  ],
  NewZealand: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
    { value: 'delegatedLegislation', label: 'Delegated Legislation' },
  ],
  UK: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
    { value: 'delegatedLegislation', label: 'Delegated Legislation' },
  ],
  US: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation (Code)' },
    { value: 'legislationSessionLaw', label: 'Legislation (Session Law)' },
    { value: 'constitution', label: 'Constitution' },
  ],
  HongKong: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
  ],
  Malaysia: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
  ],
  Singapore: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
  ],
  SouthAfrica: [
    { value: 'case', label: 'Case' },
    { value: 'legislation', label: 'Legislation' },
  ],
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="label-caps">{label}</span>
        {optional && <span className="text-[10px] font-normal normal-case tracking-normal text-gray-400">(optional)</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-[9px] text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:shadow-ring-brand'

export default function ForeignDomesticForm({ fields, onChange }: ForeignDomesticFormProps) {
  function update(patch: Partial<InternationalMaterialFields>) {
    onChange({ ...fields, ...patch })
  }

  const country = fields.foreignCountry
  const category = fields.foreignCategory
  const isChapterTwoCase = category === 'case' && country !== 'US'
  const reportType = fields.foreignCaseReportType ?? 'reported'
  // Malaysian courts don't issue medium neutral citations at all (AGLC4 r 20.1.2's own note) — so
  // the MNC option is left off the dropdown entirely for Malaysia, rather than offered and then
  // silently producing an AGLC4-inconsistent citation if picked.
  const CASE_REPORT_TYPES: { value: CaseReportType; label: string }[] =
    country === 'Malaysia'
      ? [
          { value: 'reported', label: 'Reported' },
          { value: 'unreported-no-mnc', label: 'Unreported' },
        ]
      : [
          { value: 'reported', label: 'Reported' },
          { value: 'unreported-mnc', label: 'Unreported — medium neutral citation' },
          { value: 'unreported-no-mnc', label: 'Unreported — no medium neutral citation' },
        ]

  return (
    <div className="space-y-5">
      <Field label="Country">
        <select
          className={inputClass}
          value={country ?? ''}
          onChange={(e) => {
            const nextCountry = e.target.value as ForeignCountry
            update({ foreignCountry: nextCountry, foreignCategory: CATEGORIES_BY_COUNTRY[nextCountry][0].value })
          }}
        >
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {country && (
        <Field label="Type">
          <select
            className={inputClass}
            value={category ?? ''}
            onChange={(e) => update({ foreignCategory: e.target.value as ForeignCategory })}
          >
            {CATEGORIES_BY_COUNTRY[country].map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {isChapterTwoCase && (
        <>
          <Field label="Report type">
            <select
              className={inputClass}
              value={reportType}
              onChange={(e) => update({ foreignCaseReportType: e.target.value as CaseReportType })}
            >
              {CASE_REPORT_TYPES.map((rt) => (
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
              placeholder={country === 'UK' ? 'CAS (Nominees) Ltd v Nottingham Forest plc' : 'R v Sharpe'}
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>

          {reportType !== 'unreported-no-mnc' && (
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="2001"
                value={fields.year ?? ''}
                onChange={(e) => update({ year: e.target.value })}
              />
            </Field>
          )}

          {reportType === 'reported' && (
            <>
              <Field label="Volume" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="1"
                  value={fields.volume ?? ''}
                  onChange={(e) => update({ volume: e.target.value })}
                />
              </Field>
              <Field label="Report series abbreviation">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="SCR"
                  value={fields.reportAbbreviation ?? ''}
                  onChange={(e) => update({ reportAbbreviation: e.target.value })}
                />
              </Field>
              <Field label="Starting page" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="45"
                  value={fields.startingPage ?? ''}
                  onChange={(e) => update({ startingPage: e.target.value })}
                />
              </Field>
            </>
          )}

          {reportType === 'unreported-mnc' && (
            <>
              <Field label="Court code (unique court identifier)">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="eg NZHC, EWCA Civ, SGHC — see AGLC4's own table for this country"
                  value={fields.foreignCourtCode ?? ''}
                  onChange={(e) => update({ foreignCourtCode: e.target.value })}
                />
              </Field>
              <Field label="Case/judgment number">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2603"
                  value={fields.foreignCaseNumber ?? ''}
                  onChange={(e) => update({ foreignCaseNumber: e.target.value })}
                />
              </Field>
            </>
          )}

          {reportType === 'unreported-no-mnc' && (
            <>
              <Field label="Court name">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="High Court of New Zealand"
                  value={fields.courtName ?? ''}
                  onChange={(e) => update({ courtName: e.target.value })}
                />
              </Field>
              <Field label="Full date">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2 March 2010"
                  value={fields.date ?? ''}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </Field>
            </>
          )}

          <Field label="Judge" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Randerson and Neazor JJ"
              value={fields.judge ?? ''}
              onChange={(e) => update({ judge: e.target.value })}
            />
          </Field>

          {reportType === 'reported' && (
            <Field label="Court name" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="High Court"
                value={fields.courtName ?? ''}
                onChange={(e) => update({ courtName: e.target.value })}
              />
            </Field>
          )}

          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder={reportType === 'unreported-mnc' ? '[24]' : reportType === 'unreported-no-mnc' ? '77–8' : '351'}
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'Canada' && category === 'legislation' && (
        <>
          <Field label="Act title">
            <input
              className={inputClass}
              type="text"
              placeholder="Privacy Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Statute volume type">
            <select
              className={inputClass}
              value={fields.canadaStatuteVolumeType ?? 'RS'}
              onChange={(e) => update({ canadaStatuteVolumeType: e.target.value as CanadaStatuteVolumeType })}
            >
              <option value="RS">RS — Revised/Re-enacted Statutes</option>
              <option value="S">S — sessional/annual volumes</option>
            </select>
          </Field>
          <Field label="Jurisdiction abbreviation">
            <input
              className={inputClass}
              type="text"
              placeholder="C"
              value={fields.canadaJurisdictionAbbrev ?? ''}
              onChange={(e) => update({ canadaJurisdictionAbbrev: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1985"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Session or supplement" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="1st Supp"
              value={fields.canadaSessionOrSupp ?? ''}
              onChange={(e) => update({ canadaSessionOrSupp: e.target.value })}
            />
          </Field>
          <Field label="Chapter">
            <input
              className={inputClass}
              type="text"
              placeholder="P-21"
              value={fields.canadaChapter ?? ''}
              onChange={(e) => update({ canadaChapter: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 25"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'NewZealand' && category === 'legislation' && (
        <>
          <Field label="Act title">
            <input
              className={inputClass}
              type="text"
              placeholder="Companies Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1993"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 5"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'NewZealand' && category === 'delegatedLegislation' && (
        <>
          <Field label="Regulation title">
            <input
              className={inputClass}
              type="text"
              placeholder="Building Regulations"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1992"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Statutory rule number">
            <input
              className={inputClass}
              type="text"
              placeholder="1992/150"
              value={fields.nzStatutoryRuleNumber ?? ''}
              onChange={(e) => update({ nzStatutoryRuleNumber: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="reg 4"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'UK' && (category === 'legislation' || category === 'delegatedLegislation') && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Online Safety Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="2023"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Jurisdiction">
            <select
              className={inputClass}
              value={fields.ukJurisdiction ?? 'UK'}
              onChange={(e) => update({ ukJurisdiction: e.target.value as UKJurisdiction })}
            >
              <option value="UK">UK — United Kingdom Parliament (from 1963)</option>
              <option value="NI">NI — Northern Ireland Assembly</option>
              <option value="Scot">Scot — Scottish Parliament</option>
              <option value="Wales">Wales — National Assembly for Wales</option>
              <option value="Imp">Imp — Imperial Parliament (pre-1963)</option>
              <option value="none">None — UK Parliament (pre-1963)</option>
            </select>
          </Field>
          {category === 'legislation' && (
            <>
              {/* AGLC4 r 24.2.3: the regnal year and chapter number are included ONLY for
                  statutes enacted before 1 January 1963 — every post-1963 UK/NI/Scot/Wales
                  statute has no number at all (confirmed directly against every one of r 24.2.2's
                  own worked examples). Leave both fields below blank for a modern Act. */}
              <Field label="Regnal year" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="9 & 10 Eliz 2 (pre-1963 Acts only — leave blank for modern Acts)"
                  value={fields.ukRegnalYear ?? ''}
                  onChange={(e) => update({ ukRegnalYear: e.target.value })}
                />
              </Field>
              <Field label="Chapter number" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="34 (pre-1963 Acts only — the formatter adds the 'c' itself)"
                  value={fields.ukNumberValue ?? ''}
                  onChange={(e) => update({ ukNumberValue: e.target.value })}
                />
              </Field>
            </>
          )}
          {category === 'delegatedLegislation' && (
            <>
              <Field label="Instrument type">
                <select
                  className={inputClass}
                  value={fields.ukInstrumentType ?? 'SI'}
                  onChange={(e) => update({ ukInstrumentType: e.target.value as UKInstrumentType })}
                >
                  <option value="SI">SI — Statutory Instrument (UK from 1947, Scot)</option>
                  <option value="SR & O">SR &amp; O — UK 1890–1947</option>
                  <option value="SR">SR — Northern Ireland</option>
                </select>
              </Field>
              <Field label="Instrument number">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2007/809"
                  value={fields.ukInstrumentNumber ?? ''}
                  onChange={(e) => update({ ukInstrumentNumber: e.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 6(1)"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'US' && category === 'case' && (
        <>
          <Field label="Report type">
            <select
              className={inputClass}
              value={reportType === 'reported' ? 'reported' : 'unreported'}
              onChange={(e) =>
                // The US has no medium-neutral-citation concept at all (r 25.1.7 is the one
                // unreported form) — 'unreported-no-mnc' is reused here purely as the internal
                // discriminant value; the dropdown itself only ever offers two options.
                update({ foreignCaseReportType: e.target.value === 'reported' ? 'reported' : 'unreported-no-mnc' })
              }
            >
              <option value="reported">Reported</option>
              <option value="unreported">Unreported</option>
            </select>
          </Field>

          <Field label="Case name">
            <input
              className={inputClass}
              type="text"
              placeholder="Roper v Simmons"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>

          {reportType === 'reported' ? (
            <>
              <Field label="Volume">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="543"
                  value={fields.volume ?? ''}
                  onChange={(e) => update({ volume: e.target.value })}
                />
              </Field>
              <Field label="Report series abbreviation">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="US"
                  value={fields.reportAbbreviation ?? ''}
                  onChange={(e) => update({ reportAbbreviation: e.target.value })}
                />
              </Field>
              <Field label="Series number" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2d"
                  value={fields.usSeriesNumber ?? ''}
                  onChange={(e) => update({ usSeriesNumber: e.target.value })}
                />
              </Field>
              <Field label="Starting page">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="551"
                  value={fields.startingPage ?? ''}
                  onChange={(e) => update({ startingPage: e.target.value })}
                />
              </Field>
              <Field label="Jurisdiction / court" optional>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Fla (leave blank for US Supreme Court)"
                  value={fields.usJurisdictionCourt ?? ''}
                  onChange={(e) => update({ usJurisdictionCourt: e.target.value })}
                />
              </Field>
              <Field label="Year">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="2005"
                  value={fields.year ?? ''}
                  onChange={(e) => update({ year: e.target.value })}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Jurisdiction and court/district">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="D Del, or Okla Ct Crim App"
                  value={fields.usJurisdictionCourt ?? ''}
                  onChange={(e) => update({ usJurisdictionCourt: e.target.value })}
                />
              </Field>
              <Field label="Docket or reference number">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Civ No 03-772-SLR"
                  value={fields.foreignCaseNumber ?? ''}
                  onChange={(e) => update({ foreignCaseNumber: e.target.value })}
                />
              </Field>
              <Field label="Full date">
                <input
                  className={inputClass}
                  type="text"
                  placeholder="6 April 2004"
                  value={fields.date ?? ''}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </Field>
            </>
          )}

          <Field label="Judge" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Kennedy J"
              value={fields.judge ?? ''}
              onChange={(e) => update({ judge: e.target.value })}
            />
          </Field>

          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder={reportType === 'reported' ? '567' : '7, or 3458, 3464'}
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
            {reportType !== 'reported' && (
              <span className="mt-1 block text-xs text-gray-400">
                Pinpoint appears after the literal &lsquo;slip op&rsquo; marker — no need to type it yourself.
              </span>
            )}
          </Field>
        </>
      )}

      {country === 'US' && category === 'legislation' && (
        <>
          <Field label="Statute title" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Federal Deposit Insurance Act"
              value={fields.usStatuteTitle ?? ''}
              onChange={(e) => update({ usStatuteTitle: e.target.value })}
            />
          </Field>
          <Field label="Original pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="§ 3"
              value={fields.usOriginalPinpoint ?? ''}
              onChange={(e) => update({ usOriginalPinpoint: e.target.value })}
            />
          </Field>
          <Field label="Title/chapter number in code" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="12"
              value={fields.usTitleOrChapterNumber ?? ''}
              onChange={(e) => update({ usTitleOrChapterNumber: e.target.value })}
            />
          </Field>
          <Field label="Code abbreviation">
            <input
              className={inputClass}
              type="text"
              placeholder="USC"
              value={fields.usCodeAbbrev ?? ''}
              onChange={(e) => update({ usCodeAbbrev: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint (section)">
            <input
              className={inputClass}
              type="text"
              placeholder="§§ 1811–35a"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
          <Field label="Publisher/editor" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="West"
              value={fields.usPublisherOrEditor ?? ''}
              onChange={(e) => update({ usPublisherOrEditor: e.target.value })}
            />
          </Field>
          <Field label="Year of code" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="2006"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'US' && category === 'legislationSessionLaw' && (
        <>
          <Field label="Statute title">
            <input
              className={inputClass}
              type="text"
              placeholder="Freedom to Display the American Flag Act of 2005"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Public/private law or chapter number">
            <input
              className={inputClass}
              type="text"
              placeholder="Pub L No 109-243"
              value={fields.usPublicLawNumber ?? ''}
              onChange={(e) => update({ usPublicLawNumber: e.target.value })}
            />
          </Field>
          <Field label="Original pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="§ 4"
              value={fields.usOriginalPinpoint ?? ''}
              onChange={(e) => update({ usOriginalPinpoint: e.target.value })}
            />
          </Field>
          <Field label="Volume or year">
            <input
              className={inputClass}
              type="text"
              placeholder="120"
              value={fields.usVolumeOrYear ?? ''}
              onChange={(e) => update({ usVolumeOrYear: e.target.value })}
            />
          </Field>
          <Field label="Abbreviated name">
            <input
              className={inputClass}
              type="text"
              placeholder="Stat"
              value={fields.usAbbreviatedName ?? ''}
              onChange={(e) => update({ usAbbreviatedName: e.target.value })}
            />
          </Field>
          <Field label="Starting page">
            <input
              className={inputClass}
              type="text"
              placeholder="572"
              value={fields.startingPage ?? ''}
              onChange={(e) => update({ startingPage: e.target.value })}
            />
          </Field>
          <Field label="Page pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="573 (a further page within the session laws volume, distinct from the original pinpoint above)"
              value={fields.usSessionLawPagePinpoint ?? ''}
              onChange={(e) => update({ usSessionLawPagePinpoint: e.target.value })}
            />
          </Field>
          <Field label="Year" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="2006 (leave blank if the volume/year field above already states it, eg for state session laws)"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'US' && category === 'constitution' && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="United States Constitution"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="art III § 2"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'HongKong' && category === 'legislation' && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Evidence Ordinance"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Chapter number" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="8 (leave blank and include the year in the title for un-numbered/historical ordinances)"
              value={fields.hkChapterNumber ?? ''}
              onChange={(e) => update({ hkChapterNumber: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 4"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'Malaysia' && category === 'legislation' && (
        <>
          <Field label="Act title">
            <input
              className={inputClass}
              type="text"
              placeholder="Copyright Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1987"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 7"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'Singapore' && category === 'legislation' && (
        <>
          <Field label="Act title">
            <input
              className={inputClass}
              type="text"
              placeholder="Adoption of Children Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Chapter number" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="4 (leave blank if no chapter number has been assigned)"
              value={fields.singaporeChapterNumber ?? ''}
              onChange={(e) => update({ singaporeChapterNumber: e.target.value })}
            />
          </Field>
          {fields.singaporeChapterNumber ? (
            <Field label="Revision year">
              <input
                className={inputClass}
                type="text"
                placeholder="1985"
                value={fields.singaporeRevisionYear ?? ''}
                onChange={(e) => update({ singaporeRevisionYear: e.target.value })}
              />
            </Field>
          ) : (
            <Field label="Year">
              <input
                className={inputClass}
                type="text"
                placeholder="1956"
                value={fields.year ?? ''}
                onChange={(e) => update({ year: e.target.value })}
              />
            </Field>
          )}
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="s 5"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {country === 'SouthAfrica' && category === 'legislation' && (
        <>
          <Field label="Act title">
            <input
              className={inputClass}
              type="text"
              placeholder="Local Government Transition Act"
              value={fields.title ?? ''}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              className={inputClass}
              type="text"
              placeholder="1993"
              value={fields.year ?? ''}
              onChange={(e) => update({ year: e.target.value })}
            />
          </Field>
          <Field label="Jurisdiction" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="South Africa"
              value={fields.southAfricaJurisdiction ?? ''}
              onChange={(e) => update({ southAfricaJurisdiction: e.target.value })}
            />
          </Field>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="ch 8"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
