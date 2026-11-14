# FEAT-119 (web slice): Android 5 — architecture II: local database, sync, change queue

Parent: FEAT-119 — `../wna_orchestration/features/FEAT-119-android-architecture-offline.md`. Local slice only: the exact
Privacy Policy text is in the parent § Legal impact — read it there, never restated here. Work only in the `main`
worktree. Role `web`; no dependency on any other sibling.

## User flows (this project's part)
- Free / Pro / Team owner / Team member: the Privacy Policy page (all visitors) tells them the Android app keeps a local
  copy of their content — no flow, no screen change.
- Admin roles: n/a — no admin surface.
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
   the concrete artifact to inspect (the rendered Privacy Policy page) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file — pull the authoritative form from its home rather than guessing. If your work
   changes a fact whose canonical home is a spec there (`specs/features/*`), you MUST update it as part of this
   work — REQUIRED, never "deferred to the user." Cite the orchestration `file:line` you updated. Specs describe what
   the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Local build / dev server only; never
   deploy, never verify on `dev.whatsnextaction.com`.

## Checklist
Test scope: no new test and no existing test is affected (a legal-text change; no asserted behaviour changes).

- [x] **W1** Privacy Policy `src/main-app/content/legal/privacy.md` per the parent § Legal impact: §10 new paragraph directly
  after the iPhone database paragraph, §7 new row after "Copy of your content in the iPhone app …", "Last updated" →
  the date of the change. Terms of Service unchanged. Verify: the text matches § Legal impact word for word; `npm run
  build` green.
  Done: §10 paragraph `src/main-app/content/legal/privacy.md:418` (directly after the iPhone database paragraph :416);
  §7 row `privacy.md:332` (after the iPhone-copy row :331); "Last updated" `privacy.md:3` is already November 14, 2026
  (= date of this change, kept). ToS untouched. Word-for-word match checked by script against parent § Legal impact
  (both quotes found verbatim); `npm run build:main` green and `dist/main-app/_prerender/legal/privacy/index.html`
  contains both texts.
- [x] Update `../wna_orchestration/specs/features/wna-features.md` — the Android privacy bullet (FEAT-118 lines, ~2710) names the local
  copy (parent W1).
  Done: `../wna_orchestration/specs/features/wna-features.md:2713-2720` — the FEAT-118 Android bullet now also names the
  Android local copy, its deletion rules and the §7 row (FEAT-119).
