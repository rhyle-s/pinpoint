import 'server-only'
import * as cheerio from 'cheerio'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { getCached, setCached } from '../cache'
import { extractPdfText, isPdfContentType } from '../pdf'
import { isUnitedNationsCharter } from '../citation-engine/utils'
import {
  ExplanatoryMaterialLabel,
  JurisdictionCode,
  LegislationFields,
  PracticeDocumentType,
  SourceType,
} from '../citation-engine/types'
import { fetchCrossRefByBibliographic, fetchCrossRefDOI } from './crossref'
import { looksLikeSecondarySourceReference } from './crossref-bib-parse'
import { rewriteDocsUnOrgUrl } from './docs-un-org'
import { fetchWithUserAgentFallback, isCloudflareChallenge } from './fetch'
import { lookupKnownTreatySeries } from './known-treaties'
import { detectUKJurisdictionFromUrl } from './uk-legislation-parse'
import { extractCelexFromFilename } from './eu-cellar-parse'
import { fetchEuropeanUnionByIdentifier } from './eu-cellar'
import { AutofillFields, AutofillResult } from './types'
import {
  finalizeAutofillResult,
  genericiseIntegralDocumentType,
  hashKey,
  normalizeJurisdiction,
  stripDuplicateYearFromTitle,
  stripTrailingYear,
  TRY_ALTERNATIVE_INPUT_SUGGESTION,
} from './utils'

const MODEL = 'claude-sonnet-4-6'
// Exported so other fetch-driving autofill handlers (eg canada-legislation.ts) that don't go
// through aiExtractFromUrl at all can still apply the same timeout/size protections rather than
// each picking their own ad hoc numbers.
export const FETCH_TIMEOUT_MS = 20_000
// Institutional/corporate reports often bury their clearest self-description (eg a foreword
// literally saying "This white paper...", or a "Citation:"-style line) a little further into the
// front matter than a typical webpage's content — confirmed on a real PDF where that sentence
// landed at character ~3026, just past the previous 3000-char cutoff. Raised across the board
// (this budget is shared by every text-based extraction path, not just reports) rather than
// adding a report-specific carve-out.
const CONTENT_CHAR_LIMIT = 4000

