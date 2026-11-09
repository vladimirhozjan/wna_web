# FEAT-104 — web slice

Parent: `FEAT-104` (`../wna_orchestration/features/FEAT-104-ios-in-app-purchase.md`) — iOS 18: in-app purchase (Pro, Team, AI credits). This slice is the local checklist only; Design (Boundaries, Contracts C1–C16, Flows F1–F10), Data contract, Screens, Legal / Help / Landing impact and decisions D1–D8 live in the parent — read them there, they are not restated here. Item ids (DP/B/W/U/I/T) are the parent's Work breakdown ids. Local stack only. Work ONLY in the `main` worktree. Starts after backend B1–B9 and deploy DP4; deploy DP6 waits on W5. Screens: S7 of the parent § Screens (every state, exact copy).

## User flows (this project's part)
Free / Pro / Team owner / Team member: a user whose subscription is billed by the App Store sees S7 (Plan line, delete-modal line, Billing-history row, per-row currency); web subscriptions are unchanged. Admin (admin-app): App Store label, Refund / Cancel-on-gateway hidden for App Store rows (W3). Not-entitled / blocked: n/a — no change. Unauthenticated: public Pricing footnote (W7), legal and Help texts (W5, W6).

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
- [ ] W1 — `main-app/scripts/models/paymentModel.js` `applyStatus` keeps `provider` (C6, from B5).
  - `SettingsPage.vue` Plan: while `provider === 'app_store'`, the Cancel row (`:143`) is replaced by the S7 line
    `data-testid="plan-app-store"`.
  - Delete modal (`:750`): the existing line only for `paywiser` / `stripe`; the S7 line
    `data-testid="delete-account-app-store"` while App Store and renewing.
  - Unit test (vitest) for both branches. Consumes B5.
  - Screen: S7 Plan + Delete account modal, built per the parent § Screens S7 (every state + exact copy).
  - Data: `provider` (+ `status`, `expires_at`, `cancel_at_period_end`) — `GET /v1/payments/status` — new field `provider` provided by backend B5.
- [ ] W2 — `BillingHistoryPage.vue`: `formatAmount` (`:135`) and the credit-note amount (`:56`) format
  `amount_minor` in the row's `currency` (F9; refunds "−").
  - An `app_store` row: meta "{date} · App Store", not clickable, no Download.
  - Vitest: EUR, USD, JPY; an App Store row has no button. Consumes B3 (row shape) / C7.
  - Screen: S7 Billing history, built per the parent § Screens S7 (every state + exact copy).
  - Data: `amount_minor`, `currency`, `provider`, `invoice` (null for App Store) — `GET /v1/payments/history` — App Store rows provided by backend B3.
- [ ] W3 — admin-app:
  - `scripts/core/apiClient.js` `GATEWAYS` gains `{ value: 'app_store', label: 'App Store' }`;
  - `UserPaymentsPage.vue` / `UserInvoicesPage.vue` hide Refund on `provider === 'app_store'` rows and show
    `store_environment` `Sandbox` as a `Badge`;
  - `UserDetailPage.vue` hides "Cancel on {Gateway}" when the gateway-subscription `provider` is `app_store`.
  - Vitest per hide. Consumes B8.
  - Data: `provider`, `store_environment` — admin user payments / gateway-subscription endpoints — backend B8.
- [ ] W4 — C15 AASA paths in `src/main-app/public/.well-known/apple-app-site-association`; `jq .` passes. Consumed by
  I9 (real links).
- [ ] W5 — `content/legal/terms.md` and `privacy.md` per `## Legal impact`, with "Last updated" = the date of the change
  (no change notice, D8). The same date goes to deploy DP6 `terms_version`.
- [ ] W6 — `content/help/faq.js` per `## Help impact` (6 edited answers + 1 new entry).
- [ ] W7 — `views/public/PricingPage.vue`: the footnote of `## Landing / Pricing impact`.
- [ ] W8 — `specs/features/wna-features.md` §21.3 / §41.6: the S7 lines, from the built code.
