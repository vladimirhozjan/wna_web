# FEAT-082 — web slice: Admin analytics — visitors, marketing sources and system load

- Parent (single source of truth): `wna_orchestration/features/FEAT-082-admin-analytics-visitors-system-load.md`
- Work: parent `## Work breakdown` §web W1–W7. Screens (every state + exact copy): parent `## Screens` S1–S6;
  contracts: `## Design` §Contracts C1 (visit body), C2 (`signup_utm`), C3 (UTM carrier, Google / Apple `state`,
  counted routes), C5 / C6 (admin response shapes); boundaries: §Boundaries (web main-app `visitTracker.js` + auth rows,
  admin-app row) and its "Reuse first" list (incl. the `formatBytes` extraction); flows: §Flows F1–F3, F8; data:
  `## Data contract`; Privacy Policy wording: `## Legal impact` — this slice does not restate them.
- Order (parent Work breakdown): **W1 after backend B1–B3**; **W3 after B2 + B4**; **W4 after B3**; **W5 after B4 +
  Q1**; **W6 after B4 (+ deploy P2)**; **W7 with W3–W6**. **W2 needs only Q2's answer and can run any time.** ui-tests
  U1–U3 wait on W1, W3–W6.
- Open owner questions in the parent `## Questions`: **Q1** decides W5 (Screens S4 is drawn as option A — replace);
  **Q2** decides one §7 line of W2. Build exactly the answered option.
- main-app: no visible UI change except the Privacy Policy text (parent Screens intro). Help impact: n/a. Landing /
  Pricing impact: n/a (parent) — no box.
- New components / models / CSS variables: none (parent Screens); the only new files are `visitTracker.js` (C3,
  infrastructure) and the extracted `formatBytes.js` (§Boundaries "Reuse first").

## User flows (this project's part)
- Free user: on a counted public route each page view sends `POST /v1/visits` with the tab's UTM + entry referrer,
  fire-and-forget, nothing stored on the device (C3, F1); registering in the same tab sends `signup_utm` (F2); Google /
  Apple sign-up carries the UTM in the OAuth `state` suffix (F3); the Privacy Policy shows the D9 text (W2). Nothing
  else visible changes.
- Pro user: same as Free.
- Team owner: same as Free.
- Team member: same as Free.
- Admin (relevant role): viewer+ — Analytics S1 Visitors + S2 Traffic Sources (A1–A4), Dashboard S4 Online Now + Live
  Connections (A6), System Health S5 Server Load + S6 Databases (A7–A10); support+ — User detail S3 Signup Source
  (A5). Each card fails alone with its own Retry (F8).
- Unauthenticated / not-entitled: a visitor sees no banner and gets no cookie / storage key (C3); an admin below the
  page's minimum role keeps today's behaviour (page hidden / `403`) — no new role gate.

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
W1 — main-app counting + signup source (after backend B1–B3):
- [ ] **W1 — `src/main-app/scripts/core/visitTracker.js`** — C3 (UTM once from the first URL, entry referrer host,
  module memory only; no cookie / localStorage / sessionStorage / IndexedDB for anything new).
- [ ] **W1 — counted routes** — `meta.countVisit: true` on the ten C3 routes in `router.js`; call the tracker from the
  existing `afterEach` (`router.js:137-139`); same-path query / hash change not counted (C3).
  Data: request only — `POST /v1/visits` (C1), provided by backend **B1** + **B2**; response ignored.
- [ ] **W1 — `apiClient.recordVisit`** — `POST /v1/visits`, every error swallowed, no toast (§Boundaries, F1).
- [ ] **W1 — `signup_utm` on registration** — `registerUser` (`apiClient.js:172-179`), `googleSso` / `appleSso`
  (`:2091-2097`) (C2). Data: request field `signup_utm`, consumed by backend **B3**.
- [ ] **W1 — Google / Apple `state` suffix** — `googleSso.js:28-32`, `appleSso.js:20-21`; split check in
  `takeGoogleSsoVerifier` (`googleSso.js:57-64`) / `takeAppleSsoNonce` (`appleSso.js:44-51`); `GoogleSsoPage.vue`
  passes the decoded UTM; sessionStorage keeps only the random part; the 1000-character rule (C3, F3).
- [ ] **W1 · Update `wna_orchestration/specs/api/api.md`** — the Google SSO `state` note (C3; parent Contracts
  touched). Cite the orchestration `file:line`.
- [ ] **W1 · Verify** — `npm run build:main`; Chrome on `:5173`: the Network / Application checks of parent W1
  "Verify" (two visits with UTM, none for in-app and `?x=1`, no new cookie / storage key, `google_sso_state` without
  `.`, UTM in `google-sso` via the local mock).

