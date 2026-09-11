import { describe, expect, it } from 'vitest'
import {
  bestEffortCaseParties,
  cleanOJDocumentTitle,
  deriveCourtCaseFromCelex,
  deriveNewSchemeOJIdentifierFromCelex,
  deriveOJSeriesFromCelex,
  deriveOJYear,
  extractCelexFromFilename,
  extractEuIdentifierFromUrl,
  extractExpressionTitle,
  findEnglishExpressionCellarId,
  findOldSchemeOJReference,
  findOwnEcli,
  findOwnOJIdentifier,
  parseWorkDate,
  toTitleCase,
} from './eu-cellar-parse'

// Fixture excerpts below are trimmed, real fragments taken directly from publications.europa.eu's
// Cellar repository (fetched live against the user's own worked-example CELEX numbers — Directive
// 93/13, the GDPR, the AI Act, and Huawei v ZTE — during development), not synthesised from memory.

describe('extractEuIdentifierFromUrl', () => {
  it('extracts a CELEX identifier from a ?uri=CELEX: URL', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:31993L0013')).toEqual({
      type: 'celex',
      value: '31993L0013',
    })
  })

  it('extracts a CELEX identifier case-insensitively', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:62013CJ0170')).toEqual({
      type: 'celex',
      value: '62013CJ0170',
    })
  })

  it('extracts a CELEX identifier from a URL with a percent-encoded colon and a trailing tracking param', () => {
    // A real, live bug caught after shipping: a URL copied straight from the browser's own address
    // bar percent-encodes the colon ('uri=CELEX%3A...') and often carries a trailing '&qid=...'
    // param — both present in the exact real URL that surfaced this ('...?uri=CELEX%3A32026R1395&
    // qid=1788823196868') — which the original regex, looking only for a literal ':', silently
    // failed to match at all.
    expect(
      extractEuIdentifierFromUrl('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32026R1395&qid=1788823196868'),
    ).toEqual({ type: 'celex', value: '32026R1395' })
  })

  it('derives a CELEX identifier from an ELI directive URL', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/eli/dir/1993/13/oj/eng')).toEqual({ type: 'celex', value: '31993L0013' })
  })

  it('derives a CELEX identifier from an ELI regulation URL', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng')).toEqual({ type: 'celex', value: '32016R0679' })
  })

  it('derives a CELEX identifier from an ELI regulation URL with an already-4-digit number', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng')).toEqual({ type: 'celex', value: '32024R1689' })
  })

  it('extracts a post-2023-scheme OJ identifier from a ?uri=OJ: URL', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689')).toEqual({
      type: 'oj',
      value: 'L_202401689',
    })
  })

  it('returns undefined for an unrecognised URL shape', () => {
    expect(extractEuIdentifierFromUrl('https://eur-lex.europa.eu/homepage.html')).toBeUndefined()
  })
})

describe('extractCelexFromFilename', () => {
  it('extracts a CELEX number from EUR-Lex\'s own PDF-export filename convention', () => {
    // The exact real filename that surfaced the underlying bug this fixes — a student-uploaded
    // EUR-Lex PDF export was being misclassified as an Other Legislative Material Gazette instead
    // of European Union Materials, because the PDF's own embedded metadata/text gave the AI
    // extractor no reliable signal (no Title, and page-1 text opens with 'Official Journal of the
    // European Communities', reasonable-but-wrong grounds to guess 'Gazette').
    expect(extractCelexFromFilename('CELEX_31993L0013_EN_TXT.pdf')).toBe('31993L0013')
  })

  it('extracts a CELEX number regardless of case and separator style', () => {
    expect(extractCelexFromFilename('celex:32016R0679.pdf')).toBe('32016R0679')
    expect(extractCelexFromFilename('CELEX%3A62013CJ0170.pdf')).toBe('62013CJ0170')
  })

  it('returns undefined for a filename with no CELEX prefix at all', () => {
    expect(extractCelexFromFilename('my-downloaded-document.pdf')).toBeUndefined()
  })
})

