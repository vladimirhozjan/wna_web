# FEAT-041 — web slice: admin-app user detail redesign + per-user sub-pages

**Parent (canonical):** `../wna_orchestration/features/FEAT-041-admin-user-detail-redesign.md`
— problem, locked decisions **D1–D14**, §Design (layout, tiles, sub-page table: routes, columns,
filters, row actions), §Contracts touched, §Work breakdown W1–W6. Read it first. This file is only this
repo's checklist; nothing from the parent is restated. API shapes: `../wna_orchestration/specs/api/admin-api.md`.

**Scope:** `src/admin-app/` only (`views/UserDetailPage.vue`, new sub-page views, `router/`,
`components/UserCollaboration.vue`, admin `apiClient`). **Precondition:** backend slice B1–B6 contracts
exist (at least in `admin-api.md`) before wiring the calls.

## User flows (this project's part)
- **Free / Pro user, Team owner / member** — n/a — admin-app only; main-app untouched.
- **Admin `support`** — parent §User flows (support): page renders Profile (Email-to-Inbox popup row,
  Sessions row → `/users/:id/sessions`), WNA Summary (+ Browse User Data), Collaboration tiles → connections /
  shared-projects / delegations (two tabs) sub-pages, Actions. Payments & Billing card and billing sub-page
  links not rendered (`hasMinRole(role, 'admin')` gate as today).
- **Admin `admin`+** — parent §User flows (admin): Payments & Billing card (status + operations unchanged +
  stat tiles with filter deep-links) → `/users/:id/payments` (wide columns, expandable `PaymentEvidence`,
  Refund) and `/users/:id/invoices` (Credit note, Download).
- **Not-entitled** — a `support` admin opening a billing sub-page URL directly sees the existing 403
  handling (toast / no data), no crash; unauthenticated → existing router auth guard.

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

## Checklist
- [x] W1 `UserDetailPage.vue` two-column grid (≤1024px one column) with cards per parent §Design —
      `src/admin-app/views/UserDetailPage.vue:15` (grid container), `:739` (2 cols), `:946` (1 col ≤1024px),
      `:101` Collaboration spans full row for `support` (owner 2026-10-08: Actions stays admin-only).
- [x] W1a Email to Inbox row + popup (existing `Modal`); Sessions row with `session_summary` —
      `UserDetailPage.vue:47-60` (row), `:276` (popup), `:66-69` (Sessions row → `/users/:id/sessions`).
- [x] W1b Browse User Data moved into WNA Summary; Actions card without it — `UserDetailPage.vue:89-97`.
- [x] W1c Collaboration stat tiles from `collaboration-stats`, each linking to its sub-page —
      `UserDetailPage.vue:108`, `:399` (`collabTiles`), `:482` (`loadCollabStats`).
- [x] W1d Billing stat tiles from `billing-stats` with filter deep-links; status + operations unchanged —
      `UserDetailPage.vue:412` (`paymentTiles`), `:424` (`invoiceTiles`), `:494` (`loadBillingStats`);
      deep-link mapping per owner 2026-10-08 (Fiscal issues / Last * → unfiltered).
- [x] W1e cards load independently (one card's error doesn't blank the page) — `UserDetailPage.vue:103-105`
      (collab error in-card), `:258` (billing error in-card), `:50` (inbox lookup error in-row).
- [x] W2 six routes under `users/:id/…` + views (existing `DataTable` + `Pagination`, back link, URL-synced
      `Select` filters) — `src/admin-app/router/router.js:59-92`; views `UserPaymentsPage.vue`,
      `UserInvoicesPage.vue`, `UserConnectionsPage.vue`, `UserSharedProjectsPage.vue`,
      `UserDelegationsPage.vue`, `UserSessionsPage.vue`; URL sync via new composable
      `src/admin-app/scripts/core/usePagedList.js` (owner-approved 2026-10-08). Billing routes `minRole: 'admin'`
      (owner 2026-10-08: redirect, as other billing pages).
- [x] W3 payments sub-page: wide columns + expandable `PaymentEvidence` row; Refund modal moved here —
      `UserPaymentsPage.vue:55` (expanded slot), `:73` (Refund modal), `:197` (refundable fetched from
      `kind=refund` rows, owner 2026-10-08); `DataTable.vue:44` + `:97` (`expandedKey`/`#expanded`, owner-approved);
      status filter = fixed list (owner 2026-10-08).
- [x] W4 invoices sub-page: credit notes as own rows; Credit note modal + Download moved here —
      `UserInvoicesPage.vue:32-37`, `:69` (modal), `:197` (`download`).
- [x] W5 delegations sub-page with By them / To them tabs, each paginated — `UserDelegationsPage.vue:13`,
      `direction` filter (default `out`) in `usePagedList`.
- [x] W6 remove code made unused (`UserCollaboration.vue` inline lists, inline payments/invoices/login
      history in `UserDetailPage.vue`); grep confirms 0 references to `login_history` —
      `UserCollaboration.vue` deleted; `grep -rnw "UserCollaboration\|login_history" src/` → 0.
- [x] W7 `npm run build:admin` green — 2026-10-08, `✓ built in 3.05s`, obfuscator 40 files.
- [x] Update `../wna_orchestration/specs/features/wna-features.md` (admin user detail section) —
      `wna-features.md:1295` (layout), `:1313` (sub-pages), `:1369` (billing tiles/Refund/Credit note),
      `:1616` (Email to Inbox admin view).
- [x] Update `../wna_orchestration/specs/tests/wna-test-cases.md` (layout, tiles, each sub-page, filters,
      pagination, role gates) — TC-714…TC-723 (`wna-test-cases.md:16659-16844`); TC-603/604/612/710
      repointed to the sub-pages; `regression-ui-tests/update-tests.sh` regenerated test data.
- [NA] README `[NA]` unless dev setup / structure guidance changes — no dev setup/structure change.
- [~] Parent `FEAT-041` User flows line "Admin `support`: sees … Actions" contradicts the owner decision
      (Actions admin-only) — DEFERRED TO USER: the parent feature file is outside this repo's writable
      spec homes; suggested wording: "…Collaboration tiles → sub-pages. No Actions card (admin-gated)…".

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
7. **Run only the NEW and directly-relevant checks — never a full suite during slice work**
   (owner directive 2026-08-19). Here that means `npm run build:admin`; the repo has no automated tests.
   Runtime verification of the screens is the owner's.