const SYSTEM_PROMPT = `You are a legal citation metadata extractor. Given webpage content, identify what type of source it is and extract the relevant fields for AGLC4 citation. Return JSON only, no explanation.

Source types: case, legislation, journal, book, report, researchPaper, website, newspaper, otherLegislativeMaterial, internationalMaterial, otherSources

For any field that is not clearly present in the content, use an empty string "" (or an empty array [] for "authors") — never omit a field or use null.

Whenever you need to extract a document/article's own title from a webpage (documentTitle, articleTitle, title — whichever field applies to this source type), a "Page title" line reflects the raw <title> tag, which on many sites is not just the headline — publishers routinely append extra text after it for SEO purposes: a secondary tagline, keywords, a document/ruling number, or the site name itself, often joined with ' - ' or ' | ', sometimes more than one such segment chained together (eg 'Real Headline - A Secondary SEO Tagline That Names A Ruling Number - Site Name'). Do not assume the whole "Page title" line, or even just its portion before the last separator, is the real title — a middle segment can be SEO padding that was never displayed as a real subheading anywhere on the actual page. When an "H1 heading" line is also given, it reflects the page's own main heading exactly as actually displayed to a reader, and is the more reliable source for the real title whenever the two disagree — prefer it. Fall back to carefully parsing the "Page title" line (stripping a trailing site name, and any other segment that reads as SEO padding rather than genuine article text) only when no "H1 heading" line is present.

For legislation, actTitle is the Act's name only, with no year in it (eg 'Crimes Act', not 'Crimes Act 1958') — the year belongs solely in the separate year field. If the source does not make the jurisdiction clear (eg pasted text that just names an Act and its year), leave jurisdiction as an empty string rather than guessing 'Cth' or inferring it from the Act's subject matter — an unmarked jurisdiction is flagged for the student to fill in, whereas a wrong one is a silent error.

For cases, set caseReportType based on how the case is cited: 'unreported-mnc' when the citation is a medium neutral citation in the form [Year] CourtCode Number (eg '[2026] QCA 146') — courtCode is the court abbreviation (eg 'QCA') and caseNumber is just the trailing number (eg '146'), and volume/reportAbbreviation/startingPage are left empty. Use 'reported' when the citation instead has a volume and a law report series (eg '(1992) 175 CLR 1') — volume, reportAbbreviation, and startingPage are filled and courtCode/caseNumber are left empty. A case's judge(s) is whoever delivered the judgment, not the parties.

Content may include lines like "[Page 2 header]: ...", which are running headers sampled from later pages of an uploaded PDF (journal offprints usually give page 1 over to title/author/abstract only, with the journal name, volume, and starting page appearing solely in these headers). Interpret common law-journal header conventions there: 'JOURNAL NAME [VOL 31: 411' means journalName 'Journal Name', volume '31', startingPage '411'; a header starting 'YYYY] ...' (eg '2009] Article Title 413') gives the year as YYYY.

Content may also include a line like "[Document end]: ...", a short excerpt from the very end of a long PDF (fetched from a URL, or uploaded directly) rather than just its middle body, which is otherwise all that a leading-text budget would show. Many official documents place their own issuing/signing date right at the end rather than near the title — a court practice direction/note's signature block (eg 'Executive Associate to the Chief Justice 29 November 2010'), or a treaty's own closing/testimonium clause naming when it was done/signed. Treat a date found there as authoritative for whichever date field the source type needs.

Use 'researchPaper' — not 'report' or 'journal' — for a conference paper (eg one bearing an ACM/IEEE-style "Reference Format:" or "Cite as:" block naming a conference), a thesis, or an unpublished/preprint working paper. 'report' is for a standalone institutional, government, or organisational publication — a law reform commission report, a corporate annual/sustainability report, a government policy document, or a white paper (a white paper is a 'report', never 'researchPaper', despite the similar name). 'journal' is for an article published in a journal issue.

For 'researchPaper':
- authors: the individual person(s) who wrote it, same as a journal article — unlike 'report', a research paper is essentially always credited to named person(s), not just the publishing body.
- title: the paper's own title, exactly as printed (eg on a working-paper series' own cover page, a thesis title page, or a conference paper's own heading) — this is the field most often missed if extraction otherwise seems to be working (documentType/institution/date filled, title left empty): always look specifically for the paper's own title, not just its series/document-number line.
- documentType: 'Conference Paper' for a paper presented at a conference (institution then holds the conference's own name, and date is the full date, eg '4 July 2015'); 'PhD Thesis', 'Masters Thesis', or 'Honours Thesis' for a thesis (institution holds the university name, and date is usually just the year); otherwise 'Working Paper' or 'Research Paper' — whichever the source itself calls it — for an unpublished/preprint paper (institution holds the publishing body).
- seriesNumber: the paper's own number within its series exactly as the source states it (eg 'RDP 2023-01', 'Working Paper No 5') — leave empty if it isn't part of a numbered series.
- institution: the conference name, university, or publishing body — see documentType above for which one applies. Never leave this blank just because it seems implied by the URL/domain; if the source states it explicitly (eg a masthead or footer identifying the publishing institution), extract it.
- date: same convention as a report — month and year where both are known, falling back to a bare year if that's all that's stated.

For 'report':
- authors: almost never an individual person — use the publishing organisation's own name exactly as it identifies itself in the document (letterhead, "About [X]", copyright line, or masthead), eg 'Cisco', 'Woolworths Group', 'Australian Law Reform Commission', 'New South Wales Law Reform Commission', 'Digital Transformation Agency'. Only use an individual's name if the document is credited to specific person(s) rather than an organisation (eg an academic white paper with named authors on its title page).
- Preserve the title's original capitalisation exactly (including a lower-case word like 'the' or 'for' where the source genuinely uses one) — the one exception is a title printed entirely in ALL CAPITAL LETTERS as a stylistic/cover-page choice, which should be converted to standard title case rather than reproduced in caps.
- Never include the year in the title itself, even if the source prints it directly alongside the title (eg cover text 'Sustainability Report 2025') — the year belongs solely in the date field.
- Applying AGLC4's document-type rule: "If the title includes a reference to the document type (eg 'Interim Report', 'Final Report'), this may be omitted from the title and included within the parentheses. Where the document type forms an integral part of the title, this should not be omitted from the title, nor should it be repeated in the document type; instead, the generic document type should be used as the document type. For example, if the title of a document is 'Annual Report', this should be used as the title and the document type should be 'Report', not 'Annual Report'." Concretely: if the document's own title is just a distinct name/tagline with a type-label separately attached (eg cover text reading "2025 Annual Report" above a distinct tagline "Providing the critical infrastructure for the AI era"), the type-label is the documentType ('Annual Report') and only the tagline is the title — the year and type-label are not part of it. But if the type-label reads as part of the title itself with no separate tagline (eg cover text "2025 Sustainability Report" with nothing else), keep it as the title ('Sustainability Report', year stripped to the date field) and use the *generic* form as documentType ('Report', not 'Sustainability Report'). The same generic-form principle applies to any document-type family: a government policy publication's documentType is 'Policy Document' even if the title itself is 'Policy for the Responsible Use of AI in Government'; a self-described "white paper"'s documentType is 'White Paper'.
- seriesNumber: normalise whatever numbering the publisher uses (eg 'ALRC Report 143', 'Discussion Paper 89', bare 'REPORT 149') to the form 'Report No 143' / 'Discussion Paper No 89' / 'Report No 149'. Leave empty if the document isn't part of a numbered series.
- date: month and year where both are known (eg 'January 2025', 'May 2022' — drop the day even if the source states one, eg a source date of '27 May 2022' becomes just 'May 2022'), falling back to a bare year if that's all that's available.

For 'book': always set sourceType 'book' regardless of whether the content is a whole book or one chapter within an edited collection (eg a PDF excerpt of a single numbered chapter) — the app defaults every book source to a whole-book citation and lets the student manually switch to a chapter citation afterwards, so extraction should populate BOTH the whole-book fields (authors, title, publisher, year, edition) AND, whenever the content is clearly a chapter rather than a whole book (a chapter number/heading, running headers naming the chapter, editors credited as '(ed)'/'(eds)' rather than authors), the chapter-specific fields below — never leave the chapter fields empty just because sourceType stays 'book'.
- chapterAuthors: the individual person(s) who wrote this specific chapter (often printed directly under the chapter heading, eg 'Moira Paterson' beneath '7 Freedom of information').
- chapterTitle: the chapter's own heading exactly as printed, with any leading chapter number stripped (eg '7 Freedom of information' gives chapterTitle 'Freedom of information') — preserve its original capitalisation same as any other title (a chapter heading is typically sentence case, not title case; do not convert it).
- editors: the whole book's editor(s), credited as '(ed)' or '(eds)' — distinct from chapterAuthors. A recurring citation line (eg a ProQuest/Ebook Central watermark repeated in the footer of every page, in the form 'Surname, Given, and Given2 Surname2. Book Title, Publisher, Year.') states editor and book names Surname-first — invert each name to given-name-first order for both editors and authors/chapterAuthors (eg 'Groves, Matthew, and H. P. Lee' becomes editors ['Matthew Groves', 'H P Lee'], not left surname-first); don't worry about a stray full stop after a single-letter initial like 'H.' when inverting, that's cleaned up automatically downstream.
- title (reused): the whole book's own title, not the chapter's — eg 'Australian Administrative Law: Fundamentals, Principles and Doctrines'.
- startingPage (reused): the chapter's own first page number within the whole book (not the PDF excerpt's own page 1) — usually determinable from a running page-footer/header number on the chapter's opening page, or from a running header repeating across pages (eg a header reading 'FREEDOM OF INFORMATION 117' on the chapter's second page means the chapter started on page 116). Leave empty if no page numbering is visible anywhere in the content.

Use 'newspaper' — not 'website' — for an article published by an online news publication/newspaper: a masthead with journalistic bylines (eg ABC News, The Sydney Morning Herald, The Age, The Guardian, news.com.au, The Australian). Recognise this from a visible "By [Reporter Name]" byline and/or the outlet's own name appearing as a news publication (often the last segment of the page's <title> tag, after a ' - ' or ' | ' separator, eg 'Article Headline - ABC News' gives newspaperName 'ABC News'). The generic 'website' type is the fallback for web content no more specific rule covers (an organisation's own page, a blog post, a forum post) — use it only when the source isn't a newspaper article. For 'newspaper': authors are the byline reporter(s) — leave empty for an unbylined wire-service report, never guess one; articleTitle is the headline exactly as printed (prefer the page's own <title>/<h1> text over a meta 'og:title' tag if they visibly differ, since og:title can lag behind a headline that was later edited); newspaperName is the masthead's own name, not the parent company (eg 'ABC News', not 'Australian Broadcasting Corporation'); date is the full publication date in 'day Month year' form (eg '17 August 2026'), not just a year. For 'website' specifically — including a page that otherwise reads like an article (a byline, a publish date, a reading-time estimate, eg a law firm's own "Insights"/"Articles" page) but isn't a masthead newspaper — put the document's own title in documentTitle, not articleTitle; articleTitle belongs only to the 'newspaper' source type above.

Use 'otherLegislativeMaterial' for five specific AGLC4 ch 3 categories — never 'legislation' for these, even though several of them look Act-like. Set otherLegislativeMaterialSubtype to whichever of the five it is:
- 'bill': a Bill before parliament, not yet an Act — the title itself says "... Bill 20XX" (an Act's title never contains the word 'Bill'). Reuse actTitle/year/jurisdiction exactly as for ordinary legislation (actTitle has no year in it, eg 'Corporations Amendment (Crowd-Sourced Funding) Bill', not '... Bill 2015') — the citation engine deliberately never italicises a Bill's title, so don't do anything special with capitalisation here, just extract it as printed.
- 'explanatoryMaterial': a document explaining a Bill, titled 'Explanatory Memorandum', 'Explanatory Statement', 'Explanatory Note', or 'Explanatory Notes' (jurisdictions differ on which term they use — set explanatoryLabel to whichever one this document actually calls itself, exactly). Reuse actTitle/year/jurisdiction for the Bill it explains, exactly as for the 'bill' subtype above. Some jurisdictions (eg NSW) publish the Bill and its explanatory note in the same document/URL — if the provided content contains both a Bill's operative provisions and an explanatory note/statement section, classify it as 'explanatoryMaterial' (the more specific document) rather than plain 'bill'.
- 'gazette': an official government gazette notice. gazetteAuthor is the specific office/minister that issued the notice (eg 'Minister for Lands (WA)') — leave empty for a citation to the gazette issue as a whole rather than one specific notice. articleTitle is that notice's own title/heading, if citing one specific notice — leave empty alongside gazetteAuthor for a whole-issue citation. jurisdiction is the full jurisdiction name as a gazette would state it (eg 'Western Australia', 'Commonwealth', 'Australian Capital Territory') — NOT an abbreviation. journalName is the gazette's own full title (eg 'Western Australian Government Gazette', 'Gazette: Special'). issue is its number exactly as printed (eg 'No 27', 'No S 489'). date is the gazette issue's date. startingPage is the notice's own starting page within the issue — leave empty for a whole-issue citation.
- 'practiceDirection': a court's Practice Direction or Practice Note. court is the issuing court's full name (eg 'Supreme Court of Victoria', 'High Court of Australia'). practiceType is 'Practice Note' or 'Practice Direction', whichever the court itself calls it. practiceNumber is its own number exactly as printed (eg 'No 9 of 2010'). practiceTitle is its own title (eg 'Conduct of Group Proceedings'). practiceDate is its issuing/signing date — this is often found at the very end of the document near a signature block (eg 'Executive Associate to the Chief Justice, 29 November 2010'), which may differ from a separately-stated commencement date elsewhere in the document; prefer the signing date.
- 'constitution': the bare Commonwealth 'Australian Constitution', or a state/territory's own constituting Act (eg 'Constitution Act 1902' (NSW), 'Constitution of Queensland 2001' (Qld), or an ACT/NT self-government Act, eg 'Australian Capital Territory (Self-Government) Act 1988'). Reuse actTitle/year/jurisdiction exactly as for ordinary legislation, with one deliberate exception: for the bare Commonwealth 'Australian Constitution' specifically, set actTitle to exactly 'Australian Constitution', leave year completely empty, and leave jurisdiction empty too — it is never cited as 'Australian Constitution (Cth)'. Every state/territory's own constituting Act, by contrast, is cited with its year and jurisdiction exactly like any other Act.

Use 'internationalMaterial' for three categories — treaties, UN General Assembly materials, and foreign domestic sources — sharing one UI entry point the same way 'otherLegislativeMaterial' bundles five AGLC4 ch 3 categories. Set internationalMaterialSubtype to whichever it is:
- 'treaty': distinguish from 'unDocument' by the presence or absence of treaty-mechanics language, not by which site hosts the page — human rights instruments in particular turn up on nearly identical-looking pages/PDFs (un.org, ohchr.org, and third-party mirrors of either) regardless of which of the two they actually are. A treaty involves signature, ratification, accession, and (once enough states have joined) entry into force — eg 'Adopted and opened for signature, ratification and accession by General Assembly resolution 2200A (XXI) of 16 December 1966, entry into force 23 March 1976, in accordance with Article 49'. treatySeries is the treaty's own series citation, most commonly a United Nations Treaty Series reference in the form '<volume> UNTS <page>' (eg '729 UNTS 161'). The UN Treaty Collection's own page (treaties.un.org/pages/showDetails.aspx) states this as a separate 'UNTS Volume Number' field in the form '<volume> (p.<page>)' (eg '729 (p.161)') — combine these into the single '<volume> UNTS <page>' string yourself; never emit the bare abbreviation 'UNTS' on its own with no volume/page, since that isn't a valid citation — leave treatySeries entirely empty instead if a volume/page genuinely isn't stated anywhere in the content. Other sources cite a different series instead (eg the Australian Treaty Series, stated as '[<year>] ATS <number>' or plain 'ATS <number>') — use whichever series the source itself cites the treaty under. Do not invent or guess a UNTS number for a document that doesn't state one itself: a treaty's own signed text, and a depositary or agency circular reproducing it (eg an IAEA INFCIRC notifying entry into force), are typically issued before UN registration assigns a volume/page, so these primary documents legitimately have no UNTS reference to extract even though the same treaty does have one once it's registered — leave treatySeries empty in that case rather than fabricating one. openedForSignature and enteredIntoForce are both full dates in 'day Month year' form; leave enteredIntoForce empty if the source states the treaty has not yet entered into force. A treaty's own closing/testimonium clause conventionally spells its signing date out in words rather than digits (eg 'DONE in triplicate ... the first day of July, one thousand nine hundred and sixty-eight' — often the very last lines of the operative text, right before the parties' signature blocks) — convert this to the same numeral 'day Month year' form as any other date (eg '1 July 1968'), don't leave openedForSignature/signedDate empty just because the source spells it out.
- 'unDocument' (badged "UN Materials"): a UN General Assembly declaration or resolution — only ever adopted or proclaimed by a resolution vote, no signature, no ratification, no accession, no entry into force at all — eg the Universal Declaration of Human Rights' own page describes it only as 'proclaimed by the United Nations General Assembly ... (General Assembly resolution 217 A)'. When content opens with the fixed treaty/unDocument boilerplate line described above, parse it directly: for a treaty, the date attached to 'of'/on adoption is openedForSignature and the 'entry into force ...' clause is enteredIntoForce (the resolution number itself isn't used anywhere in a treaty citation); for a unDocument, the same resolution number/session feeds resolutionNumber/session and the adoption date feeds date. resolutionNumber is the GA resolution's own number only, no 'GA Res' prefix and no session attached (eg '217A', not 'GA Res 217A' or '217 A (III)'). session is the Roman-numeral GA session the resolution belongs to, shown separately (eg 'III' for the UDHR, the General Assembly's 3rd session) — this only exists for older resolutions; a resolution numbered like '61/295' (session/number rather than number(session)) never has a separate session at all, so leave session empty for those — never guess a session from the year either way. unDocSymbol is the formal UN document symbol (eg 'A/810', or 'A/RES/61/295' for a resolution using the newer numbering) — a fairly technical detail that most general-audience pages don't state at all (confirmed on the UN's own public UDHR page, which gives the resolution number and date but no document symbol anywhere) — leave it empty rather than write a partial or invented symbol. date is the resolution/document's own formal date in 'day Month year' form — usually the same as the adoption date, but not always (see adoptedDate). adoptedDate is only set when the source separately states that the resolution was actually adopted/voted on at the General Assembly on an earlier date than the document's own formal date (eg a UN page might read '...adopted by the General Assembly on 13 September 2007' for a document itself dated 2 October 2007) — leave it empty whenever only one date is stated anywhere, which is the common case; never duplicate date into adoptedDate when the source only gives one date.
  - One deliberate exception to the treaty-mechanics test above: the Charter of the United Nations is 'unDocument', never 'treaty', even though authoritative pages about it typically do state signature/entry-into-force language (San Francisco, 26 June 1945, entered into force 24 October 1945) the same way a treaty's page would. AGLC4 cites the Charter by its bare title alone with nothing else at all — set title to exactly 'Charter of the United Nations' and leave every other field (resolutionNumber, session, unDocSymbol, date, adoptedDate) completely empty, even though the dates are readily available on the page. Do not treat the Charter's own signature/entry-into-force dates as belonging anywhere in its citation.
- 'foreignDomestic' (badged "Foreign Domestic Sources"): a foreign jurisdiction's own case or piece of legislation. Only ever choose this for a URL from one of the specific sites below — for every other source, if content doesn't clearly match 'treaty' or 'unDocument', prefer whichever of the other source types (eg 'case', 'legislation', 'website') best fits instead. Canada, the UK, New Zealand, and the US federal Code have extraction support so far; every other jurisdiction (US state legislation, Hong Kong, Malaysia, Singapore, South Africa) does not yet — never choose 'foreignDomestic' for those, even if the content is obviously a foreign case or Act.
  - US federal Code (law.cornell.edu/uscode — a fallback only; the primary route for this site is deterministic, not AI-based, see us-code-parse.ts): usTitleOrChapterNumber is the Title number the section sits within (eg '12', '35', '42' — the number right before 'U.S. Code' in the page's own heading). usCodeSection is the section number including the '§' symbol (eg '§ 1811', '§ 78j-1'). Leave usStatuteTitle empty (AGLC4 r 25.2.1 says the underlying Act's title is generally omitted when citing via the Code itself) and leave year empty too unless the page clearly states a specific edition year.
  - Canada legislation (laws-lois.justice.gc.ca, given in the URL line above): the page's own citation appears prominently right at the top, in the form 'Act Title (R.S.C., 1985, c. X)' or 'Act Title (R.S.C., 1985, c. X (Nth Supp.))' — this stated citation, NOT the URL, is the only source of truth for every field below. **The URL path segment (eg '/eng/acts/I-3.3/...') is the site's own internal catalogue slug for navigation — it is not always the same as the AGLC4-citable chapter, and must never be used as or to guess canadaChapter.** For most Acts consolidated directly into the main 1985 Revised Statutes, the slug and the real chapter do coincide (eg the Privacy Act's slug is 'P-21' and its real chapter is also 'P-21') — but for an Act that was instead added via one of the five Supplements to the 1985 revision (stated on the page as eg 'c. 1 (5th Supp.)'), the slug ('I-3.3' for the Income Tax Act) is completely different from the real chapter ('1', with '5th Supp' as the separate canadaSessionOrSupp field) — always read the actual displayed citation text, never infer from the slug. actTitle is the Act's own title with 'The' stripped from the start if present (eg 'Privacy Act', not 'The Privacy Act') and no year in it. canadaStatuteVolumeType is 'RS' if the citation states 'Revised Statutes of Canada'/'R.S.C.' (or an equivalent provincial 'Revised Statutes'), otherwise 'S' for a plain sessional/annual volume citation (eg 'S.C.'/'S.O.') — set 'not-applicable' only if genuinely unclear. canadaJurisdictionAbbrev is the one-or-two-letter jurisdiction code from the citation itself (federal is 'C', eg 'R.S.C.' -> 'C'; Ontario is 'O', eg 'R.S.O.' -> 'O'; British Columbia is 'BC'; Quebec is 'Q'; etc — use whatever letters directly follow 'R.S.'/'S.' in the page's own citation). year is the statute volume's year (eg 1985 for 'R.S.C. 1985'). canadaChapter is the bare chapter designation exactly as printed after 'c.'/'ch.' in the page's own citation, with any parenthetical supplement/session number stripped out into canadaSessionOrSupp instead (eg the page states 'c. 1 (5th Supp.)' -> canadaChapter '1', canadaSessionOrSupp '5th Supp'; the page states 'c. P-21' with no supplement -> canadaChapter 'P-21', canadaSessionOrSupp empty). canadaSessionOrSupp is empty far more often than not — only set it when the page's own citation actually shows a '(Nth Supp)' or '(Nth Sess)' parenthetical directly after the chapter.
  - Canada cases (decisions.scc-csc.ca, Supreme Court of Canada): caseName, year, volume, reportAbbreviation (almost always 'SCR' for this site), and startingPage — reuse exactly the same fields a domestic reported case would use.
  - UK legislation (legislation.gov.uk — a fallback only, reached when uk-legislation.ts's own deterministic URL-based parser doesn't recognise the page shape, typically a pre-1963 historical Act): actTitle is the Act's own title with 'The' stripped from the start if present, year is the calendar year it was passed. Do NOT extract a chapter number here (there is no ukNumberType/ukNumberValue field in this schema at all): AGLC4 r 24.2.3 includes a chapter number ONLY for statutes enacted before 1 January 1963, in the form 'RegnalYear, c Number' (eg '9 & 10 Eliz 2, c 34') — the regnal year is not the same as the page's own plain calendar year and can't be reliably read off a modern legislation.gov.uk page, so leave that for the student to add manually if this is genuinely a pre-1963 Act. Every post-1963 UK/NI/Scot/Wales statute has no number in its citation at all (confirmed directly against AGLC4's own worked examples) — a chapter/'asp'/'anaw'-style number is real-world citation practice, not AGLC4's.
  - New Zealand legislation (legislation.govt.nz — a fallback only; the primary route for ordinary public Acts is deterministic, not AI-based, see nz-legislation-parse.ts, which this fallback is really only reached for NZ delegated legislation/Regulations, under the site's own '/regulation/' URL segment rather than '/act/'): actTitle is the Act's/Regulations' own title with no year in it, year is the year it was passed/made. There's only ever one NZ jurisdiction (unlike Canada/UK) — every NZ source is 'NewZealand', never split into sub-jurisdictions.

Use 'otherSources' for seven AGLC4 ch 7 categories that are NOT reports or research papers/theses (those two stay 'report'/'researchPaper' as already described above — this bundles the seven *other* ch 7 categories under one UI entry point, the same way 'otherLegislativeMaterial'/'internationalMaterial' bundle their own categories). Set otherSourcesSubtype to whichever of the seven it is. Deliberately reuses fields already defined above for other source types wherever the underlying concept matches, rather than one dedicated field per concept — every field below not specific to otherSources is a reused one, not a mistake:
- 'dictionary': an entry in a general-language dictionary (eg Macquarie Dictionary, Oxford English Dictionary, Merriam-Webster). title is the dictionary's own name. chapterTitle is the word/phrase defined. If the page states an edition and year (a hard-copy/print dictionary or a static online reproduction of one), set edition (eg '5th ed' — include the 'ed' suffix) and year. If instead it's a live online dictionary with no edition number, leave edition/year empty — a live entry's retrieval date isn't knowable from the page's own content (that's today, whenever the student is citing it, not a fact the page states), so leave that for the student to fill in themselves too.
- 'legalEncyclopedia': an entry in a legal encyclopedia (eg Halsbury's Laws of Australia, The Laws of Australia, Halsbury's Laws of England) — recognise from the publisher (LexisNexis, Westlaw AU/Thomson Reuters) plus a numbered 'Title'/'Chapter' structure, distinct from an ordinary law-firm or government explainer page. title is the encyclopedia's own name. publisher is the encyclopedia's publisher. journalName is the broad subject-area 'Title' the entry sits under, AS ONE COMBINED STRING with its number directly in front if it has one (eg '235 Insurance', matching exactly how it appears on the source) — some encyclopedias, eg Halsbury's Laws of England, don't number their Titles at all, in which case just the name alone (eg 'Equitable Jurisdiction') is fine. chapterTitle is the specific chapter within that Title, same combined 'Number Name' form (eg '2 General Principles', '2.3 Access to Information'). startingPage is the specific paragraph number(s) cited, in the page's own numbering (eg '235-270', '101') — this is reused for the paragraph pinpoint here, not a literal page number.
- 'speech': a transcript or record of a speech, lecture, or address — recognise from framing like 'Speech delivered by...', a named lecture series, or a judge's/official's own 'Speeches' page. authors (single entry) is who delivered it, following AGLC4 r 4.1.5's judicial-officer rule specifically (this matters a lot for court speeches, a common source for this subtype): a judicial officer who was STILL SITTING on the date the speech was actually delivered keeps their judicial title (eg 'Justice') if — and only if — the source itself states it (eg a title page reading 'The Hon Justice Michael Kirby AC CMG', or a footnote 'Justice of the High Court of Australia' — post-nominals like 'AC CMG' are always dropped regardless, matching the no-honorifics convention every other author name in this app already follows). A judicial officer who had ALREADY RETIRED by the date the speech was delivered never keeps their former judicial title, even if the source itself states it — judge this by the delivery date, not by whether the hosting site's own current-day URL/section files them under eg 'former justices' (a court's site groups a speech by that person's status *today*, which can differ from their status when they actually gave it). A 'Sir'/'Dame'/peerage title, unlike a judicial title, is always kept either way. title is the speech's own title. documentType is 'Speech' by default, or — if it's a named lecture in a lecture series — the lecture's own name with any leading 'The' and its ordinal number both stripped (eg 'Lucinda Lecture', not 'The 2013 Lucinda Lecture' or '27th Sultan Azlan Shah Lecture'). institution is the institution/organisation that hosted or organised the occasion (eg a university, professional body, or court) — NOT the specific venue building it happened to be held in, even when the venue's own name is stated just as prominently (eg a graduation address's own cover page stating both 'Griffith University' and, as the physical venue, 'Brisbane Convention and Exhibition Centre' — the university is the forum here, prefer it over the incidental venue). Only fall back to the city/town if no institution/organisation is named at all. date is the full delivery date.
- 'pressRelease': an official press or media release — issued BY an organisation, in its own voice, announcing its own action, decision, or outcome (eg 'The ACMA has issued...', 'Today, Telstra announced...'). This is genuinely easy to confuse with 'newspaper', which is the OPPOSITE relationship — a third-party masthead's own journalist reporting ABOUT other people/events. Strong signals for 'pressRelease' even when the URL path itself says something generic like '/articles/' or '/news/': the page is hosted on a government regulator/agency/company's OWN domain (not an independent news outlet); a breadcrumb trail or site section literally reading 'Media releases'/'News and media'/'Newsroom'/'Press releases'; the byline is the organisation's own media/communications team rather than a named reporter; the body text speaks in the organisation's own institutional voice about its own decision rather than investigating/reporting on a third party. authors (single entry) is the issuing person/organisation. institution is the releasing body — leave this empty whenever it's the same as the author (very common: most releases are issued in an organisation's own name). title is the release's own title. documentType is 'Media Release' by default, or whatever label the source itself uses (eg 'Press Release', 'Press Statement') if it's different. seriesNumber is a release/reference number, only if the source itself prints one. date is the release's own date.
- 'abs': always author 'Australian Bureau of Statistics' — the fixed literal string; do not put this in authors[], it's applied automatically and any authors[] entry here is ignored. title is the release's own title, including any period/quarter as printed in the page heading (eg 'Underemployed workers, February 2026'), never with a separate year stripped out the way a Report's title is. seriesNumber is the catalogue number: ABS pages commonly state this directly in the page text as 'ABS catalogue number X' or 'Cat. no. X' (eg '6202.0') even when it isn't in a dedicated meta tag — search the content for this phrase specifically. Many current ABS releases genuinely don't have one at all (ABS has moved away from catalogue numbers for some newer web-first releases) — leave seriesNumber empty in that case rather than inventing one; don't treat its absence as a sign this isn't ABS content. date is the release's own publication date.
- 'filmOrMedia': a film, TV episode, radio segment, or podcast — including on a general news outlet's own site (eg ABC News hosts both ordinary text articles AND video/TV content, such as Four Corners episodes, under the same news.abc.net.au domain and near-identical URL shape). Distinguish from 'newspaper' by the page's own actual content, not just its domain: a 'filmOrMedia' page centres on an embedded video/audio player with a running time/duration, is framed as an episode of a named program/series (eg 'Four Corners', a podcast series name), and has comparatively little running prose text of its own — a 'newspaper' page instead has a named reporter byline and substantial paragraph-form written journalism as the primary content. mediaFormat is 'film' for a standalone film/audiovisual recording, 'tvSeries' for a television episode/program, or 'radioOrPodcast' for a radio segment or podcast — this is the one otherSources-specific field this subtype needs. articleTitle: leave completely empty for a film (r 7.14.2 — films never take an episode title). For a TV episode, its own title if it has one; if instead it's only labelled/numbered (eg 'Season 9, Episode 10' or just 'Episode 10' with no title), use that exact literal text as the value. For radio/podcasts, the episode's own title exactly as printed on the source. title is the film's title, or the television/radio/podcast SERIES name (eg 'Four Corners') — not the episode title, which is separate. publisher is the studio/production company/producer — for ABC content this is 'Australian Broadcasting Corporation', not 'ABC News' (that's the masthead name used only for the 'newspaper' type). date is a bare year for film/TV, but a full date for radio/podcasts (r 7.14.4 requires the full date there, not just a year). edition is only set for a genuinely non-standard version (eg 'Director's Cut') — leave empty for the standard/theatrical version.
- 'socialMedia': a post on a social media platform (eg X/Twitter, Facebook, Instagram, TikTok, LinkedIn) or a video uploaded to a platform like YouTube (note: a YouTube video that's really a news outlet's own produced segment, eg an embedded ABC News video player, is 'filmOrMedia' instead — 'socialMedia' is for the platform-native post/upload itself, not professionally-produced broadcast content that happens to also live on a platform). socialMediaUsername is exactly as displayed on the platform, capitalisation preserved, including the leading '@' for an X/Twitter handle — this is the one otherSources-specific field this subtype needs (a real name distinct from the username, when the platform shows one, isn't extracted here — leave it for the student, it's a minor optional detail). title is the post's own text/caption — leave completely empty if the post has none (eg a bare video/image upload with no caption), never an empty string that gets quoted as ''. newspaperName is reused for the platform's own name (eg 'Twitter' — not 'X', matching AGLC4's own worked examples, which predate the rebrand and still say 'Twitter'; use whichever the page's own branding suggests if it's a different platform). date is the full date the post was made — if only a raw UTC/ISO timestamp is available in the page metadata, convert it to a plain 'day Month year' date. Leave the post's specific time and time zone for the student to fill in manually — a platform typically displays the time adjusted to the *viewer's own* local time zone client-side, which a server-side fetch can't reliably replicate, so don't guess one.`

