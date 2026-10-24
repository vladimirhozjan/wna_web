# FEAT-060 — web slice: Mobile-web polish (swipe, pull-to-refresh, Clarify bottom sheet, touch targets)

**Parent (canonical):** `../wna_orchestration/features/FEAT-060-mobile-web-polish.md` — §User flows, §Screens (S1–S4,
click budget, data needs, flow → element check), §Design (D1–D9 + owner DS1–DS12), §Help impact, §Contracts touched.
Read it first. This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only, below the 768 px breakpoint; desktop unchanged. New files owner-approved by parent D8 —
`src/main-app/scripts/core/swipe.js`, `src/main-app/components/PullToRefresh.vue`,
`src/main-app/components/BottomSheet.vue`, token `--touch-target-min`. No API change (parent §Data needs). Legal: n/a
(parent §Legal impact — no new data or processor), so no legal box.

## User flows (this project's part)
- **Free / Pro** — parent "Free user" / "Pro user": the whole flow is this repo's — the swipe map per parent §Screens S1
  (incl. owner DS1–DS5), snap-back, long-press reorder (ItemList + both Project detail action lists), pull-to-refresh on the
  S2 pages, Clarify as the S3 sheet, S4 tap targets.
- **Team owner** — parent "Team owner": a swipe is offered only where the row already renders that action (no new rule;
  e.g. no right swipe on a member's claimed action); Projects left swipe only where the row shows × (DS12).
- **Team member** — parent "Team member": same rule; read-only rows get no swipe.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — n/a — public pages get none of this (S4 applies to authenticated pages only).

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
- [x] W-1 `scripts/core/swipe.js` — gesture per parent §Design "Swipe" (direction lock, threshold, snap-back); `Item.vue`
  emits `swipe-right` / `swipe-left` only when the page passes the action; mobile-only.
  — `src/main-app/scripts/core/swipe.js:14` (`useSwipe`: axis lock at 10 px, `holdLimit` 400 ms, mobile via `isMobileViewport`, swallows the click after a swipe); `components/Item.vue:206` (gesture, arm at `SWIPE_ARM_RATIO = 0.4` :141, 150 ms snap, emit after snap :230), props `swipeRight` / `swipeLeft` default null; `components/ItemList.vue:175` `swipeFor` (+ `swipeFilter`, null while dragging).
- [x] W-2 Long-press reorder — ItemList touch delay + haptic at drag start, AND the two Project detail action lists (own
  150 ms delay today); first-visit drag hint copy per §Screens S1 (DS10).
  — `components/ItemList.vue:24` `:delay="LONG_PRESS_MS"` (400), haptic :191, hint `Hold to reorder` on `(pointer: coarse)` :89; `views/dashboard/ProjectDetailPage.vue:240` + `:331` delay 400, `onActionDragStart` :1762 (haptic + blocks swipe while dragging).
- [x] W-3 `components/PullToRefresh.vue` + native-reload guard (`overscroll-behavior-y: contain`, mobile only).
  — `src/main-app/components/PullToRefresh.vue:48` (gesture, axis y, only from scrollTop 0, blocked while editing / first load / refreshing / past the 400 ms hold); guard :95 on the scroller + `html:has(.pull-to-refresh)` / `body:has(...)` under 768 px, so pages without it keep the native pull.
- [x] W-4 `components/BottomSheet.vue` + `ClarifyPanel` mode `sheet`; every caller that passes `fullscreen` on mobile
  switches to `sheet` (grep `'fullscreen'` → 0 mobile callers left).
  — `components/BottomSheet.vue` (open 70 % :32, auto-expand `checkOverflow` :63, backdrop :51, handle drag via `useSwipe`); `ClarifyPanel` mode `sheet` `components/clarify/ClarifyPanel.vue:94`; callers `views/dashboard/InboxPage.vue:112`, `views/dashboard/StuffDetailPage.vue:227` + `:604`. The orphaned `fullscreen` mode was removed; `grep -rn "'fullscreen'\|\"fullscreen\"" src/main-app` → 0.
- [x] W-5 Token `--touch-target-min: 44px` in the token file (both themes unaffected — size only).
  — `src/main-app/styles/tokens/layout.css:27`.
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-6 S1 swipe map — every row of the §Screens S1 page table wired to that page's EXISTING handler (Complete /
  Clarify / `onTrash` with its confirm): Next, Today, Waiting, Overdue, Engage sections, Project detail (personal +
  shared rules), Someday + Projects left only, Inbox right = Clarify for that one item and the sheet closes after it
  (DS1), none on Completed / Trash / Reference / Search / Recurring templates (DS5). Reveal label/icon/colour per S1.
  — Inbox `views/dashboard/InboxPage.vue:63` (null in clarify mode; `onSwipeClarify` :386, single item closes :411); Next `NextPage.vue:42`, Today `TodayPage.vue:42`, Waiting `WaitingForPage.vue:51`, Overdue `OverduePage.vue:17`, Engage 4 sections `EngagePage.vue:40`; Someday left only `SomedayPage.vue:43`; Projects left + `:swipe-filter="canTrash"` `ProjectsPage.vue:51`; Project detail personal `ProjectDetailPage.vue:258`, shared by `canCompleteAction` / `canDeleteAction`. Completed / Trash / Reference / Search / Recurring pass no swipe props. Reveal icon/label/colours `components/Item.vue` `SWIPE_ACTIONS` + `.item__swipe-reveal--*`.
