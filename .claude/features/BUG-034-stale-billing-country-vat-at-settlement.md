# BUG-034 — web slice: clear state on country change (D5) + hold the download-sandbox property (D8)

**Parent (canonical problem, root cause, design, locked decisions D1–D8, reconciliations R1–R5):**
`wna_orchestration/features/BUG-034-stale-billing-country-vat-at-settlement.md` — read it first; this
file is only the local checklist. Do not restate the parent here.

**Post-BUG-033 file-location note.** The parent cites `main-app/scripts/core/invoicePdf.js:9` and
`admin-app/scripts/core/invoicePdf.js:8` for D8. After BUG-033 both per-app generators were replaced
by the single shared module **`src/shared/invoicePdf.js`** and the two cited files are deleted (see
the BUG-033 web slice's post-slice note). D8's property now lives at `src/shared/invoicePdf.js:9` —
`sandbox="allow-same-origin"`, no `allow-scripts`. All D8 boxes below target the shared module.

## User flows (this project's part)

- **Free user upgrading after an earlier attempt from another country** (the reported flow) — this
  slice implements D5: switching the country in the `/upgrade` billing form empties the state/region
  input, so the subscribe payload can never pair a new country with the previous country's state.
- **Free user upgrading, first time** — unchanged: the form already posts the entered
  `billing_country` correctly (parent "Frontend" section); nothing to change on this path beyond D5.
- **Pro / Team subscriber at renewal** — n/a — renewal is a backend webhook path with no web surface.
- **Lapsed / cancelled user re-subscribing from a new country** — same as the reported flow: D5
  applies to the checkout form they re-enter.
- **Any user wanting to change their billing address** — n/a — D4: no post-subscribe billing-address
  editor exists and none is to be added. Build nothing.
- **Team owner / member** — n/a (single-seat self-purchase in v1).
- **Admin** — D8 regression gate only: admins open documents in the register and download PDFs; the
  shared generator must keep `sandbox` **without** `allow-scripts`, and the download must still
  render correctly. Verify, do not edit (D8 is already satisfied in code).
- **Unauthenticated / not-entitled** — n/a (payments gated by the `payments` flag; no change).

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

- [x] `src/main-app/views/dashboard/UpgradePage.vue` — add a `watch` on `billingCountry` (`:224`)
      that clears `stateRegion` (`:223`), alongside the existing `watch(paymentsEnabled, …)` at
      `:291`, so the payload (`:259-260`) can never pair a new country with the previous country's
      state (D5). Per-country show/hide of the state field was **rejected** — do not build it.
      Done: `UpgradePage.vue:296-298` — `watch(billingCountry, () => { stateRegion.value = '' })`.
      No show/hide built.
- [x] **D8 — verify, do not edit.** Confirm `src/shared/invoicePdf.js:9` still sets
      `sandbox="allow-same-origin"` **without** `allow-scripts` (see the file-location note above).
      The attribute is already present — this box holds the property, it does not add it. **Do not
      switch it to `sandbox=""`**: the generator reads `iframe.contentDocument` to measure the body
      and pin `#doc-footer`, so an opaque origin would break the PDF download (parent R5).
      Verified: `src/shared/invoicePdf.js:9` `iframe.setAttribute('sandbox', 'allow-same-origin')`;
      grep for `allow-scripts` across `src/` matches only the explanatory comment at
      `invoicePdf.js:4`. All three download callers import the shared module
      (`BillingHistoryPage.vue:99`, `BillingDocumentsPage.vue:156`, `UserDetailPage.vue:464`); the
      per-app copies remain deleted. Not edited.
- [x] **D8 / BUG-033 coordination** — Download still produces a correct PDF in **both** apps
      (main-app billing history; admin-app document register / user detail): correct page count,
      `#doc-footer` pinned, no blank trailing page (parent coordination note — whichever of
      BUG-033/BUG-034 lands second re-verifies the other's download gates). If you cannot drive the
      running apps, mark `[~]` "DEFERRED TO USER" with exact steps — never `[x]` on build success.
      Verified by owner at runtime 2026-08-25 on the local dev servers (main 6111 / admin 7111):
      downloads work on all three surfaces. Code inspection agrees (`invoicePdf.js:30-39` pins
      `#doc-footer`, floor'd `A4_HEIGHT_PX:2` prevents the blank trailing page).
- [x] Update `wna_orchestration/specs/features/wna-features.md:1146` — annotate the billing-address
      form's **State (optional)** field: it is emptied when the country selection changes (D5).
      Cite the updated `file:line` (rule 6). Done: `wna-features.md:1146-1147` — "State (optional;
      emptied whenever the country selection changes …)".
- [x] `npm run build:main` passes. Built + obfuscated 18 files, 2026-08-25.
- [x] `npm run build:admin` passes. Built + obfuscated 28 files, 2026-08-25.
