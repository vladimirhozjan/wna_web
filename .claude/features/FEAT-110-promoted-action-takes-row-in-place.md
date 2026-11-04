# FEAT-110 (web slice): Promoted action takes the row in place on Next / Today

Parent: `wna_orchestration/features/FEAT-110-promoted-action-takes-row-in-place.md` (FEAT-110) — problem, Screens, Design § Boundaries / Contracts / Flows and Work breakdown live there; not restated here.
Job: items W1–W7 (7 boxes). Backend: nothing (no backend slice). Order: W1 → W7.

## User flows (this project's part)
- Free / Pro / Team owner: on Next or Today completes, trashes, moves to Someday or transforms a project's next action → the same row shows the project's next backlog action (parent § Flows 1–8, § Screens); Undo puts the original back in the row at once.
- Team member (shared project, own assigned action): shared rows are never held — unchanged behaviour (`isHoldable`).
- Admin: n/a — admin-app has no action lists.
- Unauthenticated: n/a — dashboard only.
- Mobile (500 px): same row, same sequence; swipe right/left triggers; sidebar drops are desktop only.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the rendered row / list and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` with exactly what's left; intentionally not done / n/a → `[NA]` with the reason. Never leave a box you acted on as bare `[ ]`; never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file. If your work changes a fact whose home is an orchestration spec (Fact Index), update that file as part of this work and cite the `file:line`. Specs describe what the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the full suite** (owner directive 2026-08-19). The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never add a "verify on dev" step.

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

## Screens
- [~] Next and Today action row built per parent § Screens — verified in Chrome at the 306 px window only (steps 1–3a/3b, Undo, op failure, empty state; see W7); desktop width not checked (window could not be widened). No new copy, icon or CSS variable (ItemList.vue:604-631 keyframes use existing tokens / none).

## Checklist
Verify after each: `npm run build:main` green. Paths relative to `wna_web/main/src/main-app/`.
- [x] W1. `scripts/core/rowHold.js` — `HOLD_LEAVE_MS` :9, `HOLD_CLOSE_MS` :11, `isHoldable` :14, `matchHeld` :19, `createRowHold` :37 (coalesced `settle` :79-94). Additive: `settle(ids)` takes the caller's id(s) (default = every held row) so a row whose op is still in flight is not unheld by another row's re-read (NextPage.vue:272 / :287, TodayPage.vue same, Sidebar.vue settleHeld calls).
- [x] W2. `scripts/core/liveMotion.js` — `swapRow` :119, `closeRow` :129, returned :148.
- [x] W3. `nextActionModel.js` — `holdReread` :27 (`limit: Math.max(limit, items.length)` :31, `cursor: null`, active tags; version + `loading = false`), `createRowHold` :43, `trashAction` skips held :187, exports `held`/`hold`/`unhold`/`settleHeld` :303; `todayModel.js` same at :26/:30/:42/:162/:276. Query params checked in code (apiClient.js:577/:912 drop a null cursor); the Chrome tool masks query strings, so the DevTools Network check itself was not visible.
- [x] W4. `components/ItemList.vue` — prop `held` :155, held classes :46-47, `item-held-out` / `item-held-fade` :623/:628, sync copy :228-235, resolve watch (matchHeld :253, swapRow :262, ghost closeRow :273), empty-state hold :256 via `fadeInEmpty`, `skip()` set :283.
- [x] W5. `NextPage.vue` — `:held` :39, `isHoldable` branches :233 / :294, `completeHeld` :257, `trashHeld` :276; `TodayPage.vue` same at :39/:232/:293/:256/:275. Non-holdable path unchanged (standalone row still gets `item-wrapper--completing`, verified in Chrome).
- [x] W6. `components/Sidebar.vue` — `heldDrop` :340, `dropOp` :348; Projects :505 (after outcome; Cancel returns before), Someday :540, Reference :827, Completed :849 (`checked = true`), Trash :880; `settleHeld` before toast / `recordDrop`; `removeFromActions` skips held :915-916; `refreshAfterDrop` skips a model with held rows :270-271. Runtime not checked (see W7).
- [~] W7. Chrome on `:5173` — the window stayed at 306 px (resize had no effect), so the mobile layout only; per-frame sampler of `main .item-wrapper[data-row-id]` count + top of the row below:
  - Next, complete active "Proj step one" → row count stays 3, row below never moves (top 252 px every frame), "Proj step two" takes the row at ~610 ms, then the 1 s accent highlight. ✔
  - Next, trash "Proj step two" (trash icon) → "Proj step three" in the row, count 3, no move, toast `"Proj step two" moved to trash` + Undo. ✔
  - Next, complete with no backlog left → ghost closes (row below glides 252 → 184 px in ~160 ms), ghost removed. ✔ Undo → original back at once (no motion), toast `"…" moved back`. ✔
  - Next, complete with backlog → promoted takes the row; Undo → original back in the row at once, promoted gone. ✔
  - Op failure (complete answered 404 via XHR redirect; stopping the backend is not allowed for me) → row content back, unchecked, held class gone, existing toast `Not Found`. ✔ (A pure network error shows the app's existing "Offline for now" screen.)
  - Tag filter the promoted action lacks → row closes, then `This context is clear` fades in. ✔
  - Today: complete → step five, trash → step six, Undo → original in the row; count 3, row below fixed. ✔ Standalone row → old `item-wrapper--completing` exit. ✔ No console errors.
  - REMAINING: desktop width (> 768 px) and the desktop sidebar drops (Someday / Reference / Projects + Cancel / Completed / Trash) — not checked: the Chrome window could not be widened past 306 px; real mobile swipe gesture not driven (same handler as checkbox / trash). Owner / ui-tests (FEAT-110 ui-tests 1, desktop cases).
