# FEAT-109-assistant-knows-where-you-are — web slice

Parent: `wna_orchestration/features/FEAT-109-assistant-knows-where-you-are.md` (FEAT-109, AI assistant knows where you are in the app). This is the local
slice for **web** — the parent holds the spec, Design (C1–C4), Screens and Data contract; read them there, they are not restated here.
Items below use the parent's Work breakdown IDs.

## User flows (this project's part)
- Free / Pro / Team owner / Team member (same for all): build the place from the route and what the open page already loaded,
  show it in the panel's composer line, send it with every assistant message (composer, answer chips, **Go ahead** / **Cancel**,
  palette row); the line follows navigation, a rename and a filter change; a request already running keeps the place it was sent with.
  Pages with no place (settings, billing, upgrade, buy credits, share, google connect) and failed / 404 item loads send none and show no line.
- Admin: n/a — admin-app has no assistant.
- Unauthenticated / not-entitled: n/a — the assistant is dashboard-only; no-credit / offline / disabled states unchanged (the line stays visible in them).

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
   the documented sibling sync requirement (see that repo's CLAUDE.md) — it is REQUIRED, never
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

Work only in the `main` worktree. No new read or endpoint: the place uses only data the pages already load.

## Checklist
Parent Work breakdown → web. Waits on backend **B1** (the `place` field + `invalid_place`) for W3's live check.
- [x] **W1** (`src/main-app/scripts/models/assistantPlace.js:72` `assistantPlace()`, `:125` `usePlacePart`; allowlist of place pages `:28`/`:58` = every dashboard route except the C4 no-place ones; build clean; Chrome :5173 — labels for Next, Next · @computer, Inbox, Search · "test", Calendar day/week/cross-month/month/year/recurring, Action loading → "Standalone above", project, canvas, settings/404 none) — `scripts/models/assistantPlace.js` — per parent C4 and W1 (`assistantPlace()` `{place, label, icon}`, `usePlacePart(getter)`, no-place routes, `label` / `icon` per Screens `{place}` table). Data: client state only — route name, and the parts W2 hands in. Verify: `npm run build` clean; ui-tests U1–U10.
- [x] **W2** (tags `NextPage.vue:130`, `TodayPage.vue:130`, `WaitingForPage.vue:137`, `SomedayPage.vue:128`, `ProjectsPage.vue:153`, `EngagePage.vue:237`; calendar `CalendarPage.vue:84`; items `ActionDetailPage.vue:516`, `StuffDetailPage.vue:292`, `RecurringDetailPage.vue:271`, `ProjectDetailPage.vue:806`, `ProjectTemplateDetailPage.vue:332`, `ProjectCanvasPage.vue:189`; idea `CanvasMap.vue:212`, `CanvasDrillDown.vue:192`; query `SearchPage.vue:101`) — Pages hand their part — per parent W2. Data (parent Data contract, no new read): item `id` / `title` from `GET /v1/action/{id}`, `/v1/stuff/{id}`, `/v1/recurring/{id}`, `/v1/project/{id}`, `/v1/projectTemplates/{id}` (`name`); canvas title from `canvasModel` `projectTitle`; canvas idea `id` / `text` from `GET /v1/project/{id}/canvas` + the selected / current idea; tags from `filterTags` + `activeTag`; calendar from `calendarModel` `currentDate` / `viewMode`; query from `searchModel` `resultTerm`. No backend box adds a field.
- [x] **W3** (`apiClient.js:2593`, `assistantModel.js:157` first step of `send`; Chrome: sent on action detail → mock `/control/requests` place = `{page:"action-detail", item:{type:"action", id, title:"Standalone above"}}`; `invalid_place` → generic toast branch `assistantModel.js` `onSendError` last else) — Send — per parent W3. Data: `place` from `assistantPlace().place` → `POST /v1/assistant/messages`, accepted by backend **B1**; `400 invalid_place` uses the existing generic send-error branch. Verify: ui-tests U1, U7, U8.
- [x] **W4** (`AssistantPanel.vue:184-194` + styles `:903`; checked in Chrome at 306px — window can't be widened, desktop from code: one line, 14px icon, 6px gaps, ellipsis + title) — Panel place line — the one touched screen, built per parent § Screens ("Panel — composer: the place line" + every row of States, exact copy, `assistant-place` / `data-place` / `title`). Data: `assistantPlace().label` / `icon` (same value Send takes; W1). Verify: ui-tests U1–U6, U9, U10.
- [x] **W5** (`AssistantPanel.vue:50`) — Empty state — per parent W5 / Screens States (`AssistantPanel.vue:50` sentence). Verify: ui-tests U5.
- [x] **W6** (`content/legal/privacy.md:3` November 4, 2026, `:158` §2.11 sentence, `:273` §5.12 wording; in prerendered `/legal/privacy`) — Privacy Policy per parent "Legal impact" (§2.11 sentence, §5.12 wording, **Last updated**; no user notice, D8). Terms of Service: n/a (no `terms_version` bump). Verify: `/legal/privacy` shows both texts and the new date.
- [x] **W7** (`content/help/gettingStarted.js:115`, `content/help/faq.js:259`) — Help per parent "Help impact" (`gettingStarted.js`, `faq.js`; `bestPractices.js` n/a). Verify: ui-tests U11.
- [x] **W8** (`wna_orchestration/specs/features/wna-features.md:3754` place line + every-send bullet, `:3775` empty-state sentence, `:3814` test id) — Update `specs/features/wna-features.md` §41.3 (place line, empty-state sentence, place on every message).

Landing / Pricing: n/a per parent — no box.

## Who / what / waits on
| Box | What | Data source | Waits on |
|---|---|---|---|
| W1 | place module | route + parts from W2 | — |
| W2 | pages hand parts | existing GETs above | — |
| W3 | send place | W1 | backend B1 |
| W4 | line | W1 | — |
| W5–W8 | copy / legal / help / spec | — | — |

## Execute after
backend B1–B3 (B4 needs deploy P1); ui-tests runs after this slice.
