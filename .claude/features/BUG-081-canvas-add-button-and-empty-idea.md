# BUG-081 (web slice): Brainstorm canvas — hover + unreachable, covered by a new idea, empty idea stays

Parent: `wna_orchestration/features/BUG-081-canvas-add-button-and-empty-idea.md` (BUG-081) — problem, Design § Boundaries / Contracts / Flows and Work breakdown live there; not restated here.
Job: items W1–W6 (6 boxes).

## User flows (this project's part)
- Free / Pro / Team owner / Team member (editor): hovers an idea, moves onto the +, clicks → a new idea opens, the parent's + stays uncovered; clicking away or dragging with nothing typed drops the empty idea (parent § User flows).
- Team member view-only: n/a — no + (`canEdit` false).
- Admin: n/a — admin-app has no canvas.
- Unauthenticated: n/a — canvas is in the dashboard only.
- Own save (D4): Undo keeps its history after the save; changes from the assistant, other devices and members still refresh the open canvas.
- Mobile (≤ 768 px): drill-down gets the D3 drop fix through the shared model; no hover +.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the rendered assistant panel and confirm it.
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
n/a — parent § Screens: behaviour fix, no new state or copy.

## Checklist
- [x] W1 — parent Work breakdown web item 1 (D2 distance: `IDEA_CHILD_GAP`, `placementFor`, layout `reach`). `canvasModel.js:24` (const), `:489` (placementFor), `CanvasMap.vue:156,248` (import, reach). Chrome :5173: sub-ideas of an idea sit 64 px from its edge, + rect (1512–1532) clear of sub-idea (1545).
- [x] W2 — parent Work breakdown web item 2 (D1 hover bridge: `cm-node--far-add` class + `::before` CSS). `CanvasMap.vue:315` (class), `:1019-1038` (CSS). Chrome: hovered far-add idea has 52 px bridge, `elementFromPoint` between box and + returns the idea; one click on + opens a new idea, + stays uncovered. Left-side idea / root hover not exercised in Chrome (CSS only).
- [x] W3 — parent Work breakdown web item 3 (D3 `discardNew(id)` drop by id). `canvasModel.js:594-617`. Chrome: + → wait 4 s → click empty canvas → no new "Untitled idea" (count unchanged), Undo disabled. Drag-mid-Tab case (b) and mobile FAB (d) not exercised — left to ui-tests.
- [~] W4 — parent Work breakdown web item 4 (D3 leave paths in `ProjectCanvasPage.vue`). Code: `ProjectCanvasPage.vue:310` (onMediaChange), `:319` (onPageHide), `:330` (onBeforeRouteLeave). Chrome: + → back link → reopen → no empty idea (verified). Resize 1280→700 not verifiable — Chrome window resize does not change the viewport here; left to ui-tests.
- [~] W5 — parent Work breakdown web item 5 (regression on `:5173`, `npm run build:main`; list TCs made new / stale for ui-tests). `npm run build:main` green. Chrome regression of TC-948/949/950/953/955 not run beyond the add/drop flows above (ui-tests owns it). New TCs for ui-tests: hover + stays reachable (idea / idea with sub-ideas / left / root); no idea covers its parent's +; empty new idea never stays (after save, press-and-drag, leaving, mobile FAB). Stale: none.
- [~] W6 — parent Work breakdown web item 6 (D4: this tab's own canvas save echo no longer refreshes the canvas; page filter + `rebase()` guard). Code: `ProjectCanvasPage.vue:150` (import), `:241-245` (filter); `canvasModel.js:253` (comment), `:284` (guard). `npm run build:main` green. Chrome :5173: add idea on left-side Idea B2 via +, type X, Enter, wait 4.5 s → no canvas GET after the PUT (resource entries empty), Undo enabled, Undo removes X, Redo restores it. Cases (b) drag-held echo, (c) second tab, (d) terminal PATCH, (e) TC-969 not exercised — left to ui-tests.
