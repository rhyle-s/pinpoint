import { AutofillResult } from './types'

// ohchr.org is genuinely Cloudflare-blocked (see BLOCKED_DATABASES in detect.ts) — no fetch ever
// reaches its content, so no amount of extraction-prompt work can produce a citation for it. For
// this specific, fixed, enumerable set of major international instruments (all explicitly
// requested), the full citation is supplied directly instead of falling through to the generic
// "OHCHR restricts automated access" message — every field below was verified the same way as
// known-treaties.ts (against treaties.un.org's own showDetails page, or at least two independent
// authoritative secondary sources where the primary page wasn't separately fetched), never
// guessed. Matched by URL path rather than by title, since these are recognised before any fetch
// is attempted at all.
const MESSAGE =
  "This exact citation was filled from Pinpoint's own verified reference data, not fetched live — ohchr.org blocks automated access, so this is the one exception where Pinpoint recognises the page by its URL instead."

const KNOWN_OHCHR_INSTRUMENTS: Array<{ path: string; result: AutofillResult }> = [
  {
    path: '/en/instruments-mechanisms/instruments/convention-prevention-and-punishment-crime-genocide',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention on the Prevention and Punishment of the Crime of Genocide',
        treatyType: 'multilateral',
        openedForSignature: '9 December 1948',
        treatySeries: '78 UNTS 277',
        enteredIntoForce: '12 January 1951',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/convention-relating-status-refugees',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention relating to the Status of Refugees',
        treatyType: 'multilateral',
        openedForSignature: '28 July 1951',
        treatySeries: '189 UNTS 137',
        enteredIntoForce: '22 April 1954',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/discrimination-employment-and-occupation-convention-1958-no-111',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Discrimination (Employment and Occupation) Convention, 1958 (No. 111)',
        treatyType: 'multilateral',
        openedForSignature: '25 June 1958',
        treatySeries: '362 UNTS 31',
        enteredIntoForce: '15 June 1960',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/international-convention-elimination-all-forms-racial',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'International Convention on the Elimination of All Forms of Racial Discrimination',
        treatyType: 'multilateral',
        openedForSignature: '21 December 1965',
        treatySeries: '660 UNTS 195',
        enteredIntoForce: '4 January 1969',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/international-covenant-economic-social-and-cultural-rights',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'International Covenant on Economic, Social and Cultural Rights',
        treatyType: 'multilateral',
        openedForSignature: '16 December 1966',
        treatySeries: '993 UNTS 3',
        enteredIntoForce: '3 January 1976',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/international-covenant-civil-and-political-rights',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'International Covenant on Civil and Political Rights',
        treatyType: 'multilateral',
        openedForSignature: '16 December 1966',
        treatySeries: '999 UNTS 171',
        enteredIntoForce: '23 March 1976',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/convention-elimination-all-forms-discrimination-against-women',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention on the Elimination of All Forms of Discrimination against Women',
        treatyType: 'multilateral',
        openedForSignature: '18 December 1979',
        treatySeries: '1249 UNTS 13',
        enteredIntoForce: '3 September 1981',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/convention-against-torture-and-other-cruel-inhuman-or-degrading',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention against Torture and Other Cruel, Inhuman or Degrading Treatment or Punishment',
        treatyType: 'multilateral',
        openedForSignature: '10 December 1984',
        treatySeries: '1465 UNTS 85',
        enteredIntoForce: '26 June 1987',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/indigenous-and-tribal-peoples-convention-1989-no-169',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Indigenous and Tribal Peoples Convention, 1989 (No. 169)',
        treatyType: 'multilateral',
        openedForSignature: '27 June 1989',
        treatySeries: '1650 UNTS 383',
        enteredIntoForce: '5 September 1991',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/international-convention-protection-rights-all-migrant-workers',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title:
          'International Convention on the Protection of the Rights of All Migrant Workers and Members of Their Families',
        treatyType: 'multilateral',
        openedForSignature: '18 December 1990',
        treatySeries: '2220 UNTS 3',
        enteredIntoForce: '1 July 2003',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/convention-rights-persons-disabilities',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention on the Rights of Persons with Disabilities',
        treatyType: 'multilateral',
        openedForSignature: '30 March 2007',
        treatySeries: '2515 UNTS 3',
        enteredIntoForce: '3 May 2008',
      },
    },
  },
  {
    path: '/en/instruments-mechanisms/instruments/convention-rights-child',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'treaty',
        title: 'Convention on the Rights of the Child',
        treatyType: 'multilateral',
        openedForSignature: '20 November 1989',
        treatySeries: '1577 UNTS 3',
        enteredIntoForce: '2 September 1990',
      },
    },
  },
  // The one declaration in this set — no signature/ratification/entry-into-force, adopted by GA
  // resolution vote instead, so it's a unDocument rather than a treaty (see un-documents.ts).
  {
    path: '/en/indigenous-peoples/un-declaration-rights-indigenous-peoples',
    result: {
      detectedSourceType: 'internationalMaterial',
      confidence: 'high',
      message: MESSAGE,
      fields: {
        subtype: 'unDocument',
        title: 'United Nations Declaration on the Rights of Indigenous Peoples',
        resolutionNumber: '61/295',
        unDocSymbol: 'A/RES/61/295',
        date: '2 October 2007',
        adoptedDate: '13 September 2007',
      },
    },
  },
]

/** Returns the pre-verified citation for a known OHCHR instrument URL, if this is one — checked
 *  before ohchr.org's generic Cloudflare-blocked handling so these specific pages short-circuit
 *  straight to a full result instead of the "restricts automated access" message. */
export function matchKnownOHCHRInstrument(input: string): AutofillResult | undefined {
  const lower = input.trim().toLowerCase()
  if (!lower.includes('ohchr.org')) return undefined
  return KNOWN_OHCHR_INSTRUMENTS.find((entry) => lower.includes(entry.path))?.result
}
