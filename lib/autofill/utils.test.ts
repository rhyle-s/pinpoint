import { describe, expect, it } from 'vitest'
import { AutofillResult } from './types'
import {
  finalizeAutofillResult,
  formatAuthorAGLC4,
  genericiseIntegralDocumentType,
  normalizeJurisdiction,
  stripDuplicateYearFromTitle,
  stripTrailingYear,
} from './utils'

describe('formatAuthorAGLC4', () => {
  it('keeps the given name in full, not reduced to an initial', () => {
    expect(formatAuthorAGLC4('Robert', 'Smith')).toBe('Robert Smith')
  })

  it('keeps multiple given names in full', () => {
    expect(formatAuthorAGLC4('Robert John', 'Smith')).toBe('Robert John Smith')
  })

  it('handles a missing given name', () => {
    expect(formatAuthorAGLC4('', 'Smith')).toBe('Smith')
  })
})

describe('stripTrailingYear', () => {
  it('splits a trailing year off the title', () => {
    expect(stripTrailingYear('Crimes Act 1958')).toEqual({ title: 'Crimes Act', year: '1958' })
  })

  it('leaves a title with no trailing year unchanged, keeping the known year', () => {
    expect(stripTrailingYear('Australian Constitution', '1900')).toEqual({
      title: 'Australian Constitution',
      year: '1900',
    })
  })

  it('falls back to an empty year when neither the title nor a known year has one', () => {
    expect(stripTrailingYear('Privacy Act')).toEqual({ title: 'Privacy Act', year: '' })
  })
})

describe('stripDuplicateYearFromTitle', () => {
  it('strips a trailing year matching the known date', () => {
    expect(stripDuplicateYearFromTitle('Sustainability Report 2025', '2025')).toBe('Sustainability Report')
  })

  it('strips a leading year matching the known date', () => {
    expect(stripDuplicateYearFromTitle('2025 Annual Report', '2025')).toBe('Annual Report')
  })

  it('leaves a title unchanged when its trailing number does not match the known date', () => {
    expect(stripDuplicateYearFromTitle('Vision 2030', '2025')).toBe('Vision 2030')
  })

  it('leaves a title unchanged when no date is known', () => {
    expect(stripDuplicateYearFromTitle('Sustainability Report 2025', '')).toBe('Sustainability Report 2025')
  })
})

describe('genericiseIntegralDocumentType', () => {
  it('collapses an integral "...Report" label to the generic "Report" (AGLC4 r 7.1.1)', () => {
    // The exact case the user reported: title is just the label + a year range, nothing else.
    expect(genericiseIntegralDocumentType('Annual Report 2023–24', 'Annual Report')).toBe('Report')
    expect(genericiseIntegralDocumentType('Sustainability Report', 'Sustainability Report')).toBe('Report')
    expect(genericiseIntegralDocumentType('Annual Report No 129', 'Annual Report')).toBe('Report')
  })

  it('keeps a non-integral label — the title carries a distinct name of its own', () => {
    expect(genericiseIntegralDocumentType('Interim Report on the Operation of the Foo Act', 'Interim Report')).toBe(
      'Interim Report',
    )
  })

  it('leaves a label that is not part of the title at all untouched', () => {
    // The "cover text '2025 Annual Report' above a distinct tagline" case — title is the tagline.
    expect(
      genericiseIntegralDocumentType('Providing the critical infrastructure for the AI era', 'Annual Report'),
    ).toBe('Annual Report')
  })

  it('leaves an already-generic or non-report document type untouched', () => {
    expect(genericiseIntegralDocumentType('Report 2024', 'Report')).toBe('Report')
    expect(genericiseIntegralDocumentType('Policy for the Responsible Use of AI', 'Policy Document')).toBe(
      'Policy Document',
    )
    expect(genericiseIntegralDocumentType('AI Governance', 'White Paper')).toBe('White Paper')
  })
})

