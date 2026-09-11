interface KnownTreaty {
  title: string
  treatySeries: string
}

// A small, hand-verified fallback for a treaty's UNTS registration when the source document
// itself doesn't state one — confirmed to be the norm, not the exception, for OHCHR's own plain
// text of a human rights treaty (the UN Treaty Series number is assigned separately, during
// registration, and isn't part of the treaty's own text). A treaty's UNTS citation is a fixed
// public fact once the treaty itself is identified, so this isn't a guess the way inventing one
// from nothing would be — but it only ever fires when ai-extract.ts's own extraction of
// treatySeries from the source content came back empty, and only for an exact title match against
// this list, never a fuzzy one. Every entry below was checked directly against treaties.un.org's
// own showDetails page or a volume's own table of contents (not just a secondary source) —
// verify the same way before adding another; getting a legal citation wrong is worse than leaving
// a field blank for the student to fill in themselves.
const KNOWN_TREATIES: KnownTreaty[] = [
  { title: 'International Covenant on Civil and Political Rights', treatySeries: '999 UNTS 171' },
  { title: 'International Covenant on Economic, Social and Cultural Rights', treatySeries: '993 UNTS 3' },
  { title: 'Convention on the Prevention and Punishment of the Crime of Genocide', treatySeries: '78 UNTS 277' },
  { title: 'Convention relating to the Status of Refugees', treatySeries: '189 UNTS 137' },
  { title: 'Discrimination (Employment and Occupation) Convention, 1958 (No. 111)', treatySeries: '362 UNTS 31' },
  {
    title: 'International Convention on the Elimination of All Forms of Racial Discrimination',
    treatySeries: '660 UNTS 195',
  },
  {
    title: 'Convention on the Elimination of All Forms of Discrimination against Women',
    treatySeries: '1249 UNTS 13',
  },
  {
    title: 'Convention against Torture and Other Cruel, Inhuman or Degrading Treatment or Punishment',
    treatySeries: '1465 UNTS 85',
  },
  { title: 'Indigenous and Tribal Peoples Convention, 1989 (No. 169)', treatySeries: '1650 UNTS 383' },
  {
    title:
      'International Convention on the Protection of the Rights of All Migrant Workers and Members of Their Families',
    treatySeries: '2220 UNTS 3',
  },
  { title: 'Convention on the Rights of Persons with Disabilities', treatySeries: '2515 UNTS 3' },
  { title: 'Convention on the Rights of the Child', treatySeries: '1577 UNTS 3' },
  // A handful of other major, frequently-cited multilateral treaties outside the human rights
  // set above — same verification bar (checked directly against treaties.un.org's own
  // showDetails page for each).
  {
    title: 'Kyoto Protocol to the United Nations Framework Convention on Climate Change',
    treatySeries: '2303 UNTS 162',
  },
  { title: 'Paris Agreement', treatySeries: '3156 UNTS 79' },
  { title: 'United Nations Convention on the Law of the Sea', treatySeries: '1833 UNTS 3' },
  { title: 'Rome Statute of the International Criminal Court', treatySeries: '2187 UNTS 3' },
  { title: 'Vienna Convention on the Law of Treaties', treatySeries: '1155 UNTS 331' },
  { title: 'Vienna Convention on Diplomatic Relations', treatySeries: '500 UNTS 95' },
  { title: 'United Nations Framework Convention on Climate Change', treatySeries: '1771 UNTS 107' },
  { title: 'Montreal Protocol on Substances that Deplete the Ozone Layer', treatySeries: '1522 UNTS 3' },
]

function normalize(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Looks up a well-known multilateral treaty's UNTS citation by title — a last-resort fallback for
 * when the source document itself doesn't state one. Case/whitespace-insensitive but otherwise an
 * exact match only; an unrecognised title returns undefined rather than a fuzzy guess.
 */
export function lookupKnownTreatySeries(title: string): string | undefined {
  const target = normalize(title)
  return KNOWN_TREATIES.find((treaty) => normalize(treaty.title) === target)?.treatySeries
}
