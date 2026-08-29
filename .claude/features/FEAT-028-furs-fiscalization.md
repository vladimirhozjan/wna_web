# FEAT-028 — web slice: FURS fiscalization surfaces (admin card + customer notice)

Parent (canonical: problem, decisions D1–D9, design, user flows):
`../../wna_orchestration/features/FEAT-028-furs-fiscalization.md` — read it first. Nothing from it
is restated here. This slice lives ONLY in the `develop-a` worktree.

Scope note (verified 2026-08-28): `src/shared/invoicePdf.js` snapshots backend-rendered HTML, so the
new fiscal fields (number triple, EOR, ZOI, QR SVG) flow through from the backend `v2`/
`credit_note_v3` templates — **no PDF-generator change in this repo**.

## User flows (this project's part)
- **Free / Pro / Team buyer (any country)**: W2 — the ZDavPR čl. 12 notice (prescribed pravilnik
  wording; copy it from the pravilnik, do not invent) visible in checkout before purchase and in the
  Terms of Service (main-app). Parent §Customer notice. The invoice documents themselves are
  backend-rendered — no main-app work.
- **Team owner / member**: n/a — same buyer surfaces as Pro, nothing extra.
- **Admin (admin+)**: W1 — Fiscalization card (premise status per env, Register premise, Echo test,
  backlog counters: pending / failed_retrying / rejected, oldest age) + fiscal-status badge
  (confirmed / ZOI-only-retrying / rejected / not required) in the billing-documents register and
  the UserDetailPage invoice list (admin-app). Parent §User flows (Admin), §Premise registration & echo.
- **Unauthenticated / not-entitled**: sees the public ToS notice only; no other surface.

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
- [x] W1 admin-app: Fiscalization card (premise status, Register, Echo, backlog counters) +
  fiscal-status badge in the billing-documents register and UserDetailPage invoice list. Endpoints
  per `wna_orchestration/specs/api/admin-api.md` once B5 lands (parent order: after backend B5).
  *(done 2026-08-29 — card: `src/admin-app/views/BillingDocumentsPage.vue:15-62` (Echo :37, Register
  :45, counters :49-61), register badge column `BillingDocumentsPage.vue:165-167` + `:284`;
  UserDetailPage badge `src/admin-app/views/UserDetailPage.vue:230`; badge mapping
  `src/admin-app/components/Badge.vue:41-53`; API wrappers
  `src/admin-app/scripts/core/apiClient.js:929-961`)*
- [x] W2 main-app: ZDavPR čl. 12 customer notice (prescribed pravilnik wording) in checkout + Terms
  of Service — static text, independent of the backend work.
  *(done 2026-08-29 — wording copied verbatim from the pravilnik (18. člen, vsebina in oblika
  obvestila, in force 2026-01-01): checkout `src/main-app/views/dashboard/UpgradePage.vue:145-152`;
  ToS §5.7 `src/main-app/content/legal/terms.md:147-155`)*
- [x] Update `wna_orchestration/specs/features/wna-features.md` — admin Fiscalization card,
  fiscal-status badges, checkout/ToS fiscal notice.
  *(done 2026-08-29 — card + badges block `wna-features.md:1320-1337`, register column `:1304`,
  user-detail badge `:1280`, checkout notice `:1151-1157`, ToS/Legal `:1622-1626`)*
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` — manual TCs for the card (register,
  echo, counters), the badges, and the notice placement.
  *(done 2026-08-29 — Section 51, TC-652–TC-657 `wna-test-cases.md:15192-15268`;
  `regression-ui-tests/update-tests.sh` run, parser green: 6 cases picked up)*
- [x] `npm run build:admin` and `npm run build:main` pass. *(both green 2026-08-29, incl.
  obfuscator post-step)*

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
   affected targets (this repo has no automated tests — the scoped check is the two production
   builds above plus manual verification). The full regression is run by the OWNER before deploy —
   never by the implementer.
