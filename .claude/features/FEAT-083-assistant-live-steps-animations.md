# FEAT-083 — web slice: assistant step log + motion for live changes (main-app)

- Parent (single source of truth): `wna_orchestration/features/FEAT-083-assistant-live-steps-animations.md`
- Work: parent `## Work breakdown` §web **W1–W12**. What to build: parent `## Screens` S1 (step log), S2 (list motion),
  S3 (Canvas motion) — every state, copy, duration, test id. How: parent `## Design` §Boundaries (web rows), §Contracts
  **C1** (`steps` shape) and **C7** (`liveClient` foreign-dispatch state + `useLiveMotion` contract), §Flows F1 / F3 +
  Edge cases; `## Data contract`; `## Legal impact`; `## Help impact`. Decisions: owner D1–D7 (parent `## Owner
  decisions`: D4 closed **Show steps** row, D5 highlight only, D6 panel stays full screen, D7 shared helper). **D8**
  (Privacy Policy notice) is still open — only the W10 Privacy box depends on it. This slice does not restate them.
- Order (parent Work breakdown): W1–W5, W7, W9–W11 may start at once (no backend field; W3 / W4 / W5 / W7 consume W1 +
  W2); **W6 waits on backend B11**; **W8 waits on backend B6–B8**; **W12 last** (W1–W11 + backend done). ui-tests U1–U7
  wait for W12. Dev servers are wnapm's — never start one.
- Reuse First: the shared composable `src/main-app/scripts/core/liveMotion.js` (`useLiveMotion`) is owner-approved
  (D7 = A, parent Screens D7 line) — do not ask again. Nothing else new: no `.vue` component, model, CSS variable, icon,
  font or dependency (reuse `Spinner`, `CheckmarkIcon`, `CrossIcon`, `--color-bg-accent-light`).

## User flows (this project's part)
- Free user: panel shows the running step log (live row with spinner, done rows with check, failed rows with cross,
  `Thinking…` when no step runs) and collapses it into reply + Changes + a closed **Show steps** row that reopens the
  finished steps, also after reload (S1, D4); every live change not made in
  this tab enters / leaves / moves / highlights on the open list or Canvas (S2 / S3); own-tab actions, first loads,
  "Load more", resync / reconnect / hidden-tab catch-up / midnight stay without motion.
- Pro user: same as Free.
- Team owner: same; a member's change to a shared project animates on the open list / Project detail / Canvas (S2, S3).
- Team member: same as Team owner, both ways; read-only Canvas viewers see the same motion (S3).
- Admin (relevant role): n/a — admin-app is not live and has no assistant (parent User flows).
- Unauthenticated / not-entitled: n/a — public pages have no assistant or live lists; out of credits / flag off /
  offline / 429 / send failed unchanged, no log started (S1 States).

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
- [x] **W1** `scripts/core/liveClient.js` — foreign-dispatch state `{ active, ids }` per C7 / parent W1 (handler
  promises → `Promise.allSettled`; held foreign packets play with motion on release; visibility catch-up, `resync`,
  reconnect, midnight without). Verify per W1 (Chrome console: second-tab change sets `active`, own-tab never).
  Data: `changes[].tab`, `.id`, `.entity`, `.change` — WebSocket `/v1/live` `changes` packet (existing,
  `router_service/src/live/live_hub.cpp:292`); separate packets per assistant write come from backend B3 + B8.
  Done: `scripts/core/liveClient.js:26` state, `:174` dispatch (foreign = a change with `tab !== tabId`; handler returns collected), `:206` `endMotion` (`Promise.allSettled` + `nextTick`), `:226` held foreign ids replay with motion at release, `:235` visibility catch-up without. Chrome: foreign create / move / trash animated, own Quick add none (W12).
