# FEAT-003 — Calendar sync (Google Calendar) · web slice

Parent: `wna_orchestration/features/FEAT-003-calendar-sync.md` (design, user flows, legal impact) +
`wna_orchestration/decisions.md` 2026-06-20, 2026-10-08, 2026-10-12 (S1–S5). Substrate: FEAT-018 (closed) —
`specs/architecture/backend.md` (Google connection), `specs/api/api.md` §Google Connection.
This file is the local slice only — it never restates the parent; read it there.

## Scope (this repo — main-app only)
Settings Calendar-Sync card (connect/disconnect, status, picker, Sync now, "what syncs", Free lockout),
connect flow via the existing `GoogleConnectPage.vue` / `/google/:feature` route, per-row Synced
indicator, legal texts. Ask before any new component/model/CSS var (reuse-first rule).

## User flows (this project's part)
- **Free:** card shows the upgrade lockout (`upgradeModel`/`UpgradeModal`, email-to-inbox §8 template);
  no connect control.
- **Pro (primary):** Connect → consent → callback forwards the browser tz (`?tz`, S1) → JWT refresh →
  connected state; picker (S2), Sync now (S5, disabled while running), "what syncs" summary; Synced chip on
  scheduled items; `dropped_features` warning; 409 → reconnect toast/state.
- **Team owner / member:** same as Pro (personal connection).
- **Admin:** n/a — no admin-app surface.
- **Unauthenticated / not-entitled:** Settings is behind auth; Free → lockout; 403 from consent → lockout.
- **Downgrade Pro/Team → Free:** card flips to lockout after JWT refresh; Synced chips may remain on data
  (backend decides the field).
- **Disconnect / reconnect:** `confirmModel` warning → disconnect → JWT refresh → "Reconnect" state.

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
- [x] Settings Calendar-Sync card (mirror the existing `calendar` card + `SECTION_KEYWORDS` entry in
  `SettingsPage.vue`); status from `GET /v1/google/status` (no connected-email display); reuse the BUG-009
  timezone selector (do not duplicate) — card `SettingsPage.vue:406-477`, keyword `:753`, status load
  `loadCalendarSync` `:1054` (email never rendered); the same `timezone` computed + `timezoneOptions` Select
  in the card `:456` (owner 2026-10-12: same Select, one source). Card hidden unless the `calendar` flag is
  active (`calendarSyncEnabled`, owner 2026-10-12)
- [x] Connect via `startGoogleConnect('calendar')` + `GoogleConnectPage.vue`; callback carries `?tz` (S1);
  show `dropped_features` warning; JWT refresh after connect / disconnect — connect `onConnectCalendar`
  `SettingsPage.vue:1072`; `?tz` `apiClient.js:1726`; dropped warning `GoogleConnectPage.vue:32-35`
  (pre-existing); JWT refresh after connect `GoogleConnectPage.vue:36`, after disconnect `SettingsPage.vue:1098`
- [x] Disconnect with `confirmModel` warning; `errorModel` 409 reconnect toast + Reconnect state —
  `onDisconnectCalendar` `SettingsPage.vue:1083`; 409 → toast + `gcal.reauth` `onCalendarSyncError` `:1045`;
  Reconnect label derived (grant without calendar, or after 409; owner 2026-10-12) `:1031`, `:429-431`
- [x] Calendar picker (`Select.vue`) → `GET /v1/calendar/calendars` / `PUT /v1/calendar/selected` (S2),
  optimistic + `state.saving` (settingsModel pattern) — picker `SettingsPage.vue:445`; optimistic set +
  revert `onSelectCalendar` `:1107`; saving spinner `:443-444`
- [x] "Sync now" button → `POST /v1/calendar/sync` (S5), disabled while running, success/error toast —
  `SettingsPage.vue:467`, `onSyncCalendarNow` `:1123`
- [x] Free upgrade lockout on the card (`upgradeModel`/`UpgradeModal`); **ask** whether a
  `calendarSyncModel.js` singleton is warranted vs folding into `settingsModel`/`calendarModel` — lockout
  `SettingsPage.vue:415-418`, `onUpgradeCalendarSync` `:1136`; downgrade reset watcher `:1384`. Owner
  2026-10-12: no new model — local `gcal` reactive state like Email-to-Inbox's `inbox`
- [x] Per-row "Synced" chip on `CalendarItem.vue` / `Item` from the additive `synced`/`provider` field
  (MetadataRow chip + inline `RecurringIcon` pattern, `CalendarItem.vue:17`); **ask** approval for the
  Google-Calendar brand icon asset — `MetadataRow.vue:59-62` (`isSynced` `:123`), `CalendarItem.vue:18`
  (`isSynced` `:62`). Owner 2026-10-12: reuse the existing `assets/GoogleIcon.vue`, no new asset; both
  gated on the `calendar` flag
- [x] `apiClient.js` fns: calendars list, select, sync now, callback `tz` param — `apiClient.js:1745`,
  `:1754`, `:1763`, `:1726`
- [x] Stable `data-testid`s on connect / disconnect / status / picker / sync-now / lockout / Synced chip
  (ui-tests depends on them; list them in this file when done) — `calendar-sync-card`,
  `calendar-sync-lockout`, `calendar-sync-upgrade`, `calendar-sync-status` (both states),
  `calendar-sync-connect` (Connect/Reconnect), `calendar-sync-picker`, `calendar-sync-timezone`,
  `calendar-sync-what-syncs`, `calendar-sync-now`, `calendar-sync-disconnect` (`SettingsPage.vue:407-472`),
  `synced-chip` (`MetadataRow.vue:59`), `calendar-item-synced` (`CalendarItem.vue:18`)
- [x] Legal L1 — `content/legal/privacy.md`: §2.1 sentence, new §2.x Connected Google services, §3 basis,
  §5.3 Google Calendar API + Limited Use, §6 Google-held events, §7 retention, Last updated — `privacy.md:25`,
  §2.8 `:89` (old §2.8 → §2.9, no cross-refs), §3 `:120`, §5.3 `:159-164`, §6 `:208`, §7 `:219`, `:3`;
  prerendered `/legal/privacy` contains the new text. Wording needs owner/legal review before publish
- [x] Legal L1 — `content/legal/terms.md`: §2 "Google Calendar sync (Pro/Team)", §9 third-party-integration
  clause, Last updated (`terms_version` bump is backend + deploy, lockstep) — `terms.md:44`, §9.7 `:277`,
  `:3`; `terms_version` bump not in this repo (backend + deploy slices)
- [x] `npm run build:main` passes — green 2026-10-12 after all edits (only the pre-existing >500 KB chunk warning)
- [x] Update `specs/features/wna-features.md` (Calendar sync) — `wna_orchestration/specs/features/wna-features.md:563-564`
  (§8.8b Synced), `:1633-1672` (§21.11 Calendar Sync Section)
- [NA] Update `specs/ci/frontend-ci.md` only if build/deploy config changes (else `[NA]`) — no build,
  Docker, K8s or deploy config changed

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
   updated. (Find the home in the orchestration Fact Index.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. `npm run build:main`; no automated tests exist in this repo). The full regression suite is run by the
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
