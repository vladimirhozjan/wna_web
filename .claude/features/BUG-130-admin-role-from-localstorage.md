# BUG-130 (web slice): admin-app takes `role` from localStorage over the JWT

Parent: `../wna_orchestration/features/BUG-130-admin-role-from-localstorage.md` (BUG-130) — design, flows, data contract live there; this file is only the web checklist.

## User flows (this project's part)
- Admin viewer / support / admin / super_admin: the admin-app shows exactly the screens of the JWT role, even after localStorage edits (parent flows 1–5).
- Free, Pro, Team owner/member: n/a — admin-app only.
- not-entitled / blocked: a `pending_otp_setup` admin stays on the OTP setup page whatever localStorage says (status from claims only).

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
1. [ ] `src/admin-app/scripts/core/authModel.js`: `currentAdmin` comes only from `decodeJwt(admin_auth_token)` — delete the `admin_current_user` read + merge in `_init` (lines 70-75) and its three writes (`:20`, `:96`, `:145`); add one `localStorage.removeItem('admin_current_user')` at the start of `_init`; drop the dead `removeItem('admin_current_user')` lines in `authModel.js` (`:10`, `:79`, `:172`) and `scripts/core/httpApi.js:24`. Data: claims `sub`, `email`, `role`, `status`, `exp` from the `/auth/login` and `/auth/refresh` access token (admin_service, existing — no backend box). Verify: `grep -rn admin_current_user src/` shows only the one `_init` removal; `npm run build:admin` passes.
2. [ ] Update `specs/api/admin-api.md` §JWT claims / minimum role (orchestration): one sentence — the admin-app derives `role` and `status` only from the access-token claims; its role gating is presentation only, the server's minimum-role check (403 `Insufficient role`) is the authority. Verify: sentence present, no other spec line restates it.
3. [ ] Output for ui-tests: report TC-616 and TC-1009 as unchanged (they assert refresh / session expiry, which this change keeps) and name the new TC of the ui-tests slice (from its reserved block).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the concrete artifact to inspect (the rendered screen, the API response) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role** (viewer / support / admin / super_admin); don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly what's left; if intentionally not done or not applicable, mark `[NA]` with the reason. Never leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file; pull the authoritative form from its home. If your work changes a fact whose home is an orchestration spec, update that file as part of this work and cite the `file:line`. Specs describe what the code/config IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite** (owner directive 2026-08-19). The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against dev/prod, never add a "verify on dev" step.
