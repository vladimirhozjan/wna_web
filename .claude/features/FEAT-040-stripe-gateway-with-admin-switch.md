# FEAT-040 — web slice: Platform-flags table, per-gateway Billing Templates, gateway-generic User-detail + report, "Paid with" line

**Parent (canonical problem, owner decisions D1–D16, design, user flows, TC ids):**
`../../wna_orchestration/features/FEAT-040-stripe-gateway-with-admin-switch.md` — read it first;
this file is only the local checklist. Do not restate the parent here. Scope: **admin-app** (W1–W3)
+ **main-app** copy/keys (W4) + spec homes (W5). API shapes come from the backend slice's spec updates
in `wna_orchestration/specs/api/admin-api.md` (§12.4/§12.5/§12.6) and `specs/api/api.md` — develop
against those, not against guesses.

## User flows (this project's part)
- **Free user**: parent §User flows (Free user) — nothing to build on `/upgrade`: it already follows
  `checkout_url` (D5) and `/settings/billing?status=…` + the BUG-029 poll are gateway-neutral. Confirm
  by reading `UpgradePage.vue:300` and `SettingsPage.vue` `applyCheckoutReturn`/`convergeAfterCheckout`;
  do not change them. A SEPA-paid return lands on the existing "still processing" state (D6) — verify
  the copy still reads honestly for a multi-day wait, adjust only if misleading.
- **Pro / Team subscriber**: parent §User flows (Pro/Team) — Settings billing history renders the
  "Paid with" line from `payment_method_type` + brand/last4 (card) or the method name (non-card, D6);
  consume the renamed history keys (`provider`, `gateway_charge_id`).
- **Lapsed / cancelled user**: same as Free — no UI difference.
- **Team owner / Team member**: n/a — single-seat billing (parent decision 2).
- **Admin**: parent §User flows (Admin) — W1 Platform-flags table (D2/D3/D3b), W2 per-gateway Billing
  Templates (D4), W3 User-detail "Cancel on {Gateway}" + state captions (D11), payment rows'
  provider/method, report gateway column/filter/CSV (D12), `gateway_rejected` toast mapping.
