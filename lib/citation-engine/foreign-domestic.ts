import { CitationResult, ForeignCategory, ForeignCountry, InternationalMaterialFields } from './types'
import { getBracketType } from './report-series'
import { ensureFullStop, formatPinpoint, italicize, joinParts, stripTrailingFullStop, wrapParens } from './utils'

/**
 * Foreign Domestic Sources (AGLC4 Part V) — Canada, New Zealand, the United Kingdom, the United
 * States, Hong Kong, Malaysia, Singapore, and South Africa. China/France/Germany are deliberately
 * NOT covered here — AGLC4 cites those in a fundamentally different shape (original-language text
 * with bracketed English translations, guillemets, no italics on non-English titles) that doesn't
 * fit this Latin-script field/form pattern; that's a separate follow-up.
 *
 * Every rule number and example cited in comments below is taken directly from the actual AGLC4
 * text (Melbourne Law School's own PDF), not memory. Where AGLC4 says a category is "cited in
 * accordance with chapter 2" (cases) or "rule 3.1"/"chapter 3" (legislation) with no explicit
 * italics exception, this follows the same italicisation this app's own domestic case/legislation
 * engines already apply for those same base rules (cases.ts/legislation.ts) — PDF text extraction
 * strips font styling, so italics can't be directly observed in the source examples, only inferred
 * from which base rule a chapter says to follow.
 */

function stripLeadingThe(title: string): string {
  return title.replace(/^the\s+/i, '')
}

/** Shared by every "chapter 2"-style foreign case format (Canada/NZ/UK/HK/Malaysia/Singapore/South
 *  Africa) — judge and court name are independent, both-optional trailing parentheticals, shown
 *  separately rather than merged (eg NZ's own example: '... (Randerson and Neazor JJ) (High
 *  Court).'). */
function trailingParens(judge?: string, courtName?: string): string {
  const judgePart = judge ? ` (${judge})` : ''
  const courtPart = courtName ? ` (${courtName})` : ''
  return `${judgePart}${courtPart}`
}

/** The shared "chapter 2" reported-case core (Case Name (Year) Volume ReportAbbr StartingPage) —
 *  used by every country below whose AGLC4 chapter says cases are "cited in accordance with
 *  chapter 2", with the bracket type resolved per-country (most via the shared report-series
 *  lookup, Malaysia via its own date-branch — see formatMalaysiaCase). */
function chapterTwoCase(fields: InternationalMaterialFields, bracket: 'round' | 'square'): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const yearPart = bracket === 'round' ? `(${fields.year ?? ''})` : `[${fields.year ?? ''}]`
  const core = joinParts([yearPart, fields.volume, fields.reportAbbreviation, fields.startingPage])
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const trailing = trailingParens(fields.judge, fields.courtName)

  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${titleItalic} ${core}${pinpointPart}${trailing}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    bibliography: stripTrailingFullStop(`${titleItalic} ${core}`),
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}

/**
 * Unreported cases with a medium neutral citation (r 2.3.1, incorporated by every Foreign
 * Domestic Sources jurisdiction that cites cases "in accordance with chapter 2" — NZ r 21.1.3, UK
 * r 24.1.5, Malaysia r 20.1.2 and Singapore r 22.1.3 all confirm this by name, each with their own
 * table of valid unique court identifiers this app doesn't enforce). Case Name [Year] CourtCode
 * CaseNumber, Pinpoint (Judge) — mirrors cases.ts's own domestic formatUnreportedMnc exactly,
 * since AGLC4 itself just points back to r 2.3.1 rather than defining a separate shape.
 */
function chapterTwoUnreportedMnc(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const citationCore = joinParts([`[${fields.year ?? ''}]`, fields.foreignCourtCode, fields.foreignCaseNumber])
  const pinpointPart = formatPinpoint(fields.pinpoint, 'paragraph')
  const judgePart = fields.judge ? ` (${fields.judge})` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${titleItalic} ${citationCore}${pinpointPart}${judgePart}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    bibliography: stripTrailingFullStop(`${titleItalic} ${citationCore}`),
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}

/**
 * Unreported cases without a medium neutral citation (r 2.3.2, incorporated the same way as
 * above). Case Name (Court, Judge, Full Date) Pinpoint — the pinpoint is a BARE space with no
 * comma before it, confirmed by AGLC4's own r 2.3.2 rule text ("There should be no punctuation
 * between the closing parenthesis of the full date and any pinpoint") and mirrored exactly from
 * cases.ts's own domestic formatUnreportedNoMnc. Reuses the shared `courtName` field for the
 * court, the same field the reported chapterTwoCase format uses for its own trailing court-name
 * parenthetical (a different code path, so no conflict).
 */
