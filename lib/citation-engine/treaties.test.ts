import { describe, expect, it } from 'vitest'
import { generateTreatyCitation } from './treaties'
import { TreatyFields } from './types'

describe('generateTreatyCitation', () => {
  it('ICESCR — no pinpoint', () => {
    const fields: TreatyFields = {
      title: 'International Covenant on Economic, Social and Cultural Rights',
      treatyType: 'multilateral',
      openedForSignature: '16 December 1966',
      treatySeries: '993 UNTS 3',
      enteredIntoForce: '3 January 1976',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*International Covenant on Economic, Social and Cultural Rights*, opened for signature 16 December 1966, 993 UNTS 3 (entered into force 3 January 1976).',
    )
  })

  it('CRC — with pinpoint', () => {
    const fields: TreatyFields = {
      title: 'Convention on the Rights of the Child',
      treatyType: 'multilateral',
      openedForSignature: '20 November 1989',
      treatySeries: '1577 UNTS 3',
      enteredIntoForce: '2 September 1990',
      pinpoint: 'art 3',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Convention on the Rights of the Child*, opened for signature 20 November 1989, 1577 UNTS 3 (entered into force 2 September 1990) art 3.',
    )
  })

  it('TRIPS', () => {
    const fields: TreatyFields = {
      title: 'Agreement on Trade-Related Aspects of Intellectual Property Rights',
      treatyType: 'multilateral',
      openedForSignature: '15 April 1994',
      treatySeries: '1869 UNTS 299',
      enteredIntoForce: '1 January 1995',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Agreement on Trade-Related Aspects of Intellectual Property Rights*, opened for signature 15 April 1994, 1869 UNTS 299 (entered into force 1 January 1995).',
    )
  })

  it('bilateral treaty — parties joined with en dash', () => {
    const fields: TreatyFields = {
      title: 'Timor Sea Treaty',
      treatyType: 'bilateral',
      parties: ['Australia', 'East Timor'],
      signedDate: '20 May 2002',
      treatySeries: '2258 UNTS 3',
      enteredIntoForce: '2 April 2003',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Timor Sea Treaty*, Australia–East Timor, signed 20 May 2002, 2258 UNTS 3 (entered into force 2 April 2003).',
    )
  })
})
