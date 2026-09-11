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
    expect(generateTreatyCitation(fields).bibliography).toBe(
      '*International Covenant on Economic, Social and Cultural Rights*, opened for signature 16 December 1966, 993 UNTS 3 (entered into force 3 January 1976)',
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

  it('NPT via IAEA INFCIRC/140 — no UNTS number determinable from the source (predates registration)', () => {
    const fields: TreatyFields = {
      title: 'Treaty on the Non-Proliferation of Nuclear Weapons',
      treatyType: 'multilateral',
      openedForSignature: '1 July 1968',
      treatySeries: '',
      enteredIntoForce: '5 March 1970',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Treaty on the Non-Proliferation of Nuclear Weapons*, opened for signature 1 July 1968 (entered into force 5 March 1970).',
    )
  })

  it('treaty series known but opened-for-signature date unknown', () => {
    const fields: TreatyFields = {
      title: 'Example Treaty',
      treatyType: 'multilateral',
      treatySeries: '100 UNTS 1',
      enteredIntoForce: '1 January 2000',
    }
    expect(generateTreatyCitation(fields).footnote).toBe('*Example Treaty*, 100 UNTS 1 (entered into force 1 January 2000).')
  })

  it('no treaty series and not yet in force — just the opened-for-signature date', () => {
    const fields: TreatyFields = {
      title: 'Example Treaty',
      treatyType: 'multilateral',
      openedForSignature: '1 January 2020',
      treatySeries: '',
    }
    expect(generateTreatyCitation(fields).footnote).toBe('*Example Treaty*, opened for signature 1 January 2020.')
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

  it('r 8.3.2 merged form — signed and entered into force on the same date (AGLC4\'s own worked example)', () => {
    // A real, confirmed gap this test fixes: the app used to always emit the two-separate-dates
    // shape ('signed Date, Series (entered into force Date)') even when the two dates were
    // identical — AGLC4 r 8.3.2 explicitly collapses that to 'Series (signed and entered into
    // force Date)' instead, dropping the redundant 'signed Date,' clause entirely.
    const fields: TreatyFields = {
      title: 'Agreement Relating to Co-operation on Antitrust Matters',
      treatyType: 'bilateral',
      parties: ['Australia', 'United States of America'],
      signedDate: '29 June 1982',
      treatySeries: '1369 UNTS 43',
      enteredIntoForce: '29 June 1982',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Agreement Relating to Co-operation on Antitrust Matters*, Australia–United States of America, 1369 UNTS 43 (signed and entered into force 29 June 1982).',
    )
  })

  it('does not merge the dates when they genuinely differ', () => {
    const fields: TreatyFields = {
      title: 'Timor Sea Treaty',
      treatyType: 'bilateral',
      parties: ['Australia', 'East Timor'],
      signedDate: '20 May 2002',
      treatySeries: '2258 UNTS 3',
      enteredIntoForce: '2 April 2003',
    }
    expect(generateTreatyCitation(fields).footnote).toContain('signed 20 May 2002, 2258 UNTS 3 (entered into force 2 April 2003)')
  })

  it('does not apply the merged form to a multilateral (opened-for-signature) treaty even if both dates match', () => {
    // r 8.3.2's merged form is specific to the 'signed by all parties' shape (r 8.3.2's own
    // heading) — AGLC4 defines no equivalent merged form for an 'opened for signature' treaty
    // (r 8.3.1), so this deliberately stays scoped to non-multilateral treaties only.
    const fields: TreatyFields = {
      title: 'Example Treaty',
      treatyType: 'multilateral',
      openedForSignature: '1 January 2000',
      treatySeries: '100 UNTS 1',
      enteredIntoForce: '1 January 2000',
    }
    expect(generateTreatyCitation(fields).footnote).toBe(
      '*Example Treaty*, opened for signature 1 January 2000, 100 UNTS 1 (entered into force 1 January 2000).',
    )
  })
})
