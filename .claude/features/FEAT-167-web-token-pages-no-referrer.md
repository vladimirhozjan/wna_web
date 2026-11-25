# FEAT-167 (web slice): token leaves the address bar on reset / verify / set-password

Parent: `wna_orchestration/features/FEAT-167-web-token-pages-no-referrer.md` — Design (Boundaries, Contracts C1–C3, Flows) and § Work breakdown live there; this slice is the local checklist only.

## User flows (this project's part)
- Unauthenticated (reset / verify): links work as today; the page keeps the token in state and removes only `token` from the address bar (C3); submit and Retry use the kept value.
- New Admin (set password): same for admin `/set-password`.
- Free, Pro, Team owner/member, other Admin roles, blocked: n/a — no change for them.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a local
  user_service rebuild + restart I cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Checklist
Consumes nothing from other siblings. No server data is read or added (Data: n/a). § Screens: n/a — no UI change. Legal / Help / Landing: n/a (parent).
- [x] 1. (done: `LandingPage.vue:16,61-67`; `npm run build:main` green; address-bar/Network check in Chrome NOT run — extension not connected, left to ui-tests TCs) main `LandingPage.vue`: add a `resetToken` ref set from `props.token` in setup and pass `:token="resetToken"` (not `props.token`) to `AuthDialog`; in `onMounted`, when `props.mode === 'reset'` and `route.query.token` is set, `router.replace({ query: rest })` with `rest` = `route.query` without `token` (C3). Verify: open `http://localhost:5173/reset-password?token=abc&email=a%40b.c&redirect=/overdue` → address bar shows `/reset-password?email=a%40b.c&redirect=/overdue`, the "Set a new password" form stays; submitting sends `token: "abc"` in `POST /v1/user/reset` (DevTools Network).
- [x] 2. (done: `VerifyEmailPage.vue:94-103`, `doVerify` uses kept `token`; build green; Chrome check NOT run — left to ui-tests TCs) main `VerifyEmailPage.vue`: read `route.query.token` once into a `const` at setup; in `onMounted` strip it (C3) before calling `doVerify()`; `doVerify` (incl. the Retry button) uses the kept value only. Verify: open `/verify?token=abc` → address bar shows `/verify`, `POST /v1/user/verify-email` carries `token: "abc"`, the expired state shows as today; "Retry" (error state) re-sends `abc`.
- [x] 3. (done: `SetPasswordPage.vue:81,89-94`; `npm run build:admin` green; admin never opened in Chrome per CLAUDE.md) admin `SetPasswordPage.vue`: replace `const token = computed(() => route.query.token || '')` with a value read once at setup (`ref(route.query.token || '')`); in `onMounted` strip it (C3). Verify: open `http://localhost:6173/set-password?token=abc` → address bar `/set-password`, the password form is shown (not the "Invalid or missing reset link." state); `/set-password` with no token still shows that state.

Tests: the new and affected tests are in the ui-tests slice; no web unit test is listed by the parent.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the concrete artifact (the rendered page, the HTTP response, the script output) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` (NOT `[x]`) with exactly what's left; intentionally not done / not applicable → `[NA]` with the reason. Never leave an acted-on box bare `[ ]`, never tick `[x]` for partial work. Overstating completion is the worst failure. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file (parent, specs, contracts, decisions). If your work changes a fact whose home is an orchestration spec (Fact Index), you MUST update it there and cite the `file:line`; the slice never restates the spec. Specs describe what the code/config IS, never per-env rollout state ("applied to dev", "not yet on prod"); applied migration state lives in `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, deployed config in `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite.** The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.