describe('deriveOJSeriesFromCelex', () => {
  it('derives L for a Regulation', () => {
    // A real, live gap: a post-2023-scheme Regulation (32024R1624) was coming back with no OJ
    // series shown at all, even though the series was already being derived internally to build
    // the OJ identifier itself — it just never made it into the fields the student actually sees.
    expect(deriveOJSeriesFromCelex('32024R1624')).toBe('L')
  })

  it('derives L for a Directive', () => {
    expect(deriveOJSeriesFromCelex('31993L0013')).toBe('L')
  })

  it('returns undefined for a Decision (could legitimately be L or C)', () => {
    expect(deriveOJSeriesFromCelex('32024D1234')).toBeUndefined()
  })

  it('returns undefined for a case-law CELEX number', () => {
    expect(deriveOJSeriesFromCelex('62013CJ0170')).toBeUndefined()
  })
})

describe('deriveNewSchemeOJIdentifierFromCelex', () => {
  it('derives the OJ identifier for a real 2026 Regulation with no top-level oj sibling at all', () => {
    // A real, live bug: this document's top-level CELEX SAMEAS block has no 'oj'-type sibling next
    // to it at all (unlike the AI Act, which has both) — the OJ identifier only exists inside each
    // per-language WORK_HAS_EXPRESSION block ('L_202601395.ENG', '.FRA', etc), so
    // findOwnOJIdentifier alone can't find it; this derives it straight from the CELEX number.
    expect(deriveNewSchemeOJIdentifierFromCelex('32026R1395')).toBe('L_202601395')
  })

  it('derives the OJ identifier for a Directive the same way', () => {
    expect(deriveNewSchemeOJIdentifierFromCelex('32024L0001')).toBe('L_202400001')
  })

  it('returns undefined for a non-legislative CELEX type letter (eg a Decision)', () => {
    expect(deriveNewSchemeOJIdentifierFromCelex('32024D1234')).toBeUndefined()
  })

  it('returns undefined for a case-law CELEX number', () => {
    expect(deriveNewSchemeOJIdentifierFromCelex('62013CJ0170')).toBeUndefined()
  })
})

describe('deriveOJYear', () => {
  it('derives the correct year from a CELEX identifier, not a naive first-4-digits match', () => {
    // A real, live bug caught during testing: '32016R0679' is sector '3' + year '2016' + type 'R'
    // + number '0679' — a naive /(\d{4})/ match against the whole string grabs '3201' (the first
    // four digits, spanning the sector digit and part of the year), not the real year '2016'.
    expect(deriveOJYear({ type: 'celex', value: '32016R0679' })).toBe('2016')
    expect(deriveOJYear({ type: 'celex', value: '31993L0013' })).toBe('1993')
    expect(deriveOJYear({ type: 'celex', value: '32024R1689' })).toBe('2024')
  })

  it('derives the year from a post-2023-scheme oj identifier', () => {
    expect(deriveOJYear({ type: 'oj', value: 'L_202401689' })).toBe('2024')
  })
})

describe('deriveCourtCaseFromCelex', () => {
  it('derives a Court of Justice case number and court name (Huawei v ZTE, C-170/13)', () => {
    expect(deriveCourtCaseFromCelex('62013CJ0170')).toEqual({
      caseNumber: 'C-170/13',
      courtName: 'Court of Justice of the European Union',
    })
  })

  it('derives a General Court case number and court name (Vainker v European Parliament, T-48/01)', () => {
    expect(deriveCourtCaseFromCelex('62001TJ0048')).toEqual({
      caseNumber: 'T-48/01',
      courtName: 'General Court of the European Union',
    })
  })

  it('returns undefined for a non-case-law CELEX number', () => {
    expect(deriveCourtCaseFromCelex('32016R0679')).toBeUndefined()
  })

  it('returns undefined for an unmapped case-law type code', () => {
    expect(deriveCourtCaseFromCelex('62013CO0170')).toBeUndefined()
  })
})

