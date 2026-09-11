import {
  BookFields,
  CaseFields,
  CitationFields,
  InternationalMaterialFields,
  JournalFields,
  LegislationFields,
  NewspaperFields,
  OtherLegislativeMaterialFields,
  OtherSourcesFields,
  ReportFields,
  ResearchPaperFields,
  SourceType,
  WebsiteFields,
} from '../citation-engine/types'
import { AutofillFields } from './types'

/**
 * A source-type-agnostic bag of the handful of concepts most citation types share (a title, its
 * author(s), a year/date, a pinpoint, a URL) — the intermediate step for reclassifying an
 * already-filled-in citation to a different source type when a student clicks a different tab
 * (eg the app guessed 'journal' but it's actually a book chapter). Deliberately much smaller than
 * any one source type's own field set: only fields with an obvious equivalent across types are
 * carried over, everything else is left for the student to fill in against the newly-selected
 * type's own template.
 */
interface CanonicalFields {
  title?: string
  authors?: string[]
  year?: string
  date?: string
  pinpoint?: string
  url?: string
  footnoteNumber?: string
  shortTitle?: string
}

function yearFromDate(date?: string): string | undefined {
  return date?.match(/\d{4}/)?.[0]
}

function toCanonical(type: SourceType, fields: CitationFields): CanonicalFields {
  switch (type) {
    case 'case': {
      const f = fields as CaseFields
      return { title: f.caseName, year: f.year, pinpoint: f.pinpoint, footnoteNumber: f.footnoteNumber, shortTitle: f.shortTitle }
    }
    case 'legislation': {
      const f = fields as LegislationFields
      return { title: f.actTitle, year: f.year, pinpoint: f.pinpointValue }
    }
    case 'journal': {
      const f = fields as JournalFields
      return {
        title: f.articleTitle,
        authors: f.authors,
        year: f.year,
        pinpoint: f.pinpoint,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'book': {
      const f = fields as BookFields
      // A chapter's own title/author(s) are the more specific, article-like concept to carry
      // over — the whole book's title has nowhere sensible to go in most other source types.
      const isChapter = f.bookType === 'chapter'
      return {
        title: isChapter ? f.chapterTitle : f.title,
        authors: isChapter ? f.chapterAuthors : f.authors,
        year: f.year,
        pinpoint: (isChapter ? f.pinpoint || f.startingPage : f.pinpoint) ?? undefined,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'report': {
      const f = fields as ReportFields
      return {
        title: f.title,
        authors: f.authors,
        date: f.date,
        url: f.url,
        pinpoint: f.pinpoint,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'researchPaper': {
      const f = fields as ResearchPaperFields
      return {
        title: f.title,
        authors: f.authors,
        date: f.date,
        pinpoint: f.pinpoint,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'website': {
      const f = fields as WebsiteFields
      return {
        title: f.documentTitle,
        authors: f.authors,
        date: f.date,
        url: f.url,
        pinpoint: f.pinpoint,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'newspaper': {
      const f = fields as NewspaperFields
      return {
        title: f.articleTitle,
        authors: f.authors,
        date: f.date,
        url: f.url,
        pinpoint: f.pinpoint,
        footnoteNumber: f.footnoteNumber,
        shortTitle: f.shortTitle,
      }
    }
    case 'otherLegislativeMaterial': {
      const f = fields as OtherLegislativeMaterialFields
      const title =
        f.subtype === 'bill' || f.subtype === 'explanatoryMaterial'
          ? f.billTitle
          : f.subtype === 'gazette'
            ? f.gazetteArticleTitle || f.gazetteName
            : f.subtype === 'practiceDirection'
              ? f.practiceTitle
              : f.constitutionTitle
      const year =
        f.subtype === 'bill' || f.subtype === 'explanatoryMaterial'
          ? f.billYear
          : f.subtype === 'constitution'
            ? f.constitutionYear
            : undefined
      return { title, year, pinpoint: f.pinpoint, footnoteNumber: f.footnoteNumber, shortTitle: f.shortTitle }
    }
    case 'internationalMaterial': {
      const f = fields as InternationalMaterialFields
      // The three subtypes' own "date" concept lives in a different field each — pick whichever
      // one the current subtype actually uses. Switching between the treaty and unDocument
      // subtypes specifically is expected to be *the* common correction this mapping needs to
      // support, since both commonly turn up on near-identical instrument-listing pages and the
      // app's own classification can guess wrong between them.
      const date =
        f.subtype === 'treaty'
          ? f.openedForSignature || f.signedDate
          : f.subtype === 'unDocument'
            ? f.date
            : f.year
      return { title: f.title, date, pinpoint: f.pinpoint, footnoteNumber: f.footnoteNumber, shortTitle: f.shortTitle }
    }
    case 'otherSources': {
      const f = fields as OtherSourcesFields
      const title =
        f.subtype === 'dictionary'
          ? f.dictionaryEntryTitle
          : f.subtype === 'legalEncyclopedia'
            ? f.encyclopediaChapterName
            : f.subtype === 'speech'
              ? f.speechTitle
              : f.subtype === 'pressRelease'
                ? f.pressReleaseTitle
                : f.subtype === 'abs'
                  ? f.absTitle
                  : f.subtype === 'filmOrMedia'
                    ? f.mediaEpisodeTitle || f.mediaTitle
                    : f.socialMediaTitle
      const authors =
        f.subtype === 'speech' && f.speechAuthor
          ? [f.speechAuthor]
          : f.subtype === 'pressRelease' && f.pressReleaseAuthor
            ? [f.pressReleaseAuthor]
            : undefined
      const date =
        f.subtype === 'speech'
          ? f.speechDate
          : f.subtype === 'pressRelease'
            ? f.pressReleaseDate
            : f.subtype === 'abs'
              ? f.absDate
              : f.subtype === 'filmOrMedia'
                ? f.mediaDate
                : f.subtype === 'socialMedia'
                  ? f.socialMediaDate
                  : f.subtype === 'dictionary'
                    ? f.dictionaryYear
                    : undefined
      const url = f.subtype === 'filmOrMedia' ? f.mediaUrl : f.subtype === 'socialMedia' ? f.socialMediaUrl : undefined
      return { title, authors, date, url, pinpoint: f.pinpoint, footnoteNumber: f.footnoteNumber, shortTitle: f.shortTitle }
    }
  }
}

function fromCanonical(type: SourceType, c: CanonicalFields): AutofillFields {
  // A date-only field falls back to a bare year (and vice versa) — an established convention
  // elsewhere in this app (see ai-extract.ts's report-date guidance): a bare year alone is an
  // acceptable, if less precise, value wherever a fuller date would otherwise go.
  const dateOrYear = c.date || c.year
  const yearOnly = c.year || yearFromDate(c.date)

  switch (type) {
    case 'case':
      return {
        caseName: c.title,
        year: yearOnly,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<CaseFields>
    case 'legislation':
      return { actTitle: c.title, year: yearOnly, pinpointValue: c.pinpoint } satisfies Partial<LegislationFields>
    case 'journal':
      return {
        articleTitle: c.title,
        authors: c.authors,
        year: yearOnly,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<JournalFields>
    case 'book':
      return {
        title: c.title,
        authors: c.authors,
        year: yearOnly,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<BookFields>
    case 'report':
      return {
        title: c.title,
        authors: c.authors,
        date: dateOrYear,
        url: c.url,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<ReportFields>
    case 'researchPaper':
      return {
        title: c.title,
        authors: c.authors,
        date: dateOrYear,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<ResearchPaperFields>
    case 'website':
      return {
        documentTitle: c.title,
        authors: c.authors,
        date: dateOrYear,
        url: c.url,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<WebsiteFields>
    case 'newspaper':
      return {
        articleTitle: c.title,
        authors: c.authors,
        date: dateOrYear,
        url: c.url,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<NewspaperFields>
    case 'otherLegislativeMaterial':
      return {
        billTitle: c.title,
        billYear: yearOnly,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<OtherLegislativeMaterialFields>
    case 'internationalMaterial':
      // subtype deliberately omitted — it's a CLASSIFICATION_KEYS field in Generator.tsx, so it
      // always resets to the blank template's default rather than carrying over from wherever the
      // student was. Both openedForSignature and date are set regardless of which subtype that
      // default turns out to be, so the fields already look right immediately if the student
      // manually flips the subtype selector afterwards, without needing a fresh autofill.
      return {
        title: c.title,
        openedForSignature: c.date,
        date: dateOrYear,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<InternationalMaterialFields>
    case 'otherSources':
      // subtype deliberately omitted, same reasoning as internationalMaterial above — it's a
      // CLASSIFICATION_KEYS field in Generator.tsx. The canonical title/date/author/url are
      // broadcast into every subtype's own primary field (not just the blank template's default
      // subtype) so the fields already look right immediately if the student manually flips the
      // subtype selector afterwards, without needing a fresh autofill — the same trick
      // internationalMaterial's openedForSignature+date dual-set uses, just extended to more
      // subtypes since there are more of them here.
      return {
        dictionaryEntryTitle: c.title,
        dictionaryYear: yearOnly,
        speechTitle: c.title,
        speechDate: dateOrYear,
        speechAuthor: c.authors?.[0],
        pressReleaseTitle: c.title,
        pressReleaseDate: dateOrYear,
        pressReleaseAuthor: c.authors?.[0],
        absTitle: c.title,
        absDate: dateOrYear,
        mediaEpisodeTitle: c.title,
        mediaDate: dateOrYear,
        mediaUrl: c.url,
        socialMediaTitle: c.title,
        socialMediaDate: dateOrYear,
        socialMediaUrl: c.url,
        pinpoint: c.pinpoint,
        footnoteNumber: c.footnoteNumber,
        shortTitle: c.shortTitle,
      } satisfies Partial<OtherSourcesFields>
  }
}

/**
 * Best-effort carryover of whatever a student has already filled in when they switch source
 * types directly (via the tab selector, not a fresh autofill) — most commonly because the app
 * guessed wrong (eg detected 'journal' for something that's actually a book chapter) and the
 * student corrects it by hand. Only concepts with an obvious equivalent in the target type move
 * across (title, authors, year/date, pinpoint, url); everything else starts from that type's own
 * blank template, same as a fresh autofill. Field-level protection for anything the student has
 * already typed into the *target* type is applied by the caller via mergeAutofillFields, exactly
 * as it is for a real autofill result.
 */
export function mapFieldsAcrossSourceType(fromType: SourceType, fromFields: CitationFields, toType: SourceType): AutofillFields {
  return fromCanonical(toType, toCanonical(fromType, fromFields))
}
