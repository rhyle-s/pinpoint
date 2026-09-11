import { describe, expect, it } from 'vitest'
import { cleanCaseName, isPlausibleReportedCitation, parseAustliiCase } from './austlii-cases-parse'

describe('cleanCaseName', () => {
  it('strips a trailing " - AustLII" suffix', () => {
    expect(cleanCaseName('Mabo v Queensland [No 2] - AustLII')).toBe('Mabo v Queensland [No 2]')
  })

  it('strips a trailing medium neutral citation from the title', () => {
    expect(cleanCaseName('Smith v Jones [2020] HCA 5')).toBe('Smith v Jones')
  })
})

describe('isPlausibleReportedCitation', () => {
  it('accepts a real citation shape', () => {
    expect(isPlausibleReportedCitation('270', 'CLR', '1')).toBe(true)
    expect(isPlausibleReportedCitation('190', 'A Crim R', '468')).toBe(true)
  })

  it('rejects an implausible volume, page, or over-long abbreviation', () => {
    expect(isPlausibleReportedCitation('999999', 'CLR', '1')).toBe(false)
    expect(isPlausibleReportedCitation('270', 'CLR', '0')).toBe(false)
    expect(isPlausibleReportedCitation('12', 'Selected Judgments Of The High Court', '3')).toBe(false)
  })
})

describe('parseAustliiCase', () => {
  it('reads a reported citation from the title and marks a known series high confidence', () => {
    const title = 'Mabo v Queensland [No 2] (1992) 175 CLR 1'
    const { fields, confidence } = parseAustliiCase(title, `${title}\n`, 'High Court of Australia. Before: Mason CJ.')
    expect(fields.reportType).toBe('reported')
    expect(fields.volume).toBe('175')
    expect(fields.reportAbbreviation).toBe('CLR')
    expect(fields.startingPage).toBe('1')
    expect(confidence).toBe('high')
  })

  it('drops to medium confidence for a plausible but unrecognised series', () => {
    const title = 'Re Something (2019) 5 Foo Bar 200'
    const { fields, confidence } = parseAustliiCase(title, `${title}\n`, '')
    expect(fields.reportType).toBe('reported')
    expect(fields.reportAbbreviation).toBe('Foo Bar')
    expect(confidence).toBe('medium')
  })

  it('falls to the medium-neutral citation when there is no reported series', () => {
    const title = 'Smith v Jones [2021] NSWCA 88'
    const { fields, confidence } = parseAustliiCase(title, `${title}\n`, '')
    expect(fields.reportType).toBe('unreported-mnc')
    expect(fields.year).toBe('2021')
    expect(fields.courtCode).toBe('NSWCA')
    expect(fields.caseNumber).toBe('88')
    expect(confidence).toBe('medium')
  })

  it('does NOT false-match a citation from unrelated body text far down the page', () => {
    // The regression this guards: the old code ran the pattern against the whole body and took the
    // first hit — here, an unrelated "12 Corporations Act 2001" reference — producing a confident
    // wrong reported citation. With the bounded citationText, it sees no citation and stays low.
    const title = 'Application by ASIC [2022] FCA 17'
    const bodyFarDown =
      'a'.repeat(4000) + ' the applicant relied on 12 Corporations Act 2001 provisions and 3 Evidence Act 1995 sections'
    const { fields, confidence } = parseAustliiCase(title, `${title}\n${bodyFarDown.slice(0, 500)}`, bodyFarDown)
    expect(fields.reportType).toBe('unreported-mnc')
    expect(fields.reportAbbreviation).toBeUndefined()
    expect(fields.courtCode).toBe('FCA')
    expect(confidence).toBe('medium')
  })

  it('extracts a judge from a "Before:" line anywhere in the body', () => {
    const title = 'X v Y [2020] VSC 1'
    const { fields } = parseAustliiCase(title, `${title}\n`, 'Lorem ipsum. Before: Bell J. Reasons for judgment.')
    expect(fields.judge).toBe('Bell J')
  })
})
