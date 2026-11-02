# BUG-078 — web slice: bell list keeps the end known after a live re-read (main-app)

- Parent (single source of truth): `wna_orchestration/features/BUG-078-bell-extra-empty-page-after-live-reread.md`
- Work: parent `## Work breakdown` §web items **1–4**. How: parent `## Design` §Boundaries (web rows), §Contracts
  (`PAGE`, `LIST_MAX`, `rereadLoaded()`, `loadList({ reset, limit })` — frozen), §Flows F1 / F2 / F3 + Edge cases;
  `## Data contract`. Decision: owner D1 (own BUG). This slice does not restate them.
- Order (parent Work breakdown): items 1–4, one job; consumes nothing from other siblings. ui-tests item 1's green run
  waits on items 1–3. Dev servers are wnapm's — never start one.
- Reuse First: nothing new — no `.vue` component, model, CSS variable, icon or dependency. Reuse the `loadVersion` /
  `myVersion` stale-response pattern of `nextActionModel.js:23,35`; keep `pendingReadIds` as is (parent §Boundaries).

## User flows (this project's part)
- Free user: after rows in the bell were marked read (live re-read), scrolling the list to the end sends no extra page
  request; re-read stays silent (no spinner), at the loaded depth, no row inserted past the loaded ones (parent F1).
- Pro user: same as Free.
- Team owner: same as Free.
- Team member: same as Free.
- Admin (relevant role): n/a — main-app bell only (parent User flows).
- Unauthenticated / not-entitled: n/a — no bell.

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
- [x] **1** (`notificationInAppModel.js:11-14` constants/`rereading`/`loadGen`; `:26` page load returns while re-reading (F2); `:27` open load bumps `loadGen` (F3); `:56-89` `rereadLoaded()` per F1, exported `:178`; `TopNav.vue:271` calls `notifModel.rereadLoaded()`; `grep -rn keepDepth` on both files → 0 matches; `npm run build:main` exit 0; logic check with the real module + mocked API, 12/12 PASS: 24 rows → re-read `limit=25` no cursor, hasMore false; new row on top → 24 shown + next scroll loads the dropped row; 130 rows → `limit=100` then `limit=31&cursor=…`, 130 rows same order; scroll during re-read skipped; reopen during re-read drops the stale result; pending-read rows stay read) `src/main-app/scripts/models/notificationInAppModel.js` + `src/main-app/components/TopNav.vue:271` —
  exactly per parent web item 1 (constants, `rereading`, `loadGen`, `rereadLoaded()` per F1 exported on the instance,
  `keepDepth` removed, page load returns while `rereading` per F2, open load bumps `loadGen` per F3; TopNav live
  handler calls `notifModel.rereadLoaded()`). Verify per item 1 (`grep -rn keepDepth` on both files empty;
  `npm run build:main` passes).
  Data: `notifications[]` (`id`, `read`, …) and `unread_count` — `GET /v1/notifications[?cursor=]` (existing, parent
  `## Data contract`; no backend box).
- [~] **2** BLOCKED — the Chrome session on `:5173` was logged out (redirect to `/`) and seeding 24 rows needs a logged-in local user + a second user or DB access (see item 3); the logic is covered by item 1's mocked-API check, the observed Network log is not. Chrome check on `http://localhost:5173`, desktop and 500 px — 24-row scenario exactly per parent web item 2
  (one `cursor=` request, then a re-read `limit=25` without `cursor`, 3 bottom scrolls → no new `cursor=` request,
  24 rows, no spinner, scroll position kept).
  Data: same as item 1.
- [~] **3** BLOCKED — reading `wna_deploy/backend/db_tools/.wna_db_passwords-local.env` was denied by the session permission classifier, so the seed / clean-up SQL was not run (nothing seeded, nothing to clean up); the `limit=100` → `limit=31&cursor=…` sequence is proven only against the mocked API (item 1). Depth ≥ 100 check on the local DB — seed / observe / clean up exactly per parent web item 3 (re-read sends
  `limit=100` then `limit=31&cursor=…`; 130 rows in the same order; bottom scroll sends no new `cursor=` request;
  seed rows deleted afterwards).
  Data: same as item 1.
- [x] **4** (`wna_orchestration/specs/features/wna-features.md:3127`) Update `wna_orchestration/specs/features/wna-features.md` §31.3 — the one clause parent web item 4 gives.
  Output for ui-tests: TC-686 is stale (it counts the live re-read as a page request).

## Screens
n/a — parent `## Screens`: no visible change.

## Help / Legal / Landing-Pricing
n/a — parent `## Help impact`, `## Legal impact`, `## Landing / Pricing impact` are all n/a.

## Spec sync (orchestration homes — this work, never deferred)
- `specs/features/wna-features.md` §31.3 — checklist item 4.
- Test cases (`specs/tests/wna-test-cases.md`) are ui-tests' only — never edit them here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (here: the DevTools Network log of `/v1/notifications` requests and the bell
   panel rows on `:5173`) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done (here: `keepDepth`).
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