function chapterTwoUnreportedNoMnc(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const parenthetical = wrapParens(joinParts([fields.courtName, fields.judge, fields.date], ', '))
  const pinpointPart = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${titleItalic} ${parenthetical}${pinpointPart}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    bibliography: stripTrailingFullStop(`${titleItalic} ${parenthetical}`),
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}

/**
 * Dispatches a "chapter 2"-style foreign case (reported or either unreported form) — shared by
 * every country below except the US, which has its own genuinely distinct formats for both
 * (formatUSCase/formatUSUnreportedCase, r 25.1/25.1.7).
 */
function chapterTwoCaseAnyReportType(fields: InternationalMaterialFields, bracket: 'round' | 'square'): CitationResult {
  if (fields.foreignCaseReportType === 'unreported-mnc') return chapterTwoUnreportedMnc(fields)
  if (fields.foreignCaseReportType === 'unreported-no-mnc') return chapterTwoUnreportedNoMnc(fields)
  return chapterTwoCase(fields, bracket)
}

/** A bare, non-comma pinpoint suffix — the general AGLC4 r 3.1 legislation-pinpoint convention
 *  (no comma before eg 's 7'), confirmed against Malaysia/Singapore/South Africa's own worked
 *  examples ('Copyright Act 1987 (Malaysia) s 7.', 'Adoption of Children Act (Singapore, cap 4,
 *  1985 rev ed) s 5.'). Canada/NZ/UK are the exceptions — each has its own explicit "preceded by a
 *  comma" sub-rule (r 15.2.5, r 24.2.5, confirmed by NZ's own r 21.2.2 example) — so those three
 *  use the ordinary comma-prefixed formatPinpoint() instead. */
function bareSpacePinpoint(pinpoint?: string): string {
  return pinpoint ? ` ${pinpoint.trim()}` : ''
}

function subsequentAndSourceType(fields: InternationalMaterialFields, pinpointPart: string) {
  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'
  return {
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    sourceType: 'internationalMaterial' as const,
    validationStatus: 'unvalidated' as const,
  }
}

// ---------------------------------------------------------------------------------------------
// Canada (AGLC4 ch 15)
// ---------------------------------------------------------------------------------------------

/** r 15.1 — Canadian cases cited in accordance with chapter 2, eg 'R v Sharpe [2001] 1 SCR 45.' */
function formatCanadaCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 15.2 — Title, StatuteVolumeType+Jurisdiction Year[(SessionOrSupp)], c Chapter, Pinpoint.
 *  Eg '*Privacy Act*, RSC 1985, c P-21' / '*Criminal Law Amendment Act*, RSC 1985 (1st Supp), c
 *  27.' 'The' is stripped from the title (r 15.2.1). r 15.2.1 says the title 'should adhere to
 *  rule 3.1.1' (the same italics convention every ordinary Act title gets) 'but should be
 *  followed by a (non-italic) comma' — that clause is calling out the trailing comma specifically
 *  as a deliberate exception, not saying the title itself is plain; confirmed by every other
 *  Foreign Domestic Sources legislation formatter in this file (NZ/UK/Hong Kong/Malaysia/
 *  Singapore/South Africa) already italicising its own title the same way. A first version of this
 *  function misread that clause as "don't italicise the title at all" — caught live by the user
 *  (correct citation content, but titles rendering in plain roman text). */
