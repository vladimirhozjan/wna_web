# FEAT-120 (web slice): Android 6 — architecture III: live updates, push, background file transfer

Parent: FEAT-120 — `../wna_orchestration/features/FEAT-120-android-architecture-platform.md`. Local slice only: the exact Privacy Policy text is in the parent § Legal impact — read it there,
never restated here. Work only in the `main` worktree. Role `web`; no dependency on any other sibling.

## User flows (this project's part)
- Free / Pro / Team owner / Team member: the Privacy Policy page (all visitors) tells them the Android app sends
  notifications through Google Firebase Cloud Messaging, keeps an FCM token per session and remembers saved attachments —
  no flow, no screen change.
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
   read any `wna_orchestration` file (the parent, specs, contracts, decisions) — pull the authoritative form
   from its home rather than guessing or asking. Reading is unrestricted; only *writing* is scoped (to the spec
   homes this repo owns). If your work changes a fact whose canonical home is a spec in `wna_orchestration`
   (`specs/features/*`), you MUST update that spec file there as part of this work — REQUIRED, never "deferred to the
   user." The local-slice rule forbids only *restating* shared facts inside the slice, NOT updating their canonical
   home. Cite the orchestration `file:line` you updated. Specs describe what the code/config IS, never per-env
   rollout state (no "applied to dev", "not yet on prod").
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19): a local build only. The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Local build / dev server only; never
   deploy, never verify on `dev.whatsnextaction.com`.

## Checklist
Test scope: no new test and no existing test is affected (a legal-text change; no asserted behaviour changes).

- [x] **W1** Privacy Policy `src/main-app/content/legal/privacy.md` per the parent § Legal impact: §2.6 push bullet, §5.13 new
  Google (Firebase Cloud Messaging) bullet after the iPhone one, §6 push paragraph's last sentence, §7 push row, §10 new
  paragraph after the Android database paragraph; "Last updated" = the day of this item. Terms of Service unchanged
  (`terms_version` untouched). Verify: the text matches the parent § Legal impact word for word; `npm run build:main`
  green; `/legal/privacy` renders every changed paragraph.
  Done: `src/main-app/content/legal/privacy.md:90` (§2.6), `:286` (§5.13 Google FCM bullet), `:312` (§6), `:343` (§7 row),
  `:421` (§10), `:3` (Last updated November 14, 2026); text copied verbatim from the parent § Legal impact; `terms_version`
  untouched (no other file changed); `npm run build:main` green; `/legal/privacy` on :5173 shows all six strings.
- [x] Update `../wna_orchestration/specs/features/wna-features.md` — the Android privacy bullet names FCM, the FCM token and the
  Downloads index (as FEAT-119's W1 did for the local copy).
  Done: `../wna_orchestration/specs/features/wna-features.md:2720-2726` (FEAT-120 sentence appended to the Android privacy bullet).
