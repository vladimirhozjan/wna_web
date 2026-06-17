# BUG-003 (web slice): No rate-limit toast on 429 from resend-verification

Parent / spec / root cause: `wna_orchestration/features/BUG-003-resend-verification-429-toast.md`.
Do not restate the parent — this is the local checklist only. (All work on `main` — no branches.)
**Likely shares a root cause with [[BUG-004-stuff-error-toasts]]** — check the error-toast pipeline together.

## Checklist (web)
- [x] On `429` from `POST /v1/user/resend-verification`, surface the exact spec toast
      ("Too many requests. Please try again later.", `wna-features.md:1788`) via the existing
      `errorModel().push(...)`. Cite `file:line` for the resend handler and the status→message map.
      → resend handler: `views/public/VerifyEmailPage.vue:151-153` (`toaster.push(err.message || …)`,
      `toaster = errorModel()` at `:82`); status→message map: `scripts/core/apiClient.js:77-78`
      (`case 429: return {status, message: "Too many requests. Please try again later."}`).
- [x] Confirm the resend handler in `views/public/VerifyEmailPage.vue` does not swallow the rejected
      promise before the toast fires (catch must reach `errorModel`).
      → `views/public/VerifyEmailPage.vue:151-153`: `catch (err)` now forwards `err.message` (the
      normalized 429 text) into `toaster.push(...)`. Was previously a bare `catch {}` that discarded
      `err.message` and pushed a generic literal.
- [x] Confirm the 429 mapping lives in the shared status→message map (`scripts/core/apiClient.js` /
      `httpApi.js`) so it isn't a one-off literal — reuse, don't duplicate.
      → `scripts/core/apiClient.js:77-78`, inside `normalizeError`'s shared `switch (status)` used by
      every apiClient call (incl. `resendVerification` at `:126-133`). Not a page-level literal.
- [x] Grep for any local/duplicate "Too many requests" literal added by mistake → `0` extra copies.
      → `grep -rn "Too many requests" src/` returns 2 hits: the new shared-map entry
      (`apiClient.js:78`) and a PRE-EXISTING entry in the separate scenario-based mapper
      (`scripts/core/errorMapper.js:10`, used by login/register/forgot/change-password — NOT the
      resend path, which uses `err.message` from `normalizeError`). `0` literals added by me at the
      page/handler level. The two mappers are independent pre-existing systems; merging them is out of
      this slice's scope.

## User flows (this project's part)
Pre-verification flow — role-agnostic (before tier/role matters). Web must render the toast on 429 for:
- **Free / Pro:** show the "Too many requests…" toast. (same code path)
- **Team owner / member:** same — no team-specific behaviour.
- **Unauthenticated / not-entitled:** this *is* their flow (account unverified) — must see the toast.
- **Admin:** n/a — admin-app uses separate OTP auth; no resend-verification flow on this surface.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass".
   Concrete artifact: trigger a real 429 on resend and confirm the red toast with the exact spec text
   renders on `VerifyEmailPage`.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (role-agnostic here); don't silently implement
   only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[ ]` and write exactly what's left.
   Overstating completion is the worst failure — it ships broken work as done.
