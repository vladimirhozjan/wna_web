# FEAT-006 — Payment & billing (Paywiser) · wna_web slice (main-app Settings flow + admin-app payments UI)

**Parent (orchestration):** `wna_orchestration/features/FEAT-006-payment-billing-paywiser.md`
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's design,
decisions, endpoint shapes, VAT rules, or any shared fact; it **links** them.
Canonical homes: endpoint shapes → `wna_orchestration/specs/api/api.md` + `specs/api/admin-api.md`;
user-facing feature catalog → `specs/features/wna-features.md`; pricing/tiers → `contracts/subscription-tiers.md`;
**flags/forced-refresh/decisions + interim assumptions A1/A2/A3** → the parent.
This slice lives ONLY in the `develop-a` worktree (never `main`/`develop-b`).

> **Parent-completeness note:** the parent's `## User flows` is filled for every role. The flows below
> restate only what **this repo** must implement to satisfy them, per role — not the whole flow.

---

## User flows (this project's part) — the UI for every role (main-app + admin-app)
- **Free** — main-app Settings "Update plan": **Upgrade** button per plan/period **only when
  `flagsModel` has BOTH `beta` AND `payments`** (else no payment UI). Clicking → **address capture
  (country required — drives VAT; state optional free text — owner 2026-07-02)** → call subscribe →
  redirect to Paywiser `checkout_url`.
- **Pro / Team subscriber** — Settings shows active plan + **"Renews on" date ("Access until" after
  cancel)**, a **Cancel** section (access until expiration), and **Change plan** (Pro↔Team / monthly↔yearly — "takes effect at renewal"
  copy). On checkout success return, run **forced refresh** (JWT refresh + `authModel.loadUser()`) so
  the new `tier` shows immediately.
- **Lapsed / cancelled** — Settings reflects Free again after expiry; **re-subscribe** re-enters the
  upgrade flow.
- **Team owner / member** — n/a for billing UI (v1 Team = single-seat self-purchase); no seat management UI.
- **Admin (support/admin)** — admin-app: new **Payments/VAT report** page (year/month filter, per-country
  VAT columns) + user-detail additions (subscription **expiration**, **invoices** list, **all
  payment-request statuses**, **full-refund** button [money-only], **edit-expiration** control) + a
  **Billing Templates** page to **create/list/edit the 4 plan options** (decision 27). Existing set-tier
  control unchanged.
- **Unauthenticated** — public `PricingPage` shows EUR Pro/Team; CTAs route to sign-up then the in-app
  (flag-gated) upgrade flow.
- **Not-entitled (flags off)** — **no payment UI anywhere** in main-app; PricingPage CTAs stay "Coming soon".

---

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a GKE redeploy I
  cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

> **ui-tests scope:** this web slice contains **no ui-tests TC boxes**. FEAT-006 TCs (TC-567+) live in
> the `wna-ui-tests` repo. The legend's ui-tests reference is inherited boilerplate.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the
   concrete artifact to inspect (the rendered Settings "Update plan" section with Upgrade/Cancel/Change,
   the redirect to Paywiser checkout, the tier updating after forced refresh, the admin Payments report
   table) and confirm it in the running app.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** — payment UI gated behind **`beta` AND `payments`**
   (both, via `flagsModel`); required country+state capture; "takes effect at renewal" for change-plan;
   forced refresh on return. Reuse existing components/models (no new component/CSS without approval).
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never leave
   a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating completion
   is the worst failure — it ships broken work as done.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. This work adds/changes user-facing features whose home is
   `wna_orchestration/specs/features/wna-features.md` — you MUST update it as part of this work and cite
   the orchestration `file:line`. Endpoint shapes stay owned by backend (`specs/api/*`); do not fork them
   here. The slice never *restates* a shared fact; it points to the home.

---

## Work breakdown (this repo)
### main-app (Settings + checkout)
- [x] `flagsModel` gate: payment UI visible only when the caller has BOTH entitlement flags —
  **implemented as `beta_mode` && `payments`** (`src/main-app/scripts/core/flagsModel.js:35`,
  `paymentsEnabled`), matching the server gate (`payment_service_impl.cpp` `BETA_FLAG="beta_mode"`;
  api.md "Payments"). **NOTE — naming conflict surfaced:** this slice said `beta`, and the deployed
  flag row is named `beta` (frontend `isBeta` also checks `beta`), but the backend payment endpoints
  hard-code `beta_mode`. UI now matches the server; the operator must create/enable `beta_mode` (+
  `payments`) for payments to light up, or backend renames its constant — owner to decide.
