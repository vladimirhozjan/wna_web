# BUG-063 — web slice: shared-project button rules on Action / Project detail from `my_role`

**Parent (canonical):** `../wna_orchestration/features/BUG-063-action-detail-member-buttons.md` — §User flows, §Screens
(S1 button matrix, S2, S3, fallback toasts), §Design (D2–D9, Web), §Help impact, §Work breakdown → web. Read it first.
This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `views/dashboard/ActionDetailPage.vue` (buttons + `itemCommands`, remove the
`listProjectMembers` watcher / `myRole` ref), `views/dashboard/ProjectDetailPage.vue` (Someday shared project, page +
palette), `components/Sidebar.vue` (`onDropToSomeday` shared project), `content/help/faq.js`. No new component, model,
CSS variable. Admin-app untouched.

**Depends on:** backend slice Rule 6 (`my_role` on action JSON). Until it lands locally, verify against a mocked
`my_role`; the close needs the real field.

**Legal:** none — parent §Legal impact is n/a.

## User flows (this project's part)
- **Free user / Pro user** — n/a — no shared projects; personal-action buttons and Sidebar drops unchanged (check one
  personal action per state).
- **Team owner** — parent "Team owner": S1 rows for owner (claimed by other → none; backlog → Done / Assign to me /
  Trash, no Move; own claim → Done / Move (Next / Today / Calendar / Waiting) / Unassign / Trash; legacy Someday →
  Activate / Trash); S2 Activate + Complete; S3 shared project Sidebar drop → toast, no API call.
- **Team member (write)** — parent row: S1 own claim incl. Waiting (Got it), backlog, claimed by other, completed Undo;
  legacy Someday action and S2 → no buttons.
- **Team member (read-only)** — parent row: S1 only own claim → Done / Unassign / Trash; everything else none; completed
  → no Undo; correct on first paint (no role fetch).
- **Downgraded member (non-Team)** — parent row: own claim → Done / Unassign / Trash, no Move / Got it; completed Undo
  kept.
- **Removed member / unshared** — parent row: `my_role` absent → completed Undo kept, backend toast as today.
- **Every row** — palette "This item" mirrors the page exactly (same computeds).
- **Admin (relevant role)** — n/a — admin app untouched.
- **Unauthenticated / not-entitled** — n/a — authenticated dashboard pages only.

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
### Screens (built per parent §Screens — every row / state + exact copy)
- [x] W-1 S1 — `ActionDetailPage.vue` buttons per the S1 matrix, every row, from `action.my_role` / `assigned_to` /
  `state` / tier; Move never lists Someday / Projects / Reference on a shared action; Trash hidden (not `:disabled`) on a
  claim of someone else. — rules `views/dashboard/ActionDetailPage.vue:613-638` (`viewerRole`, `canFinish`, `canMove`,
  `canManageSomeday`, `canAssign`, `canUnassign`, `canUndo`); template Undo `:94`, Someday `:104`, Got it `:125`, Done
  `:134`, Move `:143` (Someday / Projects / Reference only when `!isProjectShared` `:157`), Assign `:164`, Unassign
  `:173`, Trash `v-if="canFinish"` `:182` (no `:disabled`).
- [x] W-2 S1 palette — `itemCommands` produce exactly the same set as the page for every S1 row (shared computeds, no
  duplicated rule). — `ActionDetailPage.vue:651-672` uses the same computeds in page order; shared Move filter
  `SHARED_HIDDEN_MOVES` `:650`, `:664`.
- [x] W-3 S1 role source — `listProjectMembers` watcher and `myRole` ref removed; grep `ActionDetailPage.vue` for
  `listProjectMembers` / `myRole` → 0 matches (rule 3). — `grep -c "listProjectMembers\|myRole"` → `0`; also removed
  `isAssignedToOther` / `isReadOnlyBacklog` (0 matches). `apiClient.listProjectMembers` kept (still used by
  `projectModel.js:277`).
- [x] W-4 S2 — `ProjectDetailPage.vue` shared Someday project: Activate + Complete for the owner only, page + palette. —
  page `views/dashboard/ProjectDetailPage.vue:85` (`!isShared || isOwner`), palette `:846`.