// Every field is a plain (non-nullable) string/array, using "" / [] as the "not present"
// sentinel — the Anthropic structured-output API caps requests at 16 nullable/union-typed
// parameters, and this schema's field count is well over that if each one is `.nullable()`.
const ExtractionSchema = z.object({
  sourceType: z.enum([
    'case',
    'legislation',
    'journal',
    'book',
    'report',
    'researchPaper',
    'website',
    'newspaper',
    'otherLegislativeMaterial',
    'internationalMaterial',
    'otherSources',
  ]),
  confidence: z.enum(['high', 'medium', 'low']),
  // Every field below is required (a plain '' / [] when it doesn't apply), deliberately, even
  // though that means most calls write out a lot of empty fields — this schema covers 11 source
  // types' worth of fields at once, so any single extraction only ever populates a handful of
  // them. Marking the unused-per-call fields `.optional()` looks like a free win (shorter output,
  // lower cost/latency) and IS one for the request the model actually has to produce — but it
  // breaks Anthropic's structured-output grammar compilation for a schema this large: confirmed
  // live, twice, that adding `.optional()` to a subset of these fields (tried at 47 optional, then
  // again at a smaller, carefully-chosen 20) makes every single extraction call hang indefinitely
  // (30s+, no response, no error — confirmed with direct API calls outside this app entirely, via
  // both `.parse()` and `.stream()`) even though the exact same fields, all required, complete in
  // ~10s reliably. This isn't the already-known "too many optional parameters" 400 (that one at
  // least fails fast, with a clear message, at 47 optional fields specifically) — it's a
  // separate, silent failure mode that shows up well under that documented ceiling. If revisiting
  // this: the real fix is almost certainly splitting this into several smaller per-source-type (or
  // per-category) schemas rather than one shared 48-field one, not just picking a different subset
  // of fields to mark optional — the size/shape of the *whole* schema seems to be what triggers it,
  // not which specific fields carry `.optional()`.
  fields: z.object({
    caseName: z.string(),
    caseReportType: z.enum(['reported', 'unreported-mnc', 'not-applicable']),
    year: z.string(),
    volume: z.string(),
    reportAbbreviation: z.string(),
    startingPage: z.string(),
    courtCode: z.string(),
    caseNumber: z.string(),
    judge: z.string(),
    actTitle: z.string(),
    jurisdiction: z.string(),
    authors: z.array(z.string()),
    articleTitle: z.string(),
    issue: z.string(),
    journalName: z.string(),
    title: z.string(),
    publisher: z.string(),
    edition: z.string(),
    chapterAuthors: z.array(z.string()),
    chapterTitle: z.string(),
    editors: z.array(z.string()),
    documentType: z.string(),
    seriesNumber: z.string(),
    institution: z.string(),
    date: z.string(),
    documentTitle: z.string(),
    websiteName: z.string(),
    newspaperName: z.string(),
    otherLegislativeMaterialSubtype: z.enum(['bill', 'explanatoryMaterial', 'gazette', 'practiceDirection', 'constitution', 'not-applicable']),
    explanatoryLabel: z.string(),
    gazetteAuthor: z.string(),
    court: z.string(),
    practiceType: z.string(),
    practiceNumber: z.string(),
    practiceTitle: z.string(),
    practiceDate: z.string(),
    internationalMaterialSubtype: z.enum(['treaty', 'unDocument', 'foreignDomestic', 'not-applicable']),
    openedForSignature: z.string(),
    treatySeries: z.string(),
    enteredIntoForce: z.string(),
    resolutionNumber: z.string(),
    session: z.string(),
    unDocSymbol: z.string(),
    adoptedDate: z.string(),
    canadaStatuteVolumeType: z.enum(['RS', 'S', 'not-applicable']),
    canadaJurisdictionAbbrev: z.string(),
    canadaChapter: z.string(),
    canadaSessionOrSupp: z.string(),
    usTitleOrChapterNumber: z.string(),
    // Not a true AGLC4 "pinpoint" (see PINPOINT_KEYS in Generator.tsx) — the section number is
    // part of the core US Code citation itself (eg '§ 1811'), the same non-pinpoint role
    // canadaChapter plays for its own country. Named distinctly from the shared `pinpoint` schema
    // field (which really is never autofilled) to avoid conflating the two.
    usCodeSection: z.string(),
    // otherSources deliberately adds only THREE new fields (this enum, mediaFormat, and
    // socialMediaUsername) — every other otherSources concept reuses an existing generic field
    // from elsewhere above instead of a dedicated one (see the SYSTEM_PROMPT guidance, which spells
    // out exactly which). Confirmed the hard way: an earlier version of this schema added one
    // dedicated field per otherSources concept (~24 new fields) and every single extraction call —
    // not just otherSources ones — started failing with the Anthropic API's own 'The compiled
    // grammar is too large' error, since structured-output schemas have a real complexity ceiling
    // shared across the whole tool, not a per-branch one. Reuse first; only add a genuinely new
    // field when nothing existing fits at all.
    otherSourcesSubtype: z.enum([
      'dictionary',
      'legalEncyclopedia',
      'speech',
      'pressRelease',
      'abs',
      'filmOrMedia',
      'socialMedia',
      'not-applicable',
    ]),
    mediaFormat: z.enum(['film', 'tvSeries', 'radioOrPodcast', 'not-applicable']),
    socialMediaUsername: z.string(),
  }),
})

