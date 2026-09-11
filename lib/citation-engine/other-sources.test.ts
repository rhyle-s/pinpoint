import { describe, expect, it } from 'vitest'
import { generateOtherSourcesCitation, otherSourcesBadge } from './other-sources'
import { OtherSourcesFields } from './types'

// Every example below is AGLC4's own worked example from ch 7 (read directly from the guide PDF,
// including its font data to confirm which elements are actually italicised — plain text
// extraction alone loses italics), not invented.

describe('generateOtherSourcesCitation — dictionary (r 7.6)', () => {
  it('Macquarie Dictionary (5th ed, 2009) ‘demise’ (def 4)', () => {
    const fields: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryEdition: '5th ed',
      dictionaryYear: '2009',
      dictionaryEntryTitle: 'demise',
      dictionaryDefNumber: '4',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Macquarie Dictionary* (5th ed, 2009) ‘demise’ (def 4).')
  })

  it('Chambers Dictionary (13th ed, 2014) ‘éclair’ — no def number, no trailing parenthesis', () => {
    const fields: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Chambers Dictionary',
      dictionaryEdition: '13th ed',
      dictionaryYear: '2014',
      dictionaryEntryTitle: 'éclair',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Chambers Dictionary* (13th ed, 2014) ‘éclair’.')
  })

  it('Oxford English Dictionary (2nd ed, 1989) ‘school’ (v2, def 2b) — entry abbreviation and def number together', () => {
    const fields: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Oxford English Dictionary',
      dictionaryEdition: '2nd ed',
      dictionaryYear: '1989',
      dictionaryEntryTitle: 'school',
      dictionaryEntryAbbrev: 'v2',
      dictionaryDefNumber: '2b',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Oxford English Dictionary* (2nd ed, 1989) ‘school’ (v2, def 2b).')
  })

  it('Macquarie Dictionary (online at 20 February 2018) ‘punctilious’ — online form', () => {
    const fields: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryRetrievalDate: '20 February 2018',
      dictionaryEntryTitle: 'punctilious',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Macquarie Dictionary* (online at 20 February 2018) ‘punctilious’.')
  })

  it('subsequent reference uses the dictionary title, not the specific entry', () => {
    const fields: OtherSourcesFields = {
      subtype: 'dictionary',
      dictionaryTitle: 'Macquarie Dictionary',
      dictionaryEdition: '5th ed',
      dictionaryYear: '2009',
      dictionaryEntryTitle: 'demise',
      dictionaryDefNumber: '4',
    }
    expect(generateOtherSourcesCitation(fields).subsequent).toBe('*Macquarie Dictionary* (n 1).')
  })
})

describe('generateOtherSourcesCitation — legal encyclopedia (r 7.7)', () => {
  it("LexisNexis, Halsbury's Laws of Australia, vol 15 (at 25 May 2009) 235 Insurance, '2 General Principles' [235-270]", () => {
    const fields: OtherSourcesFields = {
      subtype: 'legalEncyclopedia',
      encyclopediaPublisher: 'LexisNexis',
      encyclopediaTitle: 'Halsbury’s Laws of Australia',
      encyclopediaVolume: '15',
      encyclopediaAtDate: '25 May 2009',
      encyclopediaTitleNumber: '235',
      encyclopediaTitleName: 'Insurance',
      encyclopediaChapterNumber: '2',
      encyclopediaChapterName: 'General Principles',
      encyclopediaParagraph: '235-270',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'LexisNexis, *Halsbury’s Laws of Australia*, vol 15 (at 25 May 2009) 235 Insurance, ‘2 General Principles’ [235-270].',
    )
  })

  it("Westlaw AU, The Laws of Australia (online at 15 February 2018) 2 Administrative Law, '2.3 Access to Information' [2.3.10] — online, 'The' kept as part of the actual title", () => {
    const fields: OtherSourcesFields = {
      subtype: 'legalEncyclopedia',
      encyclopediaPublisher: 'Westlaw AU',
      encyclopediaTitle: 'The Laws of Australia',
      encyclopediaRetrievalDate: '15 February 2018',
      encyclopediaTitleNumber: '2',
      encyclopediaTitleName: 'Administrative Law',
      encyclopediaChapterNumber: '2.3',
      encyclopediaChapterName: 'Access to Information',
      encyclopediaParagraph: '2.3.10',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Westlaw AU, *The Laws of Australia* (online at 15 February 2018) 2 Administrative Law, ‘2.3 Access to Information’ [2.3.10].',
    )
  })

  it("LexisNexis, Halsbury's Law of England (online at 20 February 2018) Equitable Jurisdiction, '4 Principles of Equitable Jurisdiction' [101] — no title number", () => {
    const fields: OtherSourcesFields = {
      subtype: 'legalEncyclopedia',
      encyclopediaPublisher: 'LexisNexis',
      encyclopediaTitle: 'Halsbury’s Law of England',
      encyclopediaRetrievalDate: '20 February 2018',
      encyclopediaTitleName: 'Equitable Jurisdiction',
      encyclopediaChapterNumber: '4',
      encyclopediaChapterName: 'Principles of Equitable Jurisdiction',
      encyclopediaParagraph: '101',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'LexisNexis, *Halsbury’s Law of England* (online at 20 February 2018) Equitable Jurisdiction, ‘4 Principles of Equitable Jurisdiction’ [101].',
    )
  })
})