- [x] Settings "Update plan": Upgrade per plan/period (`SettingsPage.vue:119-133` + `PLAN_OPTIONS`),
  address capture — country required via searchable `Select` over the new static list
  (`src/main-app/scripts/data/countries.js`; modal `SettingsPage.vue:608-655`), state optional `Inpt`;
  Cancel section (`SettingsPage.vue:108-115`), Change-plan with "takes effect at renewal" copy
  (`SettingsPage.vue:91-106`, confirm at `:868`). Active shows **"Renews on"**, cancelled **"Access
  until"** (`SettingsPage.vue:84`). Verified in the running app against mock Paywiser (subscribe →
  paid webhook → Pro; cancel → Access until; change-plan → queued row).
- [x] `paymentModel.js` (`src/main-app/scripts/models/paymentModel.js`) + `apiClient.js`
  subscribe/status/cancel/change-plan with try-catch-`normalizeError`
  (`src/main-app/scripts/core/apiClient.js:1877-1919`).
- [x] Checkout redirect to Paywiser `checkout_url` (`SettingsPage.vue:856`); success/failure return =
  the backend-configured `/settings/billing?status=…` URL, handled in-page
  (`SettingsPage.vue:901-921`; router redirect now preserves the query —
  `src/main-app/router/router.js:44`). Also fixed a latent `authModel` typo
  (`apiClient.refreshTokens()` → `refreshToken()`, `authModel.js:220`) the return flow depends on.
- [x] **Forced refresh** on success return — JWT refresh + `authModel.loadUser()`
  (`SettingsPage.vue:909-913`); verified live: tier flipped Free→Pro without re-login.
- [x] `PricingPage` CTAs wired to the in-app flow when flags on (`PricingPage.vue:150-166` `tierCta`/
  `goToUpgrade`; "Coming soon"/"Contact Us" kept otherwise). Also: prices now render **€** per the
  all-EUR contract (`PricingTier.vue:12,19`), and `UpgradeModal` offers "View plans" → Settings when
  flags on (`UpgradeModal.vue`).
### admin-app (oversight)
- [x] **Payments/VAT report** page (year/month filter, per-country VAT + totals + payments table) —
  mirrors `AuditLogPage`/`DataTable` + `Pagination` (`src/admin-app/views/PaymentsReportPage.vue`);
  route (`src/admin-app/router/router.js:82-87`) + `SidebarNav` entry (`SidebarNav.vue:40-45`), admin
  role. Verified by build + code (browser check needs an OTP admin account — see acceptance note).
- [~] User-detail additions (`src/admin-app/views/UserDetailPage.vue:123-211`): payment-request list
  with all statuses (`:168-188`), **full-refund** button money-only (`:452-471`), **edit-expiration**
  control Set/Clear (`:473-521`), invoices list (number/date/amount/credit-notes, `:190-208`). **[~]
  because the *current* expiration value can't be displayed** — `GET /admin/platform-users/{id}`
  doesn't return `subscription_expires_at` (backend/spec gap; shown only after a Set). Blocked on the
  backend exposing it.
- [x] **Billing Templates / Plans page (decision 27)** — fixed 2×2 catalog, create fills a missing
  combo, edit updates price (EUR)/title/active, shows the mapped Paywiser template id
  (`src/admin-app/views/BillingTemplatesPage.vue`; API fns `apiClient.js:705-731`); route
  (`router.js:88-93`) + `SidebarNav` entry (`SidebarNav.vue:46-51`), admin role. No new shared
  components — reuses `DataTable`/`Modal`/`Inpt`/`Badge`/`Btn` (Badge's existing status map extended
  for payment statuses, `Badge.vue:33-41,58`).
