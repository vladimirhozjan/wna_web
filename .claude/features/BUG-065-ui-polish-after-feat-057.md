# BUG-065 — web slice (main-app): UI quality dropped on everything shipped after FEAT-057

- Parent (single source of truth): `wna_orchestration/features/BUG-065-ui-polish-after-feat-057.md`
- Decisions: `wna_orchestration/decisions.md` 2026-10-24 FEAT-059, 2026-10-25 FEAT-066 (step 6 lists and Download
  removed), 2026-10-26 BUG-065 (`idea_count`)
- The spec: parent `## Screens` S0–S15 (every state + exact copy, incl. the User-flow → element map); parent `## Design`
  §Boundaries row "web main-app", §Contracts C3 (`idea_count`), C4 (`shared`), C6 (`data-testid`), §Flows F2–F4;
  parent `## Help impact`; parent `## Work breakdown` §web W1–W18. This slice does not restate them — read them there.
- Order: every item except W4 starts at once, in any order. W4 waits on backend B1 running on the local stack.
  W6's icon waits on the owner's **D1** answer (designer question, open) — W6 is written so each answer is one change.
- Main-app only; admin-app out of scope (owner). Main worktree only.
- Every item: `npm run build:main` passes, and the item's screens are checked in Chrome on `:5173` at 1440 px and 500 px,
  light and dark, in every state the Screens table lists (`CLAUDE.md` UI Quality) — parent §web.

## User flows (this project's part)
- Free user: S2 capture bar identical to Pro (O6) with the locked attach menu (`Upgrade` / `Contact Us`, no emoji) — W6;
  brainstorm at the Free idea cap opens the existing upgrade modal (S8 / S9) — W10, W11.
- Pro user: capture with attachments (W6), Stuff detail attachment rows (W7), Clarify with preview (W8), Undo toast (W5),
  Weekly Review (W9), the Brainstorm count on Project detail (W4), brainstorm on desktop (W10) and mobile (W11),
  `Turn into actions` (W12), WelcomeModal on first login (W13).
- Team owner: as Pro, plus the shared-project action row per S6.2 / X2 (W3), also when reached by the arrows (C4).
- Team member: Action detail on a shared project per the S11 table, `View only` Alert for `read_only` (W2); read-only
  brainstorm from the S6.1 row (W4) and the S8 / S9 view-only states (W10, W11).
- Admin (relevant role): n/a — admin-app out of scope (owner).
- Unauthenticated / not-entitled: `/share` signed out resumes after login, unchanged flow, new layout (W15); offline
  states per S13 (W14).

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
- [~] **W1 — S0 X1** built per parent § Screens S0: `components/Btn.vue` `font-family: inherit`. Verify as parent W1.
  → Code done `src/main-app/components/Btn.vue:58`; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W2 — S0 X2 / X2b / X4 + S11 Action detail rows** built per parent § Screens S0 + S11 (every state × role, exact
  copy): `views/dashboard/ActionDetailPage.vue`, `Dropdown` + `MoreIcon`, testid `detail-more-menu`. Verify as parent W2.
  Data: `state`, `assigned_to`, `project_shared`, `my_role` from `GET /v1/action/{id}` — exist today (parent Data contract).
  → Code done: row keys/order/⋯ split `views/dashboard/ActionDetailPage.vue:637`, ⋯ `detail-more-menu` :176, `View only` Alert :185, X4 44 px mobile rule in the ≤768 block; build green. Personal Someday keeps `Move` (Activate · Move · Trash) — Q1 answered (PM round 2: keep Move, parent §User flows :46, X2 :75). Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W3 — S6.2, S6.3, S6.4, S7** built per parent § Screens S6.2–S6.4 + S7 / X5: `ProjectDetailPage.vue` action row,
  backlog prefix column + `Do next`, one shared outcome-helper constant (`ProjectsPage.vue`, `MoveModal.vue`,
  `clarify/ClarifyStepCreateProject.vue`, Project detail textarea), `ProjectsPage.vue` add form. Verify as parent W3.
  Data: `state` + `shared` (+ `owner_id`) from `GET /v1/project/{id}` (exist) and from `GET /v1/projects/pos/{n}` /
  `GET /v1/someday/pos/{n}` (`shared` new → backend B1, C4; until B1 lands check with direct links); `my_role` from
  `GET /v1/project/{id}` / `GET /v1/project/{id}/members` (exist).
  → Code done: S6.2 row `views/dashboard/ProjectDetailPage.vue:879` (⋯ Share… / Trash), S6.3 prefix column :276 + desktop `Do next` text / mobile NextIcon :287 (both lists), S6.4 constant `scripts/core/textUtils.js:6` used in ProjectsPage / MoveModal / ClarifyStepCreateProject / Project detail, S7 grid form `views/dashboard/ProjectsPage.vue:11-37`; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W4 — S6.1 Brainstorm section** (after backend B1 runs locally) built per parent § Screens S6.1 (every state +
  exact copy): row testid `project-brainstorm-row`, can-edit = owner AND `ACTIVE`, tap → `/project/:id/canvas`; the
  browser never counts nodes. Verify every case of parent W4 on the local stack.
  Data: `idea_count` from `GET /v1/project/{id}`, `GET /v1/projects/pos/{n}`, `GET /v1/someday/pos/{n}`,
  `GET /v1/completed/pos/{n}` PROJECT rows (C3) — new → backend B1.
  → Code done: section `views/dashboard/ProjectDetailPage.vue:197` (testid `project-brainstorm-row`), copy :901 from `project.idea_count` (all 4 sources replace `project.value` as-is), can-edit = owner AND `ACTIVE`; backend B1 is running locally (`wnapm status`: core healthy). Remaining: the local-stack cases (0 owner / 0 member / 3 / +1 / arrows) — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests); ui-tests U2 covers them.
