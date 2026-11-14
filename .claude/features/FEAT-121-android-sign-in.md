# FEAT-121 (web slice): Android 7 — sign-in, registration, account

Parent: FEAT-121 — `../wna_orchestration/features/FEAT-121-android-sign-in.md`. Local slice only: the exact Privacy Policy text is in the parent § Legal impact — read it there, never restated here. Work only in the `main` worktree. No dependency on any other sibling; Help impact and Landing / Pricing impact are n/a in the parent.
Role `web`, repo `wna_web/main`, on `main`.

## User flows (this project's part)
- Free / Pro / Team owner / Team member (and every visitor of the public page): the Privacy Policy tells them Android Google sign-in keeps no token, Android Apple sign-in uses the website's token, and the Android store source — no flow, no screen change.
- Admin roles: n/a — admin-app is not touched.
- Not-entitled / blocked: n/a — the page is public.

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
   the concrete artifact to inspect (the rendered `/legal/privacy` page) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent, specs, contracts, decisions) — pull the authoritative form
   from its home rather than guessing or asking. Reading is unrestricted; only *writing* is scoped (to the spec
   homes this repo owns). If your work changes a fact whose canonical home is a spec in `wna_orchestration`
   (features → `specs/features/*`; numbers → `contracts/*`), you MUST update that spec file there as part of this work — REQUIRED, never "deferred to the
   user." The local-slice rule forbids only *restating* shared facts inside the slice, NOT updating their canonical
   home. Cite the orchestration `file:line` you updated. Specs describe what the code/config IS, never per-env
   rollout state (no "applied to dev", "not yet on prod").
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19): the build and the one page named in the box. The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Local stack only; never deploy, never test
   against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.

## Checklist
Test scope: no test code in this slice; no existing test is directly affected (a legal-text edit changes no asserted behaviour) and no generic regression box.

- [x] **W1** Privacy Policy (`wna_web/main/src/main-app/content/legal/privacy.md`) per the parent `## Legal impact`: §2.1 Google account identifier bullet, last sentence; §2.1 Apple account identifier bullet, last sentence; §2.12 App Store / Google Play sentence; §7 the "Sign-in tokens" row (retention column unchanged); "Last updated" = the day of this item. Terms of Service: n/a — `terms_version` untouched. Verify: `npm run build:main`; `/legal/privacy` renders the four changed sentences.
  - Done 2026-11-14: `src/main-app/content/legal/privacy.md:26` (Google: website + iPhone token, Android gives no token), `:27` (Apple: Android uses the website's token), `:167` (App Store / Google Play), `:337` (§7 row, retention column unchanged), `:3` Last updated = November 14, 2026 (already today's date). Old wording "one for each app" / "each app you sign in with" → 0 matches. `npm run build:main` green; prerendered `dist/main-app/_prerender/legal/privacy/index.html` and live `http://localhost:5173/legal/privacy` (Chrome) both contain all four new sentences. Terms untouched.