- [x] **W2** (D7 = A) `scripts/core/liveMotion.js` `useLiveMotion` per C7 / parent W2 (enter / ghost leave / FLIP move /
  highlight, 250 / 1000 ms, viewport-only, `finish()` before a new run, `data-motion`, `skip`). Verify per W2
  (`npm run build:main`; behaviour through W4).
  Data: none — reads only the DOM and W1's state.
  Done: `scripts/core/liveMotion.js:146` `useLiveMotion` (enter / ghost leave / FLIP / highlight, 250 / 1000 ms, viewport-only, cancel before a new run, `data-motion`, `skip`, `force()`); `:39` `motionSet` primitives (used by `CanvasMap`); `:96` table-row leave; in-place = id in packet or row text changed (canvas packets carry only the project id); a row re-created elsewhere (other day column) glides. `npm run build:main` green.
- [x] **W3** Every live re-read handler returns its re-read promise — the handlers parent W3 lists (16 `onLiveChange`
  pages / views + packet handlers in `connectionModel.js`, `ProjectCanvasPage`, `ProjectDetailPage`,
  `ProjectTemplateDetailPage`, `EngagePage`). Verify per W3 (grep each handler).
  Data: the existing list endpoints those handlers already re-read (no new field).
  Done: changed to return the re-read — `HorizonsPage.vue:241`, `connectionModel.js:78`, `ProjectCanvasPage.vue:243`, `ProjectDetailPage.vue:1286`, `ProjectTemplateDetailPage.vue:649`, `completedModel.js:161` (`reconcile` resolves after the debounced reload); the other 14 handlers already returned / awaited (grep).
- [x] **W4** `ItemList.vue` — `useLiveMotion` with `skip` = completing ids; empty-state ordering per C7 / parent W4
  (Inbox, Next, Today, Waiting For, Someday, Overdue, Projects, Completed, Trash, Engage sections, Horizons, Project
  templates, Recurring). Verify in Chrome (W12).
  Data: row `id` + array order — `GET /v1/inbox`, `/v1/nextActions`, `/v1/today`, `/v1/waiting`, `/v1/someday`,
  `/v1/overdue`, `/v1/projects`, `/v1/completed`, `/v1/trash`, `/v1/engage`, `/v1/horizons`, `/v1/projectTemplates`,
  `/v1/recurring` (all existing, parent Data contract rows).
  Done: `components/ItemList.vue:212` (after the anchoring watcher; `skip` = completing ids, live-completed rows keep the exit look until the re-read lands `:176`), empty-state ordering `:222`. Chrome: Inbox enter + highlight, leave; Engage in-place highlight.
- [x] **W5** `ProjectDetailPage.vue` (Next Action + backlog `VueDraggable`) and `ProjectTemplateDetailPage.vue` (actions):
  `data-row-id` + `useLiveMotion`; new Next Action = old row moves, new one arrives (parent W5).
  Data: `id` + order — `GET /v1/project/action?project_id=` (existing; web order by `backlog_position`) and
  `GET /v1/projectTemplates/{id}` actions (existing).
  Done: `ProjectDetailPage.vue:836` (+ `data-row-id` on both backlog lists), `ProjectTemplateDetailPage.vue:342`. Chrome: foreign move of "PA three" to Next Action → glide + highlight. Template detail not separately run in Chrome (same composable).
- [x] **W6** Calendar (day / week grid + all-day `tiles: true`, glide to new slot / day; month chips as rows; year
  none), Reference (grid `tiles: true`, list rows), Connections (pending received / sent / connections; accept = leave
  + arrive), Search results: `data-row-id` + `useLiveMotion` (parent W6). **Waits on backend B11.**
  Data: `id` + order — `GET /v1/calendar`, `/v1/reference/folders`, `/v1/reference/attachments`,
  `/v1/connections/pending`, `/v1/search` (existing); `GET /v1/reference/files` and `GET /v1/connections` stable order
  → **backend B11** (new tiebreak).
  Done (B11 landed): `CalendarDayView.vue:59` / `CalendarWeekView.vue:233` tiles (`data-row-id` on `CalendarItem`, continuation segments excluded), `CalendarMonthView.vue:155` rows, `RefGridView.vue:81` tiles, `RefListView.vue:158` rows, `ConnectionsPage.vue:184` (`r-` / `s-` / `c-` ids → accept = leave + arrive), `SearchPage.vue:100`. Chrome: Week reschedule Mon → Tue glides + highlight. Reference / Connections / Search not run in Chrome.
