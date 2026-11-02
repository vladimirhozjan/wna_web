# FEAT-082 — web slice: Admin analytics — visitors, marketing sources and system load

- Parent (single source of truth): `wna_orchestration/features/FEAT-082-admin-analytics-visitors-system-load.md`
- Work: parent `## Work breakdown` §web W1–W7. Screens (every state + exact copy): parent `## Screens` S1–S6;
  contracts: `## Design` §Contracts C1 (visit body), C2 (`signup_utm`), C3 (UTM carrier, Google / Apple `state`,
  counted routes), C5 / C6 (admin response shapes); boundaries: §Boundaries (web main-app `visitTracker.js` + auth rows,
  admin-app row) and its "Reuse first" list (incl. the `formatBytes` extraction); flows: §Flows F1–F3, F8; data:
  `## Data contract`; Privacy Policy wording: `## Legal impact` — this slice does not restate them.
- Order (parent Work breakdown): **W1 after backend B1–B3**; **W3 after B2 + B4**; **W4 after B3**; **W5 after B4**;
  **W6 after B4 (+ deploy P2)**; **W7 with W3–W6**. **W2 can run any time.** ui-tests U1–U3 wait on W1, W3–W6.
- Owner answers (parent `## Design` Answers, `decisions.md` 2026-11-02 FEAT-082): **Q1 = A** — Online Now replaces
  *Active Sessions (15m)* (W5, as Screens S4); **Q2 = B** — the §7 "Days of use" wording "kept without your identity"
  (W2); **Q3 = B** — no notice to users, only the "Last updated" date (W2).
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
- [x] **W1 — `src/main-app/scripts/core/visitTracker.js`** — C3 (UTM once from the first URL, entry referrer host,
  module memory only; no cookie / localStorage / sessionStorage / IndexedDB for anything new). —
  `visitTracker.js:7-22` (read once at module load, memory only), `:38-42` (send). Chrome: no new storage key.
- [x] **W1 — counted routes** — `meta.countVisit: true` on the ten C3 routes in `router.js`; call the tracker from the
  existing `afterEach`; same-path query / hash change not counted (C3). — `router.js:30,35,36,77,82,86,90,99,104,108`
  (meta), `:145` (afterEach), `visitTracker.js:40` (`START_LOCATION` = first view always counts; same `path` skipped).
  `/help/connect-ai` counted too (Q2 = A, triage J736): `router.js:95`; Chrome: one `POST /v1/visits`
  `{"path":"/help/connect-ai"}` → 204.
- [x] **W1 — `apiClient.recordVisit`** — `POST /v1/visits`, every error swallowed, no toast. — `apiClient.js:173-179`
  (plain `fetch` + `.catch(() => {})`, so a blocked request never reaches the httpApi interceptors / offline banner).
- [x] **W1 — `signup_utm` on registration** — `registerUser` / `googleSso` / `appleSso` (C2). — `apiClient.js:181-187`,
  `:2104-2109`; `authModel.js:81` (tab UTM on register). Chrome: register from
  `/register?utm_source=youtube&utm_medium=video&utm_campaign=launch-2026&utm_content=reel-03&utm_term=gtd` → admin
  `GET /admin/platform-users/{id}` returns all five parts.
- [x] **W1 — Google / Apple `state` suffix** — `googleSso.js:22-37` (`ssoState` incl. the 1000-character rule,
  `splitSsoState`), `:79-86` (split check), `appleSso.js` (same helpers in `getAppleAuthUrl` / `takeAppleSsoNonce`),
  `GoogleSsoPage.vue:100` (decoded UTM → sign-in). Chrome: `google_sso_state` / `apple_sso_state` hold no `.`, the sent
  state carries the suffix, verifier / nonce still match, a bad or foreign suffix → `utm: null`, UTF-8 values round-trip.
