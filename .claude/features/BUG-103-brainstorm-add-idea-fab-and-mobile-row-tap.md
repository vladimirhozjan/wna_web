# BUG-103 — web slice

Parent: `BUG-103` (`../wna_orchestration/features/BUG-103-brainstorm-add-idea-fab-and-mobile-row-tap.md`) — brainstorm mobile: "Add idea" pill instead of the Quick-Add-like "+", row tap opens the idea, rename by long-press / ⋯ / title. Local checklist only; Design, Screens, Flows live in the parent — read them there, not restated here. Item ids are the parent's Work breakdown ids (web 1–5). Work only in this `main` worktree. Consumes nothing from another sibling; no server data (parent §Data contract: n/a).

## User flows (this project's part)
- Free / Pro / Team owner / Team member (editor): mobile (≤ 768px) Brainstorm → **Add idea** pill adds an idea; a tap anywhere on a row opens it; rename via long-press → **Rename**, ⋯ → **Rename** (inside an idea), or the title.
- Team member (viewer) / owner of a non-ACTIVE project: no pill, no sheet, no ⋯; a row tap opens the idea; title not editable.
- Admin / Unauthenticated: n/a — no admin surface; signed-in only.

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

## Checklist
- [ ] 1. `CanvasDrillDown.vue` — the **Add idea** pill (parent web item 1, Screens row 1). `data-testid="canvas-fab"` stays (parent §Boundaries — test ids kept).
- [ ] 2. `CanvasDrillDown.vue` — row tap opens, `onRowTextClick` removed (parent web item 2, Screens row 2).
- [ ] 3. `CanvasDrillDown.vue` + `views/dashboard/ProjectCanvasPage.vue` — rename routes: sheet **Rename**, editor empty-card copy, `renameCurrent()` exposed, ⋯ **Rename** first in `drillDeep` (parent web item 3, Screens rows 3 + Copy changes).
- [ ] 4. Help — `content/help/gettingStarted.js` **Brainstorming a Project**: the sentence per parent §Help impact, verbatim; "Tap +" no longer in `content/help/` (parent web item 4).
- [ ] 5. Desktop unchanged: at > 768px no pill, no row list — check only (parent web item 5).
- [ ] Verify at 500px and 320px in the local stack: `npm run build` passes; the checks listed under each parent item hold.
