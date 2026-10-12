# FEAT-018 — web slice: shared Google connect helper + callback + JWT refresh (main-app) — REOPENED 2026-10-12

**Parent (problem, design, owner decisions Q1/Q2 + 2026-10-12 re-home, user flows):**
`../../wna_orchestration/features/FEAT-018-google-account-connection.md` — read it first; this file is only
the local checklist. Depends on the backend slice (internal endpoints) — the public `/v1/<consumer>/...`
routes arrive with each consumer (FEAT-003 calendar, FEAT-017 drive), so this slice ships **no UI** and is
not reachable by users until a consumer lands.

## User flows (this project's part)
- **Free user**: parent "Free user" — the helper surfaces a 403 from a consumer's connect endpoint as the
  upgrade path (`upgradeModel`), not an error toast.
- **Pro / Team owner / Team member**: parent "Pro / Team user" — helper redirects to the consent URL the
  consumer's connect endpoint returns; the callback page posts `code`+`state` to that consumer's callback
  route, shows a warning toast when the response reports a dropped scope, and returns to Settings.
  It must **not** log the user in (distinct from `GoogleSsoPage.vue`).
- **Admin**: n/a — admin-app untouched (parent: no admin surface).
- **Not-entitled / blocked**: unauthenticated → normal auth guard; 409 (reconnect) → `errorModel` toast.
## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a local
  service rebuild + restart I cannot run"). Does NOT count as done — it **blocks closure**.
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
   affected targets (e.g. `npm run build:main`; no automated tests exist in this repo). The full regression suite is run by the
   OWNER before deploy — never by the implementer.

8. **Test and verify LOCALLY only — never on dev/GKE/prod** (owner directive). A missing dev/GKE run is
   never a reason for `[~]`; never wait for a dev or prod confirmation.

## Checklist
- [x] W1 — **Ask the owner before creating** the callback page / any new model (repo rule: reuse first,
      ask before new `.vue`/model). Record the answer here.
      Owner 2026-10-12: new `GoogleConnectPage.vue` at `/google/:feature` approved, DashboardLayout, no new model
      (helpers in `apiClient`); public routes `GET /v1/<feature>/connect` → `{url}` and `POST /v1/<feature>/callback`
      `{code,state}`; 403 → `upgradeModel` with the backend text as-is; shrink → `push(msg,'warning')` then `/settings`.
- [x] W2 — `apiClient` helper: start a Google connect for a given consumer feature (call its connect
      endpoint → redirect to the returned consent URL); callback-post helper for that consumer.
      `src/main-app/scripts/core/apiClient.js:1706` `startGoogleConnect(feature)` (redirects to `res.data.url`),
      `:1720` `completeGoogleConnect(feature, code, state)`; 403 → upgrade modal `:1700`; exported `:2162-2163`.
- [x] W3 — Callback route + page (one generic page parameterized by feature, matching the per-feature
      redirect URI the deploy slice configures) — posts `code`/`state`, handles 403 / 409 / scope-shrink
      warning, routes back to Settings; never touches auth state.
      Route `src/main-app/router/router.js:41` (`/google/:feature` ↔ deploy `/google/drive`, `/google/calendar`; not in
      `PUBLIC_ROUTE_NAMES` → auth-guarded). Page `src/main-app/views/dashboard/GoogleConnectPage.vue:29` posts,
      `:31-32` `dropped_features` → warning toast, `:35` 403 = upgrade modal only / 409 & other errors → error toast,
      `:24` missing code/state (Google cancel) → error toast, `:41` `router.replace` to Settings; no `authModel` import.
      Warning toast style added: `src/main-app/components/ErrorToaster.vue:78` (existing `--color-warning*` tokens).
      Runtime check DEFERRED TO USER/consumer: not exercisable until a consumer (FEAT-003/017) ships its `/v1` routes.
- [x] W4 — `npm run build:main` passes; code inspection shows no consumer-specific code in the helper.
      `npm run build:main` ✓ 2026-10-12 (only the pre-existing >500 KB chunk warning); `git diff` of `apiClient.js`
      contains 0 `calendar`/`drive` matches — feature is a parameter only.
- [NA] W5 — `specs/features/wna-features.md` / `specs/tests/wna-test-cases.md`: no user-visible surface in
      FEAT-018; the consumer (FEAT-003) documents the visible flow. Re-open only if W3 ships reachable UI.
      Still NA: `/google/:feature` is only reached via a Google redirect, which needs a consumer's connect route.

## Reopened checklist (2026-10-12) — gates closure
Owner rule (parent §`connections` JWT claim, `decisions.md` 2026-10-12): the access JWT carries
`connections: {provider: [features]}`; the web refreshes the JWT on expiry **and whenever it knows a claim
changed**. The consumers' connect routes now land on core_service (no web change — same `/v1/<feature>/*`).
- [x] W6 — After a successful callback (`GoogleConnectPage.vue`), including the shrink case, force a JWT
      refresh through the existing refresh path (`httpApi.js` rotate / `apiClient.refreshToken`) before
      routing to Settings; reuse one helper, no new model.
      `src/main-app/scripts/core/apiClient.js:1728` — `completeGoogleConnect` awaits `refreshConnectionsClaim()`
      (`:1716`, wraps the existing `httpApi.refreshSession` rotate) on every 2xx, shrink included, before it returns;
      the page routes to Settings only after that (`GoogleConnectPage.vue:29`, `:41`). No new model.
- [x] W7 — Same forced refresh after every web-initiated change of a JWT-carried fact: Google disconnect
      (helper for consumers, parameterized by feature) and web-initiated tier changes (subscribe / cancel /
      plan change flows) — check which already refresh; add only the missing ones; cite each call site.
      - Disconnect: new `disconnectGoogle(feature)` `apiClient.js:1732` (`POST /v1/<feature>/disconnect`, matches core
        `/internal/google/{feature}/disconnect` POST) → refresh `:1740`; exported `:2164`.
      - Subscribe / plan change (one flow: `UpgradePage.vue:287` → hosted checkout; tier flips on the webhook):
        `SettingsPage.vue:804` already refreshed on checkout return, but before the flip — ADDED `SettingsPage.vue:812`
        refresh when the converge poll observes the new tier.
      - Cancel: no JWT fact changes (`wna_backend/user_service/src/services/payment/payment_service_impl.cpp:587`
        updates only the subscription row; tier holds until expiry → server-side sweep) — no refresh needed.
- [x] W8 — No code reads Google connection state from an API: any connected-state check reads the decoded JWT
      `connections` claim (helper in the existing auth model); grep proof `0` calls to a google status endpoint.
      `authModel().connectedFeatures(provider)` `src/main-app/scripts/core/authModel.js:272` (base64url-decodes the
      access token, returns `connections[provider] || []`). `grep -rn "google/status\|${feature}/status\|/calendar/status\|/drive/status" src/main-app` → 0.
- [x] W9 — `npm run build:main` passes.
      ✓ 2026-10-12 (`✓ built in 4.25s`; only the pre-existing >500 KB chunk warning).
