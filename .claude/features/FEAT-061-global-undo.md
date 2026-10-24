# FEAT-061 — web slice: Global undo (Undo toast, Ctrl/⌘+Z, Trash confirm removed)

**Parent (canonical):** `../wna_orchestration/features/FEAT-061-global-undo.md` — §User flows, §Screens (S1–S5, flow → element check, designer decisions DS1–DS20),
§Design (D1–D9 + D1a), §Help impact, §Contracts touched. Read it first. This file is only this repo's checklist; nothing from
the parent is restated.

**Scope:** main-app only. New `src/main-app/scripts/core/undoModel.js` (DS2) and the `errorModel` / `ErrorToaster` undo
variant (DS1) are owner-approved. Depends on: backend FEAT-061 slice (`recurring_parent_id` on Today / Waiting / Overdue /
Engage rows) and FEAT-060's `--touch-target-min` token (DS3). Legal: n/a (parent §Legal impact), so no legal box.

## User flows (this project's part)
- **Free / Pro** — parent "Free user": the whole flow is this repo's — record each undoable op (S3) with its S5 snapshot,
  Undo toast 6 s (S1), Ctrl/⌘+Z on desktop (S2), inverse + field restore + reorder / re-promote (D1a, D7, DS13–DS15,
  DS17), success / failure copy (DS4–DS6), detail-page return (DS7), no confirm on Trash (S4), non-undoable cases toast
  without Undo (D8, DS11, DS12, DS20), reorder no toast (D9).
- **Team owner** — parent "Team owner": shared-project rows → inverse call only, server placement, no reorder / re-promote
  (DS19); server 403/409 messages pass through the failure toast.
- **Team member** — parent "Team member": same as owner; a read-only member never gets an Undo (no undoable op is offered).
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — n/a — public pages: no toast, no key.

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
### Building blocks
- [x] W-1 `errorModel` / `ErrorToaster` undo variant per §Screens S1 (6 s, no dedupe, single slot, `Undoing…`, button look
  + ≤ 768 px wrap, DS1 / DS3). — `scripts/core/errorModel.js:3` (6 s), `:45-49` (single slot, no dedupe), `:56-66`
  (in flight, timer stopped), `:68-70` (body click dismisses, not while undoing); `components/ErrorToaster.vue:9-23`
  (icon, `Undo` / `Undoing…` button), `:79-117` (text-label fw-semibold, toast text colour, hover underline, ≤ 768 px wrap
  `calc(100vw - 32px)` + `--touch-target-min` hit area).
- [x] W-2 `scripts/core/undoModel.js` — record / undo / clear on expiry, page-refresh signal, sidebar counts reload (DS2).
  — `undoModel.js:54-66` record (non-undoable → plain toast), `:34-39` `registerRefresh` (page-refresh signal, used by
  every list / detail page), `:88` `refreshStats`, expiry = the toast leaving (`errorModel.js:48`; no toast → nothing to run).
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-3 S1 Undo toast — every state (shown, in flight, success DS4, failure DS5 / DS6, expiry, replaced DS2) with exact copy.
  — shown / in flight / expiry / replaced: `errorModel.js:45-66`; success `"<title>" moved back` `undoModel.js:82`;
  partial (DS6) `:84`; server text / upgrade-modal pass-through `:71`; DS5 fallback copy `:96-100`; position-only failure
  silent `:182-195`.
- [x] W-4 S2 Ctrl/⌘+Z in `shortcutModel.js` (pause rules) + `ShortcutsDialog.vue` row + note (DS16). —
  `scripts/core/shortcutModel.js:92-99` (no Shift/Alt, repeat / in-flight / field / dialog / ≤ 768 px ignored);
  `components/ShortcutsDialog.vue:29,36` (row after the palette key), `:11` (note).
- [x] W-5 S3 toast copy per op — every undoable op wired at every entry point (list rows, detail pages, CommandPalette,
  Sidebar drops, Move menus / MoveModal, FEAT-060 swipe); non-undoable ops toast without Undo; Sidebar copy unified (DS8);
  project trash copy (DS9). — rows (checkbox / × / swipe share the handler): `InboxPage.vue:335,353`,
  `NextPage.vue:234,251`, `TodayPage.vue:233,250`, `WaitingForPage.vue:279,296`, `OverduePage.vue:153,170`,
  `EngagePage.vue:381,403`, `SomedayPage.vue:260,279`, `ProjectsPage.vue:240` (DS9), `ProjectDetailPage.vue:1717,1740`;
  detail buttons (palette "This item" runs the same handlers): `StuffDetailPage.vue:639,825,840,874`,
  `ActionDetailPage.vue:1016,1053,1106,1136,1560,1641,1676`, `ProjectDetailPage.vue:1369,1435` (DS9),`1469,1545`;
  Engage drop zones `EngagePage.vue:494,508,531`; Sidebar `Sidebar.vue:333,401,435,504,559,647,733,791,819`
  (`:791` / `:819` DS8 copy). Not undoable: connection Waiting (DS12) `ActionDetailPage.vue:1015`, `EngagePage.vue:530`,
  `Sidebar.vue:732`; moves out of Completed (DS11) `Sidebar.vue:434,503`; conversions / Clarify keep `toaster.success`.