- [x] W-7 S1 states — armed/unarmed reveal, snap-back, Trash confirm copy per page, success toasts, as §Screens S1.
  — armed class + `data-armed` `components/Item.vue:13`; snap-back 150 ms then the page's existing handler (Complete = `onItemCheck(id, true)` / `onCheck` / `onCompleteAction`, Trash = `onTrash` / `onTrashAction` with its unchanged confirm copy and toast); blocked while editing / loading / checked / snapping (`Item.vue:206` `canStart`) and while dragging (`ItemList.vue:175`, `ProjectDetailPage.vue` `draggingAction`); a direction the row does not offer leaves it still (`onMove` returns false).
- [x] W-8 S2 pull-to-refresh on exactly the S2 page set (DS6) — pulling / armed / refreshing / done / error states and
  copy; Engage error toast (DS7).
  — `components/PullToRefresh.vue:48` (copy :11, Spinner 20 px, sidebar `loadStats` with the page refresh, overscroll guard :95); pages Inbox :51, Next :32, Today :32, Waiting :41, Someday :32, Projects :41, Overdue :8, Completed :47 (list + chart stats), Trash :13, Engage :14 (toast in `onRefresh` :266). Not on Reference / Calendar / Search / Review / detail / Settings.
- [x] W-9 S3 Clarify sheet — open height, auto-expand (DS9), drag-down / backdrop = Cancel, ignored while saving and on
  "Do it now" (DS8), keyboard behaviour, per §Screens S3.
  — `components/BottomSheet.vue` (visualViewport height/offset tracking → keyboard shrinks the sheet, overflow → full height, one-way); DS8 guard `scripts/models/clarifyModel.js:259` `canDismiss()` shared with Escape `ClarifyPanel.vue:161`, passed as `:dismissible`; backdrop / drag = `cancelClarify` (`clarify.cancel()` + close) in Inbox and Stuff detail.
- [x] W-10 S4 touch targets — every element listed in §Screens S4 gets ≥ `--touch-target-min` hit area under 768 px;
  data-encoding elements excluded (DS11).
  — Item row/checkbox/× `components/Item.vue` (media block + token literals); Btn `components/Btn.vue` (`.dashboard` / `.bottom-sheet` scoped hit area); Assign/Unassign `ProjectDetailPage.vue` token; ClarifyPanel `<`/`×`; SidebarMenuItem; Inpt (`.dashboard` / `.bottom-sheet` only, public forms untouched); Select trigger/options/sheet ×; Dropdown items + sheet ×; ItemMoveDropdown; TagFilter / ContextFilter trigger, options, chip ×; TagInput field, chip ×, presets; SegmentSwitch; CalendarHeader; TopNav search/bell/menu (dashboard only); FeedbackBtn (`body:has(.dashboard)` only); Reference row/card menu buttons. Compiled CSS checked in `dist/`. Notes: `UserAvatar` in TopNav renders only when `context !== 'dashboard'` (public pages), so it has no authenticated-page target — untouched; the mobile Quick Add FAB is `DashboardLayout.vue` `.mobile-fab` (64 px, already above the token) — untouched. Calendar events / heat-map / chart bars untouched (DS11).
