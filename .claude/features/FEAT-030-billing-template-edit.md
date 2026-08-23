# FEAT-030 — web slice (admin-app): edit active billing templates

**Parent (canonical spec, design D1–D6, probe evidence):**
`wna_orchestration/features/FEAT-030-billing-template-edit.md` — read it first; this file is only
the local checklist. Do not restate the parent here; decisions live in `wna_orchestration/decisions.md`
(2026-08-23 FEAT-030 entry). Endpoint surface (incl. the new PATCH fields and `active_subscriptions`
row field once the backend slice lands): `wna_orchestration/specs/api/admin-api.md` §12.5.

## User flows (this project's part)
- Free user / Pro user / Team owner / Team member: n/a — no main-app surface; the re-price is
  passive for end users (parent).
- Admin (billing manager): implement the catalog edit affordance — edit price and/or title on a
  template row (parent D1); a price change opens the existing ConfirmDialog naming the
  `active_subscriptions` count ("N active subscriptions will renew at the new price"), title-only
  edits save without the dialog (parent D5); surface 409 `paywiser_rejected` vendor detail on
  failure (parent D3).
- Unauthenticated / not-entitled: n/a — admin-app auth gates apply unchanged.

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
   (owner directive 2026-08-19). This repo has no automated tests: the concrete checks are
   `npm run build:admin` passing plus the manual TCs you add to
   `wna_orchestration/specs/tests/wna-test-cases.md`.

## Checklist
- [ ] admin-app catalog: edit affordance on template rows for price and title (parent D1) — reuse
      existing components/patterns per this repo's Mandatory Rules (ask before creating new ones)
- [ ] Price-change save opens the existing ConfirmDialog with the row's `active_subscriptions`
      count; title-only edits save without the dialog (parent D5)
- [ ] Surface 409 `paywiser_rejected` vendor detail (and 502) to the admin on failure (parent D3)
- [ ] `npm run build:admin` passes
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — admin Billing Templates section:
      edit capability (rule 6)
- [ ] Update `wna_orchestration/specs/tests/wna-test-cases.md` — TCs for price edit + confirm dialog
      (count shown), title-only edit (no dialog), 409 surfacing (rule 6)
