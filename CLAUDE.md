# Pinpoint

An AGLC4 (Australian Guide to Legal Citation, 4th ed) citation generator for law students. Next.js 14 App Router, TypeScript, Tailwind, deployed nowhere yet (no git remote configured — see "Deployment" below).

## Architecture

- **`lib/citation-engine/`** — deterministic, pure-function citation formatting, one file per source type (`cases.ts`, `legislation.ts`, `journal-articles.ts`, `books.ts`, `reports.ts`, `research-papers.ts`, `websites.ts`, `treaties.ts`). `index.ts` dispatches on `SourceType` and exposes `generateCitationSync` (safe to call client-side for instant preview) and `formatItalics` (the single chokepoint that converts `*text*` markers to italics and straight quotes/apostrophes to typographic ones for actual display/copy).
- **`lib/citation-engine/validator.ts`** — a second pass using Claude to catch what the deterministic engine can't (AGLC4 rule text is embedded per source type in `RULES_BY_SOURCE_TYPE`, plus shared `BIBLIOGRAPHY_RULE`/`SUBSEQUENT_RULE` since those diverge from the per-type rules in ways worth stating once).
- **`lib/autofill/`** — three independent ways to populate fields, all funnelling into the same field-mapping/validation logic in `ai-extract.ts`:
  1. **URL paste** (`lib/autofill/index.ts` → `autofill()`) — routes by domain/pattern (AustLII, AU state legislation sites, CrossRef DOIs, or the generic AI-extraction fallback).
  2. **PDF upload** — parsed **entirely client-side** via `pdfjs-dist` (`lib/pdf-extract/client-extract.ts`); only a small text summary (title/author/subject/keywords/creator/producer + a ~2000-char page-1 snippet) is ever sent to `/api/autofill/pdf`. The file itself never reaches the server — this was a deliberate legal/privacy requirement, not just an implementation choice. See "PDF upload internals" below before touching this.
  3. **Paste text** — for sources Pinpoint can't fetch at all (login-gated databases like Lexis+/Westlaw): student copies the citation details by hand, same extraction pipeline as the other two.
- **`Generator.tsx`** — the main client component. Tracks per-field "touched" state (`touchedFields`) so a fresh autofill can safely overwrite everything *except* what the student manually typed, while pinpoint fields are deliberately excluded from that protection (see `PINPOINT_KEYS`) since they identify a spot in *this* citation, not the source itself, and should never carry over between citations.

## Non-obvious conventions (read before "fixing" these)

- **Typographic quotes**: `applyTypographicApostrophes` in `citation-engine/index.ts` is context-aware, not a blind `'` → `'` replace — it has to correctly open/close a straight-quoted phrase nested inside a title (eg `the 'black box'`), which a naive replace gets wrong.
- **Bibliography formatting** differs from footnote/subsequent in three ways, all deliberate: never uses "et al" (lists every author in full), only the *first* author's name is inverted to `Surname, Given`, and it ends with **no trailing full stop**. The AI validator didn't know this until `BIBLIOGRAPHY_RULE` was added — if it starts "correcting" a correct bibliography back to footnote style, that rule text is the first place to check.
- **Author names**: always full given names, never abbreviated to initials (`formatAuthorAGLC4` in `lib/autofill/utils.ts`). Sources like CrossRef sometimes hand back a stray full stop after a single-letter middle initial (eg `"Emily M."`) — `stripInitialFullStops` in `citation-engine/utils.ts` cleans this at render time, inside `formatAuthorList`/`formatBibliographyAuthorList`, so it's applied regardless of where the name came from.
- **Legislation pinpoints from a pasted URL**: NSW, Qld, and Tas run the same underlying platform (confirmed by matching generic `<title>` tags and identical URL structure) with a `#sec.N`-style fragment convention — `lib/autofill/au-legislation.ts` parses this directly from the URL string (no fetch needed). Deliberately **not** extended to Vic/WA/SA/ACT/NT, which run different, unverified platforms — guessing a pinpoint wrong is worse than leaving it blank, so those get a "please add manually" note instead via `finalizeAutofillResult` in `lib/autofill/utils.ts`.
- **AGLC4 rule-number confidence**: every rule number cited in the UI (`AGLC4 r X.X`) is asserted with reasonable confidence *except* the Conference/Research Paper/Thesis type, which cites `AGLC4 ch 7` only — the chapter is right, the general format is right, but the precise sub-rule numbering (conference papers vs theses may be separately numbered) hasn't been verified against the actual guide. Worth tightening if the user ever confirms the exact numbers.

