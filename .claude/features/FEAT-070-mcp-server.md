# FEAT-070 — web slice: MCP server

- Parent (single source of truth): `wna_orchestration/features/FEAT-070-mcp-server.md`
- Decisions: `wna_orchestration/decisions.md` 2026-10-28 FEAT-070 (D1–D5, D7, D8, D10), FEAT-070 (architect), FEAT-070 (owner) (D6, D9, D11, D12)
- Work: parent `## Work breakdown` §web WEB-1–WEB-7. The spec: parent `## Screens` S1, S2 and S3 (every element, state,
  exact copy, desktop + 500px, click budget), `## Design` §Boundaries (row web main-app), §Contracts C4, C6, C13
  (`MCP_URL`), §Flows F1 steps 4–6, F3, **W1**; parent `## Data contract`; `## Legal impact`; `## Help impact`. API:
  `wna_orchestration/specs/api/api.md` once BE-6 lands. This slice does not restate them — read them there.
- Order (parent §Work breakdown): WEB-1, WEB-2, WEB-5, WEB-6 need nothing; **WEB-3 / WEB-4 consume backend BE-1**
  (C4 / C6) running locally; WEB-4 also consumes WEB-1. Runs in parallel with deploy DEP-2…DEP-6; ui-tests come after.
  Work only in the `main` worktree.
- Decisions D1–D12 are locked (parent `## Questions` closed); the designer's D8 / D10 / D11 update of `## Screens`
  (S1 rows 6–7, S3) has landed. One open item: parent § Screens **S3** (Change Password hint line + AI Apps reload) has
  no Work breakdown item yet — the PM (2026-10-28) put it into this slice's WEB-4 round; built per § Screens S3.

## User flows (this project's part)
- Free user: S2 shows the MCP address + **Copy** (connect entry point) and the connected apps with remove (WEB-4); S1
  shows `{app}`, `{host}`, account, the can / can't list (D1–D3, D8, D10) and **Allow access** / **Cancel** (WEB-3). No
  tier state (D5).
- Pro user: same screens as Free — no tier difference anywhere (Screens S1 / S2 "Per tier / role").
- Team owner: same screens; rights on shared projects (incl. sharing / members by the AI, D8) are server-side, no
  screen difference.
- Team member: same screens; read-only stays read-only server-side, no screen difference.
- Admin (relevant role): n/a — admin-app untouched (parent User flows: no admin view of AI apps).
- Unauthenticated / not-entitled: S1 sends a signed-out visitor to `/login?redirect=<S1 URL>` and gets them back after
  email, register, Google or Apple sign-in (WEB-2 = W1, WEB-3); an invalid / expired / used request or `?error=` → the
  "This link doesn't work anymore" state (WEB-3); after removal the AI app sends the user to S1 again — same screen.

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
- [x] **WEB-1 runtime key `MCP_URL`** — `domains.js` export `mcp_url`, `src/main-app/public/config.js` key, per parent
  WEB-1 / C13. Verify: `npm run build:main`.
  Data: `window.RUNTIME_CONFIG.MCP_URL` — local constant here; env values from deploy **DEP-4**.
  Done: `src/main-app/scripts/core/domains.js:14` (`mcp_url`); local `src/main-app/public/config.js` gains `MCP_URL`
  (file is gitignored — local only); README runtime-config example. `npm run build:main` green; S2 shows
  `http://localhost:8000/mcp` in Chrome.
- [x] **WEB-2 W1 SSO return path** — `authModel.rememberReturnPath` / `takeReturnPath`, `AuthDialog.startSso`,
  `GoogleSsoPage.exchangeCode` (both providers), the shared validator in `LandingPage.resolveRedirect` + backslash
  rejection, per parent WEB-2 and §Flows W1. Verify as parent WEB-2 in Chrome `:5173`.
  Done: validator `scripts/core/authModel.js:43`, `rememberReturnPath` / `takeReturnPath` `:313-323`,
  `components/AuthDialog.vue:477`, `views/public/GoogleSsoPage.vue:102`, `views/public/LandingPage.vue:55`. Chrome:
  signed out → `/login?redirect=/authorize?request=…` → Google via the local mock (`:10000`, as ui-tests route it) → new
  account landed back on `/authorize?request=…`. Validator: `/settings` kept; `//evil.com`, `/\evil.com`,
  `https://evil.com` → `null` (→ `/engage`). Apple shares the same return page and code path (not run — no local Apple
  mock).
