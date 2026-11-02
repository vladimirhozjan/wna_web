# BUG-077 — web slice: Always-visible grey scrollbars on the sidebar and list pages (main-app)

- Parent (single source of truth): `wna_orchestration/features/BUG-077-always-visible-scrollbars.md`
- Work: parent `## Work breakdown` §web **W1 → W2 / W3 / W4 → W5**. What to build: parent `## Screens` (both
  "Containers in scope" tables, States, User-flow mapping). How: parent `## Design` §Boundaries, §Contracts (the frozen
  `useAutoHideScrollbar(elRef)` contract, the `.auto-scrollbar` CSS block, the per-container pattern and its rules),
  §Flows. Decisions D1, D2 = A, D3 = A (parent `## Decisions`). This slice does not restate them.
- Order (parent Work breakdown): W1 first; W2 / W3 / W4 in any order, all need W1; then W5. ui-tests U1 / U2 wait for
  W2–W4 on the local `:5173`. No backend / deploy work. Dev servers are wnapm's — never start one.
- Reuse First: the new composable `scripts/core/useAutoHideScrollbar.js` and the global class `.auto-scrollbar` are
  owner-approved (D3 = A) — do not ask again. Nothing else new: no `.vue` component, model, CSS variable or utility.

## User flows (this project's part)
- Free user: on the Sidebar, every list page (W2) and every other dashboard scroller (W3) — no scrollbar at rest, a
  4px thumb while scrolling that disappears 1 s after; scrolling input (wheel, trackpad, keyboard, pull-to-refresh,
  infinite scroll, drag-to-reorder auto-scroll) unchanged; the 8 existing auto-hiding containers behave as before on
  the shared piece (W4).
- Pro user: same as Free — identical per parent Screens §States "Roles".
- Team owner: same as Free.
- Team member: same as Free.
- Admin (relevant role): n/a — admin-app out of scope (parent User flows, Boundaries).
- Unauthenticated / not-entitled: n/a — public pages scroll the whole document; not touched (parent User flows).

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

## Checklist (parent Work breakdown, in order)
- [x] **W1** — `scripts/core/useAutoHideScrollbar.js:1-28` (contract: `$el ?? value`, passive `scroll`, 1000 ms, watch immediate, `onBeforeUnmount` cleanup); `styles/globals.css:106-130` (values equal the removed `ActionDetailPage` block); `npm run build:main` green. — `src/main-app/scripts/core/useAutoHideScrollbar.js` + the `.auto-scrollbar` block in
  `src/main-app/styles/globals.css`, exactly as parent §Contracts. Verify per W1 (`npm run build:main`; CSS values equal
  `ActionDetailPage.vue:1830-1858`).
  Data: none — no server data (parent `## Data contract` n/a).
- [x] **W2** (D1) — all 16 applied (Screens boxes below); Chrome `:5173` desktop (1280) + 500px (same-origin 500px iframe — the window could not be resized), at rest transparent / while scrolling `--color-border-light` / transparent again after 1 s; dark checked on Next + Sidebar (thumb `#2a2a2a`); build green. Pull-to-refresh / infinite scroll / drag-to-reorder were NOT exercised by hand (touch-only / would reorder the owner's data): their code is untouched — `PullToRefresh` root unchanged, `ItemList.vue:181` `scrollParent` reads only `overflow-y` — regression run belongs to ui-tests U2. — the 16 containers of parent Screens "Containers in scope (D1)" / W2 list (Sidebar `.sidebar-nav` +
  15 list pages). Verify per W2 (Chrome on `:5173`, desktop + 500px, light + dark, each container; pull-to-refresh,
  infinite scroll and drag-to-reorder on Next and Inbox; `npm run build:main`).
  Data: none.
- [~] **W3** (D2 = A) — all applied incl. `scrollbar-width: thin` removed (`ProjectTemplateDetailPage.vue:870`); every container Chrome-verified EXCEPT `ProjectDetailPage .share-modal__list` (`ProjectDetailPage.vue:681`): the local test user is Free, Share opens the Team upgrade modal, so the list never renders — code + build only; REMAINS: runtime check by ui-tests U1 with a Team user. `.att-list`: CSS only (`ReferencePage.vue:962`, grep finds no element) — dead CSS left in place. — the containers of parent Screens "Containers in scope (D2 = A)" / W3 list (5 Calendar views,
  Review, Project template detail ×3 incl. removing `scrollbar-width: thin` at `ProjectTemplateDetailPage.vue:870`,
  Project share list, Billing history, Buy credits, Upgrade, Share). `ReferencePage .att-list`: nothing to apply —
  mention the dead CSS (`ReferencePage.vue:958`) in the report, do not delete it. Verify as W2 for each container.
  Data: none.