describe('normalizeJurisdiction', () => {
  it('matches a known jurisdiction code', () => {
    expect(normalizeJurisdiction('Cth')).toBe('Cth')
  })

  it('is case-insensitive', () => {
    expect(normalizeJurisdiction('nsw')).toBe('NSW')
  })

  it('returns undefined for unrecognised input', () => {
    expect(normalizeJurisdiction('Elbonia')).toBeUndefined()
  })

  it('returns undefined for empty input', () => {
    expect(normalizeJurisdiction(undefined)).toBeUndefined()
    expect(normalizeJurisdiction(null)).toBeUndefined()
  })
})

describe('finalizeAutofillResult', () => {
  it('adds a manual-pinpoint note when the Act title was found but no pinpoint was', () => {
    const result: AutofillResult = {
      detectedSourceType: 'legislation',
      fields: { actTitle: 'Privacy Act', year: '1988', jurisdiction: 'Cth' },
      confidence: 'high',
    }
    expect(finalizeAutofillResult(result, true).message).toMatch(/section links aren't recognised/)
  })

  it('adds a missing-year note when the case name was found but no year was', () => {
    const result: AutofillResult = {
      detectedSourceType: 'case',
      fields: { caseName: 'Smith v Jones', reportType: 'reported', year: '' },
      confidence: 'high',
    }
    expect(finalizeAutofillResult(result, true).message).toMatch(/case year/)
  })

  // A real, confirmed bug found during a full autofill audit: a PDF upload (or pasted text) that
  // hit these same two notes showed URL-only wording ("This site's section links aren't
  // recognised...") even though no site or link was ever involved — suggestAlternative (already
  // false for both those input methods, see ai-extract.ts's aiExtractFromPdfMetadata/
  // aiExtractFromPastedText) now also picks the wording, not just whether to append the
  // PDF/paste-alternative suggestion.
  it('uses document-based wording (not "this site"/"this link") for a PDF upload or pasted text', () => {
    const legislationResult: AutofillResult = {
      detectedSourceType: 'legislation',
      fields: { actTitle: 'Privacy Act', year: '1988', jurisdiction: 'Cth' },
      confidence: 'high',
    }
    const legislationMessage = finalizeAutofillResult(legislationResult, false).message
    expect(legislationMessage).toMatch(/document/)
    expect(legislationMessage).not.toMatch(/this site|this link/)

    const caseResult: AutofillResult = {
      detectedSourceType: 'case',
      fields: { caseName: 'Smith v Jones', reportType: 'reported', year: '' },
      confidence: 'high',
    }
    const caseMessage = finalizeAutofillResult(caseResult, false).message
    expect(caseMessage).toMatch(/document/)
    expect(caseMessage).not.toMatch(/this site|this link/)
  })

  it('falls back to the generic suggestion when even the case name is missing', () => {
    const result: AutofillResult = {
      detectedSourceType: 'case',
      fields: { caseName: '', reportType: 'reported', year: '' },
      confidence: 'low',
    }
    expect(finalizeAutofillResult(result, true).message).toMatch(/save the page as a PDF/)
  })

  it('does not suggest the PDF/paste alternative when the attempt was already a PDF/paste one', () => {
    const result: AutofillResult = {
      detectedSourceType: 'website',
      fields: { url: '', documentTitle: '' },
      confidence: 'low',
    }
    expect(finalizeAutofillResult(result, false).message).toBeUndefined()
  })

  it('leaves an existing message untouched', () => {
    const result: AutofillResult = {
      detectedSourceType: 'legislation',
      fields: { actTitle: '', year: '', jurisdiction: 'NSW' },
      confidence: 'low',
      message: 'This site blocks automated requests.',
    }
    expect(finalizeAutofillResult(result, true).message).toBe('This site blocks automated requests.')
  })

  it('leaves a fully successful result untouched', () => {
    const result: AutofillResult = {
      detectedSourceType: 'legislation',
      fields: { actTitle: 'Privacy Act', year: '1988', jurisdiction: 'Cth', pinpointType: 's', pinpointValue: '13' },
      confidence: 'high',
    }
    expect(finalizeAutofillResult(result, true).message).toBeUndefined()
  })
})
