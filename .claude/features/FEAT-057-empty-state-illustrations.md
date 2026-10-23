# FEAT-057 — web slice: Empty-state illustrations per section (16 inline-SVG illustrations, new copy)

**Parent (canonical):** `../wna_orchestration/features/FEAT-057-empty-state-illustrations.md` — §User flows, **§Screens**
(layout table, "Every usage" table rows 1–31 with exact new copy, sketch briefs), §Design (D1–D8, DS1–DS3), §Work
breakdown → web. Read it first. This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — new `components/illustrations/*Illustration.vue` (16, approved by the parent D7),
`components/EmptyState.vue` (`icon` → `illustration` + `size`), `components/FilterEmptyState.vue`, every caller listed in
parent §Screens "Every usage". Colors only from existing theme tokens (no new CSS variable). admin-app untouched.

**Legal:** none — parent §Legal impact is n/a. **Help:** none — parent §Help impact is n/a.

## User flows (this project's part)
- **Free user** — parent "Free user": every empty section renders its illustration (parent §Screens row's Illustration
  column) above the new title + text, button unchanged, correct in light and dark theme.
- **Pro user** — parent "Pro user": same as Free (no tier difference).
- **Team owner** — parent "Team owner": same as Free; Connections "Team tier, no connections" state (row 23).
- **Team member** — parent "Team member": same as Team owner.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — unauthenticated: n/a — empty states are dashboard-only; not-entitled: Connections
  non-Team state (row 22) with its illustration + new copy, upgrade button unchanged.

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
- [NA] W-1 16 illustration components in `components/illustrations/` (Inbox, Today, Next, Waiting, Projects, Someday,
  Reference, Completed, Trash, Overdue, Engage, Connections, Search, Recurring, Attachments, Filter) — each per its parent
  sketch brief, tokens only from the brief, root `data-testid="empty-illustration-<name>"` (kebab-case name).
  OWNER REVERTED 2026-10-23: illustrations rejected; the 16 components were removed and the previous icons restored.
- [NA] W-2 `EmptyState.vue`: prop `icon` → `illustration` (required, DS3) + `size` `md` | `sm` (md ~160 px / mobile ~120 px,
  sm ~80 px kept for onboarding, DS1) as local CSS constants; title/text/button classes unchanged. `FilterEmptyState.vue`
  passes `Filter` + the parent row 25 default title/text.
  OWNER REVERTED 2026-10-23: `EmptyState.vue` keeps its `icon` prop. Owner-approved replacement: the icon sits on a raised
  coin inside a halo + two orbit rings, 160 px / 120 px mobile, tokens only (`components/EmptyState.vue:2-15`, styles +
  `@media`). No `size` prop (no caller needs `sm`). `FilterEmptyState.vue` keeps the row 25 copy only
  (`components/FilterEmptyState.vue:5,13`).
- [NA] W-3 Grep confirms `0` remaining `:icon=` on `<EmptyState` / `FilterEmptyState` and no orphaned icon imports left by
  this change (icons still used elsewhere stay).
  OWNER REVERTED 2026-10-23: every caller keeps its previous `:icon=`; `assets/FilterLargeIcon.vue` was restored.
### Screens (one box per parent §Screens surface — illustration + exact new copy + button unchanged)
> Owner 2026-10-23: copy kept, illustrations reverted to the previous icons — each box below is ticked for the copy only.
- [x] W-4 Inbox (row 1) — empty state after the Inbox Zero celebration; celebration itself unchanged. → `views/dashboard/InboxPage.vue:88`
- [x] W-5 Today, Next, Waiting For (rows 2–4). → `TodayPage.vue:60`, `NextPage.vue:60`, `WaitingForPage.vue:69`
- [x] W-6 Projects, Someday (rows 5–6). → `ProjectsPage.vue:69`, `SomedayPage.vue:68`
- [x] W-7 Completed, Trash, Overdue (rows 7–9). → `CompletedPage.vue:55`, `TrashPage.vue:31`, `OverduePage.vue:30`
- [x] W-8 Engage truly empty (row 10). → `EngagePage.vue:170`
- [x] W-9 Reference — files empty, files search no match, Attachments local + Drive, Trash tab (rows 11–15).
  → `ReferencePage.vue:52-56` (rows 11/12, Search illustration on a search), `:144-146` (13/14), `:197` (15)