type ExtractedFields = z.infer<typeof ExtractionSchema>['fields']

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return cachedClient
}

function extractPageContent(html: string) {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header').remove()

  const title = $('title').text().trim()

  // Confirmed live on a real page (a MinterEllison article) that this matters: its <title> tag was
  // 'Real Headline - TR 2026/2: What Software Distributors Need to Know Now - MinterEllison' — a
  // genuine subheading/SEO-keyword segment concatenated between the real headline and the site
  // name, which the model folded into the extracted article title as a result, producing a wrong
  // citation. A page's own <h1> is almost always the real, undecorated headline as actually
  // displayed, so it's extracted here as a second, independent signal alongside <title> — SYSTEM_
  // PROMPT tells the model to prefer it when the two disagree. Picking the *longest* <h1> on the
  // page, not just the first, matters too: the same real page also had a hidden, unrelated
  // `<h1>Share this page</h1>` (a genuine accessibility mis-tag on a hidden share-this-page widget,
  // sitting earlier in the DOM than the real headline) — `.first()` would have picked that instead.
  // A real article headline is essentially always longer than incidental UI-chrome text like that,
  // so "longest wins" is a simple, robust heuristic that doesn't depend on guessing whatever
  // hidden/visually-hidden class name convention a given site happens to use.
  const h1 = $('h1')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), '')

  // Pages can carry multiple <meta name="author"> tags (eg multi-author news articles) —
  // .attr() on a multi-element match only ever returns the first, so collect them all.
  const authorNames = $('meta[name="author"]')
    .map((_, el) => $(el).attr('content')?.trim())
    .get()
    .filter((value): value is string => Boolean(value))
  const metaAuthor =
    authorNames.length > 0 ? authorNames.join('; ') : ($('meta[property="article:author"]').attr('content') ?? '')

  const metaDate =
    $('meta[name="date"]').attr('content') ??
    $('meta[name="pubdate"]').attr('content') ??
    $('meta[name="publish-date"]').attr('content') ??
    $('meta[property="article:published_time"]').attr('content') ??
    $('meta[property="og:updated_time"]').attr('content') ??
    $('meta[itemprop="datePublished"]').attr('content') ??
    ''

  const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, CONTENT_CHAR_LIMIT)

  return { title, h1, metaAuthor, metaDate, content }
}

