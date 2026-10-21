# BUG-057 — web slice: forgot shows "check your inbox"; reset only from the emailed link

**Parent (canonical):** `../../wna_orchestration/features/BUG-057-forgot-password-returns-reset-token.md` — §User
flows, §Screens (Screens 1–3, S1–S8 — exact copy lives there), §Design (D2, D5), §Help impact, §Work breakdown › web.
Read it first, plus `../../wna_orchestration/specs/api/api.md` §Forgot Password / §Reset Password. This file is only
this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `AuthDialog.vue`, `router.js`, `errorMapper.js`, `content/help/faq.js`. Admin-app is out of
scope.

## User flows (this project's part)
- **Free / Pro / Team owner / Team member** — forgot submit → parent Screen 2 for any email (response body never
  read); the new-password form opens only from the emailed `/reset-password?token=` link; invalid/expired link →
  parent S4 toast + forgot form; success → login form.
- **Admin** — n/a — admin-app reset is the separate `/set-password` flow (parent §User flows).
- **Unauthenticated / not-entitled (attacker knowing only an email)** — sees the same Screen 2 as any user; no
  reset form, no account-exists signal. `/reset` and token-less `/reset-password` redirect to `/forgot` (S1).

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
### Screens (one box per parent § Screens screen — every state + exact copy)
- [x] W-1 Screen 1 — Forgot form: every state in the parent table (idle, invalid format, submitting, success → Screen 2
  without reading the body, error toasts). `data.reset_token` no longer read — grep `reset_token` in `src/` → `0`.
  ✔ `AuthDialog.vue:444-445` (body ignored → `'forgot-sent'`); idle/invalid/spinner/error toast unchanged `:83-94`, `:433-450`; `grep -rn reset_token src/` → 0 (local ref renamed `resetToken` `:202`).
- [x] W-2 Screen 2 — new `AuthDialog` mode `'forgot-sent'` (S8), elements + exact copy per parent.
  ✔ `AuthDialog.vue:112-120` — h2 / subtitle / `Lnk` → `goToLogin()` (email kept), no `Btn`.
- [x] W-3 Screen 3 — reset form from the link: S1 router redirects (`router.js`) and S4 invalid/expired-link toast via a
  new `ErrorScenario` in `errorMapper.js` + switch to the forgot form.
  ✔ `router.js:37-39` (`/reset` → `/forgot`; `beforeEnter` token-less → `forgot`), `:116` (`reset` dropped from public names);
  `errorMapper.js:19`, `:49-52` (`RESET_PASSWORD`); `AuthDialog.vue:472-476` (401 → toast + `goToForgot()`).
  Owner-approved extra (2026-10-21): `httpApi.js:12` AUTH_PATHS `'/v1/user/reset-password'` (no such endpoint) → `'/v1/user/reset'`,
  else a logged-out 401 triggered refresh → `logout()` → reload to `/`, so S4 never showed.
### Help
- [x] W-4 `content/help/faq.js` "How do I reset my password?" rewritten per parent § Help impact (no lifetime — D5).
  ✔ `faq.js:21`.
### Specs (orchestration homes)
- [x] W-5 Update `../../wna_orchestration/specs/features/wna-features.md` §2.4 / §2.5 per parent §Work breakdown › web
  (incl. dropping the "valid for 1 hour" claim and the `/reset` → `/forgot` redirect).
  ✔ `wna-features.md:162-165` (§2.4), `:169`, `:173` (§2.5), `:181` (8 modes), `:203` (allowlist); owner-approved `:2261` reset tokens 1 h → 24 h.
- [x] W-6 Update `../../wna_orchestration/specs/tests/wna-test-cases.md` — TC-014, TC-015, TC-016, TC-040 and new
  TC-825, TC-826, TC-827 per parent §Work breakdown › web.
  ✔ `wna-test-cases.md:426` TC-014, `:453` TC-015, `:478` TC-016, `:507` TC-825, `:532` TC-826, `:555` TC-827, `:1266` TC-040;
  `regression-ui-tests/update-tests.sh` re-run.
### Verify
- [x] W-7 `npm run build:main` passes; ask the owner to verify Screens 1–3 at runtime on the local stack.
  Build ✔ (2026-10-21). Owner verified Screens 1–3 on local :6111 (2026-10-21).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (here: the auth dialog after a forgot submit for a known and an unknown email, the
   reset form opened from the Mailpit link, the expired-link toast, `/reset` landing on `/forgot`, the FAQ entry) and
   confirm it.
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
   updated. (Find the home in the orchestration Fact Index.) This includes `/internal/*` routes, CronJobs
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local docker services, local web dev server, local mocks; ui-tests `BASE_URL` = local).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments — dev AND prod compose overrides, config.json, crontabs, scripts —
   and hands over the exact command lines for dev AND for prod. Operator-only steps (GCP/VM
   provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — handed over: <dev command> / <prod command>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