- [x] W-10 Detail "no longer here" — Stuff, Action, Project, Recurring (rows 16–19, Trash illustration, DS2).
  → `StuffDetailPage.vue:33`, `ActionDetailPage.vue:33`, `ProjectDetailPage.vue:33`, `RecurringDetailPage.vue:21`
- [x] W-11 Search page — idle, 429 error, other error, no results All + other chip (rows 20, 21a–21d).
  → `SearchPage.vue:27`, `:32-34`, `:46-48`, title `:102`
- [x] W-12 Connections — not entitled + Team no connections (rows 22–23). → `ConnectionsPage.vue:48-50`, `:59-61`
- [x] W-13 Calendar Recurring view empty (row 24). → `components/calendar/CalendarRecurringView.vue:48-50`
- [x] W-14 Context-filter empty states — shared text (row 25) + per-caller titles Next, Today, Waiting For, Engage, Projects,
  Someday (rows 26–31).
  → `FilterEmptyState.vue:5,14`; `NextPage.vue:57`, `TodayPage.vue:57`, `WaitingForPage.vue:66`, `EngagePage.vue:163`,
  `ProjectsPage.vue:66`, `SomedayPage.vue:65`
### Verify
- [x] W-15 `npm run build:main` passes. → `✓ built`, obfuscator + prerender OK (only the pre-existing >500 kB chunk warning).
- [~] W-16 Runtime check on the local stack (owner verifies at runtime): every row 1–31 reached once in light AND dark
  theme and on mobile width; list what was seen.
  DEFERRED TO USER: I don't run apps. Runtime pass = TC-844 in light and dark theme, desktop + ≤ 768 px (coin + orbit
  composition and copy). Preview reviewed: https://claude.ai/artifact/N92o1x25s2r5Bgnz6RRPts
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-17 Update `../wna_orchestration/specs/features/wna-features.md` — every "Empty state:" line for the surfaces in
  rows 1–31 (new copy + illustration).
  → `../wna_orchestration/specs/features/wna-features.md:330,344,444-445,451,492,553,616,622,701,734,839-841,845-847,866,920,948,996-997,1068,2233,2452-2455,2734,2795-2798`
  (illustration mentions removed after the owner revert; §25.5 `:2233` describes the coin/orbit composition; lines added where a surface had none: Stuff/Action/Project/Recurring not-found, Recurring view, Projects, Waiting
  For, Someday, Reference Trash tab, Connections)
- [~] W-18 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-844 (every empty section shows its
  illustration + new copy, light theme) and TC-845 (same, dark theme), expected results from parent §Screens.
  → `../wna_orchestration/specs/tests/wna-test-cases.md:19186`: TC-844 checks the copy plus the icon coin/orbit composition,
  run in light and dark (Section 60). TC-845 (dark
  theme illustrations) was removed because the illustrations were reverted. `regression-ui-tests/update-tests.sh` re-run.
- [x] W-19 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — rewrite the old empty-state copy in TC-066, TC-100,
  TC-101, TC-108, TC-212, TC-220, TC-234, TC-235, TC-356, TC-368, TC-386, TC-387, TC-417, TC-792, TC-798, TC-800, TC-805
  (grep the old titles again before closing; TC-797's "Search everything..." is the TopNav placeholder — not an empty state,
  leave it).
  → rewritten at `../wna_orchestration/specs/tests/wna-test-cases.md:2304,3275,3298,3504,6664,7055,7441,7466,11369,11881,11906,12332,17931,
  18873,18913,19005`. TC-356 left as is: its "No results found for "…"" is the Help page search
  (`views/public/HelpPage.vue:111`), not an EmptyState and not in rows 1–31. Old-title grep over code, TCs and features = 0.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (each rendered empty state in parent §Screens rows 1–31, in light and dark theme) and confirm it.
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
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
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
