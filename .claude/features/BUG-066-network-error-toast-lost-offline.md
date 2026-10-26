# BUG-066 — web slice: Network-error toast never shows when an action fails offline

- Parent (single source of truth): `wna_orchestration/features/BUG-066-network-error-toast-lost-offline.md`
- Decisions: parent `## Locked decisions` D1–D3 as clarified by the owner 2026-10-26 (one line in
  `wna_orchestration/decisions.md`)
- Work: parent `## Work breakdown` §web W6–W10 (re-cut 2026-10-26). The rule, the filter + bypass, the reasons and the
  edge cases: parent `## Design` (§Boundaries, §Contracts table, §Flows). This slice does not restate them — read them there.
- Superseded: W1–W4 (J116) built the earlier deferred-offline-mark design; W6, W7, W9 undo them. W5 is dropped.
- Order: first — web W6–W10, then ui-tests U4–U6 (ui-tests starts when W6–W9 are in `wna_web/main` and served on
  `:5173`). No backend / deploy work.
- Screens: n/a (parent `## Screens`: no new screen or copy). Data: n/a (parent `## Data contract`: no server field read).
- Legal / Help: n/a (parent `## Legal impact`, `## Help impact`).

## User flows (this project's part)
- Free user: on a signed-in page, a change (add, edit, complete, swipe, drag, delete) or a read (pull-to-refresh, page
  open, Load more) that fails with no response shows the offline banner / page and **no** error toast — the
  `errorModel` filter (W8 a–c), with immediate offline marking restored (W6, W7). The same request answered 500 / 503
  or timing out → page unchanged, its toast shows (unchanged code). Capture bar, Share, palette "Add to Inbox",
  welcome-tour and sync-failure errors keep their toasts (`keepOffline`, W8 d); success toasts always show.
- Pro user: same as Free.
- Team owner: same as Free.
- Team member: same as Free.
- Admin (relevant role): n/a — main-app only (parent `## User flows`).
- Unauthenticated / public pages (login, register, verify email, Google SSO, help, pricing, legal): dashboard layout
  not mounted → the filter does not apply, network errors show as today (W8 a–b; checked in W10 h).

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
- [x] ~~W1~~ ~~W2~~ ~~W3~~ ~~W4~~ superseded (deferred offline mark — contradicts D1–D3); undone by W6, W7, W9.
- [NA] ~~W5~~ dropped by the parent (it checked the superseded behaviour).
- [x] **W6** — done: interceptor restored by hand (`httpApi.js:116-125`, `ERR_NETWORK` → `markNoResponse()` immediately); `git diff -- src/main-app/scripts/core/httpApi.js` empty (0 lines). Original: `src/main-app/scripts/core/httpApi.js` — restore the response interceptor to HEAD exactly as parent W6
  (remove `answeredResponses`, its increments and the GET / auth / quiet / `setTimeout` branch; `ERR_NETWORK` →
  `markNoResponse()` immediately). Revert by hand, no `git checkout`. Verify: `git diff -- src/main-app/scripts/core/httpApi.js` is empty.
- [x] **W7** — done: three `quiet` config additions removed (`apiClient.js:413`, `:1051`, `:1600`); `git diff` of the file empty. Original: `src/main-app/scripts/core/apiClient.js` — remove J116's three `quiet` request-config additions (`addStuff`,
  `saveProjectCanvas` axios branch, `uploadAttachment`), as parent W7. Verify: `git diff` of the file is empty.
- [x] **W8a** — done: `offlineModel.js:6-7` (`dashboardShown`, `offlineContentShown`), `:30-34` (`setDashboardShown`, both returned). Original: `scripts/core/offlineModel.js` — `dashboardShown` ref, `offlineContentShown` computed, `setDashboardShown(v)`,
  both returned from `offlineModel()`, exactly as parent W8 (a).
- [x] **W8b** — done: `DashboardLayout.vue:198` (`false` in `onUnmounted`), `:205` (`true` in `onMounted`). Original: `layouts/DashboardLayout.vue` — `setDashboardShown(true)` in the existing `onMounted`, `false` in the existing
  `onUnmounted`, as parent W8 (b).
- [x] **W8c** — done: `errorModel.js:19-21` (signature, comment, early return before console log + dedup). Original: `scripts/core/errorModel.js` — `push(message, type = 'error', { keepOffline = false } = {})` with the
  early-return first line and the one-line comment, exactly as parent W8 (c).
- [x] **W8d** — done: `CaptureBar.vue:323, 337, 441, 449`, `SharePage.vue:215, 236`, `CommandPalette.vue:209`, `DashboardLayout.vue:145`, `captureQueue.js:344` (multi-line calls; same 9 calls as the parent's start lines), copy unchanged. Original: `{ keepOffline: true }` as the third argument on exactly the 9 existing calls listed in parent W8 (d)
  (`CaptureBar.vue` ×4, `SharePage.vue` ×2, `CommandPalette.vue`, `DashboardLayout.vue`, `captureQueue.js`); copy
  unchanged, no other call site.
- [x] **W8 verify** — `npm run build:main` exit 0; `grep -rn keepOffline src/main-app` = `errorModel.js` + the 9 sites. Original: — `npm run build:main` passes; `grep -rn "keepOffline" src/main-app` lists `errorModel.js` + the 9 sites.
- [x] **W9** — done: (a) clause removed `wna_orchestration/specs/features/wna-features.md:3122`; (b) `:3124`; (c) `:2465` kept; (d) `:3226`. Original: Update `wna_orchestration/specs/features/wna-features.md` — parent W9: (a) §38 *Offline detection*: delete
  J116's appended clause; (b) §38 *Offline pages*: replace the sentence with the parent's text; (c) §25
  *Pull-to-refresh*: keep as is; (d) Appendix C *Network error* row: append the parent's text. Verify: `git diff` of the
  file, BUG-066 hunks = exactly (a), (b), (d); cite the orchestration `file:line`.
- [NA] **W10** — owner decision (2026-10-26, option 1): no manual Chrome check; covered by ui-tests Playwright (`route.abort('failed')`, assert offline page / banner + 0 error toasts): (a) Next add + (b) Next complete → U5 TC-519; (c) Sidebar drag Next → Someday, (d) Settings toggle, (e) Inbox trash → new ui-tests steps (TC-519 extended or a new TC, owner); (f) 500 toast → TC-519 steps 1–5 (unchanged); (g) offline capture → TC-893 / TC-894; (h) public-page network error → TC-043; (i) back online → U5 `unroute` + reload. Original: Local check in Chrome on `http://localhost:5173` (desktop and 500 px), DevTools request blocking — cases
  (a)–(i) exactly as parent W10 (Next add, Next complete, Sidebar drag to Someday, Settings toggle, Inbox trash → no
  toast; Next add answered 500 → toast; Inbox offline capture → "saved on this device"; signed-out login blocked →
  error as today; unblock → reload, banner gone). Report each as pass / fail.
- [x] **W10 TC list** — listed in the implement report. Original: — in the report, list for ui-tests: TC-519 rewritten; regression TC-893, TC-894, TC-043 (web never
  edits `specs/tests/wna-test-cases.md`).

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
   (Test cases are the exception in this repo: `specs/tests/*` is authored by wna-ui-tests only — list the TCs
   instead, per this repo's CLAUDE.md.)
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
