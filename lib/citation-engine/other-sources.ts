import { CitationResult, OtherSourcesFields } from './types'
import { formatAboveN } from './subsequent'
import { ensureFullStop, italicize, joinParts, lastName, quote, stripTrailingFullStop } from './utils'

/** Bare pinpoint with a leading space and no comma — the convention every subtype in this file
 *  uses (matching a report/whole-book/research-paper pinpoint), never the comma-prefixed style a
 *  case's pinpoint-after-starting-page needs. */
function barePinpoint(pinpoint?: string): string {
  return pinpoint ? ` ${pinpoint.trim()}` : ''
}

/**
 * r 7.6 — hard copy: [Italic Dictionary Title] (Edition ed, Year) 'Entry' (def N). Online:
 * [Italic Dictionary Title] (online at RetrievalDate) 'Entry' (def N). Confirmed by inspecting the
 * AGLC4 PDF's own font data (not just its plain text, which loses italics) that the dictionary
 * title is italicised in every one of r 7.6's five worked examples — 'Entry' is explicitly called
 * out as '(unitalicised)' by the rule text itself, by contrast.
 */
function formatDictionary(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const titleItalic = italicize(fields.dictionaryTitle ?? '')
  const currency = fields.dictionaryRetrievalDate
    ? `online at ${fields.dictionaryRetrievalDate.trim()}`
    : joinParts([fields.dictionaryEdition, fields.dictionaryYear], ', ')
  const titleAndCurrency = `${titleItalic} (${currency})`

  const entryQuoted = quote(fields.dictionaryEntryTitle ?? '')
  const defParenInner = joinParts(
    [fields.dictionaryEntryAbbrev, fields.dictionaryDefNumber ? `def ${fields.dictionaryDefNumber.trim()}` : undefined],
    ', ',
  )
  const entryPart = defParenInner ? `${entryQuoted} (${defParenInner})` : entryQuoted

  const core = `${titleAndCurrency} ${entryPart}`
  return { footnote: ensureFullStop(core), bibliography: stripTrailingFullStop(core) }
}

/**
 * r 7.7 — hard copy: Publisher, [Italic Title of Encyclopedia], vol N (at Date) TitleNumber Name
 * of Title, 'ChapterNumber Name of Chapter' [Paragraph]. Online: Publisher, [Italic Title] (online
 * at RetrievalDate) TitleNumber Name of Title, 'ChapterNumber Name of Chapter' [Paragraph]. Note
 * the punctuation differs between the two forms — hard copy takes a comma before 'vol', online
 * takes none before '(online at ...)' — confirmed against the PDF's own font data and all three of
 * r 7.7's worked examples, including one (Halsbury's Laws of England) that has no title number at
 * all, which some encyclopedias simply don't use.
 */
function formatLegalEncyclopedia(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const titleItalic = italicize(fields.encyclopediaTitle ?? '')
  const titleSegment = fields.encyclopediaRetrievalDate
    ? `${titleItalic} (online at ${fields.encyclopediaRetrievalDate.trim()})`
    : joinParts([
        `${titleItalic},`,
        fields.encyclopediaVolume ? `vol ${fields.encyclopediaVolume.trim()}` : undefined,
        fields.encyclopediaAtDate ? `(at ${fields.encyclopediaAtDate.trim()})` : undefined,
      ])

  const titleNumAndName = joinParts([fields.encyclopediaTitleNumber, fields.encyclopediaTitleName])
  const chapter = quote(joinParts([fields.encyclopediaChapterNumber, fields.encyclopediaChapterName]))
  const paragraph = fields.encyclopediaParagraph ? ` [${fields.encyclopediaParagraph.trim()}]` : ''

  const publisherPrefix = fields.encyclopediaPublisher ? `${fields.encyclopediaPublisher}, ` : ''
  const core = `${publisherPrefix}${titleSegment} ${titleNumAndName}, ${chapter}${paragraph}`
  return { footnote: ensureFullStop(core), bibliography: stripTrailingFullStop(core) }
}

/** r 7.3 — Author, 'Title' (Speech (or named lecture), Institution/Forum, Full Date) Pinpoint. */
function formatSpeech(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const label = fields.speechLabel || 'Speech'
  const parenthetical = `(${joinParts([label, fields.speechForum, fields.speechDate], ', ')})`
  const authorPrefix = fields.speechAuthor ? `${fields.speechAuthor}, ` : ''
  const core = `${authorPrefix}${quote(fields.speechTitle ?? '')} ${parenthetical}`
  return { footnote: ensureFullStop(`${core}${barePinpoint(fields.pinpoint)}`), bibliography: stripTrailingFullStop(core) }
}

