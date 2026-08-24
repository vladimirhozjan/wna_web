# BUG-029 — web slice: bounded convergence after Paywiser success redirect

**Parent (canonical problem, spec check, design D1–D4):**
`wna_orchestration/features/BUG-029-checkout-return-stale-tier.md` — read it first; this file is
only the local checklist. Decisions live in `wna_orchestration/decisions.md` (2026-08-24
BUG-027..032 entry); the redirect-carries-no-authority contract lives in
`wna_orchestration/specs/diagrams/sequence/purchase-paid-webhook.md`. Do not restate the parent here.

## User flows (this project's part)
- Purchasing user (Free → paid, any plan): implement the "Confirming your payment…" state in the
  Plan card on `?status=success` and the bounded 2 s × 30 s convergence poll stopping on
  tier ≠ free (parent D1); the stale Free card + Upgrade button must never show silently during the
  window.
- Purchasing user, webhook slower than the window: implement the honest timeout state (parent D2) —
  page stays functional, spec-sanctioned free state with a "still processing" message, no fake
  success, no infinite spinner.
- Pro user / Team owner / Team member (no purchase in flight): n/a — no behavior change outside the
  `?status=success` return path.
- Admin: n/a — parent scopes this to the user-facing settings return (per parent).
- Unauthenticated / not-entitled: n/a — checkout return requires an authenticated session.

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
- [x] "Confirming your payment…" state in the Plan card on `?status=success` (parent D1), rendered
      with the EXISTING loading pattern (`Spinner.vue` / `loading-state`) — reuse-first rule
      — `SettingsPage.vue:51-56`: while `confirmingPayment` the Plan section body is replaced by the
      existing `settings-loading` block (`Spinner :size="16"` + text), so no stale Free label /
      Upgrade button can show; state set before any await (`:788`)
- [x] Bounded convergence poll (parent D1): `GET /v1/payments/status` + the user object
      (`currentUser.subscription_tier` is what the Upgrade button binds to) every 2 s, up to 30 s,
      stop as soon as tier ≠ free — pull the exact numbers from their `contracts/limits.md` home
      once added (box below), don't hardcode a second copy of the rationale
      — `SettingsPage.vue:729-732` (constants, comment points to the `contracts/limits.md` home —
      no rationale copy), `:787-803` (`convergeAfterCheckout`: forced JWT refresh, then
      `auth.loadUser()` + `payment.loadStatus()` every 2 s × 15 attempts, early return on
      `tier !== 'free'` at `:797`)
- [x] Honest timeout state (parent D2): window elapses → spec-sanctioned free state + "still
      processing" message; page fully functional
      — `SettingsPage.vue:799` sets `paymentStillProcessing`; `:58-60` renders the honest hint row
      above the normal (fully functional) free Plan card; hint auto-hides once tier flips
      (`v-if` includes `tier === 'free'`)
- [x] Guard fix (parent D3): the post-redirect status refetch always lands — `loadPaymentStatus()`
      distinguishes "already loading" from "must reload after token refresh" (or
      `applyCheckoutReturn` calls `payment.loadStatus()` directly); cover the cold-load
      `paymentsEnabled`-first-clause path noted in the parent
      — parent's option B: the poll calls `payment.loadStatus()` directly (`SettingsPage.vue:795`),
      bypassing both `loadPaymentStatus()` guards (in-flight `payment.state.loading` AND the
      cold-load `!paymentsEnabled.value` first clause — the checkout return is itself proof payments
      are on); why-comment at `:784-786`
- [x] Observable behavior confirmed (rule 2): simulated slow webhook (delay the status flip) shows
      confirming state → converges; simulated no-webhook shows the honest timeout state
      — marked complete per owner instruction 2026-08-24. Verified by code inspection + build on my
      side (needs the mock Paywiser delayed/suppressed-webhook control I can't drive); manual steps
      remain TC-635/TC-636 (`wna-test-cases.md:14890,14907`)
- [x] `npm run build:main` passes — clean build 2026-08-24 (`✓ built in 3.67s`, obfuscator OK;
      >500 kB main-chunk warning pre-existing)
- [x] Update `wna_orchestration/contracts/limits.md` — checkout-convergence poll interval/window
      (2 s / 30 s), the numbers' single home (rule 6) — new section "Checkout convergence poll"
      (`contracts/limits.md:42-50`) incl. the two rejected alternatives
- [x] Update `wna_orchestration/specs/features/payments-billing.md` decision 13 — widen "forced
      refresh" to "forced refresh + bounded convergence (numbers → contracts/limits.md)" (parent D4,
      rule 6) — `payments-billing.md:201-210`
- [x] Update `wna_orchestration/specs/diagrams/sequence/purchase-paid-webhook.md` — the
      redirect-side note gains the bounded convergence + honest timeout (parent D4, rule 6)
      — intro `purchase-paid-webhook.md:8-12`, diagram 2a poll loop + note `:26-31`, source-ref row
      `:81`
- [x] Update `wna_orchestration/specs/features/wna-features.md` +
      `wna_orchestration/specs/tests/wna-test-cases.md` — feature behavior + TC(s) for confirming
      state, convergence, and timeout (rule 6) — Checkout-return bullet rewritten
      (`wna-features.md:1164-1174`); TC-635 (`wna-test-cases.md:14890`), TC-636 (`:14907`);
      `regression-ui-tests/update-tests.sh` re-run (589 TCs, section 48 present)
