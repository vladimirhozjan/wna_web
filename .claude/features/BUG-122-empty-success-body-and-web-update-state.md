# BUG-122 (web slice): Web update can still send `state`

Parent: `wna_orchestration/features/BUG-122-empty-success-body-and-web-update-state.md` — Design and the acceptance gates live there; read them, nothing is restated here. Work on `main` (this `main` worktree only). Independent of the backend slice.

## User flows (this project's part)
- Free / Pro user, Team owner / member: an action edit still saves, nothing visible changes; a caller passing `state` (none today) has it dropped (parent Flows 5).
- Admin: n/a — no admin change.
- Unauthenticated / not-entitled: n/a — no change.

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

## Checklist (parent § Work breakdown → web)
- [x] W1. DONE — `src/main-app/scripts/core/apiClient.js:827-843` `updateAction` has no `state` key (grep of the function: 0 matches); `createAction` keeps it at :814; `npm run build:main` passes. — delete `if (data.state) body.state = data.state` from `updateAction`; the rest of the function and `createAction` (line 813, keeps `state`) stay. Verify: the `updateAction` body builder has no `state` key; `npm run build:main` passes.
  Data: none — no server data read.
  Tests: no new test — no caller passes `state` (`nextActionModel`, `waitingModel`, `todayModel`, `overdueModel`, `somedayModel.updateItem`, `undoModel`, `EngagePage`, `ProjectDetailPage`), and the main-app has no unit runner. Existing tests directly affected: none.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the concrete artifact to inspect (the API response, the request body) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly what's left; if intentionally not done or not applicable, mark `[NA]` with the reason. Never leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file. If your work changes a fact whose canonical home is an orchestration spec (see its Fact Index), you MUST update that file as part of this work and cite the `file:line`. Specs describe what the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite** (owner directive 2026-08-19). The full regression suite is run by the OWNER before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.