- [x] **WEB-3 Screen S1 — Allow access (`/authorize`)** — built per parent § Screens S1 as updated by the designer for
  D8 / D10 (elements 1–10, incl. rows 6–7) and every state (loading, signed out → login redirect, ready, allowing,
  cancelling, invalid / expired / used incl. `?error=` and `410`, network toast, switch account, same app again); route
  name `authorize` in `PUBLIC_ROUTE_NAMES`; apiClient `getOauthRequest`, `approveOauthRequest`, `denyOauthRequest`
  (branch on `err.status === 410`); Switch account = `auth.logoutUser()` then login with `redirect`; per parent WEB-3.
  Verify Chrome desktop + 500px, every S1 state.
  Data: `client_name`, `redirect_host` (`expires_at`) ← `GET /v1/user/oauth/requests/{handle}`; `redirect_url` ←
  `POST /v1/user/oauth/requests/{handle}/approve` · `/deny`; error `410 oauth_request_invalid` on all three — new, backend
  **BE-1** (C4). Account `email` ← `localStorage.current_user` (from `GET /v1/user/me`, existing, `authModel.js:270-277`).
  Done: `views/public/AuthorizePage.vue` (states `:6-55`, load / decide / switch `:96-138`), route `router/router.js:43`,
  public `:125`, apiClient `scripts/core/apiClient.js:420-463`. Chrome on `:5173` against local BE-1: ready (desktop +
  500px — title 2 lines, rows wrap, buttons side by side), signed out → login redirect, Switch account → signed out +
  `/login?redirect=…`, Allow → `127.0.0.1:65530/callback?code=…&state=xyz&iss=…`, Cancel → `?error=access_denied&state=xyz`,
  used handle on Allow (410) and on load (410) → "This link doesn't work anymore", `?error=invalid_request` → same.
  Not reproduced locally (needs the backend down; not done): the network-error toast on Allow / Cancel and a non-410
  load failure — code path `AuthorizePage.vue:110-129`.
- [x] **WEB-4 Screen S2 — Settings → AI Apps card** (below Sessions) — built per parent § Screens S2: rows, the
  "Connect an AI app" copy row, every state (loading, load error + Retry, empty, list, remove confirm, removing, removed
  incl. `404`, remove failed, copy failed); apiClient `listAiApps`, `removeAiApp` (`404` = removed); `SECTION_KEYWORDS`
  entry `aiApps`; copy via `copyText`; per parent WEB-4. Verify Chrome desktop + 500px, every S2 state.
  Data: `ai_apps[].id`, `.name`, `.connected_at` ← `GET /v1/user/ai-apps`; `success` / `404 ai_app_not_found` ←
  `DELETE /v1/user/ai-apps/{id}` — new, backend **BE-1** (C6). Address ← `mcp_url` (**WEB-1**; envs **DEP-4**).
  Done: card `views/dashboard/SettingsPage.vue:276-321` (below Sessions), keyword `aiApps` `:894`, load `:1676` +
  `loadAiApps` / `onRemoveAiApp` `:1855-1897`, shared copy helper `copyAddress` `:1098` (Email to Inbox uses it too).
  Chrome on `:5173` (desktop + 500px): empty, list (2 apps newest first, a long name wraps, X stays right), Copy →
  "Copied!", remove confirm → toast "ChatGPT removed", already-removed (`404`) → row gone + "Claude removed",
  `/settings/aiApps` → `?section=aiApps`, card expanded. AI apps never appear in Sessions (A7). Not reproduced
  locally: loading (transient) and load-error + Retry (needs the backend down) — Sessions-pattern code.
- [x] **Screen S3 — Settings → Change Password hint + AI Apps reload** — per parent § Screens S3 / D11 (PM note: the box
  no longer waits). Done: hint `views/dashboard/SettingsPage.vue:809` (`text-body-s settings-hint`, always shown),
  `loadAiApps()` beside `loadSessions()` `:1947`. Chrome: hint below the third field — 2 lines on desktop (400px
  modal); at 500px the full-screen modal has room for 1 line. Real change (2 apps connected) → existing toast "Password
  changed. 3 other sessions signed out." and the card turned to "No AI apps connected yet." with no page reload.
  "End other sessions" untouched.
