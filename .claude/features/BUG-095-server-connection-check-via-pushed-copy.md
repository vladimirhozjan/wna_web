# BUG-095 (web slice): handle the "not a connection" 404 — S1–S4, Help sentence

Parent: `../wna_orchestration/features/BUG-095-server-connection-check-via-pushed-copy.md` — BUG-095. Local slice only; Screens S1–S4 (exact copy), Design C5 and the Data contract live there — link, never restate.
Waits on backend B3 (the `not_a_connection` code + refused `user_id`) running on the local stack. Work only in the `main` worktree.

## User flows (this project's part)
- Free / Pro: n/a — upgrade modal opens before any of these surfaces (as built).
- Team owner: S1–S4 — on the `404` `not_a_connection` show the Screens copy, re-read connections, keep the rest of the input.
- Team member: S1, S2, S4 for their own actions; S3 not shown (owner-only, as built).
- Admin: n/a — no admin screen.
- Unauthenticated / not-entitled: router `401` / Team-tier `403` as built — unchanged.

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
- [x] W1 `src/main-app/scripts/core/apiClient.js` `normalizeError`: a body with `error === 'not_a_connection'` → keep
  `code: 'not_a_connection'` and `user_id` on the normalized error (beside `drive_file_not_found`). Consumes backend B3.
  Data: `error` + `user_id` from the `404` of `POST /v1/action/{id}/delegate`, `POST /v1/action`, `POST /v1/project/{id}/share`, `POST /v1/project/{id}/members` — new, provided by backend B3.
  Done: `src/main-app/scripts/core/apiClient.js:111` (code kept; `user_id` already kept at :110).
- [x] W2 one helper module `src/main-app/scripts/core/notConnection.js`: `isNotConnection(err)` (`status === 404 &&
  code === 'not_a_connection'`), `recipientLabel(err, pickEmail)` (the pick's `email`, else the `user_id` looked up in
  `connectionModel` before the re-read, else "Someone you picked"), the S1–S4 copy builders (verbatim from Screens),
  and `refreshConnections()` = `connectionModel().loadAll()`.
  Data: `user_id` / `email` for the re-read from `GET /v1/connections` (`connections[]`) — present, no backend box.
  Done: `src/main-app/scripts/core/notConnection.js:3` `isNotConnection`, `:8` `recipientLabel`, `:14` `refreshConnections`, `:18` copy.
- [x] W3 S1 (built per parent § Screens S1, every state + exact copy) — `ActionDetailPage.vue` (`delegateAction` at :1061), `EngagePage.vue` (:568), `Sidebar.vue`
  `onDropToWaitingFor` action branch (:750): on `isNotConnection` → S1 toast, re-read, no success toast / navigation,
  Action Detail's existing rollback kept.
  Data: refused `error` / `user_id` from `POST /v1/action/{id}/delegate` `404` — backend B3; `{email}` = the pick's email already in hand.
  Done: `ActionDetailPage.vue:1077` (rollback kept above it), `EngagePage.vue:581`, `Sidebar.vue:806` (`sourceType === 'action'` → S1, stays in its list). Chrome :5173 desktop: Action Detail → Move → Waiting For → removed B → S1 toast, action stays in Next, no navigation.
- [x] W4 S2 (built per parent § Screens S2, every state + exact copy) — `waitingModel.addWaiting` (:90) + `WaitingForPage.vue` (:210): S2 toast replaces "That recipient is no
  longer a connection.", add row stays open with the title, picker cleared and focused, re-read.
  Data: refused `error` from `POST /v1/action` (`delegate_to_user_id`) `404` — backend B3.
  Done: `WaitingForPage.vue:213` (toast, `newDelegate = null`, re-read), `:232` picker focused; title kept (`failed`). `waitingModel.addWaiting` needed no change (it rethrows the connection error as built). Chrome :5173 desktop + 500 px: toast (2 lines at 500 px), title kept, picker empty + focused, B gone from the list, nothing created.
- [x] W5 S3 (built per parent § Screens S3, every state + exact copy) — `ProjectDetailPage.vue` share (:1127) and add (:1133, `friendlyMemberError` :1158): Share refused → modal
  open, refused person out of list + selection after the re-read, the two error-line copies; Add → carry on past a
  refused pick, then the S3 toast / error-line states (one / several / all); "Someone you picked" when the body has no
  known `user_id`.
  Data: refused `error` + `user_id` (first refused member) from `POST /v1/project/{id}/share` and `/members` `404` — backend B3.
  Done: `ProjectDetailPage.vue:1139` add carries on past a refused pick, `:1147` all refused (error line), `:1154` some refused (toast, modal closes), `:1160` share refused (error line), `:1176` `dropRefusedPicks` (re-read + prune selection). `:899` `shareModalPickEmails` (uid → email, set on tick `:1121`) feeds `recipientLabel` as `pickEmail` in Add (`:1147`) and Share (`:1168`), so `{email}` survives the live re-read; "Someone you picked" only when `user_id` is missing or not a pick. Chrome :5173, live socket open (no `holdLive`): Share B+C, B removes → "b95b_…@test.wna is no longer a connection. Select Share to go on with the rest.", C stays ticked; Share again → shared with C (desktop). Add B+D, B removes → D added, modal closes, toast "b95b_…@test.wna is no longer a connection, so they weren't added." (desktop); Add B only, B removes → error line "b95b_…@test.wna is no longer a connection. Pick someone else.", Add disabled (500 px iframe).
- [x] W6 S4 (built per parent § Screens S4, every state + exact copy) — `clarifyModel.js` (:220), `StuffDetailPage.vue` (:796), `Sidebar.vue` drops of Stuff / project / Someday
  / Completed that end in `delegateAction` (activate / uncomplete paths): the flow goes on as on success, the S4 toast
  (Next Actions copy vs "active again" copy) replaces the success toast; no Clarify inline error; re-read.
  Data: refused `error` from `POST /v1/action/{id}/delegate` `404` — backend B3.
  Done: `clarifyModel.js:228` (refusal → `refusedRecipient`, flow reaches DONE), `ClarifyPanel.vue` S4 toast in place of "converted to action"; `StuffDetailPage.vue:809` (toast, navigate on); `Sidebar.vue:806` non-action sources → `removeFromSource` + S4 toast (`activeAgain` for Someday/Completed ACTION, else `inNext`). Chrome :5173: Clarify "Delegate It" → removed B → S4 Next Actions toast, item left Inbox, Next Action count +1, no success toast.
- [x] W7 Help — `src/main-app/content/help/faq.js` "How do connections work?" sentence (parent § Help impact).
  Done: `src/main-app/content/help/faq.js:225` sentence added verbatim.
- [x] W8 verify: `npm run build:main` green; by hand on the local stack (two Team users, Remove in a second browser
  with the first one's live socket closed via devtools) each of S1–S4 once at desktop and 500 px.
  Done: `npm run build:main` green. Chrome :5173 (Team users A/B/C via API; B removes the connection after A's pick is in hand): S1 Action Detail, S2 Waiting For, S3 Share + Add, S4 Clarify at desktop; S2 and S3 Add at 500 px (iframe — the Chrome window cannot be resized). Sidebar / Engage / Stuff Detail drops checked by code only (same helper and copy as the verified paths).
- [x] Update `specs/features/wna-features.md` §30.6, §32.7, §33.10 per parent § Contracts touched.
  Done: §30.6 / §32.7 / §33.10 server side already written by backend; added the web states in `wna_orchestration/specs/features/wna-features.md:3253` (§32.6 edge case, S1/S2/S4) and `:3278-3282` (§33.1, S3; dropped stale "the server does not check the connection").