- [~] **W4** (D3 = A) — 8 copies migrated, listeners/timers/cleanups/scoped CSS removed, orphan imports removed; grep `::-webkit-scrollbar-thumb` → only `styles/globals.css`, `components/Select.vue`, `components/TimeInput.vue`; Chrome OK for Action / Stuff / Project detail, Project `.actions-list-scroll`, Settings nav + pane, drawer at 500px, Assistant panel. NOT Chrome-verified: `RecurringDetailPage .detail-body` (`RecurringDetailPage.vue:29`) — local user is Free, recurring creation returns 403; REMAINS: ui-tests U2 with a Pro user. — move the 8 existing copies onto W1 (the 7 files parent W4 lists); delete each local listener,
  timer, cleanup and scoped scrollbar CSS, keep every other rule. Verify per W4 (the `::-webkit-scrollbar-thumb` grep
  lists only `styles/globals.css`, `components/Select.vue`, `components/TimeInput.vue`; Chrome — each of the 8 behaves
  as before, incl. the mobile drawer at 500px and the Assistant panel).
  Data: none.
- [x] **W5** — `wna_orchestration/specs/features/wna-features.md:263` (Sidebar) + `:2728-2732` (§25.5 — list pages and the D2 screens in one line, linked from Sidebar, instead of restating it in ~10 sections); ui-tests list in the report. — spec sync (box under "Spec sync" below); in the web output list for ui-tests the new TCs needed (U1) and
  the TCs that must stay green (TC-1214).

## Screens (one box per screen — built per parent `## Screens`, every state, desktop + 500px, light + dark)
States for every box: content fits / overflowing at rest / scrolling / touch / light-dark / loading-empty-error
unchanged (parent Screens §States). Copy: none. Icons: none.
- [x] **Sidebar** `components/Sidebar.vue:3` — `.sidebar-nav` — desktop only; 500px unchanged (drawer, W4) (W2).
- [x] **Dashboard** `views/dashboard/EngagePage.vue:13` — `EngagePage .engage-content` (W2).
- [x] **Today** `views/dashboard/TodayPage.vue:31` — `TodayPage .today-content` (W2).
- [x] **Next** `views/dashboard/NextPage.vue:31` — `NextPage .next-content` (W2).
- [x] **Inbox** `views/dashboard/InboxPage.vue:44` — `InboxPage .inbox-content` (W2).
- [x] **Projects** `views/dashboard/ProjectsPage.vue:47` — `ProjectsPage .projects-content` (W2).
- [x] **Project templates** `views/dashboard/ProjectTemplatesPage.vue:11` — `ProjectTemplatesPage .templates-content` (W2).
- [x] **Waiting For** `views/dashboard/WaitingForPage.vue:40` — `WaitingForPage .waiting-content` (W2).
- [x] **Someday / Maybe** `views/dashboard/SomedayPage.vue:31` — `SomedayPage .someday-content` (W2).
- [x] **Reference** `views/dashboard/ReferencePage.vue:42` — `ReferencePage .ref-content` on `RefUploadZone` (W2).
- [x] **Horizons** `views/dashboard/HorizonsPage.vue:12` — `HorizonsPage .horizons-content` (W2).
- [x] **Connections** `views/dashboard/ConnectionsPage.vue:9` — `ConnectionsPage .connections-content` (W2).
- [x] **Overdue** `views/dashboard/OverduePage.vue:7` — `OverduePage .overdue-content` (W2).
- [x] **Search** `views/dashboard/SearchPage.vue:24` — `SearchPage .search-content` — `.search-chips` hidden horizontal scrollbar stays as is (W2).
- [x] **Completed** `views/dashboard/CompletedPage.vue:46` — `CompletedPage .completed-scroll` (W2).
- [x] **Trash** `views/dashboard/TrashPage.vue:12` — `TrashPage .trash-content` (W2).
- [x] **Calendar — Day** `components/calendar/CalendarDayView.vue:3` — `CalendarDayView .day-view__scroll` (W3).
- [x] **Calendar — Week** `components/calendar/CalendarWeekView.vue:3` — `CalendarWeekView .week-view__scroll` (W3).
- [x] **Calendar — Month (list)** `components/calendar/CalendarMonthView.vue:70` (list renders at ≤ 768px only — checked at 500px) — `CalendarMonthView .month-view__list` (W3).
- [x] **Calendar — Year** `components/calendar/CalendarYearView.vue:2` — `CalendarYearView .year-view` (W3).
- [x] **Calendar — Recurring** `components/calendar/CalendarRecurringView.vue:27` — `CalendarRecurringView .recurring-view__content` (W3).
- [x] **Review** `views/dashboard/ReviewPage.vue:31` — `ReviewPage .review-body` (W3).
- [x] **Project template detail** `views/dashboard/ProjectTemplateDetailPage.vue:29,119,263` — `ProjectTemplateDetailPage .detail-body`, `.actions-list-scroll`, `.ap-list` (W3).
- [NA] **Reference — attachments list** — grep: `.att-list` exists only as CSS (`ReferencePage.vue:962`), no element renders it; nothing to apply, CSS left — `ReferencePage .att-list` — parent W3: no rendered element, nothing to apply;
  resolve `[NA]` with that reason after confirming the grep (W3).