- [x] W-6 S4 Trash confirm removed at all 12 call sites + the swipe-left path (D5); Complete Project confirm kept (DS10);
  Reference-file trash untouched. `grep -rn "title: 'Move to Trash'" src/main-app` → only the Reference-file one left.
  — grep → `views/dashboard/ReferencePage.vue:559` only; swipe-left emits into the same page handlers (no own confirm);
  Complete Project confirm kept `ProjectDetailPage.vue:1357`.
- [x] W-7 S5 snapshot + inverse per op — field restore (DS13 `/wait` + `PUT waiting_since`, DS14), reorder to the old index
  except DS17 rows, re-promote + return to Today / Calendar / Waiting (D7, DS15), shared rows server placement (DS19),
  recurring active instance → no Undo using `recurring_parent_id` (D8). — `undoModel.js:41-52` (D8, DS12, DS20),
  `:103-118` inverse, `:121-158` restore (DS11 re-complete `:126,132,138`; DS19 `:140`; backlog bp `:141-144`; D7/DS15
  re-promote `:146-152`; DS13 `:153-155`; DS14 `:156`), `:161-180` state calls, `:182-195` reorder (DS17 `:186`;
  Overdue / Engage / Sidebar-from-those pass `reorder: false`). Sidebar drops snapshot the full dragged row
  (`Sidebar.vue:303-315`). Known limits (owner-approved 2026-10-24): Someday rows carry no `project_shared` /
  `backlog_position` → list/Sidebar Activate of a legacy shared Someday action shows Undo and the 403 passes through;
  Complete/Trash of a project action from Someday comes back where the server places it. TODAY snapshots without a
  Today-list `source` (Get Action position ≠ Today combined position) skip the reorder.
- [x] W-8 Detail pages: Undo returns to the restored item when still on the page the op left (DS7). —
  `undoModel.js:29-31` (landing path), `:60-62` (detail origin), `:90-93` (return + reload); detail reloads
  `StuffDetailPage.vue:399`, `ActionDetailPage.vue:773`, `ProjectDetailPage.vue:1129`.
### Help (parent §Help impact — one box each)
- [x] W-9 `content/help/faq.js:98` — Undo toast + Ctrl/⌘+Z. — `content/help/faq.js:98`.
- [x] W-10 `content/help/faq.js:188` — Trash no longer asks first; Undo brings it back. — `content/help/faq.js:188`.
- [x] W-11 `content/help/gettingStarted.js` keyboard-shortcuts entry — Ctrl/⌘+Z. — `gettingStarted.js` has no
  keyboard-shortcuts entry; the app's keyboard-shortcuts Help entry is `content/help/faq.js:311` ("Are there keyboard
  shortcuts?") → Cmd/Ctrl+Z added at `faq.js:313`.
### Verify
- [x] W-12 `npm run build:main` passes (paste the tail). — `✓ built in 3.87s` · `[obfuscator] Obfuscated 19 files` ·
  `[prerender] / … /legal/privacy → dist/main-app/_prerender/legal/privacy/index.html` (only the known >500 kB chunk
  warning). No other CI gate in `package.json` (no lint / tests).
- [x] W-13 `data-testid`s for ui-tests on the toast and its Undo button; list them here for the ui-tests slice. —
  `undo-toast` (`ErrorToaster.vue:9`), `undo-toast-button` (`ErrorToaster.vue:19`).
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-14 Update `../wna_orchestration/specs/features/wna-features.md` — undo toast + Ctrl/⌘+Z (§37), every section whose
  Trash confirm goes away, Sidebar toast copy. — §25.1 Undo toast `wna-features.md:2285-2311`; §37.1 row `:2949`;
  §37.3 `:3001-3006`; Trash confirm gone `:318` (Inbox), `:445` (Next), `:631` (Projects), `:651` (Project detail),
  `:716` (Waiting), `:757` (Someday), `:2371` (swipe), `:2860` (Overdue); Sidebar drop toasts `:257`.
