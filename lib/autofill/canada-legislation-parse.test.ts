import { describe, expect, it } from 'vitest'
import { extractCanadaLegislationCitation, parseCanadaCitationLine } from './canada-legislation-parse'

// Every citation string below was confirmed by direct fetch against the real laws-lois.justice.gc.ca
// page, not invented — see CLAUDE.md for the <header>-stripping bug this deterministic parser
// replaces the AI-based extraction with.
describe('parseCanadaCitationLine', () => {
  it('parses an ordinary Revised Statutes citation with a letter-number chapter', () => {
    expect(parseCanadaCitationLine('R.S.C., 1985, c. P-21')).toEqual({
      statuteVolumeType: 'RS',
      jurisdictionAbbrev: 'C',
      year: '1985',
      chapter: 'P-21',
      sessionOrSupp: undefined,
    })
  })

  it('parses a Revised Statutes citation with a supplement', () => {
    expect(parseCanadaCitationLine('R.S.C., 1985, c. 1 (5th Supp.)')).toEqual({
      statuteVolumeType: 'RS',
      jurisdictionAbbrev: 'C',
      year: '1985',
      chapter: '1',
      sessionOrSupp: '5th Supp',
    })
  })

  it('parses a plain sessional Statutes of Canada citation', () => {
    expect(parseCanadaCitationLine('S.C. 2002, c. 1')).toEqual({
      statuteVolumeType: 'S',
      jurisdictionAbbrev: 'C',
      year: '2002',
      chapter: '1',
      sessionOrSupp: undefined,
    })
  })

  it('returns undefined for text that does not match the expected citation shape', () => {
    expect(parseCanadaCitationLine('Not a citation at all')).toBeUndefined()
  })
})

describe('extractCanadaLegislationCitation', () => {
  it("finds the citation in a 'Title (Citation)' heading inside the page's <header>", () => {
    const html = `<html><head><title>Youth Criminal Justice Act</title></head>
      <body><header>Some nav noise Youth Criminal Justice Act (S.C. 2002, c. 1) more nav</header>
      <main>Assented to 2002-02-19...</main></body></html>`
    expect(extractCanadaLegislationCitation(html, 'Youth Criminal Justice Act')).toEqual({
      statuteVolumeType: 'S',
      jurisdictionAbbrev: 'C',
      year: '2002',
      chapter: '1',
      sessionOrSupp: undefined,
    })
  })

  it('returns undefined when the title never appears next to a citation', () => {
    const html = `<html><head><title>Some Act</title></head><body><header>No citation here</header></body></html>`
    expect(extractCanadaLegislationCitation(html, 'Some Act')).toBeUndefined()
  })
})
