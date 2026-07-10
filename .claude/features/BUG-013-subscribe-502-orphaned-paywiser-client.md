# BUG-013 — web slice

Parent (canonical): `wna_orchestration/features/BUG-013-subscribe-502-orphaned-paywiser-client.md`.
Problem, root cause, owner decisions, and acceptance gates live there — not restated here.

This slice: owner D2 only — a **friendlier on-screen message for payment-gateway failures in the
subscribe flow** (the 502 `"payment gateway error"` response) instead of the generic error output.
No flow change, no new API calls. Reuse existing patterns (`errorModel` toast / existing inline
error surfaces in the Settings upgrade flow); per this repo's CLAUDE.md, ask before creating any
new component, model, or CSS variable.

## User flows (this project's part)
- **Lapsed Pro/Team user re-subscribing** (parent flow 1) and **new user with a gateway-known
  email** (parent flow 2): after the backend fix these succeed end-to-end — the web slice is what
  they see if a **genuine** gateway failure still occurs: a specific, calm payment-gateway-failure
  message (what happened, that no charge was made, try again later) instead of generic error text.
- **Free user, first subscribe, email unknown to gateway** (parent flow 3): same — the friendly
  message only appears on a gateway-error response; the happy path is untouched.
- **Pro/Team user with an active subscription:** n/a — 409 flow and its existing messaging
  unchanged.
- **Admin:** n/a — admin-app untouched.
- **Unauthenticated / not-entitled:** n/a — 401 / `payments`-flag gating and UI unchanged.

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

## Work
- [x] Detect the gateway-error response from `POST /v1/payments/subscribe` in the subscribe flow
      (apiClient → model → view path) and show a specific, calm message — what happened, that the
      card was **not** charged, try again later — instead of the generic error output. Reuse the
      existing error surface; no new components without asking.
      → `src/main-app/views/dashboard/UpgradePage.vue:274-277` — the only subscribe call site
      (PricingPage/SettingsPage only route to `/upgrade`); `err.status === 502` → calm toast via the
      existing `errorModel` surface; all other errors keep the prior generic output. `normalizeError`
      preserves `status` on every response-error path (`src/main-app/scripts/core/apiClient.js:31-85`),
      so both the backend `{"message":"payment gateway error"}` body and a raw proxy 502 are caught.
- [NA] Verify in the running app (dev server or dev env): trigger a gateway-error response and
      inspect the rendered message on screen — that screen is the definition of done.
      OWNER 2026-07-10: cannot be tested locally — on-screen check waived; slice closed on code
      verification (`src/main-app/views/dashboard/UpgradePage.vue:274-277` + green build). TC-589
      remains the manual QA case for a future dev-env run.
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` — add the manual QA case for the
      friendly gateway-error message (the parent's ui-tests ride-along; cite the TC id you add).
      → **TC-589**, `wna_orchestration/specs/tests/wna-test-cases.md:14218`
- [x] Update `wna_orchestration/specs/features/wna-features.md` payments/upgrade section **if** it
      documents subscribe error output (else mark `[NA]` with the checked location).
      → it documents the `/upgrade` subscribe flow (Free/lapsed bullet); added the gateway-error
      toast sentence at `wna_orchestration/specs/features/wna-features.md:1135-1137`
- [x] Tick the web box in the parent's Work breakdown when verified.
      → `wna_orchestration/features/BUG-013-subscribe-502-orphaned-paywiser-client.md` (web section
      of the Work breakdown; owner waived the local on-screen check)

**Observable definition of done:** a user hitting a payment-gateway failure during subscribe sees
the specific calm message on screen (not the generic error toast text). Cite the component
`file:line` and describe/screenshot the rendered state.