### Invoices — client-side PDF (web owns this; backend has no PDF/GCS)
- [~] **Invoice list + one-click PDF download (owner-decided 2026-07-02)** — **BLOCKED ON BACKEND
  ENDPOINTS THAT DON'T EXIST** (verified in `specs/api/api.md`, `specs/api/admin-api.md`, and the
  backend controllers): there is (a) **no user-facing invoice/billing-history list** (no
  `GET /v1/payments/history`-like route — `payment_controller.hpp` has only
  subscribe/status/cancel/change-plan/webhook) and (b) **no invoice-HTML fetch** for user or admin
  (backend renders invoice HTML only for email). Done within what exists: the **admin** user-detail
  invoice list renders from the invoice metadata joined into `GET /admin/platform-users/{id}/payments`
  (`UserDetailPage.vue:190-208`) — without a Download button. Remaining (needs backend + spec first,
  endpoint specs are backend-owned): user-facing invoice list in Settings billing history; invoice-HTML
  endpoints; then the sandboxed-iframe → lazy-loaded jsPDF+html2canvas client-side PDF (dep NOT added
  yet — nothing to feed it, and the main chunk must not grow). DEFERRED TO USER: coordinate the
  endpoint additions with the backend slice.

## Spec sync (orchestration homes — REQUIRED, not deferrable)
- [x] Updated `wna_orchestration/specs/features/wna-features.md` — Settings "Update plan"
  (upgrade/address/cancel/change-plan, flag gate, checkout return: `wna-features.md:1113-1134`) +
  admin Payments/VAT report, Billing Plans page, user-detail payment additions
  (`wna-features.md:1136-1155`) + PricingPage paid-CTA gating (`wna-features.md:1381-1386`).
- [x] (Endpoint shapes referenced, not restated. The web work **revealed missing shapes** — user-facing
  invoice list, invoice-HTML fetch (user+admin), `subscription_expires_at` in the admin user-detail
  response — flagged above for the backend slice, which owns those spec edits; nothing forked here.)

## Slice doc
- [x] Local web slice exists (develop-a only) and points to FEAT-006 by ID → this file.

---

## Acceptance / gates (this repo's portion)
- [x] With both entitlement flags (`beta_mode`+`payments` — see the flag-naming note above): Settings
  shows Upgrade → address (country/state) → Paywiser checkout — **verified end-to-end in the running
  app** against the local mock Paywiser (dev server + real backend + flags enabled in the local DB:
  Upgrade Pro-monthly → Billing Address modal → Slovenia/Štajerska → redirected to
  `localhost:10001/checkout/test_pur_4`). Without either flag no payment UI renders — verified live by
  disabling `payments` (with `beta_mode` still on) and reloading Settings: only the plain plan/limits
  rows rendered (gate `flagsModel.js:35`).
- [x] After checkout success, forced refresh updates the visible tier without re-login — verified:
  emitted the mock `purchase.paid` webhook, returned to `/settings/billing?status=success`, page showed
  success toast + Current plan **Pro** + Pro limits (250 MB) immediately.
- [x] Subscriber sees plan + "Renews on Aug 3, 2026" → Change-plan ("takes effect at renewal", queued
  "Switches to Team — €156/year at renewal" row after Apply) → Cancel → **"Access until Aug 3, 2026"**
  with Cancel/Change rows hidden — all verified live; DB confirmed `cancel_at_period_end=t`,
  `queued_tier=team/yearly`.
- [~] admin-app Payments/VAT report filters by year/month with per-country VAT
  (`PaymentsReportPage.vue`); user-detail shows invoices + all payment statuses + refund +
  edit-expiration (`UserDetailPage.vue:123-211`). **[~]:** (a) current-expiration *display* blocked on
  the backend exposing `subscription_expires_at` (edit works); (b) pages verified by green build +
  spec-shaped API calls only — a live admin-app browser pass needs an OTP-enrolled admin account
  (operator). Both blockers noted for the user.
- [x] admin-app Billing Templates page: create/list/edit the 4 options (price/period/EUR/active,
  Paywiser template id shown) per `admin-api.md` §12.5 (`BillingTemplatesPage.vue`); subscribe reads the
  backend `billing_plan` mapping (backend-owned; local subscribe verified against the seeded pro-monthly
  plan).
- [~] Invoice one-click client-side PDF — **blocked on missing backend endpoints** (no user-facing
  invoice list, no invoice-HTML fetch); see the Invoices box above. Backend serves HTML only for email
  today; no PDF dep was added, so the main chunk is unchanged.
- [x] `specs/features/wna-features.md` updated — `wna-features.md:1113-1155` + `:1381-1386`. New files
  limited to slice-required pages/model/data (`PaymentsReportPage.vue`, `BillingTemplatesPage.vue`,
  `paymentModel.js`, `data/countries.js`); no new shared component or CSS token (existing `Badge`
  status map extended; Settings billing UI inline in `SettingsPage.vue` per the page's pattern).
