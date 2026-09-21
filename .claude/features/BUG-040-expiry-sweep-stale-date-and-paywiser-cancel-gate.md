# BUG-040 — web slice (admin-app): Cancel-on-Paywiser gated on the gateway state, "Next charge on <date>"

**Parent (canonical):** `../../wna_orchestration/features/BUG-040-expiry-sweep-stale-date-and-paywiser-cancel-gate.md`
— problem, locked decisions **D1–D4**, the row state machine (parent §User flows, Admin), the
endpoint shape (§Design 2) and the web design (§Design 3) all live there. Read it first; this file is
only this repo's checklist. Nothing is restated.

**Scope:** admin-app only — `src/admin-app/views/UserDetailPage.vue` (Cancel-on-Paywiser row,
`:179-193`, `handleCancelPaywiser` `:711`, Set-Subscription pre-fill `:514-518`) and
`src/admin-app/scripts/core/apiClient.js` (one function beside `cancelPaywiser` `:732`, export list
`:1131`). main-app: nothing (parent: the tier refresh already works). Depends on the **backend**
slice (new GET) being reachable — until then the row must still render and land in the
"Paywiser unreachable" state, never break the page.

## User flows (this project's part)
- **Admin, user detail (role ≥ admin)** — this repo implements the whole visible flow: the page
  renders immediately; the Cancel-on-Paywiser row starts disabled with "Checking Paywiser…", then
  resolves per parent §User flows (Admin) — enabled only on Paywiser `active` with
  "Next charge on <date>" (D1/D2); disabled with the Paywiser status verbatim for
  `subscription_paused`/`pending`/`inactive`; disabled with "No Paywiser subscription" when the
  backend answers `present:false` (D4); disabled with "Paywiser unreachable" on `502`/network (D3, no
  retry control). Re-fetch after a successful Cancel and after a successful Set-Subscription save.
  The Set-Subscription form no longer pre-fills a past date once the backend nulls it — no web code
  for that, but verify it on screen.
- **Lapsed user** — n/a for code — the main-app already reloads the user on every token refresh
  (parent §Problem "not bugs"); nothing to change in `src/main-app/`.
- **Free / Pro-Team subscriber / Team owner-member / unauthenticated / not-entitled** — n/a — no
  surface in this bug (parent §User flows).

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
- [x] W1 — Done: `src/admin-app/scripts/core/apiClient.js:741-748` (`getPaywiserSubscription` beside `cancelPaywiser`, `normalizeError` as siblings), export list `:1141`. — `apiClient.getPaywiserSubscription(userId)` → `GET /admin/platform-users/${userId}/paywiser-subscription`
  (`src/admin-app/scripts/core/apiClient.js`, beside `cancelPaywiser` `:732`; add to the export list
  `:1131`). Error normalization as the sibling functions.
- [x] W2 — Done: `src/admin-app/views/UserDetailPage.vue:499-511` (`paywiserState` + `paywiserCaption` computed: checking / active + `formatDate(next_charge_on)` / status verbatim / no-subscription / unreachable), caption span `:182` (`text-caption color-text-secondary`, static caption `:181` kept), `Btn` `:disabled` `:188`. No new component / CSS var. — `UserDetailPage.vue` row state (`:179-193`): a single reactive state + caption per parent
  §User flows (Admin) — `checking` / `active` (+ `next_charge_on` via the page's `formatDate`) /
  `<paywiser status verbatim>` / `no-subscription` / `unreachable`. `Btn` `:disabled` gains the
  `!== 'active'` condition (`:187`). The existing static caption (`:181`) stays. No new component,
  no new CSS variable (reuse `text-caption` / `color-text-*` classes already on the card).
- [x] W3 — Done: `UserDetailPage.vue:867` `load().then(loadPaywiserSubscription)` (un-awaited); loader `:564-580` catches every error → `unreachable`, `present:false` → `no-subscription`; re-fetch after Set-Subscription save `:736` and after Cancel success `:759`. — Lookup timing: fire after the user-detail load resolves (`:514` block), **not awaited by
  the page**; re-fetch after `handleCancelPaywiser` success (`:711`) and after a successful
  Set-Subscription save (`handleSaveSubscription`). A `404`/`502`/network error never throws out of
  `onMounted` — it lands in `unreachable`.
- [~] W4 — `npm run build:admin` green (2026-09-21, `✓ built in 2.92s`, obfuscator 32 files). On-screen DoD (a)–(d) + empty datetime for a swept user DEFERRED TO USER: backend slice not landed and I do not run apps; until it lands the row renders "Paywiser unreachable" (404 → catch). — `npm run build:admin` green (cite the run). DoD on screen against a stack with the backend
  slice: (a) Paywiser-backed active user → button enabled, "Next charge on <date>"; (b) same user
  after Cancel → button disabled, "subscription_paused"; (c) Free / admin-granted user → disabled,
  "No Paywiser subscription", and the network tab shows **no** Paywiser-side call beyond the one GET;
  (d) mock stopped → disabled, "Paywiser unreachable". Also confirm the Set-Subscription datetime
  input is empty for a swept user (backend B1).
- [x] W5 — Done: `wna_orchestration/specs/features/wna-features.md:1252-1266` (gated button, five caption states, D1–D4, re-fetch); `wna_orchestration/specs/features/payments-billing.md:153-155` (Admin bullet clause). — Update `wna_orchestration/specs/features/wna-features.md:1242-1258` (admin
  Payments & Billing card: gated button + the five caption states, D1–D4) and the "Admin" bullet in
  `wna_orchestration/specs/features/payments-billing.md` (§User flows by role). Cite lines.
- [x] W6 — TC-608 rewrite + TC-676 were already landed by the ui-tests slice (`wna-test-cases.md:14677-14703`, `:15615-15632`, ids TC-673–676 coordinated); web-slice provenance rows added `:14704` and `:15633`. `regression-ui-tests/update-tests.sh` not found from this checkout — owner to regenerate `test-cases.json` if needed. — Update `wna_orchestration/specs/tests/wna-test-cases.md`: rewrite TC-608 step 2
  (`:14677` — a user without gateway billing now shows a **disabled** button + "No Paywiser
  subscription" instead of a 404 toast; step 3 → "Paywiser unreachable" state, button disabled) and
  add one new manual TC for the gated states (D1–D4; next free id — max was TC-672 at slice time,
  re-check before writing). Cite lines.