- [~] **W5 — S1 Undo toast + mobile toasts** built per parent § Screens S1: `components/ErrorToaster.vue`
  (+ `scripts/core/errorModel.js` only if needed). Verify as parent W5.
  → Code done: `components/ErrorToaster.vue` (body click keeps undo :9, snackbar, Undo button, desktop/mobile layout), `styles/globals.css` `html[data-fab]` offset, set by `layouts/DashboardLayout.vue`; `errorModel.js` unchanged; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W6 — S2 capture bar + O6 icon (D1)** built per parent § Screens S2 / X5: `components/CaptureBar.vue`,
  `components/QuickAddBtn.vue`, `views/dashboard/InboxPage.vue` (incl. the Free drop overlay copy),
  `components/CaptureChips.vue`. Icon by the owner's D1 answer exactly as parent W6 lists (option 1 / 2 / 3) — until
  D1 is answered the icon part stays `[~]` (blocked on D1). Verify as parent W6 (Free and Pro rows pixel-identical).
  Data: `subscription_tier` from `current_user` (client `authModel`) — exists.
  → Code done (D1 = option 1): `assets/AttachmentIcon.vue:2` redrawn (used in MetadataRow, ClarifyPanel, ReferencePage, Stuff detail header), attach inside the field in all 3 variants `components/CaptureBar.vue:48` with the circled-plus glyph per parent :148 (`PlusIcon` 10 px in a 22 px circle `CaptureBar.vue:52`, hover / menu-open `--color-action` + `--color-action-bg-light` `:557-583`), Add P sm stretched, Quick Add tokens, locked line w/o emoji = one constant `scripts/core/captureRules.js:10` (CaptureBar, InboxPage overlay, SharePage), mic-wait `Cancel` `CaptureBar.vue:91`, chips `components/CaptureChips.vue`, FAB bar surface `layouts/DashboardLayout.vue:350`; build green. Remaining: Free vs Pro pixel-identical check — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W7 — S3 Inbox row + Stuff detail** built per parent § Screens S3: `components/MetadataRow.vue`,
  `views/dashboard/StuffDetailPage.vue`, `components/AttachmentSection.vue`. Verify as parent W7.
  Data: `input_type` from `GET /v1/stuff/{id}`; `id`, `file_name`, `mime_type`, `size_bytes` from
  `GET /v1/item/{id}/attachments` — exist.
  → Code done: `components/MetadataRow.vue:72` (secondary icon), Stuff detail header icon by `input_type` + strip removed, `components/AttachmentSection.vue:62-83` (40 px thumbnail → RefPreviewModal, Play/Stop, Spinner, failed → retry :65), no `<audio controls>`; shared helpers (owner Q2 = A) `scripts/core/captureRules.js:22` `captureIcon()` (ClarifyPanel :121, StuffDetailPage :296, MetadataRow :119) and `:27` `audioPlayer()` (CaptureBar :174, AttachmentSection :160, AttachmentPreviewStrip :57); build green. Remaining: photo / voice / PDF item — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W8 — S4 Clarify** built per parent § Screens S4: `components/clarify/ClarifyPanel.vue`,
  `components/AttachmentPreviewStrip.vue`, `components/BottomSheet.vue`, mobile option cards. Verify as parent W8.
  Data: `input_type` from `GET /v1/stuff/{id}`; attachments from `GET /v1/item/{id}/attachments` — exist.
  → Code done: centred strip `components/AttachmentPreviewStrip.vue:188` (88 / 64 px, horizontal scroll, audio line), `components/BottomSheet.vue:49` (height − touch target, safe-area), ghost close `Btn` in ClarifyPanel, option cards ≥ 64 px w/o key hints on ≤768 in every step; build green. Remaining: panel / modal / sheet — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W9 — S5 Weekly Review + O9** built per parent § Screens S5: `views/dashboard/ReviewPage.vue` (testid
  `review-step-{n}`; count pills, step-6 lists and their data fetch removed), `components/Celebration.vue` (also Inbox
  Zero). Verify as parent W9.
  Data: `review.last_review_date`, `review.in_progress` from `GET /v1/user/settings` — exist.
  → Code done: `views/dashboard/ReviewPage.vue` (header row, card, rows `review-step-{n}` :85, AnimatedCheckbox, chevron, progress hit areas; pills, Go, step-6 lists + fetch removed — `reviewModel.js` window loaders deleted, grep 0), `components/Celebration.vue:3` EmptyState art (Inbox Zero too); build green. Remaining: idle → Start → 6 → Complete → `Last reviewed: today` — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W10 — S8 desktop brainstorm + O3 / O4 / O5** built per parent § Screens S8: `views/dashboard/ProjectCanvasPage.vue`
  (Download + export code removed, testids `canvas-help`, `canvas-turn-into-actions`), `components/canvas/CanvasMap.vue`.
  Verify as parent W10 (owner, member, completed project, Free at the cap).
  Data: `revision`, `nodes[]` from `GET /v1/project/{id}/canvas`; `revision` from the `PUT` response — exist.
  → Code done: header `views/dashboard/ProjectCanvasPage.vue:20` (`canvas-help`, `canvas-turn-into-actions`, two tooltips :190, Download + export code removed — grep 0), `components/canvas/CanvasMap.vue:356` first-open fit, action-colour branches, one pill, no-overlap layout, zoom bottom-left 32×32, empty states; build green. Remaining: owner / member / completed / Free cap — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W11 — S9 mobile drill-down redo + O8** built per parent § Screens S9: `components/canvas/CanvasDrillDown.vue`
  (+ `ProjectCanvasPage.vue` mobile header), testid `canvas-fab`; delete / move undo per **F3** incl. the
  close-on-next-commit rule. Verify every case of parent W11 at 500.
  Data: as W10 — exist.
  → Code done: `components/canvas/CanvasDrillDown.vue` rebuilt (detail header + back label, `{i} of {n}`, one ⋯, detail title, `Ideas` card of `Item` rows, new-idea row, FAB `canvas-fab` :132, error Alert, bottom bar removed); F3 undo toast + close-on-next-commit `views/dashboard/ProjectCanvasPage.vue:242-307`; build green. Remaining: root / deep / siblings / empty / view-only / delete→Undo / move→Undo / edit after delete at 500 — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W12 — S10 Turn into actions modal** built per parent § Screens S10: `components/canvas/CanvasConvertModal.vue`;
  `Nothing to convert yet…` removed (grep → 0).
  Data: as W10 + the existing create-action call — exist.
  → Code done: `components/canvas/CanvasConvertModal.vue:2` title, intro, left toggle, rows, `Add 1 action` / `Add {n} actions`, success toast :86; `Nothing to convert` grep 0; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W13 — S12 WelcomeModal** built per parent § Screens S12: `components/WelcomeModal.vue`.
  → Code done: `components/WelcomeModal.vue:4` (`1 of 4`, no ×, fixed body height, icons, 520 px, mobile pinned flex-1 primary, S12 copy), `components/Modal.vue` full-screen footer safe-area; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W14 — S13 offline** built per parent § Screens S13: `layouts/DashboardLayout.vue`, `views/dashboard/InboxPage.vue`,
  `views/dashboard/SharePage.vue`. Verify with DevTools offline.
  Data: local queue (client) — exists.
  → Code done: banner only Inbox + `/share` `layouts/DashboardLayout.vue:28`, page title + offline EmptyState `App.vue:5`, draft badges `views/dashboard/InboxPage.vue:59`, full-width queued titles, in-place sync (reorder off while pinned), toast `scripts/core/captureQueue.js:97`; build green. Remaining: DevTools offline — Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W15 — S14 `/share`** built per parent § Screens S14: `views/dashboard/SharePage.vue`.
  Data: `subscription_tier` from `current_user` — exists.
  → Code done: `views/dashboard/SharePage.vue` card 520, labels, Inpt-look textarea, buttons + mobile pinned bar, locked line :38 from the shared constant; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests).
