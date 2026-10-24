# FEAT-061 — web slice: Global undo (Undo toast, Ctrl/⌘+Z, Trash confirm removed)

**Parent (canonical):** `../wna_orchestration/features/FEAT-061-global-undo.md` — §User flows, §Screens (S1–S5, flow → element check, designer decisions DS1–DS20),
§Design (D1–D9 + D1a), §Help impact, §Contracts touched. Read it first. This file is only this repo's checklist; nothing from
the parent is restated.

**Scope:** main-app only. New `src/main-app/scripts/core/undoModel.js` (DS2) and the `errorModel` / `ErrorToaster` undo
variant (DS1) are owner-approved. Depends on: backend FEAT-061 slice (`recurring_parent_id` on Today / Waiting / Overdue /
Engage rows) and FEAT-060's `--touch-target-min` token (DS3). Legal: n/a (parent §Legal impact), so no legal box.

## User flows (this project's part)
- **Free / Pro** — parent "Free user": the whole flow is this repo's — record each undoable op (S3) with its S5 snapshot,
  Undo toast 6 s (S1), Ctrl/⌘+Z on desktop (S2), inverse + field restore + reorder / re-promote (D1a, D7, DS13–DS15,
  DS17), success / failure copy (DS4–DS6), detail-page return (DS7), no confirm on Trash (S4), non-undoable cases toast
  without Undo (D8, DS11, DS12, DS20), reorder no toast (D9).
- **Team owner** — parent "Team owner": shared-project rows → inverse call only, server placement, no reorder / re-promote
  (DS19); server 403/409 messages pass through the failure toast.
- **Team member** — parent "Team member": same as owner; a read-only member never gets an Undo (no undoable op is offered).
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — n/a — public pages: no toast, no key.

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
- [ ] W-1 `errorModel` / `ErrorToaster` undo variant per §Screens S1 (6 s, no dedupe, single slot, `Undoing…`, button look
  + ≤ 768 px wrap, DS1 / DS3).
- [ ] W-2 `scripts/core/undoModel.js` — record / undo / clear on expiry, page-refresh signal, sidebar counts reload (DS2).
### Screens (one box per parent §Screens surface — every state + exact copy)
- [ ] W-3 S1 Undo toast — every state (shown, in flight, success DS4, failure DS5 / DS6, expiry, replaced DS2) with exact copy.
- [ ] W-4 S2 Ctrl/⌘+Z in `shortcutModel.js` (pause rules) + `ShortcutsDialog.vue` row + note (DS16).
- [ ] W-5 S3 toast copy per op — every undoable op wired at every entry point (list rows, detail pages, CommandPalette,
  Sidebar drops, Move menus / MoveModal, FEAT-060 swipe); non-undoable ops toast without Undo; Sidebar copy unified (DS8);
  project trash copy (DS9).
- [ ] W-6 S4 Trash confirm removed at all 12 call sites + the swipe-left path (D5); Complete Project confirm kept (DS10);
  Reference-file trash untouched. `grep -rn "title: 'Move to Trash'" src/main-app` → only the Reference-file one left.
- [ ] W-7 S5 snapshot + inverse per op — field restore (DS13 `/wait` + `PUT waiting_since`, DS14), reorder to the old index
  except DS17 rows, re-promote + return to Today / Calendar / Waiting (D7, DS15), shared rows server placement (DS19),
  recurring active instance → no Undo using `recurring_parent_id` (D8).
- [ ] W-8 Detail pages: Undo returns to the restored item when still on the page the op left (DS7).
### Help (parent §Help impact — one box each)
- [ ] W-9 `content/help/faq.js:98` — Undo toast + Ctrl/⌘+Z.
- [ ] W-10 `content/help/faq.js:188` — Trash no longer asks first; Undo brings it back.
- [ ] W-11 `content/help/gettingStarted.js` keyboard-shortcuts entry — Ctrl/⌘+Z.
### Verify
- [ ] W-12 `npm run build:main` passes (paste the tail).
- [ ] W-13 `data-testid`s for ui-tests on the toast and its Undo button; list them here for the ui-tests slice.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [ ] W-14 Update `../wna_orchestration/specs/features/wna-features.md` — undo toast + Ctrl/⌘+Z (§37), every section whose
  Trash confirm goes away, Sidebar toast copy.
- [ ] W-15 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-862–868 (IDs reserved by the parent; scope
  per the ui-tests slice) + update every existing Trash TC that has the confirm step; regenerate via
  `regression-ui-tests/update-tests.sh` if that is the repo's practice.
- [ ] W-16 Update `../wna_orchestration/specs/api/api.md` — Update Action documents `waiting_since` if it is missing (DS13
  relies on it; behaviour verified at `wna_backend/core_service/src/services/action/action_service_impl.cpp:161`).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (each S1–S5 surface in the local dev server: the toast, the Undo result in the list, the missing Trash confirm) and confirm it.
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
   affected targets (`npm run build:main` and the local check of the touched pages). The full regression suite is run by the
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
