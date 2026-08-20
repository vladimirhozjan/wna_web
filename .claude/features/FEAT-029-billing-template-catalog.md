# FEAT-029 — Billing-template catalog with assignable pricing slots · wna_web slice (admin-app)

**Parent (orchestration):** `wna_orchestration/features/FEAT-029-billing-template-catalog.md`
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's design
(D1–D7), API surface, or user flows; it **links** them. Endpoint shapes live in the parent `## Design`
→ synced into `wna_orchestration/specs/api/admin-api.md` §12.5 by the backend slice — read them there.

---

## User flows (this project's part) — per role

- **Admin (admin-app, role ≥ admin)** — this repo implements the parent's whole Admin flow UI:
  catalog table (non-hidden default + "show hidden" toggle; row shows title, price, currency, period,
  Paywiser template id, assigned slot, created date), create-template form (price, currency, period
  count + units, title; surfaces the prod period-restriction 400 clearly), hide/unhide (surfacing the
  "assigned — unassign first" rejection), slots panel (4 pricing options: assign to any template incl.
  hidden, unassign, `active` toggle), **no delete and no edit UI anywhere**, and 409
  `paywiser_rejected` display (vendor code + message in the error toast — never "gateway error" for a
  deliberate refusal).
- **Free user (main-app)** — no main-app changes expected: `/v1/plans` shape is unchanged and
  unoffered slots simply don't appear. Verify only (checkbox below).
- **Pro user / Team owner (existing subscriber)** — n/a — grandfathering is backend-side; nothing
  changes visibly in the web app.
- **Team member** — n/a — billing is owner-side; members have no billing surface.
- **Not-entitled / blocked** — main-app subscribe/cancel may now receive a 409 with a generic safe
  message; verify the existing error normalization surfaces that message in the toast (checkbox below).

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

> **ui-tests scope:** this web slice contains **no ui-tests TC boxes**. The legend's ui-tests
> reference is inherited boilerplate.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "build passes". State
   the concrete artifact to inspect (the rendered screen/toast, the request the UI sends) and confirm
   it; this repo has no automated tests, so verify with `npm run build:admin` (and `build:main` if
   touched) + code inspection + the manual test cases you add.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done (the removed delete/edit template UI, old per-slot endpoint paths).
4. **Honor the parent's User flows for every role** (viewer-centric / entitlement rules etc.); don't
   silently implement only the happy path — the rejection surfaces (hide-while-assigned, prod period
   400, 409 vendor reason) are part of the flow.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT, specs, contracts, decisions) — pull the
   authoritative form (exact predicate, response shape, DDL) from its home rather than guessing or
   asking. Reading is unrestricted; only *writing* is scoped (to the spec homes this repo owns). If your
   work changes a fact whose canonical home is a spec in `wna_orchestration` (response shapes →
   `specs/api/*`; SQL DDL / CI → `specs/ci/*`; features → `specs/features/*`; test cases →
   `specs/tests/*`; architecture → `specs/architecture/*`; numbers → `contracts/*`), you MUST update
   that spec file in `wna_orchestration` as part of this work. Editing the spec's orchestration home is
   the documented sibling sync requirement (see this repo's CLAUDE.md) — it is REQUIRED, never
   forbidden, and never "deferred to the user." The local-slice rule forbids only *restating* shared
   facts inside the slice, NOT updating their canonical home. Cite the orchestration `file:line` you
   updated. (Find the home in the orchestration Fact Index.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). This repo has no automated tests — the scoped equivalent is: build
   only the app(s) you touched (`npm run build:admin`, and `build:main` only if main-app changed).
   The full pre-deploy verification is the OWNER's — never the implementer's.

---

## Checklist

### Admin-app — Billing Templates section redesign
- [ ] Catalog table: non-hidden by default, "show hidden" toggle; columns title, price, currency,
      period (count + units), Paywiser template id, assigned slot (or —), created date.
- [ ] Create-template form: price, currency, period count + units, title; prod period-restriction 400
      surfaced as a clear inline error (not a generic toast).
- [ ] Hide/unhide action per template; the "assigned to <slot> — unassign first" 400 surfaced clearly.
- [ ] Slots panel: the 4 pricing options with assigned template; assign (dropdown includes hidden
      templates), unassign, `active` toggle; assigning a hidden template just works (backend
      auto-unhides — reflect the new state after reload/refetch).
- [ ] Delete + edit template UI removed entirely (grep `0` matches for the old delete/update calls in
      the admin apiClient and views).
- [ ] 409 `paywiser_rejected` handling in admin error path: toast/inline shows `vendor_code` +
      `vendor_message`; 502 keeps the generic gateway message.

### Main-app — verification only
- [ ] Verify pricing page / upgrade modal handle a missing plan (unassigned/inactive slot) gracefully —
      expected: it simply isn't offered; `[NA]` with reason if no code change needed.
- [ ] Verify subscribe/cancel error normalization surfaces the 409 generic message in the toast
      (not "gateway error"); `[NA]` with reason if it already does.

### Build + spec sync (rules 2, 6 — cite file:line)
- [ ] `npm run build:admin` passes (and `build:main` if main-app was touched).
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — admin Billing Templates section:
      catalog + slots + hide, delete/edit removed.
- [ ] Update `wna_orchestration/specs/tests/wna-test-cases.md` — TCs for: catalog list + show-hidden,
      create (incl. prod period 400), hide rejection while assigned, slot assign/unassign/active,
      hidden-assign auto-unhide, 409 vendor-reason display.
