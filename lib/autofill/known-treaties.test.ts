import { describe, expect, it } from 'vitest'
import { lookupKnownTreatySeries } from './known-treaties'

describe('lookupKnownTreatySeries', () => {
  it('finds ICESCR by its exact title', () => {
    expect(lookupKnownTreatySeries('International Covenant on Economic, Social and Cultural Rights')).toBe(
      '993 UNTS 3',
    )
  })

  it('finds ICCPR by its exact title', () => {
    expect(lookupKnownTreatySeries('International Covenant on Civil and Political Rights')).toBe('999 UNTS 171')
  })

  it('matches case- and whitespace-insensitively', () => {
    expect(lookupKnownTreatySeries('  convention on the rights of the child  ')).toBe('1577 UNTS 3')
  })

  it('returns undefined for an unrecognised title rather than guessing', () => {
    expect(lookupKnownTreatySeries('Treaty on the Non-Proliferation of Nuclear Weapons')).toBeUndefined()
  })

  it('returns undefined for a title that only partially matches', () => {
    expect(lookupKnownTreatySeries('International Covenant on Civil and Political Rights (Optional Protocol)')).toBeUndefined()
  })

  it.each([
    ['Kyoto Protocol to the United Nations Framework Convention on Climate Change', '2303 UNTS 162'],
    ['Paris Agreement', '3156 UNTS 79'],
    ['United Nations Convention on the Law of the Sea', '1833 UNTS 3'],
    ['Rome Statute of the International Criminal Court', '2187 UNTS 3'],
    ['Vienna Convention on the Law of Treaties', '1155 UNTS 331'],
    ['Vienna Convention on Diplomatic Relations', '500 UNTS 95'],
    ['United Nations Framework Convention on Climate Change', '1771 UNTS 107'],
    ['Montreal Protocol on Substances that Deplete the Ozone Layer', '1522 UNTS 3'],
  ])('finds %s', (title, series) => {
    expect(lookupKnownTreatySeries(title)).toBe(series)
  })
})
