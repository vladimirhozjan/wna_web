# BUG-088 — web slice

Parent: `BUG-088` (`../wna_orchestration/features/BUG-088-connection-check-and-web-connections-parity.md`) — delegation / share without an accepted connection · web Connections off §30.4. This slice is the local checklist only; Design (Boundaries, Contracts C1–C6, Flows F1–F4), Data contract, Screens, Help impact and owner decision D3 live in the parent — read them there, they are not restated here. Item ids (B/W/DP/U) are the parent's Work breakdown ids. Local stack only. Starts after backend B4 (C4 body). Local stack only; work only in the `main` worktree.

## User flows (this project's part)
Reference the parent's User flows by role; this project implements:
- Free / Pro: Connections — a received invitation shows the §30.4 hint and a live **Accept** that opens the upgrade modal (no request); Decline as built. Downgraded user: banner as built, Received hint hidden (R2).
- Team owner / member: delegate / share / add member to a non-connection → "That recipient is no longer a connection." (toast on delegate surfaces, share-modal error line), connection list re-read; Cancel invitation / Remove connection get their own dialogs.
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
- [x] **W1** — DONE: `src/main-app/scripts/core/apiClient.js:7` (import), `:108-112` (branch before `backendMsg`). Delegate surfaces all show `err.message`: ActionDetailPage `:1076`, EngagePage `:580`, Sidebar `:805`, StuffDetailPage `:808`, clarifyModel `:231` (`state.error`), WaitingForPage `:210` (own 404 copy, same text). `npm run build:main` exit 0. Runtime path needs backend B4 (not yet in `core_service`) → ui-tests U5. — `scripts/core/apiClient.js` `normalizeError`: before the `backendMsg` branch, `data.error === 'not_a_connection'` → `connectionModel().loadAll().catch(() => {})` and return `{status, code: 'not_a_connection', message: 'That recipient is no longer a connection.'}` (import as `referenceModel` at `:6`). Check that every delegate surface shows `err.message`: ActionDetailPage `:1076`, EngagePage `:580`, Sidebar `:805`, StuffDetailPage `:808`, clarifyModel `:231`, WaitingForPage `:210` (own copy, same text). Data: `error` = `not_a_connection` in the delegate / inline-create body — source `POST /v1/action/{id}/delegate` and `POST /v1/action`, provided by backend B4. Verify: `npm run build`; ui-tests U5.
- [x] **W2** — DONE: `src/main-app/views/dashboard/ProjectDetailPage.vue:1139` (first branch; modal stays open). Runtime → ui-tests U6 after B4. — `ProjectDetailPage.vue` `submitShareModal` (catch `:1137`): first branch `err?.code === 'not_a_connection'` → `shareModalError.value = err.message` (modal stays open). Data: `error` = `not_a_connection` from `POST /v1/project/{id}/share` / `…/members`, provided by backend B4. Verify: ui-tests U6. Consumes W1.
- [x] **W3** — DONE: `ConnectionsPage.vue:91` `:disabled="!!actingId"`; `onAccept` unchanged (`:252-275`). Chrome :5173 (stubbed GET lists, Free, payments off): Accept enabled → UpgradeModal with the Screens message + support hint + Got it, no request. — `ConnectionsPage.vue` Accept (`:94`): built per `## Screens` #4 / R1 — `:disabled="!!actingId"`; `onAccept` as built (`:255-275`); Free / Pro → no request, `UpgradeModal` with the Screens message. Data: signed-in `subscription_tier` and `payments` flag from `GET /v1/user` (as built, no backend box). Verify: ui-tests U1.
- [x] **W4** — DONE: `ConnectionsPage.vue:77-79` (`v-if="!isTeamTier && !showDowngradeBanner"`, no button). Chrome desktop + 500px: hint shown with received-only data (2 lines at 500px); hidden when banner shows. — `ConnectionsPage.vue` Received hint (`:77-82`): built per `## Screens` #2 copy, shown when `!isTeamTier && !showDowngradeBanner`, no button (R2). Data: `GET /v1/connections/pending` `received[]` and `subscription_tier` (as built, no backend box). Verify: ui-tests U1, U2.
- [x] **W5** — DONE: `ConnectionsPage.vue:121` / `:143` → `onCancelInvite` `:296-303`, `onRemoveConnection` `:305-312`, shared `confirmRemove` `:314-331` (404 → `loadAll`, no toast `:325`; else Screens toast); live-close watcher kept `:291-294` (unchanged). `onRemove(` 0 matches. Chrome: both dialogs with exact copy (Remove at 500px fits in 4 lines). — `ConnectionsPage.vue` `onRemove` (`:299-321`) → two handlers built per `## Screens`: Pending invitations Cancel (`:123`) → "Cancel invitation?" dialog, Connections Remove (`:145`) → "Remove connection?" dialog, exact copy; on `404` → `connections.loadAll()` and no toast; other errors → the Screens toasts; the live-close watcher (`:295-298`) kept for both. Data: `DELETE /v1/connections/{id}`, `GET /v1/connections`, `GET /v1/connections/pending` (as built, no backend box). Verify: ui-tests U3, U4.
- [x] **W6** — DONE: `src/main-app/content/help/faq.js:225` (§Help impact text, exact). — `content/help/faq.js:225` — replace the last sentence of "How do connections work?" with the parent's §Help impact text (exact). Verify: Help page shows it.
- [x] **W7 spec** — DONE: `wna_orchestration/specs/features/wna-features.md:3088` (§30.1), `:3108` (§30.4), `:3114` (§30.5 Cancel dialog), `:3120-3121` (§30.6), `:3261-3262` (§32.7), `:3279` (§33.1). — Update `specs/features/wna-features.md` §30.1, §30.4, §30.6, §32.7, §33.1 per parent §Contracts touched. Cite `file:line`. Consumes W1–W6, B4.

### Who / what / waits on
| Box | Needs from backend | Waits on |
|---|---|---|
| W1, W2 | `404 not_a_connection` body | B4 |
| W3, W4, W5, W6 | nothing new (as-built endpoints) | — |
| W7 | — | W1–W6, B4 |

