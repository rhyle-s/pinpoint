import { describe, expect, it } from 'vitest'
import { generateNewspaperCitation } from './newspapers'
import { NewspaperFields } from './types'

describe('generateNewspaperCitation', () => {
  it('ABC News — two bylined authors', () => {
    const fields: NewspaperFields = {
      authors: ['Isobel Roe', 'Jamie McKinnell'],
      articleTitle: 'Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault',
      newspaperName: 'ABC News',
      date: '17 August 2026',
      url: 'https://www.abc.net.au/news/2026-08-17/alan-jones-complainant-c-ray-hadley-peter-fitzsimons/107045376',
    }
    const result = generateNewspaperCitation(fields)
    expect(result.footnote).toBe(
      'Isobel Roe and Jamie McKinnell, ‘Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault’, *ABC News* (online, 17 August 2026) <https://www.abc.net.au/news/2026-08-17/alan-jones-complainant-c-ray-hadley-peter-fitzsimons/107045376>.',
    )
    expect(result.bibliography).toBe(
      'Roe, Isobel and Jamie McKinnell, ‘Former Alan Jones colleague recalls telling rival Ray Hadley of alleged indecent assault’, *ABC News* (online, 17 August 2026) <https://www.abc.net.au/news/2026-08-17/alan-jones-complainant-c-ray-hadley-peter-fitzsimons/107045376>',
    )
    expect(result.sourceType).toBe('newspaper')
  })

  it('omits the author entirely for an unbylined report', () => {
    const fields: NewspaperFields = {
      articleTitle: 'Reserve Bank holds interest rates steady at August meeting',
      newspaperName: 'The Sydney Morning Herald',
      date: '5 August 2026',
      url: 'https://www.smh.com.au/business/economy/example-article',
    }
    expect(generateNewspaperCitation(fields).footnote).toBe(
      '‘Reserve Bank holds interest rates steady at August meeting’, *The Sydney Morning Herald* (online, 5 August 2026) <https://www.smh.com.au/business/economy/example-article>.',
    )
  })

  it('includes a pinpoint before the URL', () => {
    const fields: NewspaperFields = {
      authors: ['Jane Reporter'],
      articleTitle: 'An Article Title',
      newspaperName: 'The Age',
      date: '1 January 2026',
      url: 'https://example.com/article',
      pinpoint: '3',
    }
    expect(generateNewspaperCitation(fields).footnote).toBe(
      'Jane Reporter, ‘An Article Title’, *The Age* (online, 1 January 2026), 3 <https://example.com/article>.',
    )
  })

  it('subsequent reference omits the newspaper name, URL, and (by AGLC4 r 1.4.1\'s own default) the title — bare surname only', () => {
    const fields: NewspaperFields = {
      authors: ['Jane Reporter'],
      articleTitle: 'An Article Title',
      newspaperName: 'The Age',
      date: '1 January 2026',
      url: 'https://example.com/article',
    }
    expect(generateNewspaperCitation(fields).subsequent).toBe('Reporter (n 1).')
  })

  it('subsequent reference includes the title when the student has explicitly set a short title, signalling disambiguation is needed', () => {
    const fields: NewspaperFields = {
      authors: ['Jane Reporter'],
      articleTitle: 'An Article Title',
      newspaperName: 'The Age',
      date: '1 January 2026',
      url: 'https://example.com/article',
      shortTitle: 'An Article Title',
    }
    expect(generateNewspaperCitation(fields).subsequent).toBe('Reporter, ‘An Article Title’ (n 1).')
  })

  it('subsequent reference uses the title alone for an unbylined article', () => {
    const fields: NewspaperFields = {
      articleTitle: 'An Article Title',
      newspaperName: 'The Age',
      date: '1 January 2026',
      url: 'https://example.com/article',
    }
    expect(generateNewspaperCitation(fields).subsequent).toBe('‘An Article Title’ (n 1).')
  })
})