- [x] W-5 S3 — `Sidebar.vue` `onDropToSomeday`: project row with `shared: true` refused without an API call, toast copy
  exactly as parent §Screens S3 (confirm the drop payload carries `shared`; add it at the drag source if not). —
  `components/Sidebar.vue:479-482` (project row, and Completed `type: PROJECT` row so it isn't uncompleted first); the
  payload already carries `shared` (`components/ItemList.vue:206`, `:251`); project / completed rows send it (api.md
  :1628, :3088).
- [x] W-6 Fallback toasts — a Sidebar drop of a shared action the viewer may not move shows the backend 403 `detail`
  (parent §Design strings) as the error toast. — no change needed: `scripts/core/apiClient.js:71` (`detail` →
  `message`, `:103-107`), every Sidebar drop catch `toaster.push(err.message …)` (e.g. `Sidebar.vue:347`, `:405`).
### Help
- [x] W-7 `content/help/faq.js` "What are shared projects?" — the two edits in parent §Help impact, verbatim. —
  `content/help/faq.js:210` (new sentence after "can comment."; "shared projects and their actions can't be moved to
  Someday/Maybe.").
### Verification
- [x] W-8 `npm run build:main` passes. — `✓ built in 4.07s` · `[obfuscator] Obfuscated 19 files` (only the
  pre-existing > 500 kB chunk warning).
- [x] W-9 Code walk of every parent §User flows row against W-1…W-5 (owner / write / read-only / non-Team / removed /
  personal) — list each row with the `file:line` of the condition that renders it; ask the owner to verify at runtime.
  (`ActionDetailPage.vue` unless noted)
  - Owner · claimed by other → none: `canFinish` `:620` false (not mine), `canMove` `:627`, `canUnassign` `:634`,
    `canAssign` `:631` (not unassigned).
  - Owner / write · backlog → Done / Assign (Team) / Trash, no Move: `:621`, `:631`, `:627` (not assignee).
  - Full member · own claim → Done / Move (Next/Today/Calendar/Waiting) / Unassign / Trash; Waiting + Got it: `:620`,
    `:627`, `:634`, `:125`, `:157`.
  - Owner · legacy Someday action → Activate / Trash; write / read-only → none: `:630`.
  - Read-only · own claim → Done / Unassign / Trash, no Move / Got it: `:620`, `:634`, `:627` (`canEditBacklog`
    false); backlog → none `:621`; completed → no Undo `:636-638`; first paint — role from `action.my_role` `:613`, no
    fetch.
  - Non-Team · own claim → Done / Unassign / Trash, no Move / Got it: `:627` (`myTier === 'team'`); completed Undo
    kept `:636-638`.
  - Removed / unshared (`my_role` absent) → completed Undo kept `:636-638`; everything else hidden (`viewerRole` null
    `:620`, `:621`, `:630`, `:634`).
  - Personal action → unchanged: `!isProjectShared` branches `:619`, `:626`, `:630`; full Move list `:157`.
  - S2 owner / member: `ProjectDetailPage.vue:85`, `:846`. S3: `Sidebar.vue:479`.
  - Every row, palette = page: `:651-672`.
  Runtime check requested from the owner (local, against the real backend `my_role`); automated in TC-874 (ui-tests).
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-10 Update `../wna_orchestration/specs/features/wna-features.md` — Action detail shared-project block (S1 matrix
  replaces the members-fetch text, :463–476), Project detail Someday shared, Sidebar Someday drop toast. —
  `wna-features.md:484` (S1 matrix, replaces the members-fetch text), `:680` (Project detail shared Someday), `:258`
  (Sidebar shared-project drop toast), `:259` (backend 403 fallback toast).
- [x] W-11 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — new TC-862 (S1 matrix per role × assignment + S2
  + S3); update TC-842 / TC-861 to the new rules. — TC-862 was already FEAT-061's, so owner chose **TC-874**:
  `wna-test-cases.md:20155` (Section 67), `:20157` (TC-874); TC-842 `:19125` (step 3: no buttons on a claim of another
  member), TC-861 `:19167` (first paint, no members request); `regression-ui-tests/update-tests.sh` run.
- [x] W-12 Tick the parent's web Work breakdown boxes in `../wna_orchestration/features/BUG-063-action-detail-member-buttons.md`.
  — `BUG-063-action-detail-member-buttons.md:181-186` (5 web boxes ticked, TC-874 renumbering noted).

### Reopened at close 2026-10-24 (acceptance ✘ — parent §Screens "Fallback toasts")
- [x] W-13 `ActionDetailPage.vue` Move (Next / Today / Calendar / Waiting) and Got it catch blocks (today a fixed
  `'Failed to move action'`, ~`:1019`, `:1057`, `:1112`, `:1140`) toast `err.message` with the old text as fallback, like
  Done / Trash / Undo; grep the page for any other bare-`catch` mutation toast and fix it the same way. —
  `views/dashboard/ActionDetailPage.vue:1019`, `:1057`, `:1112`, `:1140` (`err.message || 'Failed to move action'`); same
  fix on the other bare-catch mutations: title / description `:888`, tags `:928`, Unassign `:1178`, scheduled date
  `:1290` / `:1321`, start date `:1371` / `:1399`, due date `:1450` / `:1478`. Remaining bare `catch {` (`:1524`,
  `:1628`) are prev/next navigation loads, not mutations. Assign `:1159` left as is (status-specific copy, not bare).
- [x] W-14 `npm run build:main` passes. — `✓ built in 3.96s` · `[obfuscator] Obfuscated 19 files` (only the
  pre-existing > 500 kB chunk warning).
- [x] W-15 Update `../wna_orchestration/specs/features/wna-features.md` (fallback toast on Action detail) and TC-874 in
  `../wna_orchestration/specs/tests/wna-test-cases.md`: add the parent Rule 7 steps (assignee Today → Unassign → in the
  project backlog; removed member's Calendar claim → backlog) and a stale-tab Move → 403 `detail` toast step. —
  `wna-features.md:509` (stale-page refused mutation → backend `detail` toast); TC-874 steps 8–10
  `wna-test-cases.md:20191-20195`, expected `:20211-20214`; `regression-ui-tests/update-tests.sh` run.
- [x] W-16 Tick the parent's new web box. — `BUG-063-action-detail-member-buttons.md:206`.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the Action detail buttons + palette per S1 row, the S2 page, the S3 toast) and confirm it.
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
   (owner directive 2026-08-19). This repo has no automated tests: verify with `npm run build:main` and code inspection;
   Playwright coverage is the ui-tests slice. The full regression suite is run by the OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every check targets the
   local stack (local web dev server, local backend). Never deploy, never point at `dev.whatsnextaction.com` /
   `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.
   A task closes on local verification alone — never wait for a dev or prod confirmation.
