# FEAT-031 — Admin Payments: filter / sort / CSV export / Refunded+Net stats · wna_web slice

**Parent (orchestration):** `wna_orchestration/features/FEAT-031-admin-payments-filter-sort-export.md`
**This slice is LOCAL** — wna_web's checklist only (admin-app). It does **not** restate the parent's
design (D1–D9) or any shared fact; it **links** them. All server behavior (params, `status_facets`,
`totals.refunded`/`totals.net`, export CSV) is the backend slice; this repo renders and wires it.

**Dependency:** the backend slice must be landed (and, for correct historic Refunded-VAT figures,
deploy migrations 010+011 applied) before this page's new UI shows real data. Parent ordering:
BUG-035 first (it rewrites `PaymentEvidence.vue` and the evidence column in
`PaymentsReportPage.vue`), then deploy → backend → web.

---

## User flows (this project's part) — per role
- **Free / Pro / Team owner / Team member** — n/a — admin-app only; main-app untouched.
- **Admin (finance/operator)** — this repo implements the visible flow on
  `src/admin-app/views/PaymentsReportPage.vue`: picks a period → sees **five** Stat cards
  (Payments, Gross, VAT, **Refunded**, **Net**) that stay whole-month while any filter is active →
  narrows by Status (options from `status_facets`) and/or Kind → picks one of the six named sorts
  (default newest-first; Amount not offered) → clicks **Export CSV**, which downloads the exact
  filtered+sorted view.
- **Admin (support)** — n/a — route `/payments` is min role `admin` (`router/router.js:82-87`);
  `viewer`/`support` never reach the page. No new route or gate change in this repo.
- **Unauthenticated / not-entitled** — n/a — behind admin auth; unchanged.

---

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

> **ui-tests scope:** this web slice contains **no ui-tests TC boxes** (admin-app has no E2E
> harness — parent marks ui-tests n/a). The legend's ui-tests reference is inherited boilerplate.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green build alone is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "build passes".
   State the concrete artifact to inspect (the rendered filter/sort selects, the five Stat cards
   holding steady under a filter, the downloaded CSV file) and confirm it — this repo has no
   automated tests, so verify via `npm run build:admin` + code inspection, and hand runtime
   verification steps to the owner.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0`
   matches before claiming done (this slice moves `downloadBlob()` — see the checklist).
4. **Honor the parent's User flows for every role** — including: all five statistics stay
   whole-month while filters are active; the Status dropdown never collapses to the current
   selection (it is fed by `status_facets`, not by the filtered rows). Don't silently implement
   only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT, `specs/api/admin-api.md` for the exact
   response/param shapes, decisions). Reading is unrestricted; only *writing* is scoped. This slice
   changes facts homed in `wna_orchestration/specs/features/wna-features.md` and
   `wna_orchestration/specs/tests/wna-test-cases.md` — you MUST update those homes as part of this
   work (see the checkboxes below) and cite the orchestration `file:line`. The local-slice rule
   forbids only *restating* shared facts here, NOT updating their canonical home.
7. **Run only the NEW and directly-relevant checks — never any full regression suite** (owner
   directive 2026-08-19). This repo has no test suite; the scoped check is `npm run build:admin`.
   Full manual regression is the OWNER's pre-deploy run — never the implementer's.

> Repo rule note: the shared `downloadBlob` admin util below is a **new utility function**; its
> creation is already owner-approved via the parent work breakdown — no separate ask needed. Any
> *other* new component/model/util still requires asking first (repo CLAUDE.md).

---

## Work breakdown (this repo — admin-app, `PaymentsReportPage.vue` + `apiClient.js`)
- [x] two `filter-select`s (**Status**, **Kind**) beside year/month (`PaymentsReportPage.vue:9-16`);
      Status options from the response's `status_facets`; Kind = the three fixed values
      (`initial`/`renewal`/`refund`); refetch + reset `page` to 1 on change
      — `PaymentsReportPage.vue:17-25` (selects), `:150-153` (`statusOptions` from
      `status_facets`), `:157` (`load()` resets `page` to 1 before every refetch)
- [x] sort `filter-select` with the six named sorts (parent Design §1 table), default `date_desc`;
      refetch on change — `PaymentsReportPage.vue:27-29` (select), `:101-108` (`SORT_OPTIONS`,
      no Amount), `:115` (default `'date_desc'`)
- [x] `apiClient.getPaymentsReport` (`apiClient.js:663-672`) — pass `status`/`kind`/`sort` through;
      add the export call (`GET /admin/payments/report/export`, blob response, same params)
      — `apiClient.js:663-675` (pass-through), `:677-689` (`exportPaymentsReport`, blob),
      `:978-979` (default-export registration)
- [x] two new `Stat` cards — **Refunded (EUR)** and **Net (EUR)** — from `totals.refunded` /
      `totals.net`; existing three untouched; all five stay whole-month while filters are active
      (they come from the backend's whole-month aggregates — do not recompute client-side)
      — `PaymentsReportPage.vue:37-38` (new cards), `:34-36` (existing three untouched); all five
      read `report.totals` directly, nothing recomputed client-side
- [x] **Export CSV** button in the page header (`PaymentsReportPage.vue:3-5`), passing the active
      year/month/status/kind **and** sort; lift `downloadBlob()` out of `AuditLogPage.vue:230-239`
      into a shared admin util and repoint AuditLogPage at it (do **not** copy it a third time;
      the `GdprRequestsPage.vue:207-223` duplicate is pre-existing — leave it unless asked)
      — `PaymentsReportPage.vue:5` (button), `:173-186` (`handleExport` passes all five params,
      filename `payments-<year>[-MM].csv`); util at `scripts/core/downloadUtils.js:1-10`;
      AuditLogPage repointed (`AuditLogPage.vue:91` import; local copy removed); Gdpr inline
      duplicate left as-is per this box
- [x] `npm run build:admin` passes — 2026-08-27 run: `✓ built in 2.58s`, obfuscator processed
      29 files, zero errors
### spec sync (orchestration homes this work changes)
- [x] Update `wna_orchestration/specs/features/wna-features.md:1191-1201` — Payments-page paragraph:
      status + kind filters, sort select, Export button, five Stat cards — updated at
      `wna-features.md:1191-1205`
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` §38 — extend TC-578 (year/month) and
      add new-id TCs for filter, sort, facets non-collapse, whole-month stats, and export
      — TC-578 extended (`wna-test-cases.md:14064-14072`); new TC-643–TC-647 at `:14074-14133`;
      `regression-ui-tests/update-tests.sh` re-run, all five ids present in `test-cases.json`

