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
})