/**
 * r 7.4 — Author, 'Title' (ReleaseType DocumentNumber, Body, Full Date) Pinpoint. The release
 * type and document number are space-joined inside the brackets (eg 'Media Release MSPA 172/09'),
 * not comma-joined like every other element here — confirmed against r 7.4's own worked examples.
 * The releasing body is omitted whenever it's the same as the author, per the rule text.
 */
function formatPressRelease(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const releaseType = fields.pressReleaseType || 'Media Release'
  const releaseTypeAndNumber = joinParts([releaseType, fields.pressReleaseDocumentNumber])
  const author = (fields.pressReleaseAuthor ?? '').trim()
  const body =
    fields.pressReleaseBody && fields.pressReleaseBody.trim().toLowerCase() !== author.toLowerCase()
      ? fields.pressReleaseBody
      : undefined
  const parenthetical = `(${joinParts([releaseTypeAndNumber, body, fields.pressReleaseDate], ', ')})`
  const authorPrefix = author ? `${author}, ` : ''
  const core = `${authorPrefix}${quote(fields.pressReleaseTitle ?? '')} ${parenthetical}`
  return { footnote: ensureFullStop(`${core}${barePinpoint(fields.pinpoint)}`), bibliography: stripTrailingFullStop(core) }
}

const ABS_AUTHOR = 'Australian Bureau of Statistics'

/** r 7.1.5 — Australian Bureau of Statistics, [Italic Title] (Catalogue No N, Full Date) Pinpoint.
 *  The author is always the fixed literal string above, per the rule text — never student-entered. */
function formatABS(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const titleItalic = italicize(fields.absTitle ?? '')
  const catalogue = fields.absCatalogueNumber ? `Catalogue No ${fields.absCatalogueNumber.trim()}` : 'Catalogue'
  const parenthetical = `(${joinParts([catalogue, fields.absDate], ', ')})`
  const core = `${ABS_AUTHOR}, ${titleItalic} ${parenthetical}`
  return { footnote: ensureFullStop(`${core}${barePinpoint(fields.pinpoint)}`), bibliography: stripTrailingFullStop(core) }
}

/**
 * r 7.14 — ['Episode Title', ][Italic Film/Series Title] (Version Details, Studio/Production
 * Company/Producer, Date) Pinpoint <URL>. One flattened shape covers all three sub-rules (films
 * r 7.14.2, TV r 7.14.3, radio/podcasts r 7.14.4) — mediaFormat only changes what a student should
 * type into mediaEpisodeTitle/mediaDate (see types.ts), not this function's own structure, which
 * is identical across all three per r 7.14.1's general rule and confirmed against every one of
 * r 7.14's worked examples (films have no episode title; TV/radio/podcasts do).
 */
function formatFilmOrMedia(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const episodePrefix = fields.mediaEpisodeTitle ? `${quote(fields.mediaEpisodeTitle)}, ` : ''
  const titleItalic = italicize(fields.mediaTitle ?? '')
  const parenthetical = `(${joinParts([fields.mediaVersionDetails, fields.mediaStudio, fields.mediaDate], ', ')})`
  const urlPart = fields.mediaUrl ? ` <${fields.mediaUrl}>` : ''
  const core = `${episodePrefix}${titleItalic} ${parenthetical}`
  return {
    footnote: ensureFullStop(`${core}${barePinpoint(fields.pinpoint)}${urlPart}`),
    bibliography: stripTrailingFullStop(`${core}${urlPart}`),
  }
}

/**
 * r 7.16 — Username[ (Real Name)][, 'Title'] (Platform, Full Date[, Time][ TimeZone]) Pinpoint
 * <URL>. Confirmed against all three worked examples, including one with no title at all (the
 * title element is dropped entirely, not left as an empty quoted string) and one with a time and
 * time zone but no real name.
 */
function formatSocialMedia(fields: OtherSourcesFields): { footnote: string; bibliography: string } {
  const realNameSuffix = fields.socialMediaRealName ? ` (${fields.socialMediaRealName.trim()})` : ''
  const usernameCore = `${fields.socialMediaUsername ?? ''}${realNameSuffix}`
  const titlePart = fields.socialMediaTitle ? `, ${quote(fields.socialMediaTitle)}` : ''

  const dateTimeCore = joinParts([fields.socialMediaDate, fields.socialMediaTime], ', ')
  const dateTimePart = fields.socialMediaTimeZone ? `${dateTimeCore} ${fields.socialMediaTimeZone.trim()}` : dateTimeCore
  const parenthetical = `(${joinParts([fields.socialMediaPlatform, dateTimePart], ', ')})`

  const urlPart = fields.socialMediaUrl ? ` <${fields.socialMediaUrl}>` : ''
  const core = `${usernameCore}${titlePart} ${parenthetical}`
  return {
    footnote: ensureFullStop(`${core}${barePinpoint(fields.pinpoint)}${urlPart}`),
    bibliography: stripTrailingFullStop(`${core}${urlPart}`),
  }
}