- [~] **W16 — S15 mobile polish leftovers** built per parent § Screens S15: `scripts/core/swipe.js` /
  `components/Item.vue` swipe strip; `components/PullToRefresh.vue` chevron + 180° rotation.
  → Code done: swipe strip from the outer left edge `components/Item.vue:437`, chevron + 180° `components/PullToRefresh.vue:12`; build green. Remaining: Chrome check at 1440 / 500 px, light + dark, every Screens state — DEFERRED: Claude in Chrome is not available in this headless run (owner / next run with Chrome, or ui-tests) (touch).
- [x] **W17a Help — `gettingStarted.js` · `Brainstorming a Project`** — the change in parent § Help impact row 1. Verify
  on `/help/getting-started`.
  → `src/main-app/content/help/gettingStarted.js` card 2; prerendered `dist/main-app/_prerender/help/getting-started/index.html` contains "Brainstorm section on the project page", "Turn into actions" ×2; "Download saves" / "Convert to backlog" 0.
- [x] **W17b Help — `gettingStarted.js` · `Quick Add — Capture From Anywhere`** — parent § Help impact row 2. Verify on
  `/help/getting-started`.
  → `gettingStarted.js` Quick Add card; prerendered getting-started page contains "attach button at the right end of the field"; "paperclip next to" 0.
