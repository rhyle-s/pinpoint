import { CitationFields, SourceType } from '@/lib/citation-engine/types'

// AGLC4 r 1.13's five bibliography divisions. Order matters — this is the order sections are
// printed in the exported document.
export type BibliographySection = 'A' | 'B' | 'C' | 'D' | 'E'

export const BIBLIOGRAPHY_SECTION_ORDER: BibliographySection[] = ['A', 'B', 'C', 'D', 'E']

export const BIBLIOGRAPHY_SECTION_LABELS: Record<BibliographySection, string> = {
  A: 'Articles/Books/Reports',
  B: 'Cases',
  C: 'Legislation',
  D: 'Treaties',
  E: 'Other',
}

// Maps a saved citation to its r 1.13 section by the *substance* of the source, not its top-level
// SourceType alone — internationalMaterial and otherLegislativeMaterial are both umbrella types
// covering genuinely different kinds of source (a treaty and a foreign court judgment are not the
// same section just because they're both 'internationalMaterial'), so this inspects the saved
// `fields` for the actual subtype/foreignCategory/euCategory where the top-level type alone is
// ambiguous. Every placement below was reviewed and confirmed directly with the user (see
// CLAUDE.md's bibliography-sections entry) rather than left as an unconfirmed guess.
export function bibliographySectionFor(sourceType: SourceType, fields: CitationFields): BibliographySection {
  switch (sourceType) {
    case 'case':
      return 'B'
    case 'legislation':
      return 'C'
    case 'otherLegislativeMaterial': {
      // Bills and constitutions are Legislation; explanatory material, gazettes, and practice
      // directions are not — confirmed with the user, not the only defensible reading of AGLC4's
      // own text.
      const subtype = (fields as Partial<{ subtype: 'bill' | 'explanatoryMaterial' | 'gazette' | 'practiceDirection' | 'constitution' }>)
        .subtype
      return subtype === 'bill' || subtype === 'constitution' ? 'C' : 'E'
    }
    case 'journal':
    case 'book':
    case 'report':
    case 'researchPaper':
    case 'newspaper':
      return 'A'
    case 'website':
    case 'otherSources':
      return 'E'
    case 'internationalMaterial': {
      const f = fields as Partial<{
        subtype: 'treaty' | 'unDocument' | 'foreignDomestic' | 'europeanUnion'
        foreignCategory: 'case' | 'legislation' | 'delegatedLegislation' | 'legislationSessionLaw' | 'constitution'
        euCategory:
          | 'officialJournal'
          | 'constitutiveTreaty'
          | 'court'
          | 'councilOfEuropeBasicDocument'
          | 'europeanCourtOfHumanRights'
          | 'europeanCommissionOfHumanRights'
      }>
      switch (f.subtype) {
        case 'treaty':
          return 'D'
        case 'unDocument':
          return 'E'
        case 'foreignDomestic':
          return f.foreignCategory === 'case' ? 'B' : 'C'
        case 'europeanUnion':
          switch (f.euCategory) {
            case 'court':
            case 'europeanCourtOfHumanRights':
            case 'europeanCommissionOfHumanRights':
              return 'B'
            case 'constitutiveTreaty':
            case 'councilOfEuropeBasicDocument':
              return 'D'
            case 'officialJournal':
            default:
              return 'C'
          }
        default:
          return 'E'
      }
    }
    default:
      return 'E'
  }
}