const EXPLANATORY_LABELS: ExplanatoryMaterialLabel[] = [
  'Explanatory Memorandum',
  'Explanatory Statement',
  'Explanatory Note',
  'Explanatory Notes',
]

function normalizeExplanatoryLabel(value: string): ExplanatoryMaterialLabel {
  return (EXPLANATORY_LABELS as string[]).includes(value) ? (value as ExplanatoryMaterialLabel) : 'Explanatory Memorandum'
}

function normalizePracticeType(value: string): PracticeDocumentType {
  return value === 'Practice Direction' ? 'Practice Direction' : 'Practice Note'
}

// A Bill (unlike the bare Commonwealth Constitution) always has a real jurisdiction — 'none' isn't
// a valid billJurisdiction, so an unrecognised/empty value falls back to Cth rather than 'none'.
function normalizeBillJurisdiction(value: string): JurisdictionCode {
  const jurisdiction = normalizeJurisdiction(value)
  return jurisdiction && jurisdiction !== 'none' ? jurisdiction : 'Cth'
}

// Canadian and UK statute titles both drop a leading 'The' (AGLC4 r 15.2.1, r 24.2.1) — the model
// is told this in the SYSTEM_PROMPT already, but stripped again here as a deterministic safety net,
// the same "prompt instruction + code-level backstop" pattern used throughout this file (eg
// stripDuplicateYearFromTitle, stripTrailingYear).
function stripLeadingThe(title: string): string {
  return title.replace(/^the\s+/i, '')
}

// Splits a legal encyclopedia's own combined 'Number Name' text (eg '235 Insurance', '2.3 Access
// to Information') into its two parts — used because the otherSources schema deliberately asks
// the model for this as one field (see the SYSTEM_PROMPT's field-reuse note) rather than two, to
// keep the schema small. A Title/Chapter with no number at all (eg 'Equitable Jurisdiction') is
// common and correct — number comes back undefined, not a parsing failure.
function splitLeadingNumber(value: string): { number?: string; name: string } {
  const match = value.trim().match(/^([\d.]+)\s+(.+)$/)
  return match ? { number: match[1], name: match[2] } : { name: value.trim() }
}