- [x] **W1 · Update `wna_orchestration/specs/api/api.md`** — Google SSO `state` note. — `specs/api/api.md:344,352`.
- [x] **W1 · Verify** — `npm run build:main` green. Chrome `:5173`: `/?utm_source=youtube&utm_campaign=x` → `/pricing`
  → two `POST /v1/visits` with `{"path":…,"utm":{"source":"youtube",…,"campaign":"x"}}` and status 204 (read from
  a page-level `fetch` wrapper; the extension's network list showed a spurious 503 while user_service logged 204);
  `/pricing?x=1` and `/settings` → none; no new cookie / storage key. Google sign-up via the local mock after
  `/?utm_source=youtube&utm_medium=video&utm_campaign=sso-check&utm_content=reel-07&utm_term=gtd` (rerun after
  deploy fixed the mock): new account `login_provider: google`, admin `GET /admin/platform-users/{id}` →
  `signup_utm` with all five parts; Analytics Traffic Sources shows `sso-check` with 1 signup.

W2 — Privacy Policy, `src/main-app/content/legal/privacy.md` (any time) — each item of parent
`## Legal impact`, wording from there:
- [x] **W2 · Legal — L3 `**Last updated:**`** → the ship date. — `privacy.md:3` (November 2, 2026).
- [x] **W2 · Legal — §2.6** new bullet **Days of use**. — `privacy.md:84`.
- [x] **W2 · Legal — §2.10** replace L140 and amend L142 as written; L141 stays. — `privacy.md:141,143` (142 unchanged).
- [x] **W2 · Legal — new §2.12** **Public Website Visits and Sign-up Source**. — `privacy.md:158-162`.
- [x] **W2 · Legal — §3 table** new row. — `privacy.md:181`.
- [x] **W2 · Legal — §4** new bullet **Statistics**. — `privacy.md:199`.
- [x] **W2 · Legal — §7 table** the three rows, Q2 = B wording. — `privacy.md:311-313`.
- [x] **W2 · Legal — §10** the sentence after L355. — `privacy.md:367`.
- [x] **W2 · Verify** — Chrome `:5173/legal/privacy`: all eleven new strings present, §2.12 and the §7 rows read well at
  desktop and at 500px (iframe, no horizontal overflow).

W3 — admin Analytics (after backend B2 + B4):
- [x] **W3 — admin `apiClient.js`** — `getVisitorStats(range)` `apiClient.js:506`, `getTrafficSources(range, group)` `:515`.
- [x] **W3 · Screen S1 — Visitors card** — `AnalyticsPage.vue:5-35` (first card, range select shared with S2, Line
  chart Visits filled / Visitors, `summary-stats` Visits · Visitors · Signup Rate with `flex-wrap`, footnote; Loading /
  "No visits in this period." / "Couldn't load visitors." + Retry). Week buckets label the Monday, month buckets
  "Dec 2025".
- [x] **W3 · Screen S2 — Traffic Sources** — `AnalyticsPage.vue:37-80` (plain section, range caption, Group by with
  8 options default Campaign, `DataTable`, none-row copy, "Top {shown} shown." `:76`, `Intl.DisplayNames` `:310`,
  `DbIpAttribution` only for Country `:78`, numbers right-aligned, ≤768 Visits column hidden `:649-650` and Group by
  full width). First column is titled after the group (as AI Usage) instead of "Name". Page order Visitors · Traffic
  Sources · Signup & Growth · … unchanged otherwise.
- [x] **W3 · Verify** — `npm run build:admin` green. Chrome `:6173` (viewer JWT minted with the local secret of
  `wna-ui-tests/tests/helpers/admin.ts`, no admin reset needed): all 8 groups render with the right columns (e.g.
  Country "Slovenia / Unknown / Austria" + DB-IP line; Referrer "Direct"; Campaign "No campaign", "x / youtube");
  90d → 14 weekly points, 12m → 12 monthly; error forced by an invalid `range` → both cards show their own message,
  Retry reloads; empty + truncated states via component state; desktop and 500px clean.

W4 — admin User detail (after backend B3):
- [x] **W4 · Screen S3 — Signup Source row** — `UserDetailPage.vue:40-43` (after Login Provider), `:557-561` (parts
  joined with " · ", empty skipped), "Unknown" in tertiary; value right-aligned, wraps (`overflow-wrap: anywhere`),
  label kept on one line.
- [x] **W4 · Verify** — support JWT: five parts "youtube · video · launch-2026 · reel-03 · gtd", three parts
  "reg-… · launch · reg-…", none "Unknown" — desktop and 500px.

W5 — admin Dashboard (after backend B4; Q1 = A):
- [x] **W5 · Screen S4 — Online Now + Live Connections** — `DashboardPage.vue:44-45`; *Active Sessions (15m)* removed
  (`grep active_sessions_15min src/admin-app` → 0).
- [x] **W5 · Verify** — one main-app tab → Online Now 1 / Live Connections 1; second tab → 1 / 2; `null` values
  (set in the model — I do not stop processes) → "—" with the rest of the card intact; 500px 3 per row.

W6 — admin System Health (after backend B4, deploy P2):
- [x] **W6 — `formatBytes` extraction** — `src/admin-app/scripts/core/formatBytes.js`, imported by
  `DashboardPage.vue:184` + `SystemHealthPage.vue:176`; the Dashboard copy is gone. `ContentBrowserPage.vue:392` keeps
  its own, different variant (null → "0 B", no TB) — outside this slice, left as is.
- [x] **W6 — admin `apiClient.js`** — `getSystemLoad(range)` `apiClient.js:157`, `getDatabaseSizes()` `:166`;
  `SystemHealthPage.vue:277` `refreshAll` on open + Refresh, `:313` the 30 s timer refreshes the services only.
- [x] **W6 · Screen S5 — Server Load** — `SystemHealthPage.vue:86-145`: header + environments caption, range
  `Select`, disk `Alert` warning / critical, `stats-grid` CPU / RAM / Disk / Disk Full In, "Last sample HH:mm", Line
  **Load (%)** `:135` (y 0–100) and **Live Connections** `:140`; daily points (30d / 12m) plot the peak with legend
  "… (daily peak)" and tooltip "Peak … · Avg …" (`:259-322`); charts 260px, ≤768 200px (`:549,588`); Loading /
  Empty / Error + Retry. Shared chart setup moved to `src/admin-app/scripts/core/chartTheme.js` (Q1 = A, triage
  J736): `ChartJS.register`, `chartColors`, `baseOptions`, imported by `AnalyticsPage.vue:184` and
  `SystemHealthPage.vue:188` (`grep getCssVar|ChartJS.register src/admin-app` → only `chartTheme.js`). **Deviation:**
  the Disk line uses `--color-info` (`:288`) instead of Screens' `--color-warning` — in both themes `--color-warning`
  equals `--color-action` (dark `#fbbf24`, light `#d97706`), so CPU and Disk would be the same colour; `chartColors`
  therefore also reads `--color-info` (existing token, no new variable).
- [x] **W6 · Screen S6 — Databases** — `SystemHealthPage.vue:137-160` (`Stat size="lg"` All Databases, `DataTable`
  Database · Size · Share, Loading / Error + Retry, names wrap).
- [x] **W6 · Verify** — `npm run build:admin` green. Chrome `:6173`: empty copy, stats, warning / critical Alert,
  "Not growing" / "~14 months" / "~1 day", Databases lists the five local DBs, error + Retry on both cards (Alert
  spanned past the card padding — fixed with `box-sizing` in `Alert.vue:57`, its first user); with the local samples
  24h shows both charts (CPU / RAM / Disk distinct, Connections / Users Online); 30d → `granularity: day`, legend
  "CPU (daily peak)" …, hover tooltip "Connections: Peak 10 · Avg 7", "CPU: Peak 30 % · Avg 20 %"; desktop
  (1280px, 260px charts) and 500px (200px charts, no overflow); Analytics renders as before (4 charts, same colours).

W7 — docs (with W3–W6):
- [x] **W7 · Update `wna_orchestration/specs/features/wna-features.md`** — User detail Profile `:1690`, Dashboard
  User Overview `:1943-1945`, System Health Server Load / Databases `:1958-1966`, Analytics Visitors / Traffic Sources
  `:2013-2029` (Server Load charts `:1964`), Legal Pages `:2575-2576`, new §24.8 Visit Counting `:2639` (incl.
  `/help/connect-ai` `:2644`).
- [x] **W7 · TC report** — below.

## TC report
New TCs for ui-tests (none edited by me):
- Visits: a public page with UTM sends one `POST /v1/visits` per counted view (11 routes incl. `/help/connect-ai`); `?x=1` / hash-only change and in-app
  pages send none; nothing new in cookies / storage.
- Signup source: email registration after a UTM landing → User detail **Signup Source** shows the joined parts;
  without UTM → "Unknown"; Google / Apple: `google_sso_state` / `apple_sso_state` hold no `.`, the sent `state` has
  the suffix, `google-sso` body carries `signup_utm`.
- Analytics: Visitors card (chart, Visits / Visitors / Signup Rate, footnote, empty "No visits in this period.", error
  "Couldn't load visitors." + Retry); Traffic Sources: Group by (8 options, default Campaign), first column titled
  after the group, "No campaign" / "Direct" / "Unknown" rows, country names + DB-IP line only for Country, "Top N
  shown." when truncated, ≤768 no Visits column.
- Dashboard: Online Now / Live Connections (1 / 1 with one tab, 1 / 2 with two), "—" when unavailable.
- System Health: Server Load (range select, "Shared by dev and prod" caption only with > 1 environment, stats, disk
  warning "Disk is filling up" / critical "Disk almost full", "No samples yet…", error + Retry), charts Load (%)
  (CPU / RAM / Disk) and Live Connections (Connections / Users Online); 30 days / 12 months → legend "… (daily
  peak)" and tooltip "Peak … · Avg …"; Databases (total + table).
- Google sign-up after a UTM landing → User detail Signup Source shows the five parts.
- Privacy Policy: §2.12 and the new date render.
Stale TCs: any TC that expects the Dashboard tile **Active Sessions (15m)** (removed, Q1 = A); any TC that expects
the System Health 30 s timer to reload everything (only services now); any TC that reads the Privacy Policy "Last
updated: October 30, 2026" or "We do not use analytics or tracking tools".

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
