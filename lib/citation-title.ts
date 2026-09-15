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
} from '@/lib/citation-engine/types'

/**
 * Extracts "the title" of a source from its saved fields — used for duplicate-detection and for
 * the Library page's "Title (A–Z)" sort, not anywhere in the citation engine itself. Every source
 * type names its title field differently (caseName, actTitle, articleTitle, documentTitle, ...),
 * and a few (otherLegislativeMaterial, otherSources) are umbrella types where the right field also
 * depends on the subtype. Returns undefined for the handful of otherSources subtypes with no single
 * clean title field (dictionary entries, legal encyclopedia chapters) — callers should treat that
 * as "can't reliably say", not silently fall back to something looser.
 */
export function getCitationTitle(sourceType: SourceType, fields: CitationFields): string | undefined {
  switch (sourceType) {
    case 'case':
      return (fields as CaseFields).caseName
    case 'legislation':
      return (fields as LegislationFields).actTitle
    case 'journal':
      return (fields as JournalFields).articleTitle
    case 'book': {
      const f = fields as BookFields
      return f.bookType === 'chapter' ? f.chapterTitle : f.title
    }
    case 'report':
      return (fields as ReportFields).title
    case 'researchPaper':
      return (fields as ResearchPaperFields).title
    case 'website':
      return (fields as WebsiteFields).documentTitle
    case 'newspaper':
      return (fields as NewspaperFields).articleTitle
    case 'otherLegislativeMaterial': {
      const f = fields as OtherLegislativeMaterialFields
      switch (f.subtype) {
        case 'bill':
        case 'explanatoryMaterial':
          return f.billTitle
        case 'gazette':
          // A specific-notice citation has its own title; a whole-gazette-issue citation doesn't,
          // so the gazette's own name is the closest thing to "the title" in that case.
          return f.gazetteArticleTitle || f.gazetteName
        case 'practiceDirection':
          return f.practiceTitle
        case 'constitution':
          return f.constitutionTitle
        default:
          return undefined
      }
    }
    case 'internationalMaterial':
      // Shared by treaty/unDocument/foreignDomestic/europeanUnion — see InternationalMaterialFields.
      return (fields as InternationalMaterialFields).title
    case 'otherSources': {
      const f = fields as OtherSourcesFields
      switch (f.subtype) {
        case 'speech':
          return f.speechTitle
        case 'pressRelease':
          return f.pressReleaseTitle
        case 'abs':
          return f.absTitle
        case 'filmOrMedia':
          return f.mediaTitle
        case 'socialMedia':
          // Not every post has its own title — the username is the next best stable identifier.
          return f.socialMediaTitle || f.socialMediaUsername
        case 'dictionary':
        case 'legalEncyclopedia':
        default:
          return undefined
      }
    }
    default:
      return undefined
  }
}

/**
 * Extracts the first author's name, exactly as the student entered it (eg 'RJ Ellicott', not a
 * surname-first inversion — that formatting only exists inside the citation engine's own
 * bibliography formatters, keyed per source type, not as a shared string usable here) — for the
 * Library page's "Author (A–Z)" sort. Only the source types that actually have an author-shaped
 * field return one; everything else (cases, legislation, treaties, and most otherSources/
 * otherLegislativeMaterial subtypes) has no natural "author" and returns undefined, same convention
 * as getCitationTitle above.
 */
export function getCitationAuthor(sourceType: SourceType, fields: CitationFields): string | undefined {
  switch (sourceType) {
    case 'journal':
      return (fields as JournalFields).authors[0]
    case 'book': {
      const f = fields as BookFields
      return (f.bookType === 'chapter' ? f.chapterAuthors : f.authors)?.[0]
    }
    case 'report':
      return (fields as ReportFields).authors?.[0]
    case 'researchPaper':
      return (fields as ResearchPaperFields).authors?.[0]
    case 'website':
      return (fields as WebsiteFields).authors?.[0]
    case 'newspaper':
      return (fields as NewspaperFields).authors?.[0]
    case 'otherLegislativeMaterial': {
      const f = fields as OtherLegislativeMaterialFields
      return f.subtype === 'gazette' ? f.gazetteAuthor : undefined
    }
    case 'otherSources': {
      const f = fields as OtherSourcesFields
      switch (f.subtype) {
        case 'speech':
          return f.speechAuthor
        case 'pressRelease':
          return f.pressReleaseAuthor
        // Not a student-entered field — r 7.1.5 fixes the author as this literal string, so
        // generate.ts never asks for one (see OtherSourcesFields.absTitle's own comment).
        case 'abs':
          return 'Australian Bureau of Statistics'
        default:
          return undefined
      }
    }
    default:
      return undefined
  }
}