W2 — Privacy Policy, `src/main-app/content/legal/privacy.md` (needs Q2; any time) — each item of parent
`## Legal impact`, wording from there:
- [ ] **W2 · Legal — L3 `**Last updated:**`** → the ship date.
- [ ] **W2 · Legal — §2.6** new bullet **Days of use**.
- [ ] **W2 · Legal — §2.10** replace L140 and amend L142 as written; L141 stays.
- [ ] **W2 · Legal — new §2.12** **Public Website Visits and Sign-up Source**.
- [ ] **W2 · Legal — §3 table** new row (visit statistics, sign-up source, days of use · Art. 6(1)(f)).
- [ ] **W2 · Legal — §4** new bullet **Statistics**.
- [ ] **W2 · Legal — §7 table** the three rows; the "Days of use" wording **per Q2** (A as written; B with "…; when
  you delete your account, they are kept without your identity").
- [ ] **W2 · Legal — §10** the sentence after L355.
- [ ] **W2 · Verify** — `/legal/privacy` renders §2.12, the §3 / §4 / §7 / §10 lines and the new date at desktop +
  500px (Chrome, `:5173`).

W3 — admin Analytics (after backend B2 + B4):
- [ ] **W3 — admin `apiClient.js`** — `getVisitorStats(range)`, `getTrafficSources(range, group)`.
- [ ] **W3 · Screen S1 — Visitors card** — built per parent Screens S1 (first card; range select shared with S2; chart,
  `summary-stats` with wrap, footnote; Loading / Empty / Error + Retry; ≤768 layout).
  Data: `bucket`, `items[].date / visits / visitors`, `totals.visits / visitors / signup_rate` from
  `GET /admin/analytics/visitors` — new, provided by backend **B2** (C5) + **B4** pass-through (C6).
- [ ] **W3 · Screen S2 — Traffic Sources** — built per parent Screens S2 (second on the page; Group by with 8 options,
  default Campaign; none-row copy; "Top {shown} shown." only when `truncated`; country names via `Intl.DisplayNames`
  as `VatRatesPage.vue:77`; `DbIpAttribution` under *Country*; ≤768 Visits column hidden; Loading / Empty / Error +
  Retry). Page order after the change as Screens S2 last line.
  Data: `utm`, `rows[].label / sublabel / none / visits / visitors / signups / signup_rate / share`, `shown`,
  `truncated` from `GET /admin/analytics/traffic-sources` — new, provided by backend **B2** (C5) + **B4**
  pass-through (C6).
- [ ] **W3 · Verify** — `npm run build:admin`; `:6173` desktop + 500px with seeded data: each group, empty range, an
  error (stop user_service) → Retry (parent W3 "Verify"; local admin via
  `wna_deploy/backend/db_tools/local/reset_admin_local.sh`, OTP per `specs/ci/backend-ci.md` §quick_otp_code).

W4 — admin User detail (after backend B3):
- [ ] **W4 · Screen S3 — Signup Source row** — built per parent Screens S3: `info-row` after Login Provider
  (`UserDetailPage.vue:36-37`), parts joined with " · ", empty parts skipped, "Unknown" when `null`; ≤768 wrap.
  Data: `signup_utm.source / medium / campaign / content / term` from `GET /admin/platform-users/{id}` — new,
  provided by backend **B3** (C5; copied by `user_management_service_impl.cpp:65-66`).
- [ ] **W4 · Verify** — a user with five parts, one with two, one with none — desktop + 500px.

W5 — admin Dashboard (after backend B4; per Q1):
- [ ] **W5 · Screen S4 — Online Now + Live Connections** — built per parent Screens S4: two `Stat`s after DAU
  (`DashboardPage.vue:40-44`), `null` → "—", rest of the card stays; **Q1 A**: remove the *Active Sessions (15m)* Stat
  (`:44`); **Q1 B**: keep it.
  Data: `online_users`, `live_connections` from `GET /admin/dashboard/user-overview` — new, provided by backend
  **B4** (C6, from router **B1** C7); `active_sessions_15min` (Q1 B only) existing,
  `admin_repository_impl.cpp:267-276`.
- [ ] **W5 · Verify** — one open main-app tab → 1 / 1, a second tab → 1 / 2; router stopped → "—", rest intact.

W6 — admin System Health (after backend B4, deploy P2):
- [ ] **W6 — `formatBytes` extraction** — move from `DashboardPage.vue:232-239` to
  `src/admin-app/scripts/core/formatBytes.js`, imported by `DashboardPage.vue` + `SystemHealthPage.vue`; `0` copies
  left (grep).
- [ ] **W6 — admin `apiClient.js`** — `getSystemLoad(range)`, `getDatabaseSizes()`; loaded on page open + Refresh
  only, the 30 s timer keeps refreshing the services only (Screens S5 "Load").
- [ ] **W6 · Screen S5 — Server Load** — built per parent Screens S5 (header + environments caption, range `Select`,
  disk `Alert` warning / critical, `stats-grid` CPU / RAM / Disk / Disk Full In, "Last sample HH:mm", Load (%) and
  Live Connections charts, daily-peak legend + "Peak · Avg" tooltip for `30d` / `12m`; every state + copy; ≤768).
  Data: `environments`, `granularity`, `current.*`, `disk_level`, `disk_full_in`, `load[]`, `connections[]` from
  `GET /admin/system/load` — new, provided by backend **B4** (C6); `environments` set by deploy **P2**.
- [ ] **W6 · Screen S6 — Databases** — built per parent Screens S6 (`Stat size="lg"` All Databases, `DataTable`
  Database · Size · Share; Loading / Error + Retry; ≤768).
  Data: `total_bytes`, `items[].name / bytes / share` from `GET /admin/system/databases` — new, provided by backend
  **B4** (C6).
- [ ] **W6 · Verify** — no samples → empty copy; seeded samples → stats + both charts; `30d` → daily peaks + tooltip
  avg; seeded disk 85 % / 92 % → warning / error Alert; Databases lists five rows; desktop + 500px.

W7 — docs (with W3–W6):
- [ ] **W7 · Update `wna_orchestration/specs/features/wna-features.md`** — admin Analytics, Dashboard, System Health,
  User detail entries. Cite the orchestration `file:line`.
- [ ] **W7 · TC report** — a `## TC report` section in this file listing the new / stale TCs for ui-tests (never edit
  `wna-test-cases.md`).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the screen at desktop + 500px, the Network request, the rendered policy) and
   confirm it.
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
   Exception: `specs/tests/wna-test-cases.md` is authored by wna-ui-tests only — list TCs in the TC report instead.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Here: `npm run build:main` / `build:admin` and the Chrome checks of the screens you
   touched. The full regression suite is run by the OWNER before deploy — never by the implementer.
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
