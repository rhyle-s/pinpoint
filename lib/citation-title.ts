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
 * Extracts "the title" of a source from its saved fields, for duplicate-detection purposes — not
 * used anywhere in the citation engine itself. Every source type names its title field
 * differently (caseName, actTitle, articleTitle, documentTitle, ...), and a few (otherLegislativeMaterial,
 * otherSources) are umbrella types where the right field also depends on the subtype. Returns
 * undefined for the handful of otherSources subtypes with no single clean title field (dictionary
 * entries, legal encyclopedia chapters) — callers should treat that as "can't reliably say", not
 * silently fall back to something looser.
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
