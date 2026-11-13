# FEAT-137 slice — wna_web (main worktree)

- Parent: `wna_orchestration/features/FEAT-137-attribution-funnel.md` (FEAT-137) — spec, § Screens (S1–S3), Design (C1–C11), Data contract, Legal impact live there; this slice restates none of it.
- Project: wna_web, `main` worktree only (never develop-a / develop-b)

## User flows (this project's part)
- Unauthenticated: tagged link (`/start?src=…`, `?ref=`, UTM) → source kept in the tab only (no storage, no cookie), carried on visits and on registration (email, Google, Apple); no question asked (parent S1, C3, F1, F2).
- Free: nothing visible changes; the source is never shown to the user.
- Pro / Team owner / Team member: n/a — the source is set once at sign-up; nothing new in their app.
- iPhone / Android sign-up: n/a — the server reads the app User-Agent; no web part.
- Admin (viewer and up): Analytics → Traffic Sources becomes the funnel (S2); support and up: User detail → Signup Source by kind (S3).
- Not-entitled / blocked: n/a — no entitlement change.

## Screens
Built per parent § Screens — one box per screen below (W1 = S1, W3 = S2, W4 = S3), every state and exact copy from the parent.

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

## Checklist (needs backend: W1 ← B2, W3 ← B3, W4 ← B2; W2 needs nothing; W5 with W1–W4)
Test scope: the verifications named per box (build + local browser checks). Existing tests directly affected: none — the parent lists none for web; ids an existing test drives stay stable.
- [x] **W1 — main-app carrier + S1 `/start` (consumes backend B2)**: `visitTracker.js` (`src`, `ref`, `signupRef()`, `ref` on visits), `apiClient.js` `signup_ref` on `registerUser` / `googleSso` / `appleSso`, `googleSso.js` `ssoState` / `splitSsoState` 6-element suffix (5 accepted), the `/start` redirect route in `router/router.js` (parent C3); screen S1 built per parent § Screens (no interstitial, no flash, address bar ends on `/register?src=<x>`, no new element or copy).
  - Data: sends `ref` on `POST /v1/visits` and `signup_ref` on the three registration requests — accepted by the backend box B2 (no field read back).
  - Verify: `npm run build:main`; Chrome on `:5173`: `/start?src=yt-bio` → address bar `/register?src=yt-bio`, the dialog with no landing flash, one `POST /v1/visits` for `/register` with `utm.source = yt-bio`; reload keeps it; `/start` → `/register`; `/pricing?ref=PH` → visit body `ref`; register → request body `signup_ref`; Google sign-up via the local mock carries `ref`; Application tab: no new cookie / storage key.
  - DONE: `src/main-app/scripts/core/visitTracker.js:18` (`src` → `utm.source` when no `utm_source`), `:35` `signupRef()`, `:40-51` `sourceToList` / `sourceFromList` (6 elements, 5 accepted), `:61` `ref` on visits; `apiClient.js:184-190, 2147, 2151` `signup_ref` via `signupFields`; `googleSso.js:23, 34` state suffix; `GoogleSsoPage.vue:100`; `authModel.js` register / SSO pass `{utm, ref}`; route `router/router.js:112-121` (keeps only non-empty `src` / `ref` / `utm_*`). `npm run build:main` green.
  - Chrome `:5173` (2026-11-13): `/start?src=yt-bio&foo=bar` → address bar `/register?src=yt-bio`, Create Your Account dialog, no flash; exactly one `POST /v1/visits` on load, DB `page_visit` row `/register` `utm_source = yt-bio`; in-app nav keeps `utm.source = yt-bio`; `/start?src=` → `/register`, visit without source; `/pricing?ref=%20PH%20` → visit body `"ref":"PH"` (DB `ph`); register via `authModel.registerUser` on `/start?ref=W1-Feat137&utm_medium=bio` → DB `signup_ref = w1-feat137`, `signup_utm_medium = bio`; `ssoState` → `RND.<b64([null×5,"PH"])>`, `splitSsoState` decodes 6 → `{utm:null, ref:"PH"}`, 5 → utm only, bad 6th → none; sessionStorage empty, no new localStorage key. 500px: `/register?src=yt-bio` dialog unchanged.
  - Not run here: the full Google sign-up through the local OAuth mock (it would replace the signed-in session of the shared browser) — the `state` round trip and the `GoogleSsoPage` → `googleSso` wiring are verified above; end-to-end is U1's TC.
- [x] **W2 — Privacy Policy**: the parent `## Legal impact` edits in `content/legal/privacy.md` (L3 date, §2.12 title + paragraphs, §3 row, §4 Statistics bullet, §7 new row) exactly as listed there; ToS: n/a.
  - Verify: `/legal/privacy` shows the new §2.12 title / paragraphs, §3 / §4 / §7 lines and the date — desktop + 500px.
  - DONE: `src/main-app/content/legal/privacy.md:163` §2.12 title, `:165` `ref` tag, `:167` second paragraph, `:169` new third paragraph, `:188` §3 row, `:206` §4 Statistics, `:339` §7 row; L3 date stays November 13, 2026 (= today). Chrome `:5173/legal/privacy` desktop + 500px (iframe; the window could not be resized): every line shows, no horizontal overflow.
