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

  it('subsequent reference ends with a full stop', () => {
    const fields: LegislationFields = {
      actTitle: 'Information Privacy Act',
      year: '2009',
      jurisdiction: 'Qld',
      pinpointType: 's',
      pinpointValue: '12',
    }
    expect(generateLegislationCitation(fields).subsequent).toBe('*Information Privacy Act* (Qld) s 12.')
  })
})
