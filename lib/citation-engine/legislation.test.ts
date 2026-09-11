import { describe, expect, it } from 'vitest'
import { generateLegislationCitation } from './legislation'
import { LegislationFields } from './types'

describe('generateLegislationCitation', () => {
  it('Privacy Act 1988 (Cth) s 13', () => {
    const fields: LegislationFields = {
      actTitle: 'Privacy Act',
      year: '1988',
      jurisdiction: 'Cth',
      pinpointType: 's',
      pinpointValue: '13',
    }
    expect(generateLegislationCitation(fields).footnote).toBe('*Privacy Act 1988* (Cth) s 13.')
  })

  it('Crimes Act 1958 (Vic) ss 3, 14', () => {
    const fields: LegislationFields = {
      actTitle: 'Crimes Act',
      year: '1958',
      jurisdiction: 'Vic',
      pinpointType: 'ss',
      pinpointValue: '3, 14',
    }
    expect(generateLegislationCitation(fields).footnote).toBe('*Crimes Act 1958* (Vic) ss 3, 14.')
  })

  it('Australian Constitution s 51(xxvi) — no jurisdiction brackets', () => {
    const fields: LegislationFields = {
      actTitle: 'Australian Constitution',
      year: '',
      jurisdiction: 'none',
      pinpointType: 's',
      pinpointValue: '51(xxvi)',
    }
    expect(generateLegislationCitation(fields).footnote).toBe('*Australian Constitution* s 51(xxvi).')
  })

  it("renders no jurisdiction bracket when jurisdiction is 'unknown' (not yet selected)", () => {
    const fields: LegislationFields = {
      actTitle: 'Weapons Act',
      year: '1990',
      jurisdiction: 'unknown',
      pinpointType: 's',
      pinpointValue: '50',
    }
    // Deliberately incomplete — the missing bracket is surfaced by getMissingFieldsWarning, not
    // papered over with a guessed '(Cth)'.
    expect(generateLegislationCitation(fields).footnote).toBe('*Weapons Act 1990* s 50.')
    expect(generateLegislationCitation(fields).bibliography).toBe('*Weapons Act 1990*')
  })

  it('Environment Protection and Biodiversity Conservation Act 1999 (Cth) sch 1', () => {
    const fields: LegislationFields = {
      actTitle: 'Environment Protection and Biodiversity Conservation Act',
      year: '1999',
      jurisdiction: 'Cth',
      pinpointType: 'sch',
      pinpointValue: '1',
    }
    expect(generateLegislationCitation(fields).footnote).toBe(
      '*Environment Protection and Biodiversity Conservation Act 1999* (Cth) sch 1.',
    )
  })

  it('Privacy Act 1988 (Cth) — no pinpoint', () => {
    const fields: LegislationFields = {
      actTitle: 'Privacy Act',
      year: '1988',
      jurisdiction: 'Cth',
    }
    expect(generateLegislationCitation(fields).footnote).toBe('*Privacy Act 1988* (Cth).')
  })

  it('bibliography entry ends with no full stop', () => {
    const fields: LegislationFields = {
      actTitle: 'Information Privacy Act',
      year: '2009',
      jurisdiction: 'Qld',
      pinpointType: 's',
      pinpointValue: '12',
    }
    expect(generateLegislationCitation(fields).bibliography).toBe('*Information Privacy Act 2009* (Qld)')
  })

  it('subsequent reference uses the short title with a (n X) cross-reference, per AGLC4 r 1.4.1', () => {
    // A real, confirmed bug this test replaces: AGLC4 r 1.4.1 explicitly covers legislation
    // ('For cases and legislation, a short title... may be used followed by a cross-reference in
    // parentheses'), and its own worked example annotates the version WITHOUT '(n X)' as wrong
    // ('ADJR Act (n 46) s 7. [Not: ADJR Act s 7.]') — a previous version of this formatter built
    // '*Short Title* (Jurisdiction) Pinpoint' with no footnote cross-reference at all, which that
    // same example rules out. The short title also drops the jurisdiction bracket entirely (not
    // just the year) — confirmed by 'ADJR Act (n 46)' never showing '(Cth)'.
    const fields: LegislationFields = {
      actTitle: 'Information Privacy Act',
      year: '2009',
      jurisdiction: 'Qld',
      pinpointType: 's',
      pinpointValue: '12',
      footnoteNumber: '4',
    }
    expect(generateLegislationCitation(fields).subsequent).toBe('*Information Privacy Act* (n 4) s 12.')
  })

  it('subsequent reference defaults the footnote number to 1 and the short title to the bare Act title', () => {
    const fields: LegislationFields = {
      actTitle: 'Privacy Act',
      year: '1988',
      jurisdiction: 'Cth',
      pinpointType: 's',
      pinpointValue: '13',
    }
    expect(generateLegislationCitation(fields).subsequent).toBe('*Privacy Act* (n 1) s 13.')
  })

  it('subsequent reference uses a student-supplied short title in place of the bare Act title', () => {
    const fields: LegislationFields = {
      actTitle: 'Administrative Decisions (Judicial Review) Act',
      year: '1977',
      jurisdiction: 'Cth',
      pinpointType: 's',
      pinpointValue: '7',
      shortTitle: 'ADJR Act',
      footnoteNumber: '63',
    }
    // Matches AGLC4's own r 1.4.1 worked example exactly: 'ADJR Act (n 63) s 7.'
    expect(generateLegislationCitation(fields).subsequent).toBe('*ADJR Act* (n 63) s 7.')
  })
})