## Slice doc
- [x] Local web slice exists (develop-a worktree only) and points to FEAT-031 by ID → this file.

## Acceptance / gates (this repo's portion)
- [x] Filters narrow the table via the server (params visible in the request); the pager resets to 1
      — wiring: `apiClient.js:665-670`, `PaymentsReportPage.vue:157`; runtime-verified 2026-08-27
      against local backend: `?year=2026&month=8&status=paid&sort=date_desc` → 200, table narrowed
      5→2 rows, pager back to page 1; `kind=refund` → clean empty state
- [x] Status dropdown lists every status in the period and does **not** collapse after a selection
      — `PaymentsReportPage.vue:19`, `:150-153`; runtime-verified: with `paid` selected the
      dropdown still lists `created` + `paid` (whole-period facets)
- [x] Sort select reorders via the server; default newest-first; **Amount is not offered**
      — `PaymentsReportPage.vue:101-108` (six sorts, no Amount), rows rendered in response order
      `:146-148`; runtime-verified: default load sends `sort=date_desc` (newest first),
      `date_asc` reorders the table oldest-first server-side
- [x] Five Stat cards; all stay whole-month while any filter is active — `PaymentsReportPage.vue:33-39`;
      runtime-verified: all five figures identical before/during `status=paid` and `kind=refund`
      filters (test data: 5 payments, €0.00 amounts)
- [x] Export downloads the CSV honouring the active filters + sort; empty period ⇒ header-only file
      — `PaymentsReportPage.vue:175-181`; runtime-verified: `payments-2026-08.csv` downloaded with
      UTF-8 BOM, semicolons, the seven visible columns, rows in the active `date_asc` order; a
      second export with `status=paid` contained only the 2 paid rows. (Header-only-on-empty is
      backend-rendered — its own slice's test; not re-verified here)
- [x] `downloadBlob` exists once (shared util); AuditLogPage repointed; grep confirms no third copy
      — grep 2026-08-27: sole definition `downloadUtils.js:1`, importers `PaymentsReportPage.vue:93`
      + `AuditLogPage.vue:91`, no other named copy (Gdpr's pre-existing inline logic is unnamed
      and untouched)
- [x] `npm run build:admin` green — 2026-08-27, `✓ built in 2.58s`, zero errors
