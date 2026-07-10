# FEAT-022 — Admin VAT rates table (read-only + refresh-now) · wna_web slice (admin-app)

**Parent (orchestration):** `wna_orchestration/features/FEAT-022-admin-vat-rates.md` — the design,
owner decisions D1–D5, endpoint/response shapes, and page behavior live THERE. This slice is
**LOCAL** — wna_web's checklist only; it does not restate the parent's design or any shared fact.
Canonical homes: admin endpoint surface → `wna_orchestration/specs/api/admin-api.md` (backend slice
lands the new section — read the shapes there, or from the parent Design until it lands); feature
catalog → `wna_orchestration/specs/features/wna-features.md`; manual QA cases →
`wna_orchestration/specs/tests/wna-test-cases.md`; decision record → `wna_orchestration/decisions.md`
2026-07-10.

Scope in one line: one new admin-app page (VAT Rates: current-per-country default view, Show-history
toggle, client-side country search, Refresh-now button) + two apiClient functions + route/sidebar
registration — behavior and shapes per the parent Design.
Notes: the new `views/VatRatesPage.vue` component is owner-approved via the parent design (D1–D3) —
reuse `DataTable`/`SearchInput`/`Btn`/`Badge`, create no other new components/CSS without asking;
country display names come from the built-in `Intl.DisplayNames` (no new dependency). main-app is
untouched. **Depends on the wna_backend slice** for live endpoints (page can be built against the
parent's response shapes first).

## User flows (this project's part)
- **Free user:** n/a — admin-app only; main-app untouched.
- **Pro user:** n/a — same.
- **Team owner:** n/a — same.
- **Team member:** n/a — same.
- **Admin (role `admin` ≥ 3):** this repo renders the parent's admin flow — sidebar entry
  "VAT Rates" (next to Billing Plans); page shows one row per country (rate %, effective_from,
  source badge, fetched_at) filtered to `current: true` by default; search box filters client-side
  by country code or display name; **Show history** toggle reveals all effective-dated rows;
  **Refresh now** calls the refresh endpoint, shows a success toast with `source` + `upserted`
  count, and reloads the table; errors surface via the standard toaster.
- **Admin `viewer`/`support` (role < 3):** sidebar entry hidden (`NAV_ITEMS` minRole) and the
  router guard redirects direct navigation to the dashboard (`meta.minRole: 'admin'`).
- **Unauthenticated / not-entitled:** standard admin guard — redirect to login (existing
  `router.beforeEach`; nothing new to build beyond registering the route under it).

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
These are non-negotiable:
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

## Checklist
### admin-app
- [ ] `scripts/core/apiClient.js`: `listVatRates()` + `refreshVatRates()` (named exports + entries in
      the default-export object, error-normalized, section comment next to the billing-templates block)
- [ ] `views/VatRatesPage.vue`: current-per-country default view, **Show history** toggle,
      client-side search (country code or `Intl.DisplayNames` name), columns + source `Badge`,
      **Refresh now** `Btn` → success toast (`errorModel().success`) with source + upserted count →
      reload; reuse `DataTable`/`SearchInput`; `<style scoped>` with token variables only
- [ ] `router/router.js`: `/vat-rates` child route (lazy import, `meta: { requiresAuth: true,
      minRole: 'admin' }`) + `components/SidebarNav.vue` `NAV_ITEMS` entry "VAT Rates" next to
      Billing Plans (minRole 'admin', inline SVG icon)
- [ ] Verify live against dev backend: page renders real rows; refresh returns a result toast; role
      `support` account neither sees the nav item nor reaches the route (redirect observed)
### spec sync (orchestration homes this work changes — rule 6)
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — Admin (admin-app) section gains the
      VAT Rates page (precedent: FEAT-006 Payments / Billing Plans entries)
- [ ] Update `wna_orchestration/specs/tests/wna-test-cases.md` — new `(FEAT-022)` section, manual
      admin-app cases starting at TC-589 (compressed Steps/Expected format; "no admin-app harness"
      run-log note per TC-578 precedent)
