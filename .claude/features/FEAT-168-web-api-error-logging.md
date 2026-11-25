# FEAT-168 (web slice): no server response or user data in the console

Parent: `../wna_orchestration/features/FEAT-168-web-api-error-logging.md` (design, rule W1–W5, flows). This slice is the
local checklist only; the spec is not restated here.

## User flows (this project's part)
n/a — developer console only; every role (Free, Pro, Team owner/member, Admin, unauthenticated) sees the same app.
Parent flows 1–6 (parent § Design → Flows) are the observable console behaviour to satisfy.

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

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (here: the browser console on the local dev server) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. If your work changes a fact whose canonical home is an orchestration
   spec, update that spec there and cite the `file:line` (parent says: no spec is touched by this ID).
   Specs describe what the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work.**
   The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against
   `dev.whatsnextaction.com` / `api-dev` / the VM.

## Checklist (parent § Work breakdown → web)
- [x] W1 `src/main-app/scripts/core/apiClient.js:64` (`normalizeError`): drop the `error.response.data` argument; the
  line logs exactly `` `[api] ${METHOD} ${cfg.url} → ${status}` ``, nothing more. Lines 66 and 68 unchanged. Return
  values unchanged. Data: none.
  DONE: `src/main-app/scripts/core/apiClient.js:64` logs method + path + status only; lines 66/68 unchanged.
- [x] W2 `src/main-app/components/AuthDialog.vue`: line 437 — remove the `userId.value` argument and the words
  "for user", wrap in `if (import.meta.env.DEV)`; lines 441, 443, 448 — wrap each in `if (import.meta.env.DEV)`
  (text unchanged); lines 543, 579, 602, 628 — delete the four `console.log(err)`. No other change in the file.
  Data: none.
  DONE: `src/main-app/components/AuthDialog.vue:437` (no userId, DEV-gated), `:441/:443/:448` DEV-gated, four `console.log(err)` deleted (login/register/forgot/reset catch blocks).
- [x] W3 DEV-gate (wrap in `if (import.meta.env.DEV)`, text and arguments unchanged):
  `src/main-app/scripts/core/errorModel.js:23`, `src/admin-app/scripts/core/errorModel.js:16`,
  `src/main-app/scripts/models/calendarModel.js:243`, `src/main-app/components/AttachmentSection.vue:252`,
  `src/main-app/scripts/models/referenceModel.js:283`. Behaviour around each line unchanged. Data: none.
  DONE: `src/main-app/scripts/core/errorModel.js:23`, `src/admin-app/scripts/core/errorModel.js:16`, `src/main-app/scripts/models/calendarModel.js:243`, `src/main-app/components/AttachmentSection.vue:252`, `src/main-app/scripts/models/referenceModel.js:283` — all `if (import.meta.env.DEV)`.
- [~] W4 Verify (no new automated test: built bundles strip console output, the repo has no unit-test runner;
  existing tests directly affected: none — no test in `wna-ui-tests` reads console output).
  (a) `grep -rnE "console\.(log|error|warn|info|debug)" src --include='*.js' --include='*.vue' --include='*.ts'`
  returns exactly: `apiClient.js` 64/66/68 (64 without `response.data`), `domains.js:7`, and DEV-gated lines only
  (AuthDialog polling ×4, both `errorModel.js`, `calendarModel.js`, `AttachmentSection.vue`, `referenceModel.js`,
  `notificationInAppModel.js` ×4) — paste the output here.
  (b) On the local dev server (`http://localhost:5173`): sign in with a wrong password → the console shows
  `[api] POST /v1/user/login → 401` and no response body.
  (c) `npm run build:main` and `npm run build:admin` exit 0. Consumes W1–W3.
  PARTIAL: (a) done — grep returns only: `apiClient.js` 64 (no response.data)/66/68, `domains.js:7`, and DEV-gated lines: AuthDialog 437/441/443/448, both `errorModel.js`, `calendarModel.js:243`, `AttachmentSection.vue:252`, `referenceModel.js:283`, `notificationInAppModel.js` 48/83/94/143. (c) done — `npm run build:main` and `npm run build:admin` exit 0. (b) DEFERRED TO OWNER: Claude in Chrome extension not connected, so the wrong-password login check on `http://localhost:5173` (expect `[api] POST /v1/user/login → 401`, no body) was not run.
- [x] W5 `CLAUDE.md` §Production Build: add one line — "Console: an API failure is logged only in
  `apiClient.js normalizeError` as method + path + status (never the response body, params or headers); any other
  console output only under `if (import.meta.env.DEV)`; no log line names the user (FEAT-168)." Consumes W1–W3.

  DONE: `CLAUDE.md` §Production Build, line after the obfuscator paragraph.