const DIRECTIVE_WORK_XML = `
<WORK_HAS_EXPRESSION type="link">
   <URI>
      <VALUE>http://publications.europa.eu/resource/cellar/954c3cd9-b2fa-47ae-a1f6-b6e62a488ad3.0008</VALUE>
      <IDENTIFIER>954c3cd9-b2fa-47ae-a1f6-b6e62a488ad3.0008</IDENTIFIER>
      <TYPE>cellar</TYPE>
   </URI>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/celex/31993L0013.ENG</VALUE>
         <IDENTIFIER>31993L0013.ENG</IDENTIFIER>
         <TYPE>celex</TYPE>
      </URI>
   </SAMEAS>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/uriserv/OJ.L_.1993.095.01.0029.01.ENG</VALUE>
         <IDENTIFIER>OJ.L_.1993.095.01.0029.01.ENG</IDENTIFIER>
         <TYPE>uriserv</TYPE>
      </URI>
   </SAMEAS>
</WORK_HAS_EXPRESSION>
`

const GDPR_WORK_XML = `
<WORK_HAS_EXPRESSION type="link">
   <URI>
      <VALUE>http://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006</VALUE>
      <IDENTIFIER>3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006</IDENTIFIER>
      <TYPE>cellar</TYPE>
   </URI>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/celex/32016R0679.ENG</VALUE>
         <IDENTIFIER>32016R0679.ENG</IDENTIFIER>
         <TYPE>celex</TYPE>
      </URI>
   </SAMEAS>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/oj/JOL_2016_119_R_0001.ENG</VALUE>
         <IDENTIFIER>JOL_2016_119_R_0001.ENG</IDENTIFIER>
         <TYPE>oj</TYPE>
      </URI>
   </SAMEAS>
</WORK_HAS_EXPRESSION>
`

const AI_ACT_WORK_XML = `
<WORK_HAS_EXPRESSION type="link">
   <URI>
      <VALUE>http://publications.europa.eu/resource/cellar/dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006</VALUE>
      <IDENTIFIER>dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006</IDENTIFIER>
      <TYPE>cellar</TYPE>
   </URI>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/oj/L_202401689.ENG</VALUE>
         <IDENTIFIER>L_202401689.ENG</IDENTIFIER>
         <TYPE>oj</TYPE>
      </URI>
   </SAMEAS>
</WORK_HAS_EXPRESSION>
`

// A trimmed, real fragment from a Regulation (CELEX 32025R2458) whose Spanish-language
// WORK_HAS_EXPRESSION block sits immediately before its English one — the exact real shape that
// surfaced a genuine wrong-language bug (see the test below).
const SPANISH_BEFORE_ENGLISH_WORK_XML = `
<WORK_HAS_EXPRESSION type="link">
   <URI>
      <VALUE>http://publications.europa.eu/resource/cellar/b03c2d60-d704-11f0-8da2-01aa75ed71a1.0023</VALUE>
      <IDENTIFIER>b03c2d60-d704-11f0-8da2-01aa75ed71a1.0023</IDENTIFIER>
      <TYPE>cellar</TYPE>
   </URI>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/oj/L_202502458.SPA</VALUE>
         <IDENTIFIER>L_202502458.SPA</IDENTIFIER>
         <TYPE>oj</TYPE>
      </URI>
   </SAMEAS>
</WORK_HAS_EXPRESSION>
<WORK_HAS_EXPRESSION type="link">
   <URI>
      <VALUE>http://publications.europa.eu/resource/cellar/b03c2d60-d704-11f0-8da2-01aa75ed71a1.0006</VALUE>
      <IDENTIFIER>b03c2d60-d704-11f0-8da2-01aa75ed71a1.0006</IDENTIFIER>
      <TYPE>cellar</TYPE>
   </URI>
   <SAMEAS>
      <URI>
         <VALUE>http://publications.europa.eu/resource/oj/L_202502458.ENG</VALUE>
         <IDENTIFIER>L_202502458.ENG</IDENTIFIER>
         <TYPE>oj</TYPE>
      </URI>
   </SAMEAS>
</WORK_HAS_EXPRESSION>
`