- [x] W-15 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-862–868 (IDs reserved by the parent; scope
  per the ui-tests slice) + update every existing Trash TC that has the confirm step; regenerate via
  `regression-ui-tests/update-tests.sh` if that is the repo's practice. — Section 65 TC-862–868
  `wna-test-cases.md:19825-20011`; Trash TCs changed: TC-061 `:2179`, TC-095 `:3132`, Next combined TC step 4 `:3480`,
  Projects list TC step 5 `:4913`, Waiting list TC step 3 `:5435`, TC-179 `:5758`, TC-388 step 2 `:11920`, TC-407 `:12007`,
  TC-408 `:12027`, shared assigned-action trash step 2 `:13024`, Engage overdue step 5 `:16499`, TC-839 `:19052` (step 7 + dialog row),
  BUG-062 Bor/Ana TC steps 1/5 `:19273`, TC-855 `:19652`, TC-856 `:19687`, TC-857 `:19711`. `update-tests.sh` run → Section 65:
  7 TCs; `regression-ui-tests/test-cases.json` + `test-data.js` regenerated.
- [x] W-16 Update `../wna_orchestration/specs/api/api.md` — Update Action documents `waiting_since` if it is missing (DS13
  relies on it; behaviour verified at `wna_backend/core_service/src/services/action/action_service_impl.cpp:161`). —
  `api.md:2029` (merge semantics + `waiting_since` after `/wait`; merge confirmed at `action_service_impl.cpp:154-169`).
### Acceptance gaps (/conclude 2026-10-24 — not accepted)
DS20 on Someday list / Sidebar rows stays as noted in W-7: legacy data only, since a shared project can't go to Someday
(`api.md:1737`). Owner, 2026-10-24: not fixed.
- [x] W-17 DS11, standalone action: Sidebar drop Completed → Trash, then Undo. `restore` already returns it to COMPLETED
  (`previous_state`), so the extra `completeAction` at `undoModel.js:137` fails and shows a false DS6 toast. Re-complete only
  where the restore does not land it in COMPLETED (stuff, project, project action). Expected: `"<title>" moved back`, item in Completed.
  — `undoModel.js:137-141` re-completes an action only when the row carries `project_id` (stuff / project keep
  `:126-127`, `:132-133`). `project_id` on Completed rows = `api.md` List Completed (backend `completed_repository_impl.cpp:98`);
  the Sidebar drop snapshots the full ItemList row (`Sidebar.vue:304-308`, `ItemList.vue:197`). Runtime: TC-863 steps 7–8.
  Data: Completed rows carry `project_id` for a project action (backend B-11–B-14). Standalone = no `project_id`.
- [x] W-18 S1 "Undo succeeded": the current page reloads. `registerRefresh` is missing on `CompletedPage.vue`, `TrashPage.vue`,
  `CalendarPage.vue`, `SearchPage.vue` and `ReviewPage.vue`. Undo pressed while one is open → its list reloads.
  — `CompletedPage.vue:216`, `TrashPage.vue:91`, `CalendarPage.vue:99` (`loadData`; recurring view has no undoable rows),
  `SearchPage.vue:117` (`search.retry` re-runs the current term), `ReviewPage.vue:274-278` (calendar lists while in review).
- [x] W-19 D7 / DS15 + DS12 from Today / Waiting / Overdue / Engage rows and Sidebar drops from them (after backend B-7–B-10):
  the snapshot carries `backlog_position` / `waiting_for_user_id`, so the re-promote (`undoModel.js:140-152`) and the DS12
  check (`:49`) fire. Check the Sidebar row snapshot (`Sidebar.vue:303-315`) and the Engage rows pass them through.
  — backend B3 in `api.md` (List Today / Waiting / Overdue / Engage rows carry `backlog_position`, `waiting_for_user_id`).
  No web change: every snapshot is the raw row — `TodayPage.vue:220,245`, `WaitingForPage.vue:266,291`,
  `OverduePage.vue:140,165`, `EngagePage.vue:354-359` (`findItem`, used by rows and drop zones), Sidebar `rowOf`
  `Sidebar.vue:304-308` (full dragged row). Runtime: TC-867 steps 6–7, TC-866 steps 6–7.
- [x] W-20 DS9: a project with actions trashed from the Someday × (`SomedayPage.vue:279`) or a Sidebar drop (`Sidebar.vue:823`)
  → `"<title>" and its actions moved to trash`.
  — owner 2026-10-24: backend reports it — Trash Project returns `trashed_actions` (`api.md` Trash Project). Someday ×
  `SomedayPage.vue:278-279` (`somedayModel.js:114,127` returns the response); Sidebar `Sidebar.vue:810-829` (Projects and
  Someday sources); Projects × `ProjectsPage.vue:238-239` and Project detail `Trash` (palette runs the same handler)
  `ProjectDetailPage.vue:1436-1437` (`projectModel.js:160,171` returns the response) — `next_action_id` /
  `orderedActions.length` no longer used for this copy. Build `✓ built in 8.76s`. Runtime: TC-863 steps 5, 9–10.
  Data: `POST /v1/project/{id}/trash` returns `trashed_actions` (backend B-15–B-18). Use it on every project-trash surface
  (Projects, Project detail, Someday, Sidebar, palette) instead of `next_action_id` / `orderedActions.length`.
