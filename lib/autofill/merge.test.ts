import { describe, expect, it } from 'vitest'
import { changedKeys, mergeAutofillFields } from './merge'

describe('changedKeys', () => {
  it('detects a changed scalar field', () => {
    expect(changedKeys({ caseName: 'A', year: '2000' }, { caseName: 'B', year: '2000' })).toEqual(['caseName'])
  })

  it('detects no changes when nothing differs', () => {
    expect(changedKeys({ caseName: 'A' }, { caseName: 'A' })).toEqual([])
  })

  it('treats arrays with the same contents as unchanged', () => {
    expect(changedKeys({ authors: ['A', 'B'] }, { authors: ['A', 'B'] })).toEqual([])
  })

  it('treats arrays with different contents as changed', () => {
    expect(changedKeys({ authors: ['A'] }, { authors: ['A', 'B'] })).toEqual(['authors'])
  })
})

describe('mergeAutofillFields', () => {
  const blank = { caseName: '', year: '', judge: '' }

  it('fills every field from autofill when nothing is protected', () => {
    const current = { caseName: 'Old Case', year: '1990', judge: 'Old Judge' }
    const autofill = { caseName: 'Mabo v Queensland [No 2]', year: '1992' }
    const result = mergeAutofillFields(blank, current, autofill)
    expect(result).toEqual({ caseName: 'Mabo v Queensland [No 2]', year: '1992', judge: '' })
  })

  it('preserves only the specific field the student edited, updating everything else', () => {
    const current = { caseName: 'MY MANUALLY EDITED TITLE', year: '2025', judge: 'Old Judge' }
    const autofill = { caseName: 'Different Case Name', year: '1992', judge: 'Brennan J' }
    const result = mergeAutofillFields(blank, current, autofill, new Set(['caseName']))
    expect(result).toEqual({ caseName: 'MY MANUALLY EDITED TITLE', year: '1992', judge: 'Brennan J' })
  })

  it('clears a field to blank when neither protected nor provided by the new autofill', () => {
    const current = { caseName: 'Stale Case', year: '1990', judge: 'Stale Judge' }
    const autofill = { caseName: 'New Case' }
    const result = mergeAutofillFields(blank, current, autofill)
    expect(result).toEqual({ caseName: 'New Case', year: '', judge: '' })
  })

  it('replaces a full previous autofill result on a second, different autofill', () => {
    const current = { caseName: 'Article One', year: '2013', judge: '' }
    const autofill = { caseName: 'Article Two', year: '2025' }
    const result = mergeAutofillFields(blank, current, autofill)
    expect(result).toEqual({ caseName: 'Article Two', year: '2025', judge: '' })
  })
})