describe('findEnglishExpressionCellarId', () => {
  it('locates the English-expression cellar id for a pre-2023-scheme (celex) document', () => {
    expect(findEnglishExpressionCellarId(DIRECTIVE_WORK_XML, { type: 'celex', value: '31993L0013' })).toBe(
      '954c3cd9-b2fa-47ae-a1f6-b6e62a488ad3.0008',
    )
  })

  it('locates the English-expression cellar id for a post-2023-scheme (oj) document', () => {
    expect(findEnglishExpressionCellarId(AI_ACT_WORK_XML, { type: 'oj', value: 'L_202401689' })).toBe(
      'dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006',
    )
  })

  it('does not cross a WORK_HAS_EXPRESSION block boundary and pick up a DIFFERENT language\'s cellar id', () => {
    // A real, live, wrong-language bug: the original regex's unscoped lazy match happily paired a
    // cellar id captured from the SPANISH block with the '.ENG' SAMEAS belonging to the very next
    // (English) block, because both sat within its search window — the citation this produced came
    // back entirely in Spanish ('Reglamento (UE) 2025/2458 ... relativo a las estadísticas
    // europeas ...') instead of English. The correct cellar id here is '...0006' (the English
    // block's own), never '...0023' (the Spanish block's own, even though it appears first).
    expect(findEnglishExpressionCellarId(SPANISH_BEFORE_ENGLISH_WORK_XML, { type: 'oj', value: 'L_202502458' })).toBe(
      'b03c2d60-d704-11f0-8da2-01aa75ed71a1.0006',
    )
  })
})

describe('findOldSchemeOJReference', () => {
  it('parses the uriserv-form identifier (Directive 93/13)', () => {
    expect(findOldSchemeOJReference(DIRECTIVE_WORK_XML, { type: 'celex', value: '31993L0013' })).toEqual({
      series: 'L',
      issueNumber: '95',
      startingPage: '29',
    })
  })

  it('parses the oj-form identifier (GDPR)', () => {
    expect(findOldSchemeOJReference(GDPR_WORK_XML, { type: 'celex', value: '32016R0679' })).toEqual({
      series: 'L',
      issueNumber: '119',
      startingPage: '1',
    })
  })

  it('returns undefined for a post-2023-scheme document (the AI Act)', () => {
    expect(findOldSchemeOJReference(AI_ACT_WORK_XML, { type: 'oj', value: 'L_202401689' })).toBeUndefined()
  })
})

describe('parseWorkDate', () => {
  it('formats a WORK_DATE_DOCUMENT into a full AGLC4-style date', () => {
    const xml = `
      <WORK_DATE_DOCUMENT type="date">
         <VALUE>2015-07-16</VALUE>
         <YEAR>2015</YEAR>
         <MONTH>07</MONTH>
         <DAY>16</DAY>
      </WORK_DATE_DOCUMENT>
    `
    expect(parseWorkDate(xml)).toBe('16 July 2015')
  })

  it('returns undefined when no WORK_DATE_DOCUMENT is present', () => {
    expect(parseWorkDate('<WORK></WORK>')).toBeUndefined()
  })
})

describe('findOwnEcli', () => {
  it("finds the case's own ECLI, adjacent to its own CELEX SAMEAS block", () => {
    const xml = `
      <SAMEAS>
         <URI>
            <VALUE>http://publications.europa.eu/resource/celex/62013CJ0170</VALUE>
            <IDENTIFIER>62013CJ0170</IDENTIFIER>
            <TYPE>celex</TYPE>
         </URI>
      </SAMEAS>
      <SAMEAS>
         <URI>
            <VALUE>http://publications.europa.eu/resource/ecli/ECLI%3AEU%3AC%3A2015%3A477</VALUE>
            <IDENTIFIER>ECLI:EU:C:2015:477</IDENTIFIER>
            <TYPE>ecli</TYPE>
         </URI>
      </SAMEAS>
    `
    expect(findOwnEcli(xml, '62013CJ0170')).toBe('ECLI:EU:C:2015:477')
  })

  it('does not match an unrelated ECLI belonging to a cited case elsewhere in the document', () => {
    const xml = `<IDENTIFIER>ECLI:EU:C:1979:36</IDENTIFIER><TYPE>ecli</TYPE>`
    expect(findOwnEcli(xml, '62013CJ0170')).toBeUndefined()
  })
})