describe('generateOtherSourcesCitation — speech (r 7.3)', () => {
  it('Justice Dyson Heydon, ‘Threats to Judicial Independence: The Enemy Within’ (Speech, Inner Temple, 23 January 2012)', () => {
    const fields: OtherSourcesFields = {
      subtype: 'speech',
      speechAuthor: 'Justice Dyson Heydon',
      speechTitle: 'Threats to Judicial Independence: The Enemy Within',
      speechForum: 'Inner Temple',
      speechDate: '23 January 2012',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Justice Dyson Heydon, ‘Threats to Judicial Independence: The Enemy Within’ (Speech, Inner Temple, 23 January 2012).',
    )
  })

  it('Virginia Bell, ‘Section 80: The Great Constitutional Tautology’ (Lucinda Lecture, Monash University, 24 October 2013) — named lecture replaces the literal word Speech', () => {
    const fields: OtherSourcesFields = {
      subtype: 'speech',
      speechAuthor: 'Virginia Bell',
      speechTitle: 'Section 80: The Great Constitutional Tautology',
      speechLabel: 'Lucinda Lecture',
      speechForum: 'Monash University',
      speechDate: '24 October 2013',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Virginia Bell, ‘Section 80: The Great Constitutional Tautology’ (Lucinda Lecture, Monash University, 24 October 2013).',
    )
  })

  it("subsequent reference is prefixed with the speaker's surname, not left bare — caught live by the AI validator against an earlier version of this formatter with no author prefix at all", () => {
    const fields: OtherSourcesFields = {
      subtype: 'speech',
      speechAuthor: 'Justice Michael Kirby',
      speechTitle: 'But the Greatest of These is Love',
      speechForum: 'Griffith University',
      speechDate: '16 December 2008',
    }
    expect(generateOtherSourcesCitation(fields).subsequent).toBe('Kirby, ‘But the Greatest of These is Love’ (n 1).')
  })
})

describe('generateOtherSourcesCitation — press and media releases (r 7.4)', () => {
  it('Department of Defence (Cth), ‘Highest East Timorese Honour for Army Officers’ (Media Release MSPA 172/09, 22 May 2009) — author is also the body, so body is omitted', () => {
    const fields: OtherSourcesFields = {
      subtype: 'pressRelease',
      pressReleaseAuthor: 'Department of Defence (Cth)',
      pressReleaseTitle: 'Highest East Timorese Honour for Army Officers',
      pressReleaseType: 'Media Release',
      pressReleaseDocumentNumber: 'MSPA 172/09',
      pressReleaseBody: 'Department of Defence (Cth)',
      pressReleaseDate: '22 May 2009',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Department of Defence (Cth), ‘Highest East Timorese Honour for Army Officers’ (Media Release MSPA 172/09, 22 May 2009).',
    )
  })

  it('ASX, ‘ASX Selects Distributed Ledger Technology to Replace CHESS’ (Media Release, 7 December 2017) 1 — default release type, with pinpoint', () => {
    const fields: OtherSourcesFields = {
      subtype: 'pressRelease',
      pressReleaseAuthor: 'ASX',
      pressReleaseTitle: 'ASX Selects Distributed Ledger Technology to Replace CHESS',
      pressReleaseDate: '7 December 2017',
      pinpoint: '1',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'ASX, ‘ASX Selects Distributed Ledger Technology to Replace CHESS’ (Media Release, 7 December 2017) 1.',
    )
  })

  it('subsequent reference reuses the full organisational author name, not a nonsensical "surname"', () => {
    const fields: OtherSourcesFields = {
      subtype: 'pressRelease',
      pressReleaseAuthor: 'Department of Defence (Cth)',
      pressReleaseTitle: 'Highest East Timorese Honour for Army Officers',
      pressReleaseDate: '22 May 2009',
    }
    expect(generateOtherSourcesCitation(fields).subsequent).toBe(
      'Department of Defence (Cth), ‘Highest East Timorese Honour for Army Officers’ (n 1).',
    )
  })
})