- [x] W-11 Verify (report, do not fix): Projects `canTrash` reads `owner_id` / `my_role` (`views/dashboard/ProjectsPage.vue:101`)
  — confirm on the local stack whether `GET /v1/projects` returns them for a shared project (owner + member) and whether
  × shows; the swipe follows the × as rendered (DS12). Record the finding here; any fix is out of scope (raise to the owner).
  — **Finding (from backend source, not a live call — I do not run the stack):** the project JSON serializer `wna_backend/core_service/src/db/entities/db_project_entity.hpp:52-98` emits `shared: true` but no `owner_id` and no `my_role`. So for every shared project `canTrash` (`ProjectsPage.vue:107`) falls to `item.my_role === 'owner'` → false: × is hidden for the owner and the member, and the Projects left swipe is not offered on any shared project. DS12 option A ("confirm the backend returns them") does not hold → **raised to the owner**; `specs/api/api.md` left unchanged.
  — **Resolved (backend fix, re-checked in source):** `db_project_entity.hpp:79-83` now emits `owner_id` + `my_role` (`owner` / `write` / `read_only`) on shared projects, read in the same query via `project_member pm_me` (`project_repository_impl.cpp:268/315/343`); `api.md:1559` / `:1618` document them. Web needs no change — `canTrash` already prefers `owner_id`, so the owner sees × and the left swipe, members don't. TC-857 step 2 now asserts both cases.
### Help
- [x] W-12 `content/help/gettingStarted.js` — the one phone-gestures sentence per parent §Help impact.
  — `src/main-app/content/help/gettingStarted.js:50` (end of "Moving Items Between Lists").
### Verify
- [x] W-13 `npm run build:main` passes (paste the tail).
  — `✓ built in 4.04s` · `[obfuscator] Obfuscated 19 files` · prerender of 8 public routes OK (only the pre-existing > 500 kB chunk warning).
- [~] W-14 Local run on a phone-sized viewport (local dev server): each W-6–W-10 surface observed — say what you saw per
  surface; desktop (> 768 px) shows no swipe, no pull indicator, Clarify still `modal`.
  — DEFERRED TO wna-ui-tests: automate TC-855–860 (mobile-chrome + mobile-safari; TC-855 step 8 is the desktop negative). I do not run dev servers; runtime observation is the ui-tests slice's job. `data-testid`s for it: `swipe-reveal` (+ `data-armed`), `pull-to-refresh` (+ `data-state` idle/pulling/armed/refreshing), `bottom-sheet` (+ `data-expanded`), `bottom-sheet-handle`, `bottom-sheet-backdrop`.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-15 Update `../wna_orchestration/specs/features/wna-features.md` — list-item swipe, long-press reorder,
  pull-to-refresh, Clarify `sheet` mode, mobile touch targets, Help sentence (parent §Contracts touched).
  — `wna_orchestration/specs/features/wna-features.md:417-418` (Clarify modes + Sheet), `:2044` (long-press 400 ms), `:2068` (hint copy), `:2206` (Help), `:2333-2334` (touch targets, native pull guard), `:2336` §25.9 Mobile Gestures (swipe map + pull-to-refresh).
- [x] W-16 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-855–860 (IDs reserved by the parent;
  scope per the ui-tests slice), mobile viewports.
  — `wna_orchestration/specs/tests/wna-test-cases.md:19658` Section 64, TC-855 (High, Smoke) … TC-860. Stale TCs updated to the new behaviour: TC-068 :2357, TC-070, the Stuff detail clarify TC and the ClarifyPanel modes TC (fullscreen → sheet), TC-262b :8340 and the touch reorder TC :10355 (150 ms → ~400 ms), TC-343 :10654 (hint copy). `regression-ui-tests/update-tests.sh` run → `test-cases.json` / `test-data.js` regenerated (TC-855–860 parsed with priority/area, TC-855 smoke).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (each W-6–W-10 surface on a phone-sized viewport of the local dev server, W-14) and confirm it.
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
   affected targets (here: `npm run build:main` and the local viewport check). The full regression suite is run by the
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