- [~] **Project detail — share list** `views/dashboard/ProjectDetailPage.vue:681` — applied, build green; Chrome NOT possible (local user Free → Team upgrade modal); REMAINS: ui-tests U1 with a Team user — `ProjectDetailPage .share-modal__list` (W3).
- [x] **Billing history** `views/dashboard/BillingHistoryPage.vue:8` — `BillingHistoryPage .billing-body` (W3).
- [x] **Buy credits** `views/dashboard/BuyCreditsPage.vue:8` — `BuyCreditsPage .buy-credits-body` (W3).
- [x] **Upgrade** `views/dashboard/UpgradePage.vue:8` — `UpgradePage .upgrade-body` (W3).
- [x] **Share** `views/dashboard/SharePage.vue:2` (checked with a seeded local pending share, then removed) — `SharePage .share-page` (W3).
- [~] **Existing 8 (unchanged look)** — 7 of 8 Chrome-verified (`ActionDetailPage.vue:41`, `StuffDetailPage.vue:41`, `ProjectDetailPage.vue:41,284`, `SettingsPage.vue:32,58`, `SidebarDrawer.vue:4` at 500px, `AssistantPanel.vue:36`); `RecurringDetailPage.vue:29` code + build only (Free user, 403) — REMAINS: ui-tests U2 with a Pro user — — Action / Stuff / Recurring / Project detail `.detail-body`, Project detail
  `.actions-list-scroll`, Settings `.settings-scroll`, `SidebarDrawer .drawer`, `AssistantPanel .assistant-panel__list` (W4).

## Legal / Help / Landing / Pricing
- [NA] Legal (ToS / PP) — parent `## Legal impact`: n/a, presentation only.
- [NA] Help — parent `## Help impact`: n/a, help content never mentions scrollbars.
- [NA] Landing / Pricing — parent `## Landing / Pricing impact`: n/a, public pages out of scope.

## Spec sync
- [x] `wna-features.md:263`, `:2728-2732`. Update `wna_orchestration/specs/features/wna-features.md` — per parent W5 (Sidebar, list-page and D2-screen
  sections; wording as in the Settings §, line 1480). Cite the `file:line` you edited.
- Test cases (`specs/tests/wna-test-cases.md`) are authored by wna-ui-tests only — never edit them here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered email, the API response, the screen) and confirm it.
   Here: the scrollbar on each container in Chrome on `http://localhost:5173`, desktop + 500px, light + dark.
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
   (Exception for this repo: test cases are authored by wna-ui-tests only — list new/stale TCs in your output.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local docker services, local web dev server, local mocks; ui-tests `BASE_URL` = local).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments — dev AND prod compose overrides, config.json, crontabs, scripts —
   applies the change to the LOCAL stack itself (local migrations, local config), and writes the exact dev and prod
   command lines as a section in `wna_deploy/backend/gce/PENDING-develop.md` / `PENDING-production.md`. Operator-only
   steps (GCP/VM provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §<ID>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