function mapFieldsToSourceType(sourceType: SourceType, raw: ExtractedFields, url: string): AutofillFields {
  const authors = raw.authors.filter((author) => author.trim().length > 0)

  switch (sourceType) {
    case 'case':
      return {
        caseName: raw.caseName,
        reportType: raw.caseReportType === 'unreported-mnc' ? 'unreported-mnc' : 'reported',
        year: raw.year,
        volume: raw.volume || undefined,
        reportAbbreviation: raw.reportAbbreviation || undefined,
        startingPage: raw.startingPage || undefined,
        courtCode: raw.courtCode || undefined,
        caseNumber: raw.caseNumber || undefined,
        judge: raw.judge || undefined,
      }
    case 'legislation': {
      // Never default an unrecognised jurisdiction to 'Cth' — a wrong jurisdiction is a silent
      // citation error. 'unknown' renders no bracket and is flagged as a missing field for the
      // student to fill in (see LegislationFields / getMissingFieldsWarning).
      const jurisdiction: LegislationFields['jurisdiction'] = normalizeJurisdiction(raw.jurisdiction) ?? 'unknown'
      // Safety net regardless of how well the model followed the "no year in actTitle"
      // instruction above — the citation engine italicises title and year together itself.
      const { title: actTitle, year } = stripTrailingYear(raw.actTitle, raw.year)
      return {
        actTitle,
        year,
        jurisdiction,
      }
    }
    case 'journal':
      return {
        authors,
        articleTitle: raw.articleTitle,
        year: raw.year,
        volume: raw.volume || undefined,
        issue: raw.issue || undefined,
        journalName: raw.journalName,
        startingPage: raw.startingPage,
      }
    case 'book': {
      const chapterAuthors = raw.chapterAuthors.filter((author) => author.trim().length > 0)
      const editors = raw.editors.filter((editor) => editor.trim().length > 0)
      return {
        bookType: 'book',
        authors: authors.length > 0 ? authors : undefined,
        title: raw.title,
        publisher: raw.publisher,
        year: raw.year,
        edition: raw.edition || undefined,
        chapterAuthors: chapterAuthors.length > 0 ? chapterAuthors : undefined,
        chapterTitle: raw.chapterTitle || undefined,
        editors: editors.length > 0 ? editors : undefined,
        startingPage: raw.startingPage || undefined,
      }
    }
    case 'report': {
      const reportTitle = stripDuplicateYearFromTitle(raw.title, raw.date)
      return {
        authors: authors.length > 0 ? authors : undefined,
        title: reportTitle,
        documentType: genericiseIntegralDocumentType(reportTitle, raw.documentType || 'Report'),
        seriesNumber: raw.seriesNumber || undefined,
        date: raw.date,
        url: url || undefined,
      }
    }
    case 'researchPaper':
      return {
        authors: authors.length > 0 ? authors : undefined,
        title: raw.title,
        documentType: raw.documentType || 'Research Paper',
        seriesNumber: raw.seriesNumber || undefined,
        institution: raw.institution,
        date: raw.date,
      }
    case 'internationalMaterial': {
      // Overrides whatever subtype the model chose, regardless — see UN_CHARTER_TITLES.
      if (isUnitedNationsCharter(raw.title)) {
        return { subtype: 'unDocument', title: 'Charter of the United Nations' }
      }

      const subtype =
        raw.internationalMaterialSubtype === 'not-applicable' ? 'treaty' : raw.internationalMaterialSubtype

      if (subtype === 'unDocument') {
        return {
          subtype: 'unDocument',
          title: raw.title,
          resolutionNumber: raw.resolutionNumber || undefined,
          session: raw.session || undefined,
          unDocSymbol: raw.unDocSymbol || undefined,
          date: raw.date,
          adoptedDate: raw.adoptedDate || undefined,
        }
      }

      // Foreign Domestic Sources extraction is only built for Canada and the UK so far (see
      // SYSTEM_PROMPT) — which of the two (and which category) is determined deterministically
      // from the URL itself, not trusted to the model, since that's a much more reliable signal
      // than asking it to classify a jurisdiction/category it has no other way to be sure of.
      if (subtype === 'foreignDomestic') {
        const lowerUrl = url.toLowerCase()

        if (lowerUrl.includes('laws-lois.justice.gc.ca')) {
          const { title, year } = stripTrailingYear(raw.actTitle || raw.title, raw.year)
          return {
            subtype: 'foreignDomestic',
            foreignCountry: 'Canada',
            foreignCategory: 'legislation',
            title: stripLeadingThe(title),
            canadaStatuteVolumeType: raw.canadaStatuteVolumeType === 'not-applicable' ? undefined : raw.canadaStatuteVolumeType,
            canadaJurisdictionAbbrev: raw.canadaJurisdictionAbbrev || 'C',
            year,
            canadaChapter: raw.canadaChapter || undefined,
            canadaSessionOrSupp: raw.canadaSessionOrSupp || undefined,
          }
        }

        if (lowerUrl.includes('decisions.scc-csc.ca')) {
          return {
            subtype: 'foreignDomestic',
            foreignCountry: 'Canada',
            foreignCategory: 'case',
            title: raw.caseName || raw.title,
            year: raw.year,
            volume: raw.volume || undefined,
            reportAbbreviation: raw.reportAbbreviation || 'SCR',
            startingPage: raw.startingPage || undefined,
          }
        }

        if (lowerUrl.includes('legislation.gov.uk')) {
          const { title, year } = stripTrailingYear(raw.actTitle || raw.title, raw.year)
          // No chapter number here (r 24.2.3 — post-1963 UK/NI/Scot/Wales statutes carry no
          // number at all; a genuinely pre-1963 Act needs its regnal year filled in by the
          // student, which this fallback path can't reliably read off the page — see ai-extract's
          // own system-prompt guidance above).
          return {
            subtype: 'foreignDomestic',
            foreignCountry: 'UK',
            foreignCategory: 'legislation',
            title: stripLeadingThe(title),
            year,
            ukJurisdiction: detectUKJurisdictionFromUrl(url) ?? 'UK',
          }
        }

        if (lowerUrl.includes('legislation.govt.nz')) {
          // The dedicated nz-legislation.ts route handles ordinary public Acts (the '/act/' URL
          // segment) deterministically and never reaches here for those — this fallback is really
          // only exercised by NZ delegated legislation (Regulations, under a different
          // '/regulation/' URL segment nz-legislation-parse.ts deliberately doesn't claim to
          // handle) or an unexpected page shape. r 21.2.2's own 'SR Year/Number' form isn't
          // separately verified against a real Regulations page, and there's no schema field for
          // it here — left for the student to add themselves rather than guessed at.
          const { title, year } = stripTrailingYear(raw.actTitle || raw.title, raw.year)
          return {
            subtype: 'foreignDomestic',
            foreignCountry: 'NewZealand',
            foreignCategory: lowerUrl.includes('/regulation/') ? 'delegatedLegislation' : 'legislation',
            title,
            year,
          }
        }

        if (lowerUrl.includes('law.cornell.edu/uscode')) {
          return {
            subtype: 'foreignDomestic',
            foreignCountry: 'US',
            foreignCategory: 'legislation',
            usTitleOrChapterNumber: raw.usTitleOrChapterNumber || undefined,
            usCodeAbbrev: 'USC',
            pinpoint: raw.usCodeSection || undefined,
          }
        }

        // No other jurisdiction has extraction support yet — a bare title rather than crashing.
        return { subtype: 'foreignDomestic', title: raw.title }
      }

      return {
        subtype: 'treaty',
        title: raw.title,
        treatyType: 'multilateral',
        openedForSignature: raw.openedForSignature || undefined,
        // The source content very often doesn't state its own UNTS registration at all (see the
        // SYSTEM_PROMPT guidance above) — falls back to a small hand-verified list of major
        // treaties' known citations before giving up and leaving the field blank.
        treatySeries: raw.treatySeries || lookupKnownTreatySeries(raw.title) || '',
        enteredIntoForce: raw.enteredIntoForce || undefined,
      }
    }
    case 'newspaper':
      return {
        authors: authors.length > 0 ? authors : undefined,
        articleTitle: raw.articleTitle || raw.title,
        newspaperName: raw.newspaperName,
        date: raw.date,
        url,
      }
    case 'otherLegislativeMaterial': {
      const subtype = raw.otherLegislativeMaterialSubtype === 'not-applicable' ? 'bill' : raw.otherLegislativeMaterialSubtype

      if (subtype === 'constitution') {
        const { title: constitutionTitle, year: constitutionYear } = stripTrailingYear(raw.actTitle, raw.year)
        return {
          subtype,
          constitutionTitle,
          constitutionYear,
          constitutionJurisdiction: normalizeJurisdiction(raw.jurisdiction) ?? 'none',
        }
      }

      if (subtype === 'gazette') {
        return {
          subtype,
          gazetteAuthor: raw.gazetteAuthor || undefined,
          gazetteArticleTitle: raw.articleTitle || undefined,
          gazetteJurisdiction: raw.jurisdiction || undefined,
          gazetteName: raw.journalName || undefined,
          gazetteNumber: raw.issue || undefined,
          gazetteDate: raw.date || undefined,
          gazetteStartingPage: raw.startingPage || undefined,
        }
      }

      if (subtype === 'practiceDirection') {
        return {
          subtype,
          court: raw.court || undefined,
          practiceType: normalizePracticeType(raw.practiceType),
          practiceNumber: raw.practiceNumber || undefined,
          practiceTitle: raw.practiceTitle || undefined,
          practiceDate: raw.practiceDate || undefined,
        }
      }

      // 'bill' and 'explanatoryMaterial' both reuse actTitle/year/jurisdiction for the Bill itself
      // — r 3.7 cites the underlying Bill per r 3.2, so the same fields describe both subtypes.
      const { title: billTitle, year: billYear } = stripTrailingYear(raw.actTitle, raw.year)
      return {
        subtype,
        billTitle,
        billYear,
        billJurisdiction: normalizeBillJurisdiction(raw.jurisdiction),
        explanatoryLabel: subtype === 'explanatoryMaterial' ? normalizeExplanatoryLabel(raw.explanatoryLabel) : undefined,
      }
    }
    case 'otherSources': {
      const subtype = raw.otherSourcesSubtype === 'not-applicable' ? 'dictionary' : raw.otherSourcesSubtype

      if (subtype === 'legalEncyclopedia') {
        const titleSplit = splitLeadingNumber(raw.journalName)
        const chapterSplit = splitLeadingNumber(raw.chapterTitle)
        return {
          subtype,
          encyclopediaPublisher: raw.publisher || undefined,
          encyclopediaTitle: raw.title || undefined,
          encyclopediaTitleNumber: titleSplit.number,
          encyclopediaTitleName: titleSplit.name || undefined,
          encyclopediaChapterNumber: chapterSplit.number,
          encyclopediaChapterName: chapterSplit.name || undefined,
          encyclopediaParagraph: raw.startingPage || undefined,
        }
      }

      if (subtype === 'speech') {
        return {
          subtype,
          speechAuthor: authors[0] || undefined,
          speechTitle: raw.title || undefined,
          speechLabel: raw.documentType || undefined,
          speechForum: raw.institution || undefined,
          speechDate: raw.date || undefined,
        }
      }

      if (subtype === 'pressRelease') {
        return {
          subtype,
          pressReleaseAuthor: authors[0] || undefined,
          pressReleaseTitle: raw.title || undefined,
          pressReleaseType: raw.documentType || undefined,
          pressReleaseDocumentNumber: raw.seriesNumber || undefined,
          pressReleaseBody: raw.institution || undefined,
          pressReleaseDate: raw.date || undefined,
        }
      }

      if (subtype === 'abs') {
        return {
          subtype,
          absTitle: raw.title || undefined,
          absCatalogueNumber: raw.seriesNumber || undefined,
          absDate: raw.date || undefined,
        }
      }

      if (subtype === 'filmOrMedia') {
        return {
          subtype,
          mediaFormat: raw.mediaFormat === 'not-applicable' ? undefined : raw.mediaFormat,
          mediaEpisodeTitle: raw.articleTitle || undefined,
          mediaTitle: raw.title || undefined,
          mediaVersionDetails: raw.edition || undefined,
          mediaStudio: raw.publisher || undefined,
          mediaDate: raw.date || undefined,
          mediaUrl: url || undefined,
        }
      }

      if (subtype === 'socialMedia') {
        return {
          subtype,
          socialMediaUsername: raw.socialMediaUsername || undefined,
          socialMediaTitle: raw.title || undefined,
          socialMediaPlatform: raw.newspaperName || undefined,
          socialMediaDate: raw.date || undefined,
          socialMediaUrl: url || undefined,
        }
      }

      // 'dictionary'
      return {
        subtype: 'dictionary',
        dictionaryTitle: raw.title || undefined,
        dictionaryEdition: raw.edition || undefined,
        dictionaryYear: raw.year || undefined,
        dictionaryEntryTitle: raw.chapterTitle || undefined,
      }
    }
    case 'website':
    default:
      return {
        authors: authors.length > 0 ? authors : undefined,
        // A page classified 'website' (an organisation's own article/insight/blog page, not a
        // masthead newspaper) can still visually read as an article — byline, publish date,
        // reading time — and the model sometimes puts its title in articleTitle rather than
        // title/documentTitle as a result, the same field a genuine 'newspaper' source would use.
        // Confirmed live on a real page (a MinterEllison "Insight" article) where this happened.
        // Falls back to it last, after the two fields this branch is actually supposed to read.
        documentTitle: raw.documentTitle || raw.title || raw.articleTitle,
        websiteName: raw.websiteName,
        documentType: 'Web Page',
        date: raw.date || undefined,
        url,
      }
  }
}