describe('generateOtherSourcesCitation — Australian Bureau of Statistics materials (r 7.1.5)', () => {
  it('Australian Bureau of Statistics, Corrective Services, Australia, September Quarter 2017 (Catalogue No 4512.0, 30 November 2017)', () => {
    const fields: OtherSourcesFields = {
      subtype: 'abs',
      absTitle: 'Corrective Services, Australia, September Quarter 2017',
      absCatalogueNumber: '4512.0',
      absDate: '30 November 2017',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Australian Bureau of Statistics, *Corrective Services, Australia, September Quarter 2017* (Catalogue No 4512.0, 30 November 2017).',
    )
  })

  it('Australian Bureau of Statistics: Annual Report, 2016–17 (Catalogue No 1001.0, 19 October 2017) 16–17 — with pinpoint', () => {
    const fields: OtherSourcesFields = {
      subtype: 'abs',
      absTitle: 'Australian Bureau of Statistics: Annual Report, 2016–17',
      absCatalogueNumber: '1001.0',
      absDate: '19 October 2017',
      pinpoint: '16–17',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Australian Bureau of Statistics, *Australian Bureau of Statistics: Annual Report, 2016–17* (Catalogue No 1001.0, 19 October 2017) 16–17.',
    )
  })

  it('the author is always the fixed literal string, never student-entered', () => {
    const fields: OtherSourcesFields = { subtype: 'abs', absTitle: 'Year Book Queensland, 1901', absCatalogueNumber: '1301.3', absDate: '23 December 1901' }
    expect(generateOtherSourcesCitation(fields).footnote.startsWith('Australian Bureau of Statistics,')).toBe(true)
  })
})

describe('generateOtherSourcesCitation — film, television and other media (r 7.14)', () => {
  it('Blade Runner: The Final Cut (Ladd Company, 2007) — version integral to the title, no separate version-details parenthetical', () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'film',
      mediaTitle: 'Blade Runner: The Final Cut',
      mediaStudio: 'Ladd Company',
      mediaDate: '2007',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Blade Runner: The Final Cut* (Ladd Company, 2007).')
  })

  it('Donnie Darko (Director’s Cut, Newmarket Films, 2004) — non-standard version as its own element', () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'film',
      mediaTitle: 'Donnie Darko',
      mediaVersionDetails: 'Director’s Cut',
      mediaStudio: 'Newmarket Films',
      mediaDate: '2004',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*Donnie Darko* (Director’s Cut, Newmarket Films, 2004).')
  })

  it('The Dark Knight (Warner Brothers Pictures, 2008) 0:54:58–0:55:11 — bare-space time pinpoint, no comma', () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'film',
      mediaTitle: 'The Dark Knight',
      mediaStudio: 'Warner Brothers Pictures',
      mediaDate: '2008',
      pinpoint: '0:54:58–0:55:11',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('*The Dark Knight* (Warner Brothers Pictures, 2008) 0:54:58–0:55:11.')
  })

  it("'The Paradise Papers', Four Corners (Australian Broadcasting Corporation, 2017) 0:40:00–0:45:00 <url> — TV episode with real title", () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'tvSeries',
      mediaEpisodeTitle: 'The Paradise Papers',
      mediaTitle: 'Four Corners',
      mediaStudio: 'Australian Broadcasting Corporation',
      mediaDate: '2017',
      pinpoint: '0:40:00–0:45:00',
      mediaUrl: 'http://www.abc.net.au/4corners/the-paradise-papers/9124930',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      '‘The Paradise Papers’, *Four Corners* (Australian Broadcasting Corporation, 2017) 0:40:00–0:45:00 <http://www.abc.net.au/4corners/the-paradise-papers/9124930>.',
    )
  })

  it("'Season 9, Episode 10', Gruen (Australian Broadcasting Corporation, 2017) — numbered-by-season episode with no title of its own", () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'tvSeries',
      mediaEpisodeTitle: 'Season 9, Episode 10',
      mediaTitle: 'Gruen',
      mediaStudio: 'Australian Broadcasting Corporation',
      mediaDate: '2017',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe('‘Season 9, Episode 10’, *Gruen* (Australian Broadcasting Corporation, 2017).')
  })

  it("'S02 Episode 07: Hindsight, Part 1', Serial (This American Life, 18 February 2016) — podcast, full date not just a year", () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'radioOrPodcast',
      mediaEpisodeTitle: 'S02 Episode 07: Hindsight, Part 1',
      mediaTitle: 'Serial',
      mediaStudio: 'This American Life',
      mediaDate: '18 February 2016',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      '‘S02 Episode 07: Hindsight, Part 1’, *Serial* (This American Life, 18 February 2016).',
    )
  })

  it('subsequent reference prefers the quoted episode title over the italicised series title when both exist', () => {
    const fields: OtherSourcesFields = {
      subtype: 'filmOrMedia',
      mediaFormat: 'tvSeries',
      mediaEpisodeTitle: 'The Paradise Papers',
      mediaTitle: 'Four Corners',
      mediaStudio: 'Australian Broadcasting Corporation',
      mediaDate: '2017',
    }
    expect(generateOtherSourcesCitation(fields).subsequent).toBe('‘The Paradise Papers’ (n 1).')
  })
})