- [x] **W3 — admin Analytics S2 (consumes backend B3)**: `AnalyticsPage.vue` built per parent § Screens S2 — `VISIT_RANGES` + This week / Last week, `SOURCE_GROUPS` + Week (after Ad), funnel columns when `sources.funnel`, row names by `kind` / `store` / `none` (Source none → "Direct"), rate captions, `mrr_minor` as `€1,234.50` with `currency` ("—" at 0), Week labels from `from` / `to` + "This week" caption on `current`, footnote from `activation`, empty copies, ≤ 768px hides Visitors + Trial started; every state (loading, empty funnel / other groups, error + Retry).
  - Data: `GET /admin/analytics/traffic-sources` (funnel groups): `label`, `sublabel`, `none`, `kind`, `store`, `visitors`, `signups`, `signup_rate`, `activated`, `activated_rate`, `trial_started`, `paid`, `paid_rate`, `mrr_minor`, top `funnel`, `currency`, `activation.stuff / clarify / days`, `shown`, `truncated` — provided by backend B2 via B3; group `week` adds `week_start`, `from`, `to`, `current` — backend B2 via B3; ranges `this_week` / `last_week` on `GET /admin/analytics/visitors` and `traffic-sources` — backend B2 (B3 passes through). Browser computes nothing.
  - Verify: `npm run build:admin`; `:6173` with local data from U-style seeding: every group, both new ranges, Week rows, an error (stop core) → "Couldn't load traffic sources." + Retry; desktop + 500px.
  - DONE: `src/admin-app/views/AnalyticsPage.vue:211-212` ranges, `:223` Week, `:235-242` funnel columns, `:299-319` row names / captions / week labels (`isSameMonth`), `:66-86` cell captions, `:489-492` MRR (`Intl` en, `currency`), `:91-96` footnote from `activation`, `:64` empty copies, `:672-674` ≤ 768px hides Trial started (Visitors hidden by the existing nth-child(2) rule). Field names checked against `wna_backend/user_service/src/services/visit/visit_service_impl.cpp:251-330`. `npm run build:admin` green.
  - Verified by build + code only: admin-app is never opened in Chrome (owner, 2026-11-04, CLAUDE.md UI Quality); the runtime / 500px / error-state checks are U2's TCs.
- [x] **W4 — admin User detail S3 (consumes backend B2)**: `UserDetailPage.vue` Signup Source by `signup_kind` per parent § Screens S3 table; none → "Direct" in `color-text-tertiary`.
  - Data: `GET /admin/platform-users/{id}` → `signup_kind`, `signup_ref`, `signup_store`, `signup_utm.*` — new fields from backend B2 (copied by admin with no admin change).
  - Verify: users of each kind (UTM five parts, ref, App Store, none) — desktop + 500px.
  - DONE: `src/admin-app/views/UserDetailPage.vue:560-573` value by `signup_kind` (store / utm / ref / none), `:42` "Direct" in `color-text-tertiary`; fields match `wna_backend/user_service/src/db/repos/admin_repository_impl.cpp:120-122` (copied by admin unchanged). `npm run build:admin` green. Runtime per kind: build + code only (admin never in Chrome) — U1's TCs.
- [x] **W5 — docs (with W1–W4)**: update `wna_orchestration/specs/features/wna-features.md` — admin Analytics (funnel, Week, This / Last week), User detail Signup Source, main-app `/start`; list the new TCs the web changes need as a note in this box for ui-tests (web never edits `wna-test-cases.md`).

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

  - DONE: `wna_orchestration/specs/features/wna-features.md:84` (§2.1 `/start`), `:1756` (User detail Signup Source), `:2088-2111` (Analytics ranges, Week, funnel), `:2687` (Privacy §2.12 line), `:2711` (`/start` redirect), `:2789-2796` (§24.8 `ref`, `src`, `/start`, `signup_ref`); `specs/api/api.md:349, 357` (Google SSO `state` 6 elements, 5 accepted — C3).
  - New TCs for ui-tests (web never edits `wna-test-cases.md`): `/start?src=x&foo=y` → URL `/register?src=x` (foo dropped), dialog, no landing flash; `/start` and `/start?src=` → `/register`, detail "Direct"; reload of `/register?src=x` keeps the source; `/pricing?ref=PH` → visit `ref = ph`, register in the same tab → detail `ph · ref link`; Google / Apple sign-up via the local mock after `?ref=` → saved (6-element `state`); Analytics: ranges This week / Last week load (Visitors daily points); Group by Week → one row per week, newest first, "This week" caption, clipped labels; Source rows "Direct", "App Store", "… · ref link"; captions "x.x % of visitors" / "x.x %"; MRR `€…` / "—"; footnote numbers from the API; empty "No visits or sign-ups in this period."; 500px hides Visitors + Trial started; core down → "Couldn't load traffic sources." + Retry; User detail Signup Source per kind (UTM 5 × 100 chars wraps at 500px, ref, App Store, Direct in tertiary).
  - Stale TCs: any TC asserting "Unknown" on User detail Signup Source, "No campaign" in the Source group, or the Signups / Signup Rate headers of Source / Campaign / Ad (parent says none exist).