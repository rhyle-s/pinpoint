'use client'

import { FilmMediaFormat, OtherSourcesFields, OtherSourcesSubtype } from '@/lib/citation-engine/types'

interface OtherSourcesFormProps {
  fields: OtherSourcesFields
  onChange: (fields: OtherSourcesFields) => void
}

const SUBTYPES: { value: OtherSourcesSubtype; label: string }[] = [
  { value: 'dictionary', label: 'Dictionary' },
  { value: 'legalEncyclopedia', label: 'Legal Encyclopedia' },
  { value: 'speech', label: 'Speech' },
  { value: 'pressRelease', label: 'Press / Media Release' },
  { value: 'abs', label: 'Australian Bureau of Statistics Materials' },
  { value: 'filmOrMedia', label: 'Film, Television and Other Media' },
  { value: 'socialMedia', label: 'Social Media Post' },
]

const MEDIA_FORMATS: { value: FilmMediaFormat; label: string }[] = [
  { value: 'film', label: 'Film / audiovisual recording' },
  { value: 'tvSeries', label: 'Television series' },
  { value: 'radioOrPodcast', label: 'Radio segment / podcast' },
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

export default function OtherSourcesForm({ fields, onChange }: OtherSourcesFormProps) {
  function update(patch: Partial<OtherSourcesFields>) {
    onChange({ ...fields, ...patch })
  }

  return (
    <div className="space-y-5">
      <Field label="Source type">
        <select
          className={inputClass}
          value={fields.subtype}
          onChange={(e) => update({ subtype: e.target.value as OtherSourcesSubtype })}
        >
          {SUBTYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {fields.subtype === 'dictionary' && (
        <>
          <Field label="Dictionary title">
            <input
              className={inputClass}
              type="text"
              placeholder="Macquarie Dictionary"
              value={fields.dictionaryTitle ?? ''}
              onChange={(e) => update({ dictionaryTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Edition" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="5th ed"
                value={fields.dictionaryEdition ?? ''}
                onChange={(e) => update({ dictionaryEdition: e.target.value })}
              />
            </Field>
            <Field label="Year" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="2009"
                value={fields.dictionaryYear ?? ''}
                onChange={(e) => update({ dictionaryYear: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Retrieval date (online dictionary only)" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Leave blank for a hard-copy dictionary — 20 February 2018"
              value={fields.dictionaryRetrievalDate ?? ''}
              onChange={(e) => update({ dictionaryRetrievalDate: e.target.value })}
            />
          </Field>
          <Field label="Entry (word/phrase defined)">
            <input
              className={inputClass}
              type="text"
              placeholder="demise"
              value={fields.dictionaryEntryTitle ?? ''}
              onChange={(e) => update({ dictionaryEntryTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entry abbreviation" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="v2"
                value={fields.dictionaryEntryAbbrev ?? ''}
                onChange={(e) => update({ dictionaryEntryAbbrev: e.target.value })}
              />
            </Field>
            <Field label="Definition number" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="4"
                value={fields.dictionaryDefNumber ?? ''}
                onChange={(e) => update({ dictionaryDefNumber: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}

      {fields.subtype === 'legalEncyclopedia' && (
        <>
          <Field label="Publisher">
            <input
              className={inputClass}
              type="text"
              placeholder="LexisNexis"
              value={fields.encyclopediaPublisher ?? ''}
              onChange={(e) => update({ encyclopediaPublisher: e.target.value })}
            />
          </Field>
          <Field label="Encyclopedia title">
            <input
              className={inputClass}
              type="text"
              placeholder="Halsbury's Laws of Australia"
              value={fields.encyclopediaTitle ?? ''}
              onChange={(e) => update({ encyclopediaTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Volume (hard copy)" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="15"
                value={fields.encyclopediaVolume ?? ''}
                onChange={(e) => update({ encyclopediaVolume: e.target.value })}
              />
            </Field>
            <Field label="At date (hard copy)" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="25 May 2009"
                value={fields.encyclopediaAtDate ?? ''}
                onChange={(e) => update({ encyclopediaAtDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Retrieval date (online only)" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Leave blank for a hard-copy encyclopedia — 15 February 2018"
              value={fields.encyclopediaRetrievalDate ?? ''}
              onChange={(e) => update({ encyclopediaRetrievalDate: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title number" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="235 — some encyclopedias don't number titles"
                value={fields.encyclopediaTitleNumber ?? ''}
                onChange={(e) => update({ encyclopediaTitleNumber: e.target.value })}
              />
            </Field>
            <Field label="Title name">
              <input
                className={inputClass}
                type="text"
                placeholder="Insurance"
                value={fields.encyclopediaTitleName ?? ''}
                onChange={(e) => update({ encyclopediaTitleName: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Chapter number">
              <input
                className={inputClass}
                type="text"
                placeholder="2"
                value={fields.encyclopediaChapterNumber ?? ''}
                onChange={(e) => update({ encyclopediaChapterNumber: e.target.value })}
              />
            </Field>
            <Field label="Chapter name">
              <input
                className={inputClass}
                type="text"
                placeholder="General Principles"
                value={fields.encyclopediaChapterName ?? ''}
                onChange={(e) => update({ encyclopediaChapterName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Paragraph">
            <input
              className={inputClass}
              type="text"
              placeholder="235-270"
              value={fields.encyclopediaParagraph ?? ''}
              onChange={(e) => update({ encyclopediaParagraph: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'speech' && (
        <>
          <Field label="Author (speaker)">
            <input
              className={inputClass}
              type="text"
              placeholder="Justice Dyson Heydon"
              value={fields.speechAuthor ?? ''}
              onChange={(e) => update({ speechAuthor: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Threats to Judicial Independence: The Enemy Within"
              value={fields.speechTitle ?? ''}
              onChange={(e) => update({ speechTitle: e.target.value })}
            />
          </Field>
          <Field label="Label" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Speech — or a named lecture, eg 'Lucinda Lecture' ('The' and any ordinal number stripped)"
              value={fields.speechLabel ?? ''}
              onChange={(e) => update({ speechLabel: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Institution / forum">
              <input
                className={inputClass}
                type="text"
                placeholder="Inner Temple — or the city/town if no forum is named"
                value={fields.speechForum ?? ''}
                onChange={(e) => update({ speechForum: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="23 January 2012"
                value={fields.speechDate ?? ''}
                onChange={(e) => update({ speechDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'pressRelease' && (
        <>
          <Field label="Author">
            <input
              className={inputClass}
              type="text"
              placeholder="Department of Defence (Cth)"
              value={fields.pressReleaseAuthor ?? ''}
              onChange={(e) => update({ pressReleaseAuthor: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Highest East Timorese Honour for Army Officers"
              value={fields.pressReleaseTitle ?? ''}
              onChange={(e) => update({ pressReleaseTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Release type" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Media Release (default)"
                value={fields.pressReleaseType ?? ''}
                onChange={(e) => update({ pressReleaseType: e.target.value })}
              />
            </Field>
            <Field label="Document number" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="MSPA 172/09"
                value={fields.pressReleaseDocumentNumber ?? ''}
                onChange={(e) => update({ pressReleaseDocumentNumber: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Releasing body" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Leave blank if identical to the author"
                value={fields.pressReleaseBody ?? ''}
                onChange={(e) => update({ pressReleaseBody: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="22 May 2009"
                value={fields.pressReleaseDate ?? ''}
                onChange={(e) => update({ pressReleaseDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'abs' && (
        <>
          <Field label="Title">
            <input
              className={inputClass}
              type="text"
              placeholder="Corrective Services, Australia, September Quarter 2017"
              value={fields.absTitle ?? ''}
              onChange={(e) => update({ absTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catalogue number">
              <input
                className={inputClass}
                type="text"
                placeholder="4512.0"
                value={fields.absCatalogueNumber ?? ''}
                onChange={(e) => update({ absCatalogueNumber: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="30 November 2017"
                value={fields.absDate ?? ''}
                onChange={(e) => update({ absDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pinpoint" optional>
            <input
              className={inputClass}
              type="text"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'filmOrMedia' && (
        <>
          <Field label="Format">
            <select
              className={inputClass}
              value={fields.mediaFormat ?? 'film'}
              onChange={(e) => update({ mediaFormat: e.target.value as FilmMediaFormat })}
            >
              {MEDIA_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Episode / segment title" optional>
            <input
              className={inputClass}
              type="text"
              placeholder={
                fields.mediaFormat === 'tvSeries'
                  ? "The episode's own title, or the literal text 'Season 9, Episode 10' / 'Episode 10' if it has none — omit entirely for a film"
                  : "The episode's own title, exactly as on the source — omit entirely for a film"
              }
              value={fields.mediaEpisodeTitle ?? ''}
              onChange={(e) => update({ mediaEpisodeTitle: e.target.value })}
            />
          </Field>
          <Field label="Film / series title">
            <input
              className={inputClass}
              type="text"
              placeholder="Four Corners"
              value={fields.mediaTitle ?? ''}
              onChange={(e) => update({ mediaTitle: e.target.value })}
            />
          </Field>
          <Field label="Version details" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Leave blank for the standard/theatrical version — eg Director's Cut"
              value={fields.mediaVersionDetails ?? ''}
              onChange={(e) => update({ mediaVersionDetails: e.target.value })}
            />
          </Field>
          <Field label="Studio / production company / producer">
            <input
              className={inputClass}
              type="text"
              placeholder="Australian Broadcasting Corporation"
              value={fields.mediaStudio ?? ''}
              onChange={(e) => update({ mediaStudio: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder={fields.mediaFormat === 'radioOrPodcast' ? 'Full date — 18 February 2016' : 'Year — 2017'}
                value={fields.mediaDate ?? ''}
                onChange={(e) => update({ mediaDate: e.target.value })}
              />
            </Field>
            <Field label="Pinpoint (point in time / time span)" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="0:54:58–0:55:11"
                value={fields.pinpoint ?? ''}
                onChange={(e) => update({ pinpoint: e.target.value })}
              />
            </Field>
          </div>
          <Field label="URL" optional>
            <input
              className={inputClass}
              type="text"
              value={fields.mediaUrl ?? ''}
              onChange={(e) => update({ mediaUrl: e.target.value })}
            />
          </Field>
        </>
      )}

      {fields.subtype === 'socialMedia' && (
        <>
          <Field label="Username">
            <input
              className={inputClass}
              type="text"
              placeholder="@s_m_stephenson"
              value={fields.socialMediaUsername ?? ''}
              onChange={(e) => update({ socialMediaUsername: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Real name" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Only if not already clear from the username"
                value={fields.socialMediaRealName ?? ''}
                onChange={(e) => update({ socialMediaRealName: e.target.value })}
              />
            </Field>
            <Field label="Title" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="Leave blank if the post has no title"
                value={fields.socialMediaTitle ?? ''}
                onChange={(e) => update({ socialMediaTitle: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Platform">
            <input
              className={inputClass}
              type="text"
              placeholder="Twitter"
              value={fields.socialMediaPlatform ?? ''}
              onChange={(e) => update({ socialMediaPlatform: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date">
              <input
                className={inputClass}
                type="text"
                placeholder="17 July 2017"
                value={fields.socialMediaDate ?? ''}
                onChange={(e) => update({ socialMediaDate: e.target.value })}
              />
            </Field>
            <Field label="Time" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="9:37pm"
                value={fields.socialMediaTime ?? ''}
                onChange={(e) => update({ socialMediaTime: e.target.value })}
              />
            </Field>
            <Field label="Time zone" optional>
              <input
                className={inputClass}
                type="text"
                placeholder="AEST"
                value={fields.socialMediaTimeZone ?? ''}
                onChange={(e) => update({ socialMediaTimeZone: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Pinpoint (point in time / time span)" optional>
            <input
              className={inputClass}
              type="text"
              value={fields.pinpoint ?? ''}
              onChange={(e) => update({ pinpoint: e.target.value })}
            />
          </Field>
          <Field label="URL">
            <input
              className={inputClass}
              type="text"
              value={fields.socialMediaUrl ?? ''}
              onChange={(e) => update({ socialMediaUrl: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