- [x] **W17c Help — `bestPractices.js` · `Do a Weekly Review`** — parent § Help impact row 3. Verify on `/help/best-practices`.
  → `src/main-app/content/help/bestPractices.js` Weekly Review; prerendered `/help/best-practices` contains "The Calendar step opens your Calendar"; "still-open actions" 0.
- [x] **W17d Help — `faq.js` · team sharing answer** — parent § Help impact row 4. Verify on `/help/faq`.
  → `src/main-app/content/help/faq.js` team sharing; prerendered `/help/faq` contains "opens the ⋯ menu on the project page".
- [x] **W18a Update `wna_orchestration/specs/features/wna-features.md`** — the brainstorm, capture bar, Weekly Review,
  undo toast, detail action rows, WelcomeModal, offline and `/share` entries S1–S15 change (parent §Contracts touched).
  No rollout notes.
  → `wna_orchestration/specs/features/wna-features.md` updated: §3.6 Welcome Tour (:302), §4.1 Inbox Zero (:364), §5.7 Clarify (:446-450), Action detail buttons (:487), §9.2 Project detail row + Brainstorm section (:701) + Do next + Share…, §9.3 Brainstorm Canvas (:759), §16 Weekly Review (:1107, step-6 lists removed), §25.1 toasts / Undo toast (:2353), §25.7 touch / safe-area, §25.9 swipe strip + pull chevron, §33 Share… trigger, §34.1 `/share` (:2932), §38 offline (:3118), §39 rich capture (:3136). No rollout notes.
- [x] **W18b Hand-off report** — lists (a) every TC in `specs/tests/wna-test-cases.md` the change makes stale or new (for
  ui-tests; never edit that file), (b) every `data-testid` added / moved / removed beyond C6.
  → In the implement report (TC list for ui-tests + testid changes beyond C6).

Legal: n/a — parent § Legal impact (no `terms.md` / `privacy.md` change).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered email, the API response, the screen) and confirm it.
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
   Exception (owner, 2026-10-25): `specs/tests/wna-test-cases.md` is authored by ui-tests only — list the TCs, never edit it.
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
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §BUG-065`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