function formatCanadaLegislation(fields: InternationalMaterialFields): CitationResult {
  const title = italicize(stripLeadingThe(fields.title ?? ''))
  // Defaults to 'RS', matching ForeignDomesticForm.tsx's select — which visually shows 'RS'
  // selected from the start, so the citation output must agree even before the student has
  // actively touched that field.
  const volumeAndJurisdiction = `${fields.canadaStatuteVolumeType ?? 'RS'}${fields.canadaJurisdictionAbbrev ?? ''}`
  const sessionSuffix = fields.canadaSessionOrSupp ? ` (${fields.canadaSessionOrSupp})` : ''
  const core = `${title}, ${joinParts([volumeAndJurisdiction, fields.year])}${sessionSuffix}, c ${fields.canadaChapter ?? ''}`
  const pinpointPart = formatPinpoint(fields.pinpoint)

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// New Zealand (AGLC4 ch 21)
// ---------------------------------------------------------------------------------------------

/** r 21.1 — New Zealand cases cited in accordance with chapter 2, eg 'Haylock v Patek [2009] 1
 *  NZLR 351.' */
function formatNZCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 21.2.1 — [Title Year] (NZ) Pinpoint, eg 'Habeas Corpus Act 2001 (NZ).' Title+year adhere to
 *  r 3.1 (in full, per the rule text), so italicised like ordinary domestic legislation. */
function formatNZLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([fields.title, fields.year]))
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${titleYearItalic} (NZ)`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** r 21.2.2 — [Title Year] (NZ) SR Year/Number, Pinpoint, eg 'Electronic Transactions Regulations
 *  2003 (NZ) SR 2003/288, reg 4.' */
function formatNZDelegatedLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([fields.title, fields.year]))
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${titleYearItalic} (NZ) SR ${fields.nzStatutoryRuleNumber ?? ''}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// United Kingdom (AGLC4 ch 24)
// ---------------------------------------------------------------------------------------------

/** r 24.1 — UK cases cited in accordance with chapter 2. 'plc' and the 'R (Party)' judicial-review
 *  construction (r 24.1.1) are conventions the case name should already reflect as typed — not
 *  auto-transformed here, same as this app never auto-transforms author names into AGLC4 form. */
function formatUKCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

const UK_JURISDICTION_LABEL: Record<Exclude<NonNullable<InternationalMaterialFields['ukJurisdiction']>, 'none'>, string> = {
  UK: 'UK',
  NI: 'NI',
  Scot: 'Scot',
  Wales: 'Wales',
  Imp: 'Imp',
}

/** r 24.2 — [Title Year][ (Jurisdiction)|,][ RegnalYear, c NumberValue], Pinpoint. Eg 'Human
 *  Rights Act 1998 (UK) s 6(1).' / 'Factories Act 1961, 9 & 10 Eliz 2, c 34.' (pre-1963, no
 *  jurisdiction bracket, so the title takes a non-italic comma instead — r 24.2.2). 'The' is
 *  stripped from the title (r 24.2.1) — confirmed necessary live: legislation.gov.uk's own
 *  <title> tag includes it for at least some Acts/instruments (eg 'The Fertilisers (Amendment)
 *  Regulations 1998'), so a naive autofill would otherwise carry it straight through.
 *
 *  r 24.2.3: the regnal year and chapter number are included ONLY for statutes enacted before
 *  1 January 1963 — confirmed by every one of r 24.2.2's own worked examples for a post-1963
 *  UK/NI/Scot/Wales statute, none of which carries any number at all. Gated here on `ukRegnalYear`
 *  being set, since that's the only signal a pre-1963 citation is intended (a real, confirmed bug
 *  in an earlier version of this function always rendered a fabricated chapter/'asp'/'nawm'/'anaw'/
 *  'asc' number regardless of era — see the field comments in types.ts).
 *
 *  r 24.2.4: the comma before a pinpoint is itself conditional on the chapter being present too —
 *  'Pinpoint references should adhere to rules 3.1.4–3.1.6. However, where the regnal year and
 *  chapter of a statute is given, they should be preceded by a comma.' Ie a post-1963 citation
 *  takes a bare-space pinpoint like ordinary domestic legislation ('... (UK) s 6(1).', no comma),
 *  while a pre-1963 one takes the comma-prefixed form ('..., 9 & 10 Eliz 2, c 34, s 3.'). A first
 *  version of this fix (after removing the fabricated chapter number above) still always used the
 *  comma-prefixed form regardless, confirmed wrong against AGLC4's own 'Human Rights Act 1998
 *  (UK) s 6(1).' example. */
function formatUKLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([stripLeadingThe(fields.title ?? ''), fields.year]))
  const jurisdiction = fields.ukJurisdiction ?? 'UK'
  const jurisdictionPart = jurisdiction === 'none' ? ',' : ` (${UK_JURISDICTION_LABEL[jurisdiction]})`
  const numberPart = fields.ukRegnalYear ? ` ${fields.ukRegnalYear}, c ${fields.ukNumberValue ?? ''}` : ''
  const pinpointPart = fields.ukRegnalYear ? formatPinpoint(fields.pinpoint) : bareSpacePinpoint(fields.pinpoint)
  const core = `${titleYearItalic}${jurisdictionPart}${numberPart}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/** r 24.3 — [Title Year] (Jurisdiction) InstrumentType Year/Number, Pinpoint. Eg 'Fertilisers
 *  (Amendment) Regulations 1998 (UK) SI 1998/2024.' [Not: 'The Fertilisers ...'] — 'The' stripped
 *  the same way r 24.2.1 requires for ordinary legislation, see formatUKLegislation. */
function formatUKDelegatedLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([stripLeadingThe(fields.title ?? ''), fields.year]))
  const jurisdiction = fields.ukJurisdiction ?? 'UK'
  const jurisdictionPart = jurisdiction === 'none' ? '' : ` (${UK_JURISDICTION_LABEL[jurisdiction as Exclude<typeof jurisdiction, 'none'>]})`
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${titleYearItalic}${jurisdictionPart} ${fields.ukInstrumentType ?? 'SI'} ${fields.ukInstrumentNumber ?? ''}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// United States (AGLC4 ch 25)
// ---------------------------------------------------------------------------------------------

/** r 25.1 — Case Name, Volume ReportAbbr[SeriesNumber] StartingPage, Pinpoint (Judge)
 *  (JurisdictionCourt, Year). usJurisdictionCourt is left blank for the US Supreme Court (r
 *  24.1.5.1). Eg 'Roper v Simmons, 543 US 551 (2005).' */
function formatUSReportedCase(fields: InternationalMaterialFields): CitationResult {
  const caseNameComma = `${italicize(fields.title ?? '')},`
  const reportAbbrev = joinParts([fields.reportAbbreviation, fields.usSeriesNumber])
  const core = joinParts([fields.volume, reportAbbrev, fields.startingPage])
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const judgePart = fields.judge ? ` (${fields.judge})` : ''
  const parenContent = joinParts([fields.usJurisdictionCourt, fields.year], ', ')
  const trailing = parenContent ? ` (${parenContent})` : ''

  return {
    footnote: ensureFullStop(`${caseNameComma} ${core}${pinpointPart}${judgePart}${trailing}`),
    bibliography: stripTrailingFullStop(`${caseNameComma} ${core}${trailing}`),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

/**
 * r 25.1.7 — Unreported US cases: Parties' Names (Jurisdiction and Court/District, Docket or
 * Reference No, Full Date) slip op Pinpoint (Judge). Genuinely different from every other Foreign
 * Domestic Sources jurisdiction's own unreported form — US courts don't use medium neutral
 * citations at all, and the literal 'slip op' marker precedes the pinpoint (omitted entirely when
 * there's no pinpoint at all — confirmed by AGLC4's own r 25.1.7 worked example 26, 'Red Hat Inc v
 * The SCO Group Inc (D Del, Civ No 03-772-SLR, 6 April 2004).', with no trailing 'slip op'). Where
 * a starting page and a further pinpoint are both needed (example 28, 'slip op 3458, 3464.'), the
 * whole 'StartingPage, Pinpoint' text is typed into the shared `pinpoint` field as one piece,
 * matching this app's established free-text convention for compound pinpoints elsewhere.
 */
function formatUSUnreportedCase(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const inner = joinParts([fields.usJurisdictionCourt, fields.foreignCaseNumber, fields.date], ', ')
  const pinpointPart = fields.pinpoint ? ` slip op ${fields.pinpoint.trim()}` : ''
  const judgePart = fields.judge ? ` (${fields.judge})` : ''

  const shortTitle = italicize(fields.shortTitle || fields.title || '')
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(`${titleItalic} (${inner})${pinpointPart}${judgePart}`),
    subsequent: ensureFullStop(`${shortTitle} (n ${footnoteNumber})${pinpointPart}`),
    bibliography: stripTrailingFullStop(`${titleItalic} (${inner})`),
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}

function formatUSCase(fields: InternationalMaterialFields): CitationResult {
  return fields.foreignCaseReportType === 'unreported-mnc' || fields.foreignCaseReportType === 'unreported-no-mnc'
    ? formatUSUnreportedCase(fields)
    : formatUSReportedCase(fields)
}

/** r 25.2 — [StatuteTitle[ OriginalPinpoint], ][TitleOrChapterNo ]CodeAbbrev Pinpoint
 *  ([PublisherOrEditor ]Year). Eg '35 USC § 102.' / 'Federal Deposit Insurance Act, 12 USC §§
 *  1811-35a (2006).' The pinpoint field carries the full '§ 102' / '§§ 1811-35a' text (US
 *  legislation pinpoints use a '§' marker rather than the usual comma-prefixed abbreviation). */
function formatUSLegislationCode(fields: InternationalMaterialFields): CitationResult {
  const statuteTitlePart = fields.usStatuteTitle
    ? fields.usOriginalPinpoint
      ? `${italicize(fields.usStatuteTitle)} ${fields.usOriginalPinpoint}, `
      : `${italicize(fields.usStatuteTitle)}, `
    : ''
  const titleAndCode = joinParts([fields.usTitleOrChapterNumber, fields.usCodeAbbrev])
  const yearPart = wrapUSYear(fields.usPublisherOrEditor, fields.year)
  const pinpointPart = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''
  const core = `${statuteTitlePart}${titleAndCode}${pinpointPart}${yearPart}`

  // A bare US Code citation — AGLC4's own worked example is just '35 USC § 102.' with no title at
  // all, the common case, not a rare edge case — has no Act title to abbreviate for the usual
  // italicised '(n X)' back-reference. subsequentAndSourceType()'s shared shortTitle fallback
  // (fields.shortTitle || fields.title || '') would italicise an empty string here ('**'),
  // confirmed live, so this builds its own fallback chain ending in the bare, unitalicised
  // Title+Code identifier (eg '12 USC') instead of that.
  const shortTitle = fields.shortTitle || fields.usStatuteTitle || fields.title
  const shortTitlePart = shortTitle ? italicize(shortTitle) : titleAndCode
  const footnoteNumber = fields.footnoteNumber || '1'

  return {
    footnote: ensureFullStop(core),
    subsequent: ensureFullStop(`${shortTitlePart} (n ${footnoteNumber})${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    sourceType: 'internationalMaterial',
    validationStatus: 'unvalidated',
  }
}

function wrapUSYear(publisherOrEditor: string | undefined, year: string | undefined): string {
  if (!year) return ''
  return ` (${joinParts([publisherOrEditor, year])})`
}

/** r 25.3 — StatuteTitle, PublicLawNumber, [OriginalPinpoint, ]VolumeOrYear AbbreviatedName
 *  StartingPage[, PagePinpoint][ (Year)]. Eg 'Freedom to Display the American Flag Act of 2005,
 *  Pub L No 109-243, § 4, 120 Stat 572, 573 (2006).' State session laws often use the year itself
 *  as VolumeOrYear, in which case the trailing '(Year)' is omitted (leave the shared `year` field
 *  blank) — eg 'An Act to Amend the Indiana Code concerning Pensions, Pub L No 5-2008, § 2 2008
 *  Ind Acts 889.' A first version of this function reused the ordinary `pinpoint` field for the
 *  pre-volume original pinpoint (eg '§ 4') and, in doing so, both dropped the comma r 25.3.3
 *  requires after it and had no way to also carry the separate page-level pinpoint r 25.3.6
 *  requires after the starting page (eg the second '573' above) — confirmed missing against
 *  AGLC4's own worked example, which needs both at once. Fixed by reusing `usOriginalPinpoint`
 *  (already used the same way by r 25.2's Code format) for the first and adding
 *  `usSessionLawPagePinpoint` for the second. */
function formatUSLegislationSessionLaw(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.usStatuteTitle ?? fields.title ?? '')
  const lawNoPart = fields.usPublicLawNumber ? `${fields.usPublicLawNumber}, ` : ''
  const originalPinpointPart = fields.usOriginalPinpoint ? `${fields.usOriginalPinpoint.trim()}, ` : ''
  const volumeCore = joinParts([fields.usVolumeOrYear, fields.usAbbreviatedName, fields.startingPage])
  const pagePinpointPart = formatPinpoint(fields.usSessionLawPagePinpoint)
  const core = `${titleItalic}, ${lawNoPart}${originalPinpointPart}${volumeCore}${pagePinpointPart}${wrapUSYear(undefined, fields.year)}`

  return {
    footnote: ensureFullStop(core),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pagePinpointPart),
  }
}

/** r 25.4 — [Title] Pinpoint, always italicised. Eg 'United States Constitution.' / 'Texas
 *  Constitution.' */
function formatUSConstitution(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const pinpointPart = fields.pinpoint ? ` ${fields.pinpoint.trim()}` : ''

  return {
    footnote: ensureFullStop(`${titleItalic}${pinpointPart}`),
    bibliography: stripTrailingFullStop(titleItalic),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// Hong Kong (AGLC4 ch 19)
// ---------------------------------------------------------------------------------------------

/** r 19.1 — Hong Kong cases cited in accordance with chapter 2 (individuals' names generally in
 *  full). Eg 'Ng Ka Ling v Director of Immigration [1999] 1 HKLRD 337.' */
function formatHongKongCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 19.2.1 — [Title] (Hong Kong)[ cap ChapterNumber], Pinpoint. No year when a chapter number is
 *  assigned; include the year in the title text itself for historical/un-numbered legislation, eg
 *  'Telephone Ordinance 1925 (Hong Kong).' Eg 'Evidence Ordinance (Hong Kong) cap 8, s 4.' */
function formatHongKongLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleItalic = italicize(fields.title ?? '')
  const chapterPart = fields.hkChapterNumber ? ` cap ${fields.hkChapterNumber}` : ''
  const pinpointPart = formatPinpoint(fields.pinpoint)
  const core = `${titleItalic} (Hong Kong)${chapterPart}`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// Malaysia (AGLC4 ch 20)
// ---------------------------------------------------------------------------------------------

/** r 20.1 — Malaysian cases cited in accordance with chapter 2 ('Sendirian Berhad' -> 'Sdn Bhd',
 *  'Datuk'/'Haji' omitted from names — reflected in how the case name is typed, not transformed
 *  here). The MLJ report series switched from volume-organised to year-organised in 1966 (r
 *  19.1.2) — branches on year directly rather than using the shared report-series lookup, since a
 *  single abbreviation maps to two different bracket styles depending on date. */
function formatMalaysiaCase(fields: InternationalMaterialFields): CitationResult {
  const isMLJ = (fields.reportAbbreviation ?? '').trim().toUpperCase() === 'MLJ'
  const year = parseInt(fields.year ?? '', 10)
  const bracket = isMLJ ? (Number.isFinite(year) && year < 1966 ? 'round' : 'square') : getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 20.2.1 — [Title Year] (Malaysia) Pinpoint, eg 'Copyright Act 1987 (Malaysia) s 7.' (no comma
 *  before the pinpoint — confirmed by this exact worked example). */
function formatMalaysiaLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([fields.title, fields.year]))
  const pinpointPart = bareSpacePinpoint(fields.pinpoint)
  const core = `${titleYearItalic} (Malaysia)`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// Singapore (AGLC4 ch 22)
// ---------------------------------------------------------------------------------------------

/** r 22.1 — Singaporean cases cited in accordance with chapter 2 ('Proprietary Limited' -> 'Pte
 *  Ltd', names typed already reflecting this). */
function formatSingaporeCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 22.2.1 — chapter-numbered: [Title] (Singapore, cap ChapterNumber, RevisionYear rev ed)
 *  Pinpoint, eg 'Adoption of Children Act (Singapore, cap 4, 1985 rev ed) s 5.' Otherwise: [Title
 *  Year] (Singapore) Pinpoint, eg 'Land Titles Ordinance 1956 (Singapore) ss 28(2)(b)-(e).' (no
 *  comma before the pinpoint in either form — confirmed by both worked examples.) */
function formatSingaporeLegislation(fields: InternationalMaterialFields): CitationResult {
  const pinpointPart = bareSpacePinpoint(fields.pinpoint)
  const core = fields.singaporeChapterNumber
    ? `${italicize(fields.title ?? '')} (Singapore, cap ${fields.singaporeChapterNumber}, ${fields.singaporeRevisionYear ?? ''} rev ed)`
    : `${italicize(joinParts([fields.title, fields.year]))} (Singapore)`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// South Africa (AGLC4 ch 23)
// ---------------------------------------------------------------------------------------------

/** r 23.1 — South African cases cited in accordance with chapter 2 ('Judge President' -> 'JP',
 *  reflected in the judge field as typed). Eg 'Christian Education South Africa v Minister of
 *  Education [1999] 2 SA 83 (Constitutional Court).' */
function formatSouthAfricaCase(fields: InternationalMaterialFields): CitationResult {
  const bracket = getBracketType(fields.reportAbbreviation ?? '')
  return chapterTwoCaseAnyReportType(fields, bracket)
}

/** r 23.2.1 — [Title Year] (Jurisdiction) Pinpoint. Jurisdiction is 'South Africa' or a provincial
 *  abbreviation. Eg 'Local Government Transition Act 1993 (South Africa).' / 'Land Administration
 *  Act 2003 (KZN).' (No comma before the pinpoint, matching the general r 3.1 legislation
 *  convention — South Africa has no explicit comma sub-rule the way Canada/NZ/UK do.) */
function formatSouthAfricaLegislation(fields: InternationalMaterialFields): CitationResult {
  const titleYearItalic = italicize(joinParts([fields.title, fields.year]))
  const pinpointPart = bareSpacePinpoint(fields.pinpoint)
  const core = `${titleYearItalic} (${fields.southAfricaJurisdiction || 'South Africa'})`

  return {
    footnote: ensureFullStop(`${core}${pinpointPart}`),
    bibliography: stripTrailingFullStop(core),
    ...subsequentAndSourceType(fields, pinpointPart),
  }
}

// ---------------------------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------------------------

const BADGE_BY_COUNTRY_CATEGORY: Record<ForeignCountry, Partial<Record<ForeignCategory, string>>> = {
  Canada: { case: 'Canadian Case', legislation: 'Canadian Legislation' },
  NewZealand: {
    case: 'New Zealand Case',
    legislation: 'New Zealand Legislation',
    delegatedLegislation: 'New Zealand Delegated Legislation',
  },
  UK: { case: 'UK Case', legislation: 'UK Legislation', delegatedLegislation: 'UK Delegated Legislation' },
  US: {
    case: 'US Case',
    legislation: 'US Legislation (Code)',
    legislationSessionLaw: 'US Legislation (Session Law)',
    constitution: 'US Constitution',
  },
  HongKong: { case: 'Hong Kong Case', legislation: 'Hong Kong Legislation' },
  Malaysia: { case: 'Malaysian Case', legislation: 'Malaysian Legislation' },
  Singapore: { case: 'Singaporean Case', legislation: 'Singaporean Legislation' },
  SouthAfrica: { case: 'South African Case', legislation: 'South African Legislation' },
}

const RULE_LABEL_BY_COUNTRY_CATEGORY: Record<ForeignCountry, Partial<Record<ForeignCategory, string>>> = {
  Canada: { case: 'AGLC4 r 15.1', legislation: 'AGLC4 r 15.2' },
  NewZealand: { case: 'AGLC4 r 21.1', legislation: 'AGLC4 r 21.2.1', delegatedLegislation: 'AGLC4 r 21.2.2' },
  UK: { case: 'AGLC4 r 24.1', legislation: 'AGLC4 r 24.2', delegatedLegislation: 'AGLC4 r 24.3' },
  US: {
    case: 'AGLC4 r 25.1',
    legislation: 'AGLC4 r 25.2',
    legislationSessionLaw: 'AGLC4 r 25.3',
    constitution: 'AGLC4 r 25.4',
  },
  HongKong: { case: 'AGLC4 r 19.1', legislation: 'AGLC4 r 19.2' },
  Malaysia: { case: 'AGLC4 r 20.1', legislation: 'AGLC4 r 20.2' },
  Singapore: { case: 'AGLC4 r 22.1', legislation: 'AGLC4 r 22.2' },
  SouthAfrica: { case: 'AGLC4 r 23.1', legislation: 'AGLC4 r 23.2' },
}

/** A second-level badge, more specific than the flat 'Foreign Domestic Sources' label — mirrors
 *  how otherLegislativeMaterialBadge() names the exact sub-category rather than a generic one.
 *  Deliberately doesn't vary by report type — reported vs unreported is a sub-format of the same
 *  'Case' category, the same way the domestic 'case' SourceType shares one badge/tab for both. */
export function foreignDomesticBadge(fields: InternationalMaterialFields): string {
  if (!fields.foreignCountry || !fields.foreignCategory) return 'Foreign Domestic Sources'
  return BADGE_BY_COUNTRY_CATEGORY[fields.foreignCountry][fields.foreignCategory] ?? 'Foreign Domestic Sources'
}

// Unreported-case rule labels, by country — only where AGLC4 gives that country its OWN
// dedicated 'Unreported Cases' sub-rule (confirmed directly against the real PDF): NZ r 21.1.3,
// UK r 24.1.5, Malaysia r 20.1.2 (no-MNC only — Malaysian courts don't issue MNCs at all, per
// AGLC4's own note; the mnc form is structurally unreachable via ForeignDomesticForm.tsx's own
// report-type options for Malaysia), Singapore r 22.1.3. Canada, Hong Kong and South Africa have
// no dedicated sub-rule of their own — their own chapters just incorporate chapter 2 generally —
// so the actual governing rule for those three is the plain domestic r 2.3.1/r 2.3.2, not a
// Foreign-Domestic-Sources-specific number; the fallback below reflects that directly rather than
// showing a made-up country-chapter number that doesn't exist.
const UNREPORTED_MNC_RULE_LABEL: Partial<Record<ForeignCountry, string>> = {
  NewZealand: 'AGLC4 r 21.1.3',
  UK: 'AGLC4 r 24.1.5',
  Singapore: 'AGLC4 r 22.1.3',
}
const UNREPORTED_NO_MNC_RULE_LABEL: Partial<Record<ForeignCountry, string>> = {
  NewZealand: 'AGLC4 r 21.1.3',
  UK: 'AGLC4 r 24.1.5',
  Malaysia: 'AGLC4 r 20.1.2',
  Singapore: 'AGLC4 r 22.1.3',
}

/** The AGLC4 rule reference shown in the UI for the current country/category — used by
 *  Generator.tsx in place of one fixed placeholder label, since eg Canada Case (r 15.1) and US
 *  Constitution (r 25.4) need different labels. A case's own label additionally varies by
 *  `foreignCaseReportType` — the US has one single unreported rule (r 25.1.7) regardless of
 *  medium-neutral-citation status (US courts don't use those at all), while every other country
 *  branches between its own MNC/no-MNC sub-rule (or the plain domestic r 2.3.1/2.3.2 fallback). */
export function foreignDomesticRuleLabel(fields: InternationalMaterialFields): string {
  if (!fields.foreignCountry || !fields.foreignCategory) return 'AGLC4 Part V'

  if (fields.foreignCategory === 'case') {
    if (fields.foreignCountry === 'US') {
      const isUnreported = fields.foreignCaseReportType === 'unreported-mnc' || fields.foreignCaseReportType === 'unreported-no-mnc'
      return isUnreported ? 'AGLC4 r 25.1.7' : 'AGLC4 r 25.1'
    }
    if (fields.foreignCaseReportType === 'unreported-mnc') {
      return UNREPORTED_MNC_RULE_LABEL[fields.foreignCountry] ?? 'AGLC4 r 2.3.1'
    }
    if (fields.foreignCaseReportType === 'unreported-no-mnc') {
      return UNREPORTED_NO_MNC_RULE_LABEL[fields.foreignCountry] ?? 'AGLC4 r 2.3.2'
    }
  }

  return RULE_LABEL_BY_COUNTRY_CATEGORY[fields.foreignCountry][fields.foreignCategory] ?? 'AGLC4 Part V'
}

export function generateForeignDomesticCitation(fields: InternationalMaterialFields): CitationResult {
  switch (fields.foreignCountry) {
    case 'Canada':
      return fields.foreignCategory === 'legislation' ? formatCanadaLegislation(fields) : formatCanadaCase(fields)
    case 'NewZealand':
      return fields.foreignCategory === 'legislation'
        ? formatNZLegislation(fields)
        : fields.foreignCategory === 'delegatedLegislation'
          ? formatNZDelegatedLegislation(fields)
          : formatNZCase(fields)
    case 'UK':
      return fields.foreignCategory === 'legislation'
        ? formatUKLegislation(fields)
        : fields.foreignCategory === 'delegatedLegislation'
          ? formatUKDelegatedLegislation(fields)
          : formatUKCase(fields)
    case 'US':
      return fields.foreignCategory === 'legislation'
        ? formatUSLegislationCode(fields)
        : fields.foreignCategory === 'legislationSessionLaw'
          ? formatUSLegislationSessionLaw(fields)
          : fields.foreignCategory === 'constitution'
            ? formatUSConstitution(fields)
            : formatUSCase(fields)
    case 'HongKong':
      return fields.foreignCategory === 'legislation' ? formatHongKongLegislation(fields) : formatHongKongCase(fields)
    case 'Malaysia':
      return fields.foreignCategory === 'legislation' ? formatMalaysiaLegislation(fields) : formatMalaysiaCase(fields)
    case 'Singapore':
      return fields.foreignCategory === 'legislation' ? formatSingaporeLegislation(fields) : formatSingaporeCase(fields)
    case 'SouthAfrica':
      return fields.foreignCategory === 'legislation' ? formatSouthAfricaLegislation(fields) : formatSouthAfricaCase(fields)
    default:
      // No country selected yet — a blank-ish placeholder result so the output panel doesn't crash
      // before the student has picked one.
      return {
        footnote: '',
        subsequent: '',
        bibliography: '',
        sourceType: 'internationalMaterial',
        validationStatus: 'unvalidated',
      }
  }
}