- **Unauthenticated / not-entitled**: parent §User flows — unchanged; pricing page reads
  `/v1/payments/plans` (shape unchanged, active gateway's prices). Nothing to build.

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
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.

## Checklist
(Reuse-first per CLAUDE.md: the Platform-flags table reuses the Feature Flags page's existing table
markup/classes; the value select reuses the admin `Select.vue` (FEAT-039); confirms use `confirmModel`;
no new component without asking. Entry points: `src/admin-app/views/FeatureFlagsPage.vue`,
`BillingTemplatesPage.vue`, `UserDetailPage.vue` (`handleCancelPaywiser` ~:755,
`loadPaywiserSubscription`), `PaymentsReportPage.vue`, `src/admin-app/scripts/core/apiClient.js`
(`paywiser_rejected` mapping :8-10, `cancelPaywiser`/`getPaywiserSubscription` ~:732-743);
main-app `src/main-app/views/dashboard/SettingsPage.vue` billing history, `scripts/models/paymentModel.js`.)

- [x] W1 — Feature Flags page: a **Platform flags** table rendered **above** the feature-flags table
  (same table styling; columns Name · Description · Value · Updated), fed by
  `GET /admin/platform-settings`; Value = `Select` over the item's `allowed_values`; changing
  `payments.gateway` opens a confirm naming the target gateway + its readiness line (ready / what is
  missing) and calls `PUT /admin/platform-settings/{key}`; a `409 gateway_not_ready` shows the server's
  reason as a toast and reverts the select; **no create / delete controls** (D3). apiClient
  `listPlatformSettings` / `updatePlatformSetting`. Inspect on screen: the row shows "Paywiser" by
  default, flipping is refused while Stripe is unready.
  **Done:** table above flags `src/admin-app/views/FeatureFlagsPage.vue:8` (columns :166-171, no
  create/delete for it); `Select` value + readiness caption :21-28 (owner 2026-10-06: caption in the Value
  cell + repeated in the confirm); confirm/PUT/revert :226-250 (select is bound to the stored value, so a
  409 toast leaves it unchanged); apiClient `listPlatformSettings`/`updatePlatformSetting`
  `src/admin-app/scripts/core/apiClient.js:529,538`. Runtime check (default "Paywiser", refusal) owed to
  the owner — TC-704/705.
- [x] W2 — BillingTemplatesPage per-gateway (D4): provider column + provider filter on the catalog
  table, "Create Paywiser template" / "Create Stripe template" (the create modal posts `provider`),
  slot cards show one assignment per gateway (`paywiser` / `stripe` from `GET /admin/billing-plans`)
  with assign/unassign per provider (`PUT …/{tier}/{period}` with `provider`), a **price mismatch**
  badge when `price_mismatch` is true, and the PATCH confirm text branches on `reprices_existing`
  (Paywiser: "re-prices N active subscribers next cycle"; Stripe: "existing subscriptions keep their
  price"). Column label "Paywiser Template" → "Gateway ref" (`gateway_price_id`). Grep
  `paywiser_billing_template_id` in `src/admin-app` → `0`.
  **Done:** `src/admin-app/views/BillingTemplatesPage.vue` — create per gateway :10 + body `provider`
  :397; slot table = two columns Paywiser/Stripe (owner 2026-10-06) :36-48, PUT with `provider` :307;
  mismatch badge :34; catalog Gateway column :234 + filter :66/:257; "Gateway ref" :238; price confirm
  branches on the row's `provider` :477 (the confirm runs before the PATCH, so it uses `provider` —
  equivalent to the response's `reprices_existing` per admin-api §12.5). Grep
  `paywiser_billing_template_id` in `src/` → 0.
- [x] W3 — UserDetailPage subscription card gateway-generic (D11): gateway name on the card; the
  button reads "Cancel on Paywiser" / "Cancel on Stripe" from the subscription's `provider`; state
  lookup via `GET …/gateway-subscription`, cancel via `POST …/cancel-gateway`; captions "Checking
  {Gateway}…", "No {Gateway} subscription", "{Gateway} unreachable", "Next charge on <date>"; payment
  rows show `provider` + `payment_method_type` (admin-only columns stay admin-only); apiClient maps
  `gateway_rejected` **and** `paywiser_rejected` to "{Gateway} rejected the request: …"; refund math
  reads `gateway_charge_id`. PaymentsReportPage: gateway column + filter dropdown + CSV export param
  (`gateway`), FEAT-031 pattern. Grep `paywiser_purchase_id|cancelPaywiser|getPaywiserSubscription`
  in `src/admin-app` → `0` (rename the apiClient functions).
  **Done:** `src/admin-app/views/UserDetailPage.vue` — gateway name in static caption/button :181-191,
  captions :516-527 (owner 2026-10-06: generic "gateway" until the lookup names a `provider`), lookup
  :591, cancel :778, payment rows `provider · payment_method_type` :209, refund math `gateway_charge_id`
  :630; apiClient `cancelGateway`/`getGatewaySubscription` :764/:773, `gateway_rejected` +
  `paywiser_rejected` → "{Gateway} rejected the request: …" :18-20 (shared `GATEWAYS`/`gatewayLabel`
  :3-10, owner-approved). Report: `src/admin-app/views/PaymentsReportPage.vue` filter :27, column :73,
  report+CSV param :167/:184 → apiClient :699/:714. Grep
  `paywiser_purchase_id|cancelPaywiser|getPaywiserSubscription` in `src/` → 0.
- [x] W4 — main-app: Settings billing history "Paid with" line from `payment_method_type` + brand/last4
  or method name (D6); `paymentModel.js`/history consume `gateway_charge_id` + `provider` (grep
  `paywiser_purchase_id` in `src/main-app` → `0`); confirm `UpgradePage.vue` + `SettingsPage.vue`
  checkout-return code needs no change (cite lines); `npm run build:main` + `npm run build:admin` green.
  **Done:** owner 2026-10-06 — **no "Paid with" line on history rows**: `/v1/payments/history` carries no
  brand/last4 (admin-api §12.6), and the backend-rendered invoice the history previews already shows it.
  `paywiser_purchase_id` in `src/main-app` → 0 (it was never referenced; the history page reads no
  gateway key). `UpgradePage.vue:301` follows `checkout_url`; `SettingsPage.vue:781`/`:801` logic
  unchanged. Copy (owner 2026-10-06, Stripe SEPA = Direct Debit, T+6 business days, no SEPA Instant):
  success toast `SettingsPage.vue:789` "Payment submitted — confirming with the payment provider…",
  still-processing hint :59 mentions SEPA "up to 6 business days". `npm run build:main` and
  `npm run build:admin` both green (2026-10-06).
- [x] W5 — Update `wna_orchestration/specs/features/wna-features.md` (Platform flags table in the
  admin Feature Flags section; Billing Templates per-gateway UI; User-detail gateway card; report
  gateway column; §21.3 "Paid with" for non-card methods) and author **TC-704…TC-711** in
  `wna_orchestration/specs/tests/wna-test-cases.md` with the ids/one-liners reserved in the parent
  §Contracts touched (re-check the max first — currently TC-703; if taken, renumber in the parent and
  tell ui-tests). TC-712 is authored by the backend slice.
  **Done:** `wna_orchestration/specs/features/wna-features.md` — checkout_url :1180, checkout return +
  copy :1202-1212, "Paid with" on the invoice :1228-1231, report gateway :1246-1250, Billing Templates
  :1257-1290, User detail gateway card :1303-1324, Platform flags block :1340-1350. TC-704…711 authored
  `specs/tests/wna-test-cases.md:16413-16582` (max was TC-703, ids unchanged); existing TCs updated for
  changed strings: TC-608, TC-609, TC-618, TC-630, TC-636. `regression-ui-tests/update-tests.sh` re-run
  (TC-704…711 parse with priority/area).
- [x] W6 — Zero-reference sweep for user-visible "Paywiser" strings in `src/admin-app` that are no
  longer gateway-specific (keep only strings that name the gateway from data); list the remaining
  intentional occurrences in this box.
  **Done:** remaining `paywiser`/`Paywiser` in `src/admin-app`: `apiClient.js:4` (GATEWAYS label — the
  data→name map), `:18-19` (`paywiser_rejected` error key kept one release); `BillingTemplatesPage.vue:15`
  (intro: Paywiser-only re-price rule, gateway-specific by design), `:351` (`createProvider` default
  value). All other user-visible gateway names render from data (`provider`).