/** The UI badge naming which of the seven sub-categories was detected/selected. */
export function otherSourcesBadge(fields: OtherSourcesFields): string {
  switch (fields.subtype) {
    case 'dictionary':
      return 'Dictionary'
    case 'legalEncyclopedia':
      return 'Legal Encyclopedia'
    case 'speech':
      return 'Speech'
    case 'pressRelease':
      return 'Press/Media Release'
    case 'abs':
      return 'ABS Materials'
    case 'filmOrMedia':
      return fields.mediaFormat === 'tvSeries'
        ? 'Television'
        : fields.mediaFormat === 'radioOrPodcast'
          ? 'Radio/Podcast'
          : 'Film/Other Media'
    case 'socialMedia':
      return 'Social Media Post'
  }
}

export function generateOtherSourcesCitation(fields: OtherSourcesFields): CitationResult {
  const footnoteNumber = fields.footnoteNumber || '1'

  const { footnote, bibliography, subsequent } = (() => {
    switch (fields.subtype) {
      case 'dictionary': {
        const { footnote, bibliography } = formatDictionary(fields)
        // A dictionary's short reference is to the dictionary itself, not the specific word
        // looked up in the first reference — matching how a whole book's subsequent reference
        // uses the book's own title, not whichever page/chapter was first cited.
        const shortTitle = italicize(fields.shortTitle || fields.dictionaryTitle || '')
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber) }
      }
      case 'legalEncyclopedia': {
        const { footnote, bibliography } = formatLegalEncyclopedia(fields)
        const shortTitle = italicize(fields.shortTitle || fields.encyclopediaTitle || '')
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber) }
      }
      case 'speech': {
        const { footnote, bibliography } = formatSpeech(fields)
        // A speech's author is always a named individual (never an organisation, unlike a press
        // release below) — matching research-papers.ts/websites.ts's own convention, the
        // subsequent reference is prefixed with just their surname, not the full footnote-style
        // author string. Confirmed against the AI validator's own independent correction of an
        // earlier version of this formatter (which had no author prefix here at all).
        const surname = fields.speechAuthor ? lastName(fields.speechAuthor) : ''
        const shortTitle = `${surname ? `${surname}, ` : ''}${quote(fields.shortTitle || fields.speechTitle || '')}`
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber, fields.pinpoint) }
      }
      case 'pressRelease': {
        const { footnote, bibliography } = formatPressRelease(fields)
        // Unlike a speech, a press release's author is usually an organisation (eg 'Department of
        // Defence (Cth)', 'ASX') — reducing that to a "surname" would produce nonsense (eg
        // '(Cth), ...'), so this reuses the full author string unabbreviated, matching reports.ts's
        // own convention for its own typically-organisational authors.
        const shortTitle = `${fields.pressReleaseAuthor ? `${fields.pressReleaseAuthor}, ` : ''}${quote(fields.shortTitle || fields.pressReleaseTitle || '')}`
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber, fields.pinpoint) }
      }
      case 'abs': {
        const { footnote, bibliography } = formatABS(fields)
        const shortTitle = `${ABS_AUTHOR}, ${italicize(fields.shortTitle || fields.absTitle || '')}`
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber, fields.pinpoint) }
      }
      case 'filmOrMedia': {
        const { footnote, bibliography } = formatFilmOrMedia(fields)
        // An episode/segment (quoted) is the more specific, citable identifier when one exists —
        // same reasoning as a book chapter's own title being the short reference, not the whole
        // book's — falling back to the film/series title (italicised) when there's no episode.
        const wrap = fields.mediaEpisodeTitle ? quote : italicize
        const shortTitle = wrap(fields.shortTitle || fields.mediaEpisodeTitle || fields.mediaTitle || '')
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber, fields.pinpoint) }
      }
      case 'socialMedia': {
        const { footnote, bibliography } = formatSocialMedia(fields)
        const shortTitle = fields.socialMediaTitle
          ? `${fields.socialMediaUsername ?? ''}, ${quote(fields.shortTitle || fields.socialMediaTitle)}`
          : (fields.socialMediaUsername ?? '')
        return { footnote, bibliography, subsequent: formatAboveN(shortTitle, footnoteNumber, fields.pinpoint) }
      }
    }
  })()

  return {
    footnote,
    subsequent,
    bibliography,
    sourceType: 'otherSources',
    validationStatus: 'unvalidated',
  }
}