## Known external limitations (don't try to "fix" these without new info)

**Genuine Cloudflare bot challenges** (`cf-mitigated: challenge` header, confirmed by direct `curl` testing) — no User-Agent trick fixes these, and building a real JS-challenge solver is out of scope:
- `austlii.edu.au` (both cases and legislation)
- `legislation.nsw.gov.au`, `legislation.sa.gov.au`
- `supremecourt.nt.gov.au`
- `fedcourt.gov.au`
- `dl.acm.org`

All of these degrade gracefully to a fallback that fills whatever's derivable from the URL alone (jurisdiction, a pinpoint parsed from the fragment) and suggests the PDF-upload or paste-text alternative (`TRY_ALTERNATIVE_INPUT_SUGGESTION` in `lib/autofill/utils.ts`).

**Client-rendered pages with ~no server-side content** (fetch succeeds, but there's nothing useful in the HTML — different failure mode, same "suggest an alternative" fix):
- `nswlr.com.au` — case name comes through fine (it's in the URL/title), but the year is fetched client-side after load and isn't in the server-rendered HTML at all.
- `sclqld.org.au/caselaw/*` (the case *summary* page) — a Vue SPA with ~700 characters of generic search-UI text and nothing else. Note this is a **different domain** from `archive.sclqld.org.au`, which serves the actual judgment PDFs and works fine — if a student pastes the summary page, `detectInputType` catches it early and tells them to find the actual judgment instead.

**WA eCourts Portal** (`ecourts.justice.wa.gov.au`) was a real bug, now fixed: every request gets a 302 to a terms-of-use gate, but the 302 response body itself already contains the full decision. `lib/autofill/fetch.ts`'s `fetchWithUserAgentFallback` follows redirects manually and uses a redirect's own body when it's substantial (>2000 chars) rather than silently discarding it — this benefits any similarly-behaved site, not just this one.

**CrossRef-resolved DOIs**: `lib/autofill/crossref.ts` checks CrossRef's own `type` field (`proceedings-article` → Conference Paper fields, not journal fields — this was a real bug, journal was previously hardcoded regardless of actual type). CrossRef doesn't always have conference start/end dates on record (falls back to year-only when absent, per the citation's own stated AGLC4 convention) — if a student needs the exact dates and CrossRef lacks them, the paper's own front matter almost always has them, so PDF-upload or paste-text is the reliable path, not a URL paste.

## PDF upload internals — two real bugs to know about if you touch this

1. **`'use client'` does not stop server-side evaluation.** `pdfjs-dist` references browser-only globals (`DOMMatrix`) at module-load time, which crashes if evaluated in Node — and Next.js *does* evaluate client-component modules in Node during the initial SSR pass, `'use client'` notwithstanding (it only marks the RSC boundary). Fixed by deferring `pdfjs-dist` behind a dynamic `import()` inside `extractPDFMetadata()` rather than a static top-level import — this also halved the page's JS bundle, since the library is now lazily code-split.
2. **The worker file can't be resolved via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`** — Next's production build runs Terser over anything pulled in that way, and Terser chokes on the worker bundle's `import.meta` syntax. Fixed by copying the worker into `/public` via a `postinstall` script and referencing it as a plain static path (`/pdf.worker.min.mjs`) instead, which sidesteps webpack/Terser entirely.

## Dev workflow

- Port 3000 is occupied by an unrelated project in this environment — always run `npm run dev -- -p 3001`.
- Full verification loop after any change: `npx tsc --noEmit`, `npx next lint`, `npx vitest run`, `npm run build` (the build step matters more than usual here — it's the only thing that catches the Terser/pdfjs-dist issue above), then a live check via the browser.
- To test file upload flows without a real OS file picker: use `javascript_tool` to construct a `File` via `fetch()` + `DataTransfer`, assign it to the file input, and dispatch a `change` event. Cross-origin PDFs will fail with CORS from the browser context (this is correct browser behaviour, not a bug) — for a controlled test PDF, drop it in `public/` temporarily and fetch it same-origin, then delete it afterwards.
- To inspect what a client-side fetch actually sends (eg confirming the PDF file itself never reaches the server), wrap `window.fetch` before triggering the action and log the captured request bodies — more reliable than reading network-panel summaries for this kind of privacy verification.

## Deployment

No git remote is configured, and until this session the entire app existed only as uncommitted changes on top of a bare `create-next-app` scaffold commit. If deploying: the user will need to `vercel login` interactively (can't be done from a non-interactive agent session), and there's no GitHub repo yet either.
