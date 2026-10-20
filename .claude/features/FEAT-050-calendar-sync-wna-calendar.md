# FEAT-050 — web slice: WhatsNextAction calendar UX + legal texts (main-app)

**Parent (canonical):** `../../wna_orchestration/features/FEAT-050-calendar-sync-wna-calendar.md` — §User flows,
§Design (D1–D14), §Legal impact. Read it first, plus `specs/features/wna-features.md` §21.11/§21.12 (current card) and
`specs/api/api.md` §Calendar Sync (shapes land there from the backend slice). This file is only this repo's checklist;
nothing from the parent is restated.

**Scope:** main-app Settings Calendar Sync card, the `/google/calendar` return flow, `calendarModel`/settings models +
`apiClient.js`, `content/legal/{privacy,terms}.md`. admin-app: none. Any new component/model needs owner approval
first (CLAUDE.md "Reuse First").

## User flows (this project's part)
- **Free** — n/a — lockout card unchanged (§21.11 Free).
- **Pro** — parent §User flows "Pro user": after the connect return, show the "Create a WhatsNextAction calendar?"
  modal (Yes → create route, success toast, card refresh; No → picker as today); picker entry "+ Create
  WhatsNextAction calendar" only when none exists; calendar-missing card state with **Re-create calendar** + picker;
  "What syncs" text covers the WNA-calendar import, recurring occurrences and Google delete → Trash; disconnect dialog
  says the WhatsNextAction calendar stays in Google; pre-FEAT-050 connections show the existing Reconnect state.
- **Team owner / Team member** — same as Pro (no team-specific UI).
- **Admin** — n/a — no admin-app surface.
- **Not-entitled / blocked** — 403 on create → upgrade modal (existing pattern); 409 `calendar_reauth_required` →
  Reconnect state (existing).

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
- [x] W-1 `apiClient.js`: create-calendar call + the new calendars/status fields (WNA marker, exists, calendar-missing)
  per `specs/api/api.md` §Calendar Sync. — `apiClient.js:1828` `createWnaCalendar()` (403 → upgrade modal via
  `googleConnectError`); `wna` / `calendar_missing` read in `SettingsPage.vue:1153` (`loadCalendarList`), 409
  `calendar_missing` split from reauth at `SettingsPage.vue:1118`.
- [x] W-2 Post-connect modal (D11): shown once after a successful calendar connect return; Yes → create, No → close
  (picker stays on its default). Reuse `Modal`/`confirmModel`; `data-testid`s listed in W-8. — `GoogleConnectPage.vue:47`
  adds `?calendar=connected` on success; `SettingsPage.vue:1156` consumes it once; `SettingsPage.vue:1137` skips the
  modal when the WNA calendar is already selected (owner decision 2026-10-20); modal `Modal` at `SettingsPage.vue:485-491`.
- [x] W-3 Picker entry (D12): "+ Create WhatsNextAction calendar" when no WNA calendar exists; selecting it calls create
  (spinner, revert on error as the existing picker does); hidden once one exists. — `SettingsPage.vue:1100` (option only
  when no `wna`), `:1201` routes it to `onCreateWnaCalendar` (`:1218`); `Select.vue:51,100` optional `option.testid`
  (owner-approved).
- [x] W-4 Calendar-missing state (D10): status line "Calendar was removed in Google" + **Re-create calendar** (create
  route) + picker; no other card actions break. — `SettingsPage.vue:438` status text, `:442-445` missing row +
  Re-create; cleared on select/create/disconnect/downgrade.
- [x] W-5 Texts: "What syncs" summary (D2/D3/D4/D6) and disconnect confirmation (D9: the WhatsNextAction calendar and
  its events stay in Google). — What syncs `SettingsPage.vue:468`; disconnect `SettingsPage.vue:1179`.
- [x] W-6 Legal (parent §Legal impact): rewrite `src/main-app/content/legal/privacy.md` §2.8 (what we read from Google,
  WNA may create a calendar, stored WNA calendar id) and any §2.1/§5.3/transfer/retention rows it affects; update the
  effective/updated date in both texts. — `privacy.md:95-113` (§2.8), `:141` (§3), `:231` (§6), `:244` (§7 retention:
  ids kept after disconnect per `specs/architecture/backend.md` disconnect hook); §2.1/§5.3 needed no change; date
  `privacy.md:3` already October 20, 2026; `terms.md:3` → October 20, 2026.
- [x] W-7 Legal (parent §Legal impact): rewrite `src/main-app/content/legal/terms.md` §2 Google Calendar Sync line
  (dedicated calendar; events created there become actions). The `terms_version` config bump is the deploy slice. —
  `terms.md:44`.
- [x] W-8 Test ids for the ui-tests slice: modal (`calendar-sync-create-modal`, `-create-yes`, `-create-no`), picker
  entry (`calendar-sync-picker-create`), missing state (`calendar-sync-missing`, `calendar-sync-recreate`) — record the
  final ids in wna-features. — `SettingsPage.vue:486,488,489,1100,442,444`; recorded in `wna-features.md:1795-1799`.
- [x] W-9 Update `../../wna_orchestration/specs/features/wna-features.md` §21.11 (and §8.8b if its sync text changes):
  modal, picker entry, missing state, texts, test ids. — `wna-features.md:1757-1799` (§21.11), `:1812-1814` (§21.12
  return query); §8.8b has no sync text → unchanged.
- [~] W-10 `npm run build:main` passes; ask the owner to verify the flows at runtime (CLAUDE.md §4). — build green
  2026-10-20; DEFERRED TO OWNER: runtime check of the modal after connect, picker entry, missing card state, and the
  rendered /legal/privacy + /legal/terms (needs the FEAT-050 backend running locally).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the modal after connect, the picker entry, the missing-calendar card, the rendered
   Privacy Policy / Terms pages) and confirm it.
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
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config the `gcloud/<env>/` manifests.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/GKE/prod** (owner directive). Every run targets the
   local stack (local docker services, local web dev server, local mocks; ui-tests `BASE_URL` = local).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / GKE, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/GKE run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments — dev AND prod manifests/configmaps/scripts —
   and hands over the exact command lines for dev AND for prod. Operator-only steps (GCP/GKE
   provisioning, applying migrations or manifests to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — handed over: <dev command> / <prod command>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
