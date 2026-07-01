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
  (country + state, required for VAT)** → call subscribe → redirect to Paywiser `checkout_url`.
- **Pro / Team subscriber** — Settings shows active plan + **expiration date**, a **Cancel** section
  (access until expiration), and **Change plan** (Pro↔Team / monthly↔yearly — "takes effect at renewal"
  copy). On checkout success return, run **forced refresh** (JWT refresh + `authModel.loadUser()`) so
  the new `tier` shows immediately.
- **Lapsed / cancelled** — Settings reflects Free again after expiry; **re-subscribe** re-enters the
  upgrade flow.
- **Team owner / member** — n/a for billing UI (v1 Team = single-seat self-purchase); no seat management UI.
- **Admin (support/admin)** — admin-app: new **Payments/VAT report** page (year/month filter, per-country
  VAT columns) + user-detail additions (subscription **expiration**, **invoices** list, **all
  payment-request statuses**, **full-refund** button [money-only], **edit-expiration** control). Existing
  set-tier control unchanged.
- **Unauthenticated** — public `PricingPage` shows USD Pro/Team; CTAs route to sign-up then the in-app
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
- [ ] `flagsModel` gate: payment UI visible only when `hasFlag('beta') && hasFlag('payments')`.
- [ ] Settings "Update plan": Upgrade (per plan/period), **country+state address capture** (reuse existing
  inputs — ask before new components), Cancel section, Change-plan ("at renewal" copy).
- [ ] `paymentModel.js` + `apiClient.js` functions for subscribe/status/cancel/change-plan (try-catch-
  `normalizeError` pattern).
- [ ] Checkout redirect to Paywiser `checkout_url`; success/failure return pages.
- [ ] **Forced refresh** on success return — JWT refresh + `authModel.loadUser()` so `tier`/`flags` update.
- [ ] `PricingPage` CTAs wired to the in-app flow when flags on (keep "Coming soon" otherwise).
### admin-app (oversight)
- [ ] **Payments/VAT report** page (year/month filter, per-country VAT) — mirror `AuditLogPage`/`DataTable`
  + `Pagination`; route + `SidebarNav` entry (admin role).
- [ ] User-detail additions (`UserDetailPage.vue`): subscription expiration, invoices list, all
  payment-request statuses, **full-refund** button (money-only), **edit-expiration** control.

## Spec sync (orchestration homes — REQUIRED, not deferrable)
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — Settings "Update plan" (upgrade/cancel/
  change-plan, flag gate) + admin Payments/VAT report + user-detail payment additions.
- [ ] (Endpoint shapes are backend-owned in `specs/api/*` — reference, do not restate; if the web work
  reveals a needed shape change, coordinate with the backend slice which owns that spec edit.)

## Slice doc
- [x] Local web slice exists (develop-a only) and points to FEAT-006 by ID → this file.

---

## Acceptance / gates (this repo's portion)
- [ ] With `beta`+`payments`: Settings shows Upgrade → address (country/state) → Paywiser checkout;
  without either flag, no payment UI (PricingPage stays "Coming soon").
- [ ] After checkout success, forced refresh updates the visible tier without re-login.
- [ ] Subscriber sees plan + expiration + Cancel + Change-plan ("at renewal").
- [ ] admin-app Payments/VAT report filters by year/month with per-country VAT; user-detail shows
  expiration + invoices + all payment statuses + refund + edit-expiration.
- [ ] `specs/features/wna-features.md` updated — cite `file:line`. No new component/CSS added without approval.