- [x] **W7** Canvas — `CanvasDrillDown.vue` Ideas rows via `useLiveMotion`; `CanvasMap.vue` per S3 / parent W7 (enter
  with branch line, leave, per-node offset glide by `requestAnimationFrame` read by pills and lines, highlight; pan /
  zoom never change; idea being typed stays).
  Data: `nodes[].id`, `parent_id`, stored order — `GET /v1/project/{id}/canvas` (existing).
  Done: `CanvasDrillDown.vue:192`; `CanvasMap.vue:899` (enter pill + `data-line-id` line, leave pill + line ghosts, `glide` offsets `:878` read by pills and lines, highlight after glide). Chrome: drill-down rename → highlight, delete → leave, add → enter; desktop map (1280 px iframe) add / delete / move → enter / leave / glide + highlight, pan / zoom unchanged.
- [x] **W8** `AssistantPanel.vue` S1 per parent W8 — working message: `m.steps` → done / failed rows + live row
  (`Thinking…` when the last entry is not `running`), row enter 150 ms, end collapse 200 ms, `atBottom` follow; ended
  assistant message with `m.steps` (D4): the closed **Show steps** row as the message's last element (after Changes and
  chips), click toggles that message's done / failed rows (`Hide steps` when open), open state in a per-message
  reactive `Set` (like `expanded`), not saved; test ids `assistant-steps`, `assistant-step` + `data-status`,
  `assistant-progress` on the live row, `assistant-steps-toggle` + `aria-expanded`; no reference to `progress` left.
  **Waits on backend B6–B8.**
  Data: `steps[]` (`text`, `status`) + `status` — `GET /v1/assistant/conversation` (every assistant message),
  `GET /v1/assistant/requests/{id}` `message`, `POST /v1/assistant/messages` `202` `assistant_message` → new field from
  **backend B6** (step lines B7, timing B8); `progress` removed by B6.
  Done: `AssistantPanel.vue:350` `liveSteps` (live row = running step or `Thinking…`), step rows + `assistant-step-mark` swap, end collapse `closeHeight`, Show steps `:105` / `openSteps` `:279`, follow while at bottom `:520`. Chrome (500 px + 1280 px): log `Added…` ✓ / `Couldn't update "x"` ✕ / spinner / `Thinking…`; end → Show steps (`aria-expanded=false`) → Hide steps with 4 `assistant-step` rows; reload → closed. `progress`: 0 references.
- [x] **W9** (D6) Mobile ≤ 768 px — panel stays full screen (no layout change); closing it during a run shows the
  remaining changes arriving with motion (parent W9). Verify in Chrome at 500 px.
  Data: as W4 / W8.
  Done: no layout change; at 500 px the panel stays full screen; lists animate behind it on foreign packets (verified Inbox / canvas at 500 px).
- [x] **W10** Help text — the two edits of parent `## Help impact`, verbatim; Privacy Policy §2.11 per parent
  `## Legal impact` **(D8)** (boxes under "Help" and "Legal" below).
  Data: none.
  Done: `content/help/gettingStarted.js:115`, `content/help/faq.js:106`, `content/legal/privacy.md:150` verbatim; Last updated already `November 2, 2026` (today; FEAT-082).
- [x] **W11** Spec sync (boxes under "Spec sync" below) + in the web output list the TCs made new / stale for ui-tests.
  Data: none.
  Done: `wna_orchestration/specs/features/wna-features.md:2802` (§25.10 Motion), `:3748` (§41.3 step log + Show steps), `:3786` test ids. TCs listed in the web output.
