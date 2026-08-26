# BUG-035 — web slice: payment location evidence rendered as plain text (icons removed)

**Parent (canonical):** `wna_orchestration/features/BUG-035-payment-evidence-display.md` — problem,
current-behavior analysis, design principle, locked decisions **D1–D7**, contracts touched, and
acceptance gates all live there. This file is only this repo's checklist; do not restate the parent.

**Ordering:** land BUG-035 **before** FEAT-031 — both edit `PaymentsReportPage.vue`.

**Scope:** web is the **only** affected project (backend row shape, `location_conflict` rule and
admin-only exclusion are deliberately unchanged — parent "Deliberately unchanged").

## User flows (this project's part)

- **Free / Pro / Team user:** n/a — evidence is admin-only and excluded from `/v1/payments/history`
  (parent flows).
- **Admin:** this repo implements the entire flow — on the Payments page and on User detail, each
  payment row's location evidence reads as plain text (`Billing SI · Card DE · IP FR`, ISO codes,
  absent parts omitted, empty when none): no hover, no dwell, no click, no pointer affordance. A
  backend-flagged `location_conflict` row renders the **identical** text in the warning colour —
  colour is the only difference. Per parent D1–D7.
- **Unauthenticated / not-entitled:** n/a — admin-app is behind admin auth (min role `admin`);
  nothing changes here.

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
   affected targets (this repo has no automated tests — the scoped check is `npm run build:admin`,
   not `build:main` too unless you touched shared code). The full regression suite is run by the
   OWNER before deploy — never by the implementer.

## Checklist

- [x] `src/admin-app/components/PaymentEvidence.vue` — delete both SVG icons, both `title`
      attributes, `cursor: help`, and the `.evidence-icon--warning` rule; render
      `Billing XX · Card YY · IP ZZ` as plain text, omitting absent parts, empty cell when none
      (parent D1/D2/D5) — component rewritten to 33 lines: text-only span at
      `PaymentEvidence.vue:1-6`, parts built/omitted via filter+join at `:18-22`; repo-wide grep for
      `evidence-icon|infoTitle|conflictTitle|cursor: help` = 0 matches
- [x] apply `var(--color-warning)` to that text when `payment.location_conflict` is true — colour
      only, no added marker or wording; strictly backend-driven, never derived client-side
      (parent D3/D7); normal evidence text uses `--color-text-tertiary` — conflict class bound
      directly to `payment.location_conflict` at `PaymentEvidence.vue:4`, colours at `:25-31`
      (tertiary base, `--color-warning` modifier); nothing else differs
- [x] `src/admin-app/views/PaymentsReportPage.vue:105` — widen the `evidence` column from `90px` to
      fit three code groups; confirm the table still fits at the 1024 px tablet breakpoint — width
      `200px` at `PaymentsReportPage.vue:105` (fits `Billing SI · Card DE · IP FR` at
      `--font-size-body-s` 13-14px). Fit at 1024 px: table is auto-layout `width:100%` inside
      `.data-table-scroll { overflow-x:auto }` (`DataTable.vue:123-130`); widths are hints and the
      evidence text wraps at spaces, so min-content stays under the ~676 px content width
      (1024 − 300 sidebar − 2×24 page padding) — no horizontal overflow
- [x] `src/admin-app/views/UserDetailPage.vue:204-206` — append the evidence text to each payment's
      existing caption line (after date and country); `.payment-side` keeps only Badge + Refund
      (parent D4) — evidence appended at end of caption at `UserDetailPage.vue:205`, guarded so no
      dangling `·` when no evidence exists; `.payment-side` now holds only Badge + Refund
      (`UserDetailPage.vue:208-217`)
- [x] confirm no `title` attribute or any other hover/click affordance is reintroduced anywhere in
      the evidence output — grep for `title=` / `cursor: help` in the touched files, 0 matches
      (parent D6) — `PaymentEvidence.vue` has 0 `title=`/`cursor` matches; remaining `title=` hits
      in `UserDetailPage.vue` (`:25,85,166,359,386,398,417,426`) are pre-existing unrelated UI
      (StatusDot, Modal/Inpt props), none in the evidence output
- [x] Update `wna_orchestration/specs/features/wna-features.md` — `:1194-1201` (Payments-page
      Evidence paragraph pins icon + hover verbatim) and `:1240-1242` (User detail) rewritten to the
      plain-text presentation — Payments-page paragraph now `wna-features.md:1194-1200` (plain text,
      ISO codes, omitted parts, empty when none, colour-only conflict); User detail caption-line
      presentation at `wna-features.md:1243-1246`
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` §43 — **re-author** TC-612 / TC-613 /
      TC-614 to assert rendered text and warning-colour rendering; TC-613's verbatim hover sentence
      has no replacement target in the product (parent "Contracts touched") — re-authored at
      `wna-test-cases.md:14618` (TC-612 plain text, omitted parts, empty cell, no affordance),
      `:14635` (TC-613 warning colour only, identical wording, backend-driven), `:14650` (TC-614
      legacy rows never warning-coloured); run logs kept with 2026-08-26 re-author rows;
      `update-tests.sh` re-run green (594 cases parsed, no duplicates)
- [x] `npm run build:admin` passes (no automated tests in wna_web) — built in 2.60s, 28 files
      obfuscated, no errors (run 2026-08-26)

## ui-tests
n/a — admin-app has no E2E harness (parent "Affected projects"); TC-612/613/614 remain manual QA
cases in their orchestration home.