// suggestAlternative is only meaningful for a URL-based attempt — a failure while already
// processing an uploaded PDF or pasted text shouldn't recommend the very thing that just failed.
function fallbackResult(url: string, suggestAlternative = false): AutofillResult {
  const message = suggestAlternative
    ? `Could not extract details — please fill fields manually. ${TRY_ALTERNATIVE_INPUT_SUGGESTION}`
    : 'Could not extract details — please fill fields manually.'
  // Same URL-only source-type guess tooLargeResult() uses (see its comment) — a document that
  // times out mid-fetch (eg a large report on a slow host, never even reaching the Content-Length
  // check below) hits this same generic path, and deserves the same benefit of the doubt.
  const guessedType = guessSourceTypeFromUrl(url)
  return {
    detectedSourceType: guessedType ?? 'website',
    fields: guessedType === 'report' ? {} : { url, documentTitle: '' },
    confidence: 'low',
    message,
  }
}

// Covers any domain caught by isCloudflareChallenge() at fetch time — not just the ones
// pre-registered by name in detect.ts's BLOCKED_DATABASES. That list still matters (it skips the
// fetch attempt entirely for a domain already known to always fail this way, and gives a properly
// curated display name + defaultSourceType instead of a bare hostname) — this is the fallback for
// every domain nobody's reported yet, so a first-time "why won't this autofill" report gets the
// same honest, actionable message a curated one does, not a generic "could not extract details"
// that reads like Pinpoint's own extraction failed rather than the site itself blocking access.
// Deliberately doesn't name 'Cloudflare' specifically in the message (matching every other entry
// in BLOCKED_DATABASES, none of which do either) — confirmed live on researchgate.net that a 403
// branded `server: cloudflare` isn't always Cloudflare's own bot-management challenge; that one
// turned out to be ResearchGate's own "Temporarily Unavailable" block page, merely served through
// Cloudflare's CDN like a huge fraction of the modern web is. isCloudflareChallenge()'s secondary
// heuristic (a plain 403 branded 'cloudflare', used when the more specific `cf-mitigated:
// challenge` header is absent) still correctly catches this as "not fetchable, don't bother
// retrying" — but the specific *mechanism* named to the student would have been wrong, hence the
// vaguer, always-accurate "restricts automated access" wording instead.
function cloudflareBlockedResult(url: string): AutofillResult {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return 'This site'
    }
  })()
  return {
    detectedSourceType: 'website',
    fields: { url, documentTitle: '' },
    confidence: 'low',
    message: `${hostname} restricts automated access, so Pinpoint is unable to retrieve citation details directly from this link. Please download the PDF and upload it here instead, or paste the citation details directly.`,
  }
}

// A normal page/PDF this app extracts from is a few hundred KB at most — extractPageContent and
// extractPdfText only ever look at the first CONTENT_CHAR_LIMIT characters anyway (and, for a PDF
// with more than a couple dozen pages, only the first/last handful of pages at that — see
// LARGE_PDF_PAGE_THRESHOLD in pdf.ts), so nothing past a few MB of *text* is ever actually used.
// This check exists to reject documents before even that gets a chance — for a genuinely huge
// document, buffering the whole thing can itself blow past FETCH_TIMEOUT_MS and fail with the same
// generic, unhelpful "Could not extract details" message a real extraction failure gets. But size
// alone isn't the risk — speed is: a 16MB static PDF served off a fast host (confirmed directly:
// homeaffairs.gov.au's 2023-24 annual report, 16.2MB, downloads in well under 2 seconds) is no
// threat at all, while laws-lois.justice.gc.ca's 'FullText.html' view serves slowly regardless of
// size — even the Criminal Code (C-46, 5.1MB) took 43 seconds to fully download in direct testing.
//
// Two caps, because an HTML page and a PDF have different risk profiles once fetched: a huge HTML
// page (a full Act with every schedule) is still just a `cheerio.load` + `.text()` away from being
// usable, but a large PDF then has to be structurally parsed by pdfjs on a constrained serverless
// CPU on top of the download. The PDF cap is set to still clear a real government annual report
// (the homeaffairs.gov.au case) with headroom, but below where a 25MB parse would be gambling
// against REQUEST_TIMEOUT_MS in production. Both are now also enforced by an actual streamed byte
// counter (readBodyWithLimit), not just the Content-Length header — a server using chunked
// transfer encoding omits that header entirely, and used to slip straight past this check.
export const MAX_FETCH_BYTES = 25_000_000
export const MAX_PDF_FETCH_BYTES = 18_000_000

// Thrown by readBodyWithLimit when a response body streams past its cap — caught in
// aiExtractFromUrl and turned into the same tooLargeResult() a Content-Length hit produces.
class ResponseTooLargeError extends Error {}

/**
 * Reads a response body into an ArrayBuffer, aborting the moment it exceeds `limitBytes`. Unlike
 * `response.arrayBuffer()`, this bounds memory and time even when the server sent no
 * Content-Length (chunked transfer encoding), and stops downloading a doomed multi-MB body rather
 * than buffering all of it first and rejecting afterwards.
 */
async function readBodyWithLimit(response: Response, limitBytes: number): Promise<ArrayBuffer> {
  const reader = response.body?.getReader()
  if (!reader) return response.arrayBuffer()

  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > limitBytes) {
      await reader.cancel()
      throw new ResponseTooLargeError()
    }
    chunks.push(value)
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out.buffer
}

/**
 * Decodes an HTML response body read as raw bytes (via readBodyWithLimit) back into text, honouring
 * a `charset=` in the Content-Type header where one is given and falling back to UTF-8 — which is
 * what `response.text()` would have done, kept equivalent here now that the body is streamed for
 * the size cap instead of being read directly as text.
 */
function decodeHtmlBody(buffer: ArrayBuffer, response: Response): string {
  const charset = response.headers.get('content-type')?.match(/charset=([^;]+)/i)?.[1]?.trim()
  try {
    return new TextDecoder(charset || 'utf-8').decode(buffer)
  } catch {
    return new TextDecoder('utf-8').decode(buffer)
  }
}

// When a document is too large to fetch/parse, Pinpoint never sees its content — but the URL
// itself is often still a strong, honest signal for what kind of source it is, worth surfacing
// even though the student still has to fill in every field by hand. Deliberately narrow and
// conservative (only the unambiguous 'report' case, matched against path segments and the
// filename alone) rather than a broad classifier guessing from thin evidence — matching this
// app's existing bias elsewhere (see the internationalMaterial warnings scoping in warnings.ts)
// toward no guess over a confidently wrong one. Confirmed against a real example:
// homeaffairs.gov.au/reports-and-pubs/Annualreports/home-affairs-annual-report-2023-24.pdf hits
// both 'reports-and-pubs' and 'annual-report' and would otherwise silently default to 'website'.
function guessSourceTypeFromUrl(url: string): SourceType | undefined {
  const lower = url.toLowerCase()
  const reportSignals = ['reports-and-pubs', 'annual-report', 'annualreport', 'discussion-paper', 'white-paper', 'policy-document']
  if (reportSignals.some((signal) => lower.includes(signal))) return 'report'
  return undefined
}

function tooLargeResult(url: string): AutofillResult {
  const guessedType = guessSourceTypeFromUrl(url)
  return {
    detectedSourceType: guessedType ?? 'website',
    fields: guessedType === 'report' ? {} : { url, documentTitle: '' },
    confidence: 'low',
    message:
      'This document is too large or slow for Pinpoint to fetch and process in the time available (some run well over 15MB, or load slowly even in a browser). Please download it and upload the PDF here instead, or paste the citation details directly.',
  }
}

interface ExtractionSource {
  title: string
  // Only ever populated by the URL-fetch path (extractPageContent) — a PDF has no DOM to pull an
  // <h1> from, so it stays undefined there and simply doesn't add a line to the prompt below.
  h1?: string
  metaAuthor: string
  metaDate: string
  content: string
  url: string
}

/**
 * Shared by both the URL-fetch path and the direct-PDF-upload path — everything past "here's
 * some page/document content" is identical. When the caller already knows the source type (eg an
 * AU legislation domain, or a hint threaded through from elsewhere), passing it here does two
 * things: it tells the model what fields matter instead of leaving it to guess the source type
 * from content alone, and — more importantly — mapFieldsToSourceType is forced to use it rather
 * than trusting a possibly-wrong guess, so the returned fields are always shaped correctly for
 * the type the caller expects.
 */
