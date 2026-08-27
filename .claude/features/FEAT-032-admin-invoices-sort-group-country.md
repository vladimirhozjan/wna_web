# FEAT-032 — web slice: Invoices page sort select, per-country table, Export CSV button

**Parent (canonical problem, current-behavior citations, design §1–§3, locked decisions D1–D6):**
`wna_orchestration/features/FEAT-032-admin-invoices-sort-group-country.md` — read it first; this file
is only the local checklist. Do not restate the parent here.

Key parent sections for this slice: Design §1 (six named sorts, default `date_desc`, Amount NOT
offered), §2 (per-country table — position, columns, raw ISO codes, whole-period/basis labelling),
§3 (Export button — **full-period** labelling; it ignores the client-side type tab and search).
Precedent to mirror: `PaymentsReportPage.vue:26-36` (country table) — see parent "Current behavior".

**Sequencing note:** depends on the backend slice (`sort` param, `by_country` block, export route).
FEAT-031 and FEAT-032 share the CSV download-button pattern — if FEAT-031's shared download helper
exists when you start, **reuse it**; if not, author it once in a reusable place (ask before creating
any new component/util, per this repo's Mandatory Rules) so FEAT-031 reuses it.

## User flows (this project's part)

- **Free / Pro / Team user** — n/a — admin-app-only surface; main-app untouched.
- **Admin (accountant / OSS filer)** — parent flow: period → per-country figures at the top → sort
  the register → export CSV. This slice implements the page side: (1) a sort `filter-select` with the
  six named sorts (default `date_desc`; no Amount option), refetching server-side and resetting the
  pager to page 1 on change; (2) the per-country `DataTable` directly under the Invoiced/Credited/Net
  strip, `:show-pagination="false"`, raw ISO alpha-2 codes, column headings making the
  documents-by-`issued_at` basis explicit (parent §2 — must not be mistakable for the Payments
  page's `vat_by_country`), rendering cleanly for an empty period, and unaffected by the type tab and
  search; (3) an **Export CSV** button in the page header labelled as a full-period export.
- **Admin (support)** — n/a — page is min role `admin` (existing route guard unchanged); the 403 on
  export is enforced backend-side.
- **Unauthenticated / not-entitled** — n/a — behind existing admin auth guards; no route change.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a GKE redeploy I
  cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered email, the API response, the screen) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (viewer-centric / entitlement rules etc.); don't
   silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT/BUG, specs, contracts, decisions) — pull the
   authoritative form (exact predicate, response shape, DDL) from its home rather than guessing or asking.
   Reading is unrestricted; only *writing* is scoped (to the spec homes this repo owns). If your work
   changes a fact whose canonical home is a spec in `wna_orchestration` (response shapes →
   `specs/api/*`; SQL DDL / CI → `specs/ci/*`; features → `specs/features/*`; test cases →
   `specs/tests/*`; architecture → `specs/architecture/*`; numbers → `contracts/*`), you MUST update
   that spec file in `wna_orchestration` as part of this work. Editing the spec's orchestration home is
   the documented sibling sync requirement (see this repo's CLAUDE.md) — it is REQUIRED, never
   forbidden, and never "deferred to the user." The local-slice rule forbids only *restating* shared
   facts inside the slice, NOT updating their canonical home. Cite the orchestration `file:line` you
   updated. (Find the home in the orchestration Fact Index.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.

## Checklist

### Page work (`src/admin-app/views/BillingDocumentsPage.vue`)
- [x] sort `filter-select` in the filter row (`:37-52`) with the six named sorts, default
      `date_desc`, **no Amount option**; pass `sort` through `apiClient.getBillingDocuments`
      (`apiClient.js:744-753`); on change: refetch + reset `page` to 1
      — `BillingDocumentsPage.vue:24-26` (select), `:201-208` (`SORT_OPTIONS`, six sorts, no
      Amount), `:213` (default `'date_desc'`); `apiClient.js:761-772` passes `sort`; `load()`
      resets `page` to 1 (`:280`). Runtime-verified 2026-08-27 against local backend:
      `?year=2026&month=8&sort=number_asc` → 200, table reordered server-side
- [x] per-country `DataTable` directly under the totals strip, `:show-pagination="false"`, mirroring
      `PaymentsReportPage.vue:26-36`; columns per parent §2 (Country / Invoiced count·gross·VAT /
      Credited count·gross·VAT / Net gross·VAT); raw ISO alpha-2 codes (D6b); headings make the
      documents-by-`issued_at` basis explicit; renders cleanly for an empty period; unaffected by
      the type tab and search
      — `BillingDocumentsPage.vue:48-68` (table, `:show-pagination="false"`, heading "Documents by
      Country — by issue date, incl. credit notes"), `:233-243` (`countryColumns`, 9 columns per
      §2), country rendered raw (no transform); reads `register.by_country` directly so the type
      tab/search can't touch it. Runtime-verified: with the "Credit notes" tab active (main table
      empty) the country table still showed the period's BG row; figures match the totals strip
- [x] **Export CSV** button in the page header calling `GET /admin/billing-documents/export`
      (year/month/sort), labelled as a **full-period** export; reuse the shared download helper
      (see sequencing note)
      — `BillingDocumentsPage.vue:4-12` (button "Export CSV (full period)" + explanatory title),
      `:295-308` (`handleExport`), reuses FEAT-031's `downloadUtils.js` `downloadBlob` (`:186`,
      `:302`); `apiClient.js:773-784`. Runtime-verified: export clicked with the Credit-notes tab
      active → `?year=2026&month=8&sort=number_asc` → `billing-documents-2026-08.csv` with UTF-8
      BOM, semicolons, the 9 spec columns (Buyer + Buyer email split), whole period (tab ignored)

### Spec sync (rule 6)
- [x] Update `wna_orchestration/specs/features/wna-features.md:1271-1289` — Invoices-page paragraph:
      sort select, per-country breakdown, Export button; **rewrite the `:1289` "no bulk export in
      v1 (D9)" line** (deferral lifted — decisions.md:489)
      — updated at `wna-features.md:1282-1314`: sort select + Documents-by-Country breakdown
      (`:1285-1294`), the old "no bulk export in v1 (D9)" line replaced by the Export-CSV
      sentence (`:1307-1314`)
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` §41 — new TC ids for sort,
      per-country table, and export (TC-599/TC-600 are the neighbouring homes)
      — new TC-648 (sort), TC-649 (per-country), TC-650 (export) inserted after TC-600 in §41;
      `regression-ui-tests/update-tests.sh` re-run, all three ids present in `test-cases.json`

### Gate
- [x] `npm run build:admin` passes (cite the run) — 2026-08-27: `✓ built in 2.54s`, obfuscator
      processed 29 files, zero errors