- [x] W-21 S3a Move project: a Sidebar drop onto Someday of a project with actions (`Sidebar.vue:506-508`) →
  `"<title>" moved to Someday. Active actions shelved.`
  — `Sidebar.vue:506-510`: Projects-row source with `next_action_id` (same predicate as `ProjectsPage.vue:239`).
  Runtime: TC-864 step 5.
  Data: web only. The dragged Projects row already carries `next_action_id`; use the same rule as Project detail.
- [x] W-22 `npm run build:main` passes. `wna-test-cases.md` gets the gap steps: D7 from Today / Waiting → TC-867, DS12 via
  Sidebar / Engage drop → TC-866, DS11 action + reload on Completed / Trash → TC-863, DS9 Someday / Sidebar → TC-863,
  shelved copy → TC-864. Update `wna-features.md` §25.1 if its copy list changes.
  — build `✓ built in 7.95s` · `[obfuscator] Obfuscated 19 files` · prerender through `/legal/privacy`. TCs:
  `wna-test-cases.md` TC-863 steps 7–10 `:19871`, TC-864 step 5 `:19905`, TC-866 steps 6–7 `:19962`, TC-867 steps 6–7
  `:19990`; `update-tests.sh` run (`test-cases.json`, `test-data.js`). §25.1 copy list unchanged (already per op, every entry
  point); Sidebar drop toasts `wna-features.md:260` gain the DS9 / shelved variants.

### Acceptance round 2 (/conclude 2026-10-24 — not accepted)
- [x] W-23 D7 / DS15 from Next-list rows (Next page checkbox / × / swipe, Engage Next section, Sidebar drop of a Next row,
  Action detail reached from Next): after Undo the project's active action is active again, not left in the backlog.
  Data: `backlog_position` on `/v1/nextActions` + `pos/{n}` rows (backend B-19–B-22). No web change is expected, because the
  snapshot is the raw row; confirm `undoModel.js:150` re-promotes from these rows.
  — no web change: every Next-row entry point records the raw row — `NextPage.vue:234,252` (checkbox / × / swipe),
  `EngagePage.vue:354-359` (`findItem` → `topActions`, rows = `/v1/nextActions` objects, `api.md:5327`), Sidebar `rowOf`
  `Sidebar.vue:304-308` (full dragged row), Action detail `ActionDetailPage.vue:1557,1638` (`action.value` = Get Action /
  `pos/{n}`, `api.md:2363`). With `backlog_position === 0` the re-promote fires at `undoModel.js:152` (`repromote`) →
  `moveProjectAction(id, 0)` `:156`, independent of `reorder: false` (Engage). Rows carry it per `api.md:2191`, `:2363`
  (backend B4). Runtime: TC-867 step 8.
- [x] W-24 Read-only member (parent User flows "Team member", S1 last row): Done / Trash of their own claim (allowed by
  BUG-063) shows the toast WITHOUT Undo, because the server always 403s uncomplete / restore for read-only. `isUndoable` →
  false when `item.project_shared && item.my_role === 'read_only'`. Data: `my_role` is on every action row and on Get Action
  (`api.md` Get Action). Completed rows (Sidebar drop Completed → Trash) get it in backend B-19; the rest is web-only and can
  start now.
  — `undoModel.js:43`: `isUndoable` → false when `item.my_role === 'read_only'`, for every op. Checked without
  `project_shared` because Completed rows carry `shared`, not `project_shared` (`api.md:3095`), and `my_role` is only
  present on a shared project (`api.md:2103`). Every Done / Trash path records a row or Get Action JSON that carries
  `my_role` (sources as in W-23; Completed rows → Sidebar `rowOf`). Not undoable → plain `toaster.success`
  (`undoModel.js:58-61`), so Cmd/Ctrl+Z has nothing to run. Runtime: TC-867 step 9.
- [x] W-25 `npm run build:main` passes. `wna-test-cases.md`: TC-867 step 8 (Next-row active action → Undo → active again)
  and step 9 (read-only member Done on their own claim → toast without Undo). `wna-features.md` §25.1: read-only members get no Undo.
  — build `✓ built in 4.16s` · `[obfuscator] Obfuscated 19 files` (only the known > 500 kB chunk warning). TC-867
  preconditions `wna-test-cases.md:19980-19984` (project S, read-only C with claim Q-C), step 8 `:19994`, step 9 `:19996`,
  expected `:20004-20006`; `update-tests.sh` run (`test-cases.json`, `test-data.js`). §25.1 no-Undo list
  `wna-features.md:2346-2347`.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (each S1–S5 surface in the local dev server: the toast, the Undo result in the list, the missing Trash confirm) and confirm it.
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
   affected targets (`npm run build:main` and the local check of the touched pages). The full regression suite is run by the
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