async function runExtraction(source: ExtractionSource, sourceTypeHint?: SourceType): Promise<AutofillResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')

  const hintLine = sourceTypeHint
    ? `\n\nThis source is already known to be of type "${sourceTypeHint}" — extract fields for that type.`
    : ''
  const urlLine = source.url ? `URL: ${source.url}\n\n` : ''

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    // SYSTEM_PROMPT is ~9,300 tokens and byte-identical on every call — cached so only the first
    // request in a ~5-minute window pays to process it, the rest hit a cache read instead. This
    // materially cuts the typical-case time-to-first-token for every autofill call, not just a
    // cost saving: a slow/uncached run of this call stacked on top of a slow upstream fetch (eg a
    // large legislation.gov.au page) is exactly what can push a request past REQUEST_TIMEOUT_MS in
    // route.ts — see CLAUDE.md.
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: 'low',
      format: zodOutputFormat(ExtractionSchema),
    },
    messages: [
      {
        role: 'user',
        content: `Extract citation metadata from this ${source.url ? 'webpage' : 'document'}.\n\n${urlLine}Page title: ${source.title}${source.h1 ? `\n\nH1 heading (the page's own main heading, as actually displayed): ${source.h1}` : ''}\n\nMeta author(s) (if more than one, semicolon-separated — include every one as a separate author): ${source.metaAuthor}\n\nMeta date: ${source.metaDate}\n\nContent:\n${source.content}${hintLine}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    return fallbackResult(source.url, !!source.url)
  }

  const parsed = response.parsed_output
  // Overrides even a model classification of something other than 'internationalMaterial' — the
  // Charter's own page/PDF typically does state signature/entry-into-force language the way a
  // real treaty's would, which is exactly the kind of thing that can pull the model toward the
  // wrong classification despite the SYSTEM_PROMPT's explicit carve-out (the subtype-level bare-
  // title override then happens inside mapFieldsToSourceType itself). See UN_CHARTER_TITLES.
  const sourceType = isUnitedNationsCharter(parsed.fields.title)
    ? 'internationalMaterial'
    : (sourceTypeHint ?? parsed.sourceType)
  const fields = mapFieldsToSourceType(sourceType, parsed.fields, source.url)

  return {
    detectedSourceType: sourceType,
    fields,
    confidence: parsed.confidence,
  }
}

export async function aiExtractFromUrl(url: string, sourceTypeHint?: SourceType): Promise<AutofillResult> {
  const cacheKey = `autofill:ai-extract:${hashKey(url)}:${sourceTypeHint ?? ''}`
  const cached = await getCached<AutofillResult>(cacheKey)
  if (cached) return cached

  // docs.un.org's own page never carries any real content (see rewriteDocsUnOrgUrl) — fetch the
  // actual PDF it embeds instead, while keeping `url` itself (used below and cached against) as
  // what the student actually pasted.
  const fetchUrl = rewriteDocsUnOrgUrl(url) ?? url

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let title: string
    let h1: string | undefined
    let metaAuthor: string
    let metaDate: string
    let content: string
    try {
      const response = await fetchWithUserAgentFallback(fetchUrl, { signal: controller.signal })
      if (isCloudflareChallenge(response)) return cloudflareBlockedResult(url)
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

      const isPdf = isPdfContentType(response.headers.get('content-type'))
      const cap = isPdf ? MAX_PDF_FETCH_BYTES : MAX_FETCH_BYTES

      const contentLength = response.headers.get('content-length')
      if (contentLength && Number(contentLength) > cap) {
        return tooLargeResult(url)
      }

      try {
        if (isPdf) {
          title = ''
          h1 = undefined
          metaAuthor = ''
          metaDate = ''
          content = await extractPdfText(await readBodyWithLimit(response, cap), CONTENT_CHAR_LIMIT)
        } else {
          const buffer = await readBodyWithLimit(response, cap)
          ;({ title, h1, metaAuthor, metaDate, content } = extractPageContent(decodeHtmlBody(buffer, response)))
        }
      } catch (bodyErr) {
        if (bodyErr instanceof ResponseTooLargeError) return tooLargeResult(url)
        throw bodyErr
      }
    } finally {
      clearTimeout(timeout)
    }

    const result = await runExtraction({ title, h1, metaAuthor, metaDate, content, url }, sourceTypeHint)
    await setCached(cacheKey, result)
    return result
  } catch (err) {
    // A fetch aborted by the FETCH_TIMEOUT_MS controller means the document was too slow to pull
    // down in time — for the student, that's the same "get it another way" situation as it being
    // too large, so it gets the same actionable message rather than the generic extraction-failed
    // one (which reads as if Pinpoint's parsing broke).
    if (err instanceof Error && err.name === 'AbortError') return tooLargeResult(url)
    return fallbackResult(url, true)
  }
}

export interface PdfMetadataInput {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  rawText?: string
  filename?: string
}

// Journal-article PDFs from most major publishers (Cambridge, Springer, Elsevier, Wiley, ...)
// print the article's own DOI somewhere on page 1, usually in a citation footer alongside the
// full published volume/issue/page reference — eg 'European Journal of Risk Regulation (2024),
// 15, 431–446 doi:10.1017/err.2023.57'. Confirmed on a real PDF that this footer can sit past the
// ~2000-character snippet budget (it landed at character ~3045 of a 3178-character page 1), so
// the AI extractor never saw the volume/issue/page at all. Rather than widening the budget or
// teaching the model this exact footer shape, any DOI found in the snippet is looked up directly
// against CrossRef first — the same authoritative pipeline a pasted DOI or DOI URL already gets —
// falling through to the generic AI-text extraction only if no DOI is present or the lookup fails.
const DOI_IN_TEXT_PATTERN = /(?:doi\.org\/|doi:\s*)(10\.\d{4,}\/[^\s"'<>()[\],;]+)/i

async function extractViaEmbeddedDoi(text: string): Promise<AutofillResult | null> {
  const match = text.match(DOI_IN_TEXT_PATTERN)
  if (!match) return null
  const result = await fetchCrossRefDOI(match[1])
  return result.confidence === 'low' ? null : result
}

/**
 * For a PDF the student uploads — parsed entirely client-side (see
 * lib/pdf-extract/client-extract.ts) so the file itself, and the bulk of its text, never reach
 * the server. This only ever receives the small text-only summary that extraction produces (a
 * handful of document-properties fields plus a ~2000-character snippet of page 1), not the file.
 */
export async function aiExtractFromPdfMetadata(metadata: PdfMetadataInput): Promise<AutofillResult> {
  const supplementaryLines = [
    metadata.subject ? `Subject: ${metadata.subject}` : '',
    metadata.keywords ? `Keywords: ${metadata.keywords}` : '',
    metadata.creator ? `Creator: ${metadata.creator}` : '',
    metadata.producer ? `Producer: ${metadata.producer}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const content = [supplementaryLines, metadata.rawText ?? ''].filter(Boolean).join('\n\n')

  // A EUR-Lex PDF export's own filename ('CELEX_31993L0013_EN_TXT.pdf') carries a CELEX number
  // that's far more reliable than anything extractable from the PDF's own text — confirmed live
  // as a real bug: this exact Directive 93/13 PDF has no embedded Title, and its page-1 text opens
  // with 'Official Journal of the European Communities', which is reasonable-but-wrong grounds
  // for the text-only AI extractor below to misclassify it as a Gazette citation (Other
  // Legislative Material) instead of the legislative act itself (European Union Materials, r
  // 14.2.1). Checked before the DOI check — a EUR-Lex filename is a stronger, more specific
  // signal than a bare DOI substring could ever be, so this takes priority.
  const celex = metadata.filename ? extractCelexFromFilename(metadata.filename) : undefined
  if (celex) {
    const celexResult = await fetchEuropeanUnionByIdentifier({ type: 'celex', value: celex })
    if (celexResult) return finalizeAutofillResult(celexResult, false)
  }

  try {
    const doiResult = await extractViaEmbeddedDoi(content)
    if (doiResult) return finalizeAutofillResult(doiResult, false)

    const result = await runExtraction({
      title: metadata.title ?? '',
      metaAuthor: metadata.author ?? '',
      metaDate: '',
      content,
      url: '',
    })
    return finalizeAutofillResult(result, false)
  } catch {
    return fallbackResult('')
  }
}

/**
 * For citation details copied by hand from a source Pinpoint can't fetch itself — eg a login-
 * gated database like Lexis+ or Westlaw, or just a title + authors off a reading list. Tries the
 * authoritative CrossRef pipeline first (an exact lookup on any DOI in the text, then a gated
 * title search for a journal/conference reference) before falling back to parsing the free text
 * with the model, which is only ever as good as what the student typed. No fetch of an arbitrary
 * page is involved, so this can't fail the way the URL/PDF paths can.
 */
export async function aiExtractFromPastedText(text: string): Promise<AutofillResult> {
  try {
    const doiResult = await extractViaEmbeddedDoi(text)
    if (doiResult) return finalizeAutofillResult(doiResult, false)

    if (looksLikeSecondarySourceReference(text)) {
      const bibResult = await fetchCrossRefByBibliographic(text)
      if (bibResult) return finalizeAutofillResult(bibResult, false)
    }

    const result = await runExtraction({
      title: '',
      metaAuthor: '',
      metaDate: '',
      content: text.slice(0, CONTENT_CHAR_LIMIT),
      url: '',
    })
    return finalizeAutofillResult(result, false)
  } catch {
    return fallbackResult('')
  }
}
