import { describe, expect, it } from 'vitest'
import { AutofillResult } from './types'
import { finalizeAutofillResult, formatAuthorAGLC4, normalizeJurisdiction, stripTrailingYear } from './utils'

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
