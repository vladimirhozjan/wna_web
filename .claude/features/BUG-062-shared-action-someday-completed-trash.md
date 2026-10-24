# BUG-062 — web slice: shared-project actions — Someday hidden, "Shared" badge on Completed / Trash (main-app)

**Parent (canonical):** `../wna_orchestration/features/BUG-062-shared-action-someday-completed-trash.md` — §User flows,
§Screens (S1–S5, Error copy, Click budget, Data needs), §Design, §Help impact, §Work breakdown → web. Read it first.
This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `views/dashboard/ActionDetailPage.vue`, `components/Sidebar.vue`, `CompletedPage.vue`,
`TrashPage.vue`, `components/ItemList.vue` (`title-suffix` pass-through), `content/help/faq.js`. Depends on the
backend slice (`project_shared`, `shared`, `completed_by`, 403 `detail`s); verify against the local stack once it
is running. Legal: n/a per parent (no box).

## User flows (this project's part)
- **Free / Pro** — n/a — no shared projects; personal actions keep Someday in the Move menu and Sidebar drop.
- **Team owner** — parent "Team owner": no Someday entry / drop on any shared-project action (S1, S2); legacy shared
  Someday row → Move hidden, Activate + Trash only, Activate toast per S1; her Completed/Trash show the "Shared"
  badge on her own shared rows (S3, S4).
- **Team member** — parent "Team member": same Someday hiding; his completed/trashed shared rows carry the "Shared"
  badge; Undo / Restore success toasts per S1; after removal the row opens read-only and Undo shows the backend
  403 `detail` toast.
- **Other members** — parent "Other members": Undo hidden on S1 when `completed_by` is someone else; a 403 falls back
  to the `detail` toast.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — n/a — dashboard only; non-Team 403 uses the existing upgrade-message path.

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
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-1 S1 Action detail — Someday hidden when `project_shared`; legacy shared Someday row → Move hidden; Undo
  hidden when `completed_by` ≠ me; success toasts + 403 toast exactly per S1 / Error copy.
  `src/main-app/views/dashboard/ActionDetailPage.vue:623-626` (`isProjectShared`/`canMove`/`canUndo`), `:94` Undo
  `v-if`, `:149` Move dropdown `v-if="canMove"`, `:163` Someday item, `:642,650-652` command palette mirrors it,
  `:1639` Undo toast `"<title>" restored`, `:1654` Activate toast `"<title>" moved to the project backlog`; 403 →
  existing `toaster.push(err.message)` (`apiClient.normalizeError` takes `data.detail`).
- [x] W-2 S2 Sidebar Someday drop — no API call for a `project_shared` row; error toast per S2.
  `src/main-app/components/Sidebar.vue:439-443` (action row `project_shared`, Completed `ACTION` row `shared`; returns
  before any API call). Drag payload carries the flags: `src/main-app/components/ItemList.vue:189-190,234-235`.
- [x] W-3 S3 Completed page — "Shared" `Badge` in the title suffix on `shared: true` rows (ItemList forwards
  `title-suffix`). `src/main-app/views/dashboard/CompletedPage.vue:80-82`; pass-through
  `src/main-app/components/ItemList.vue:66-68`. Uncheck toast / 403 toast already per S3 (`CompletedPage.vue` `onItemCheck`).
- [x] W-4 S4 Trash page — same badge; Restore toast per S4. `src/main-app/views/dashboard/TrashPage.vue:27-29`;
  Restore toast `"<title>" restored` and 403 `err.message` toast unchanged (`TrashPage.vue` `onRestoreOne`).
- [x] W-5 S5 Project detail Completed section — confirm unchanged; row → S1 behaves per W-1. No diff in
  `ProjectDetailPage.vue`; "completed by" label `:1680-1682`, row → `action-detail` `:1716` (S1 rules from W-1 apply).
### Help
- [x] W-6 `content/help/faq.js` "What are shared projects?" — the parent §Help impact sentence.
  `src/main-app/content/help/faq.js:210`.
### Verify
- [x] W-7 `npm run build:main` passes; grep confirms no remaining reference to any removed Someday path for shared
  actions. Build green (2026-10-23, `✓ built`). Nothing was removed — the only action→Someday callers
  (`grep -rn somedayAction src/main-app`) are `Sidebar.vue:449,458` (guarded at `:439`) and
  `ActionDetailPage.vue:1074` (reached only from the `:163` item, hidden when `project_shared`).
- [~] W-8 Local run with two users (Ana owner, Bor member) on the local stack: screenshots/notes of S1–S4 per role.
  DEFERRED TO wna-ui-tests: automate TC-832–837 (runtime checks go to ui-tests per owner directive); needs the
  backend slice (`project_shared`, `shared`, `completed_by`, 403 `detail`s) on the local stack.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-9 Update `../wna_orchestration/specs/features/wna-features.md` — Completed, Trash, shared actions (Someday
  hidden, "Shared" badge). `wna-features.md:256` (Sidebar Someday drop), `:462-472` (§6.2 Action Detail shared
  rules), `:920-924` (§13.1 Completed), `:953-955,960,966-968` (§14.1 Trash).
- [x] W-10 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-832–837 (IDs reserved by the
  parent; one-liners in the ui-tests slice "Tests that must pass"). `wna-test-cases.md:19237` Section 61, TC-832
  `:19242` … TC-837 `:19370`; `regression-ui-tests/update-tests.sh` re-run.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (S1–S4 rendered for Ana and Bor on the local stack) and confirm it.
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
