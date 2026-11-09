# BUG-088 — web slice

Parent: `BUG-088` (`../wna_orchestration/features/BUG-088-connection-check-and-web-connections-parity.md`) — delegation / share without an accepted connection · web Connections off §30.4. This slice is the local checklist only; Design (Boundaries, Contracts, Flows), Data contract, Screens, Help impact and owner decisions D1, D2, D4 live in the parent — read them there, they are not restated here. Round 2: owner D4 (2026-11-09) withdrew the round-1 core → user_service connection check; this slice holds the round-2 removal items (parent ids RB/RW/RD/RU) and the round-1 items that stay. "Restore to `<commit>`" means the file's content as of that commit, nothing else changed (commits are named in the parent § Design). Work only in the `main` worktree.

## User flows (this project's part)
Reference the parent's User flows by role; this project implements:
- Free / Pro: Connections — a received invitation shows the §30.4 hint and a live **Accept** that opens the upgrade modal (no request); Decline as built (round 1, kept). Downgraded user: banner as built, Received hint hidden.
- Team owner / member: pickers and the share modal list `GET /v1/connections` as built; the web handles no `not_a_connection` (D4) — delegate / share errors show as before round 1. Cancel invitation / Remove connection have their own dialogs (round 1, kept).
- Admin: n/a — no admin-app screen or route changes.
- Not-entitled / unauthenticated: route guard and caller tier gate as built.

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
   The **deploy** slice always prepares BOTH environments — dev AND prod compose overrides, config.json, crontabs, scripts —
   applies the change to the LOCAL stack itself (local migrations, local config), and writes the exact dev and prod
   command lines as a section in `wna_deploy/backend/gce/PENDING-develop.md` / `PENDING-production.md`. Operator-only
   steps (GCP/VM provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §<ID>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.

## Checklist
Round 1 kept and done: W3–W6 (ConnectionsPage per parent § Screens, FAQ) and the round-1 spec edits for §30.1 / §30.4 / §30.6 dialogs. W1, W2, W7 (the `not_a_connection` mapping) are withdrawn by D4 and removed by RW1–RW3.
- [x] **W3 (kept)** `ConnectionsPage.vue` Accept live on every tier (`:disabled="!!actingId"`, `:91`) → upgrade modal, no request.
- [x] **W4 (kept)** `ConnectionsPage.vue:77-79` Received hint (`!isTeamTier && !showDowngradeBanner`).
- [x] **W5 (kept)** `ConnectionsPage.vue` own Cancel invitation / Remove connection dialogs (`onCancelInvite` / `onRemoveConnection` / `confirmRemove`).
- [x] **W6 (kept)** `src/main-app/content/help/faq.js:225` "How do connections work?".

### Round 2 — removal (D4)
- [x] **RW1** — done: `apiClient.js:1-6` no `connectionModel` import, `normalizeError` (`:107`) no `not_a_connection` branch; `git diff 796fcc0^ -- apiClient.js` empty; `grep -rn not_a_connection src` → 0; `npm run build:main` exit 0. `scripts/core/apiClient.js`: drop the `connectionModel` import (`:7`) and the `not_a_connection` branch (`:108-112`) in `normalizeError`. Data: none — removal, no server data read. Verify: `grep -rn not_a_connection src` returns nothing; `npm run build`. Consumes nothing.
- [x] **RW2** — done: `ProjectDetailPage.vue:1139` `if (status === 403) shareModalError.value = 'Sharing requires the Team plan.'`; `git diff 796fcc0^ -- ProjectDetailPage.vue` empty; build exit 0. `views/dashboard/ProjectDetailPage.vue` `submitShareModal` (`:1139-1140`): back to `if (status === 403) shareModalError.value = 'Sharing requires the Team plan.'` as before round 1. Data: none — removal. Verify: `npm run build`; the share modal's `403` line unchanged (checked by the shared-projects spec in ui-tests RU1's run). Consumes nothing.
- [x] **RW3 spec** — done (RB3 landed: core_service 31ec575, no `connection_guard/`, 0 `not_a_connection`; kept `403` at `action_service_impl.cpp:296-301`): `wna-features.md:3121` (§30.6), `:3261` (§32.7, old 404 + 503 rows replaced), `:3278` (§33.1). Update `specs/features/wna-features.md` §30.6 `:3121`, §32.7 `:3261-3262` (incl. the old "404 if the target user is not an accepted connection"), §33.1 `:3279`: the server checks no connection (D4); the pickers offer only accepted connections. Cite `file:line`. Consumes RB3, RW1, RW2.

### Who / what / waits on
| Box | Needs from backend | Waits on |
|---|---|---|
| RW1, RW2 | nothing | — |
| RW3 | the guard removed (RB3) | RB3, RW1, RW2 |
