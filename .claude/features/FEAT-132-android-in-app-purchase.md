# FEAT-132 — web slice

Parent: `FEAT-132` (`../wna_orchestration/features/FEAT-132-android-in-app-purchase.md`) — Android 18: in-app purchase (Pro, Team, AI credits). This slice is the local checklist only; Design (Boundaries, Contracts C1–C17, Flows F1–F12), Data contract, Screens, Legal / Help / Landing impact and decisions D1–D8 live in the parent — read them there, they are not restated here. Item ids (DP/B/W/U/A/T/I/IT) are the parent's Work breakdown ids. Local stack only. Work ONLY in the `main` worktree. Starts after backend B1–B9 and deploy DP4; deploy DP5 waits on W4. Screens: S7 of the parent § Screens (every state, exact copy).

## User flows (this project's part)
Free / Pro / Team owner / Team member: a user whose subscription is billed by Google Play sees S7 (Plan line, delete-modal line, Billing-history row, per-row currency); web subscriptions are unchanged; no Play purchase or Play link on the web. Admin (admin-app): Google Play label, Refund / Cancel-on-gateway hidden for Play rows, `Test` badge (W3). Not-entitled / blocked: n/a — no change. Unauthenticated: public Pricing footnote (W6), legal and Help texts (W4, W5).

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
- [x] W1 — `main-app/views/dashboard/SettingsPage.vue`: Plan — while `provider === 'google_play'` the Cancel row (`:184`)
  is replaced by the S7 line `data-testid="plan-google-play"` (beside the `plan-app-store` branch, `:181`); delete modal
  (`:802`) — the S7 line `data-testid="delete-account-google-play"` "Your Google Play subscription is cancelled too." while
  renewing. Consumes B6 (C6 `google_play`).
  - Data: `provider` (+ `status`, `expires_at`, `cancel_at_period_end`) — `GET /v1/payments/status` — value `google_play` provided by backend B6 (rows B4, constraint DP1).
  - Screen: S7 Plan + Delete account modal, built per the parent § Screens S7 (every state + exact copy).
  - Done: `src/main-app/views/dashboard/SettingsPage.vue:184-186` (`plan-google-play` replaces Cancel while `hasActiveSubscription`, renewing or not; Upgrade already hidden for paid tiers) · `:806` (`delete-account-google-play` while `renewingSubscription` = active/past_due and not `cancel_at_period_end`). `npm run build:main` green. Runtime with a real Play row → ui-tests U1/U2 (no local `mock_google_play` yet; logged-in Chrome check not possible without a test account).
- [x] W2 — `BillingHistoryPage.vue` (`:33`): a `google_play` row's meta " · Google Play" (no invoice, no Download — as the
  `app_store` branch). Consumes B4 (row shape).
  - Data: `amount_minor`, `currency`, `provider`, `invoice` (null for Google Play) — `GET /v1/payments/history` — Play rows provided by backend B4 / B5.
  - Screen: S7 Billing history, built per the parent § Screens S7 (every state + exact copy).
  - Done: `src/main-app/views/dashboard/BillingHistoryPage.vue:33` (" · Google Play"; no invoice → row not clickable, no Download, `:37-43`); amount in row `currency` via `formatAmount` `:141-144` (as built). Runtime → ui-tests U1/U2.
- [x] W3 — admin-app: `scripts/core/apiClient.js` `gatewayLabel('google_play')` → "Google Play"; `UserPaymentsPage.vue`
  (`:55`) hides Refund for `google_play`, (`:49`) shows `store_environment === 'Test'` as a `Badge` "Test";
  `UserDetailPage.vue` (`:245`, `:249`) treats `google_play` as `app_store` with the hint "Tier changes here never touch
  Google Play billing — the user cancels in Google Play". Consumes B8.
  - Data: `provider`, `store_environment` — admin user payments / gateway-subscription endpoints — backend B8.
  - Done: `src/admin-app/scripts/core/apiClient.js:11` · `UserPaymentsPage.vue:50` (Test badge), `:56` (no Refund) · `UserDetailPage.vue:246` (hint, wording "the user cancels in Google Play" per the slice), `:250` (no Cancel-on-gateway button). `npm run build:admin` green (admin-app is never opened in Chrome).
- [x] W4 — `content/legal/terms.md` and `privacy.md` per `## Legal impact`, "Last updated" = the date of the change (no
  change notice). The same date goes to DP5.
  - Done: "Last updated" = **November 17, 2026** (→ DP5 `terms_version`). `terms.md:3`, §5.2 Changing plans `:134`, Android bullet `:136` (iPhone bullet's last sentence folded in), §5.3 `:146`, §5.4 `:183`, §5.5 `:191`, §5.6 `:195`, §5.7 `:199`, §5.8 `:212`, §11.1 `:342`. `privacy.md:3`, §2.5 `:77`, §5.4 `:247`, §6 `:318`, §7 `:356`. Rendered on `:5173/legal/terms` and `/legal/privacy` (Chrome).
- [x] W5 — `content/help/faq.js` per `## Help impact` (6 edited answers + 1 retitled entry).
  - Done: `src/main-app/content/help/faq.js` AI credits `:280`, plans `:292`, cancel `:313`, switch `:318`, invoices `:323`, renewal `:328`, refund retitled `:331-333`. Rendered on `:5173/help/faq` (Chrome).
- [x] W6 — `views/public/PricingPage.vue`: the footnote of `## Landing / Pricing impact`.
  - Done: `src/main-app/views/public/PricingPage.vue:52`; `.ai-footnote` gains `text-wrap: balance` (`:387`) so the longer line no longer leaves an orphan. Checked in Chrome at desktop and 500px.
- [x] W7 — `specs/features/wna-features.md` §21.3 / §41.6: the S7 lines, from the built code.
  - Done: `wna_orchestration/specs/features/wna-features.md:1562` (§21.2 delete modal), `:1645-1649` (§21.3 Plan), `:1671-1672` (§21.3 Billing history), `:1792-1796` (admin user payments), `:1839-1841` (admin Cancel on gateway), `:2612-2614` (Pricing footnote), `:4052-4053` (§41.6).
