import { describe, expect, it } from 'vitest'
import { generateReportCitation } from './reports'
import { ReportFields } from './types'

describe('generateReportCitation', () => {
  it('Australian Law Reform Commission — with series number', () => {
    const fields: ReportFields = {
      authors: ['Australian Law Reform Commission'],
      title: 'Traditional Rights and Freedoms',
      documentType: 'Report',
      seriesNumber: 'Report No 129',
      date: 'December 2015',
      pinpoint: '45',
    }
    expect(generateReportCitation(fields).footnote).toBe(
      'Australian Law Reform Commission, *Traditional Rights and Freedoms* (Report No 129, December 2015) 45.',
    )
  })

  it('Royal Commission — no series number, multi-part pinpoint', () => {
    const fields: ReportFields = {
      authors: ['Royal Commission into Aged Care Quality and Safety'],
      title: 'Final Report: Care, Dignity and Respect',
      documentType: 'Report',
      date: 'March 2021',
      pinpoint: 'vol 1, 22',
    }
    expect(generateReportCitation(fields).footnote).toBe(
      'Royal Commission into Aged Care Quality and Safety, *Final Report: Care, Dignity and Respect* (Report, March 2021) vol 1, 22.',
    )
  })

  it('Closing the Gap — no author', () => {
    const fields: ReportFields = {
      title: "Closing the Gap: Prime Minister's Report 2021",
      documentType: 'Report',
      date: '2021',
      pinpoint: '12',
    }
    expect(generateReportCitation(fields).footnote).toBe(
      "*Closing the Gap: Prime Minister's Report 2021* (Report, 2021) 12.",
    )
  })

  it('includes the URL when present, after the parenthetical', () => {
    const fields: ReportFields = {
      authors: ['CISCO'],
      title: 'Providing the critical infrastructure for the AI era',
      documentType: 'Annual Report',
      date: '2025',
      url: 'https://www.cisco.com/c/dam/en_us/about/annual-report/2025-cisco-full-annual-report.pdf',
    }
    const result = generateReportCitation(fields)
    expect(result.footnote).toBe(
      'CISCO, *Providing the critical infrastructure for the AI era* (Annual Report, 2025) <https://www.cisco.com/c/dam/en_us/about/annual-report/2025-cisco-full-annual-report.pdf>.',
    )
    expect(result.bibliography).toBe(
      'CISCO, *Providing the critical infrastructure for the AI era* (Annual Report, 2025) <https://www.cisco.com/c/dam/en_us/about/annual-report/2025-cisco-full-annual-report.pdf>',
    )
  })

  it('omits the URL entirely from the subsequent reference, and uses the title alone — not the body author\'s name', () => {
    // AGLC4 r 1.4.1's own worked example for a body-authored report (the ALRC's 'Traditional
    // Rights and Freedoms') drops the author entirely in the subsequent reference — a body has no
    // 'surname' to extract, so title-only is the correct, safe default here (see reports.ts).
    const fields: ReportFields = {
      authors: ['Woolworths Group'],
      title: 'Sustainability Report',
      documentType: 'Report',
      date: '2025',
      url: 'https://example.com/report.pdf',
    }
    expect(generateReportCitation(fields).subsequent).toBe('*Sustainability Report* (n 1).')
  })

  it('omits the URL when not present, matching prior behaviour', () => {
    const fields: ReportFields = {
      authors: ['Australian Law Reform Commission'],
      title: 'Traditional Rights and Freedoms',
      documentType: 'Report',
      seriesNumber: 'Report No 129',
      date: 'December 2015',
    }
    expect(generateReportCitation(fields).footnote).toBe(
      'Australian Law Reform Commission, *Traditional Rights and Freedoms* (Report No 129, December 2015).',
    )
  })
})