describe('generateOtherSourcesCitation — social media posts (r 7.16)', () => {
  it("Brooking Creative Labs, 'Is America Dreaming?: Understanding Social Mobility' (YouTube, 20 July 2015) 00:00:00–00:01:00 <url>", () => {
    const fields: OtherSourcesFields = {
      subtype: 'socialMedia',
      socialMediaUsername: 'Brooking Creative Labs',
      socialMediaTitle: 'Is America Dreaming?: Understanding Social Mobility',
      socialMediaPlatform: 'YouTube',
      socialMediaDate: '20 July 2015',
      pinpoint: '00:00:00–00:01:00',
      socialMediaUrl: 'https://www.youtube.com/watch?v=vG6-UaBECN4',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'Brooking Creative Labs, ‘Is America Dreaming?: Understanding Social Mobility’ (YouTube, 20 July 2015) 00:00:00–00:01:00 <https://www.youtube.com/watch?v=vG6-UaBECN4>.',
    )
  })

  it('chapteriiibestbits (Instagram, 21 July 2016 AEST) <url> — no title, no real name, timezone but no separate time', () => {
    const fields: OtherSourcesFields = {
      subtype: 'socialMedia',
      socialMediaUsername: 'chapteriiibestbits',
      socialMediaPlatform: 'Instagram',
      socialMediaDate: '21 July 2016',
      socialMediaTimeZone: 'AEST',
      socialMediaUrl: 'https://www.instagram.com/p/BIICBevgk31',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      'chapteriiibestbits (Instagram, 21 July 2016 AEST) <https://www.instagram.com/p/BIICBevgk31>.',
    )
  })

  it('@s_m_stephenson (Scott Stephenson) (Twitter, 17 July 2017, 9:37pm AEST) <url> — real name, date, time, and timezone together', () => {
    const fields: OtherSourcesFields = {
      subtype: 'socialMedia',
      socialMediaUsername: '@s_m_stephenson',
      socialMediaRealName: 'Scott Stephenson',
      socialMediaPlatform: 'Twitter',
      socialMediaDate: '17 July 2017',
      socialMediaTime: '9:37pm',
      socialMediaTimeZone: 'AEST',
      socialMediaUrl: 'https://twitter.com/s_m_stephenson/status/887169425551441921',
    }
    expect(generateOtherSourcesCitation(fields).footnote).toBe(
      '@s_m_stephenson (Scott Stephenson) (Twitter, 17 July 2017, 9:37pm AEST) <https://twitter.com/s_m_stephenson/status/887169425551441921>.',
    )
  })

  it('subsequent reference falls back to the bare username when there is no title', () => {
    const fields: OtherSourcesFields = {
      subtype: 'socialMedia',
      socialMediaUsername: 'chapteriiibestbits',
      socialMediaPlatform: 'Instagram',
      socialMediaDate: '21 July 2016',
      socialMediaTimeZone: 'AEST',
    }
    expect(generateOtherSourcesCitation(fields).subsequent).toBe('chapteriiibestbits (n 1).')
  })
})

describe('otherSourcesBadge', () => {
  it('gives a fixed label for most subtypes', () => {
    expect(otherSourcesBadge({ subtype: 'dictionary' })).toBe('Dictionary')
    expect(otherSourcesBadge({ subtype: 'legalEncyclopedia' })).toBe('Legal Encyclopedia')
    expect(otherSourcesBadge({ subtype: 'speech' })).toBe('Speech')
    expect(otherSourcesBadge({ subtype: 'pressRelease' })).toBe('Press/Media Release')
    expect(otherSourcesBadge({ subtype: 'abs' })).toBe('ABS Materials')
    expect(otherSourcesBadge({ subtype: 'socialMedia' })).toBe('Social Media Post')
  })

  it('names the specific media format for filmOrMedia', () => {
    expect(otherSourcesBadge({ subtype: 'filmOrMedia', mediaFormat: 'film' })).toBe('Film/Other Media')
    expect(otherSourcesBadge({ subtype: 'filmOrMedia', mediaFormat: 'tvSeries' })).toBe('Television')
    expect(otherSourcesBadge({ subtype: 'filmOrMedia', mediaFormat: 'radioOrPodcast' })).toBe('Radio/Podcast')
  })
})