describe('findOwnOJIdentifier', () => {
  it("finds the document's own post-2023-scheme OJ identifier next to its CELEX SAMEAS block (the AI Act)", () => {
    const xml = `
      <SAMEAS>
         <URI>
            <VALUE>http://publications.europa.eu/resource/celex/32024R1689</VALUE>
            <IDENTIFIER>32024R1689</IDENTIFIER>
            <TYPE>celex</TYPE>
         </URI>
      </SAMEAS>
      <SAMEAS>
         <URI>
            <VALUE>http://publications.europa.eu/resource/oj/L_202401689</VALUE>
            <IDENTIFIER>L_202401689</IDENTIFIER>
            <TYPE>oj</TYPE>
         </URI>
      </SAMEAS>
    `
    expect(findOwnOJIdentifier(xml, '32024R1689')).toBe('L_202401689')
  })

  it('returns undefined when the document has no oj-scheme sibling', () => {
    expect(findOwnOJIdentifier('<WORK></WORK>', '31993L0013')).toBeUndefined()
  })
})

describe('extractExpressionTitle', () => {
  it('extracts the EXPRESSION_TITLE value', () => {
    const xml = `
      <EXPRESSION>
         <EXPRESSION_TITLE type="data">
            <VALUE>Regulation (EU) 2016/679 of the European Parliament and of the council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation) (Text with EEA relevance)</VALUE>
         </EXPRESSION_TITLE>
      </EXPRESSION>
    `
    expect(extractExpressionTitle(xml)).toBe(
      'Regulation (EU) 2016/679 of the European Parliament and of the council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation) (Text with EEA relevance)',
    )
  })

  it('returns undefined when no title is present (common for older case-law records)', () => {
    expect(extractExpressionTitle('<WORK></WORK>')).toBeUndefined()
  })

  it('does not match EXPRESSION_TITLE_SHORT when it appears before the full EXPRESSION_TITLE', () => {
    // A real, live bug caught during testing: an unanchored regex matched 'EXPRESSION_TITLE_SHORT'
    // (eg 'Unfair Terms Directive') instead of the document's own full title, when the short-title
    // element happened to appear first in the source document.
    const xml = `
      <EXPRESSION_TITLE_SHORT type="data">
         <VALUE>Unfair Terms Directive</VALUE>
      </EXPRESSION_TITLE_SHORT>
      <EXPRESSION_TITLE type="data">
         <VALUE>Council Directive 93/13/EEC of 5 April 1993 on unfair terms in consumer contracts</VALUE>
      </EXPRESSION_TITLE>
    `
    expect(extractExpressionTitle(xml)).toBe('Council Directive 93/13/EEC of 5 April 1993 on unfair terms in consumer contracts')
  })
})

describe('toTitleCase / cleanOJDocumentTitle', () => {
  it('capitalises principal words and lower-cases minor ones, except first/last', () => {
    expect(toTitleCase('the quick brown fox jumps over the lazy dog')).toBe('The Quick Brown Fox Jumps Over the Lazy Dog')
  })

  it('strips the trailing EEA-relevance marker and applies Title Case (GDPR — matches the user-provided worked example exactly)', () => {
    const raw =
      'Regulation (EU) 2016/679 of the European Parliament and of the council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation) (Text with EEA relevance)'
    expect(cleanOJDocumentTitle(raw)).toBe(
      'Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the Protection of Natural Persons with Regard to the Processing of Personal Data and on the Free Movement of Such Data, and Repealing Directive 95/46/EC (General Data Protection Regulation)',
    )
  })
})

describe('bestEffortCaseParties', () => {
  it('extracts the party segment from a compound Formex title, drops a secondary defendant, strips full stops', () => {
    const raw =
      'Judgment of the Court (Fifth Chamber) of 16 July 2015.#Huawei Technologies Co. Ltd v ZTE Corp. and ZTE Deutschland GmbH.#Request for a preliminary ruling from the Landgericht Düsseldorf.'
    // Close to, but not identical to, AGLC4's own 'Huawei Technologies Co Ltd v ZTE Corporation' —
    // 'Corp' vs 'Corporation' is genuine outside knowledge no mechanical parse can recover; this
    // is documented as a medium-confidence starting point, not asserted as exact.
    expect(bestEffortCaseParties(raw)).toBe('Huawei Technologies Co Ltd v ZTE Corp')
  })

  it('falls back to the whole string when there is no # delimiter', () => {
    expect(bestEffortCaseParties('Costa v ENEL.')).toBe('Costa v ENEL')
  })
})