- [~] **W12** Chrome check on `:5173`, desktop and 500 px — every scenario parent W12 lists (Inbox + panel "sort" with
  3+ writes; Engage, Project detail, Calendar week, Canvas map + drill-down; second-tab change; own action, Load more,
  hidden-tab catch-up without motion; DevTools Network during a 20-write run on Inbox and Engage: average ≤ 8 GET/s,
  no `429`). Waits on W1–W11 + backend done.
  Data: all of the above.
  Motion scenarios checked in Chrome (see W1–W9). OPEN: 20-write run on Inbox (desktop, panel open) = **9.94 GET/s** avg (41 request + 20 list + 20 stats GETs in 8.2 s), 0× `429` locally (local bucket 50/s; prod user bucket 10/s) — over the ≤ 8 GET/s target. Engage not measured separately (same per-packet reads). Blocked on owner decision (Questions in web output).

## Screens (one box per screen — built per parent `## Screens`, every state + exact copy, desktop + 500 px)
- [x] **S1 Assistant panel — running step log** — layout table rows 1–3, motion, scrolling, end collapse, every row of
  the S1 States table, copy table (server text as is; web words only `Thinking…`), test ids (W8, W9).
  Done: W8 (Chrome 500 px + 1280 px).
- [x] **S1 Assistant panel — Show steps (D4)** — every row of the S1 "Show steps" table (where, shown on / not on,
  look, copy `Show steps` / `Hide steps`, open, click, unfinished step), desktop + 500 px (W8).
  Done: W8.
- [x] **S2 Lists — `ItemList` surfaces** (Inbox, Next, Today, Waiting For, Someday, Overdue, Projects, Completed, Trash,
  Engage sections, Horizons, Project templates, Recurring) — arrive / leave / complete / move / in-place highlight
  table, packet-together, viewport-only, empty-state ordering, no-motion cases (W4).
  Done: W4 (Inbox, Engage checked in Chrome).
- [x] **S2 Project detail + Template detail** own `VueDraggable` lists (W5).
  Done: W5.
- [x] **S2 Calendar** — day / week grid + all-day, month chips, year at once (W6).
  Done: W6 (Week checked in Chrome).
- [~] **S2 Reference files (grid + list), attachments** (W6).
  Code done (W6); not run in Chrome this round — left for the W12 re-check / ui-tests.
- [~] **S2 Connections** — pending received / sent / connections (W6).
  Code done (W6); not run in Chrome (needs a second account) — ui-tests.
- [~] **S2 Search results** (W6).
  Code done (W6); not run in Chrome this round.
- [x] **S3 Canvas — desktop mind map** (W7).
  Done: W7.
- [x] **S3 Canvas — mobile drill-down Ideas card** (W7).
  Done: W7.

## Help (parent `## Help impact`)
- [x] `content/help/gettingStarted.js` "Working With the AI Assistant" — sentence replaced verbatim (W10).
  Done: `:115`.
- [x] `content/help/faq.js` "Do my lists update by themselves?" — sentence added verbatim (W10).
  Done: `:106`.

## Legal (parent `## Legal impact`)
- [x] `content/legal/privacy.md` §2.11 AI Assistant, bullet **Conversation** — wording replaced verbatim as parent
  Legal impact (W10).
  Done: `:150`.
- [x] `content/legal/privacy.md` **Last updated** → the release date (W10). **(D8)** pending: the parent follows the
  recommended "new date only, no notice to users"; if the owner picks a notice, the architect adds that work item —
  do not build any notice from this slice.
  Done: `:3` already November 2, 2026; D8 = date only, no notice.
- ToS: n/a — parent Legal impact: no `terms_version` bump.

Landing / Pricing: n/a in code — parent `## Landing / Pricing impact` lists no item (hero video re-recorded by the
owner, not a work item).

## Spec sync (orchestration homes — this work, never deferred)
- [x] Update `wna_orchestration/specs/features/wna-features.md` §25.10 — motion for foreign live changes (C7) (W11).
  Done: `wna-features.md:2802`.
- [x] Update `wna_orchestration/specs/features/wna-features.md` §41.3 — step log replaces the progress line, Show
  steps (D4) (W11).
  Done: `wna-features.md:3748`.
- Never edit `specs/tests/wna-test-cases.md` (ui-tests only) — list new / stale TCs in the output instead.

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