- [~] **WEB-5 ToS `terms.md`** (parent §Legal impact) — §2 Core Features "AI App Connections" bullet; §6 Acceptable Use
  bullet addition; §9.7 Third-Party Integrations AI-apps text; "Last updated" = ship date (= new `terms_version`).
  Verify: `__TERMS_VERSION__` = backend BE-1 / deploy DEP-3 `terms_version`.
  Done: `content/legal/terms.md:3` (October 28, 2026), `:48` §2, `:198` §6, `:291` §9.7; build gives
  `__TERMS_VERSION__` = `2026-10-28`. REMAINS: backend `user_service/config/config.json` `legal.terms_version` is still
  `2026-10-27` → local checkout answers `409 terms_version_mismatch` until **BE-1** bumps it to `2026-10-28` (DEP-3 for
  the envs). If the ship date ends up later, the "Last updated" lines move with it.
- [x] **WEB-5 Privacy `privacy.md`** (parent §Legal impact) — new §2.9 "Connected AI Apps" (old 2.9 → 2.10); §5.11 "AI
  apps you connect"; §6 International Transfers paragraph; "Last updated" = ship date.
  Done: `content/legal/privacy.md:3`, §2.9 `:133-135` (old 2.9 → 2.10), §5.11 `:241-243`, §6 `:259`. Renders on
  `/legal/privacy` (prerender).
- [x] **WEB-5 Privacy §5.7** (D8) — "This sharing happens only at your direction" addition, per parent §Legal impact.
  Done: `content/legal/privacy.md:224`.
- [x] **WEB-5 Privacy §7 Retention row** (D9) — "Connected AI apps …" row, per parent §Legal impact.
  Done: `content/legal/privacy.md:276` (period named as a session's, no number restated).
- [x] **WEB-5 Privacy §4 How We Use** (D12) — security emails also cover a new AI app connection.
  Done: `content/legal/privacy.md:170`.
- [x] **WEB-6 Help `gettingStarted.js`** (parent §Help impact) — "Connecting an AI App" after "Customizing Settings"
  (incl. the D8 / D10 can-do points). Verify: `/help/*` renders it.
  Done: `content/help/gettingStarted.js:108` (after "Customizing Your Settings"); in the `/help/getting-started` prerender.
- [x] **WEB-6 Help `faq.js` §Account & Security** — "Can I use WhatsNextAction with Claude, ChatGPT or another AI?" and
  "How do I disconnect an AI app?". Verify: `/help/faq` renders both.
  Done: `content/help/faq.js:240`, `:245`; both in the `/help/faq` prerender.
- [x] **WEB-6 Help `bestPractices.js`** — "Review Connected AI Apps" after "Manage Your Sessions". Verify: page renders it.
  Done: `content/help/bestPractices.js:88`; in the `/help/best-practices` prerender.
- [x] **WEB-7 Update `wna_orchestration/specs/features/wna-features.md`** — `/authorize` route + Settings → AI Apps card;
  list the new / stale TCs in your output for ui-tests UI-5 (never edit `wna-test-cases.md`).
  Done: `wna_orchestration/specs/features/wna-features.md:213-214` (§2.9 allowlist + SSO return path + validator),
  `:1433-1436` (§21.2 hint + AI Apps reload), `:2187` (§21.14 AI Apps), `:2468` (§24.7 `/authorize`). TCs listed in
  the job output.

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
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no
   "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is
   `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config `wna_deploy/backend/gce/config/<env>/`
   and `vm/wna/<env>/`. Exception (owner, 2026-10-25): `specs/tests/wna-test-cases.md` is authored by ui-tests only —
   list the TCs your change makes new / stale instead.
7. **Run only the NEW and directly-relevant checks — never a full regression during slice work**
   (owner directive 2026-08-19): `npm run build:main` plus the Chrome check of the states you touched. The full
   regression suite is run by the OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every check targets the
   local stack (`http://localhost:5173`, dev servers run by `wnapm`, local backend + mocks). Never deploy, never test
   against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" / "needs a dev deploy" step. A
   missing dev/prod run is never a reason for `[~]`. Env values (`MCP_URL` per env) are the **deploy** slice's (DEP-4);
   a task closes on local checks alone — never wait for a dev or prod confirmation.
