import { CitationResult, InternationalMaterialFields, TreatyFields, UNDocumentFields } from './types'
import { generateTreatyCitation } from './treaties'
import { generateUNDocumentCitation } from './un-documents'
import { foreignDomesticBadge, generateForeignDomesticCitation } from './foreign-domestic'
import { europeanMaterialsBadge, generateEuropeanMaterialsCitation } from './european-materials'

function toTreatyFields(fields: InternationalMaterialFields): TreatyFields {
  return {
    title: fields.title ?? '',
    treatyType: fields.treatyType ?? 'multilateral',
    parties: fields.parties,
    openedForSignature: fields.openedForSignature,
    signedDate: fields.signedDate,
    treatySeries: fields.treatySeries ?? '',
    enteredIntoForce: fields.enteredIntoForce,
    pinpoint: fields.pinpoint,
    footnoteNumber: fields.footnoteNumber,
    shortTitle: fields.shortTitle,
  }
}

function toUNDocumentFields(fields: InternationalMaterialFields): UNDocumentFields {
  return {
    title: fields.title ?? '',
    resolutionNumber: fields.resolutionNumber,
    session: fields.session,
    includeOfficialRecords: fields.includeOfficialRecords,
    unDocSymbol: fields.unDocSymbol,
    date: fields.date ?? '',
    adoptedDate: fields.adoptedDate,
    pinpoint: fields.pinpoint,
    footnoteNumber: fields.footnoteNumber,
    shortTitle: fields.shortTitle,
  }
}

/** The UI badge naming which of the three categories was detected/selected — for Foreign
 *  Domestic Sources this delegates to a second-level badge naming the specific country/category
 *  (eg 'Canadian Legislation'), the same way otherLegislativeMaterialBadge() names an exact
 *  sub-category rather than a generic label. */
export function internationalMaterialBadge(fields: InternationalMaterialFields): string {
  switch (fields.subtype) {
    case 'treaty':
      return 'Treaty'
    case 'unDocument':
      return 'UN Materials'
    case 'foreignDomestic':
      return foreignDomesticBadge(fields)
    case 'europeanUnion':
      return europeanMaterialsBadge(fields)
  }
}

export function generateInternationalMaterialCitation(fields: InternationalMaterialFields): CitationResult {
  switch (fields.subtype) {
    case 'treaty':
      return generateTreatyCitation(toTreatyFields(fields))
    case 'unDocument':
      return generateUNDocumentCitation(toUNDocumentFields(fields))
    case 'foreignDomestic':
      return generateForeignDomesticCitation(fields)
    case 'europeanUnion':
      return generateEuropeanMaterialsCitation(fields)
  }
}
