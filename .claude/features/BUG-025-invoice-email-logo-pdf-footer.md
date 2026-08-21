# BUG-025 — web slice: pin the document footer to the bottom of the A4 page in the client-side PDF

**Parent (the contract):**
`/Users/vladimirhozjan/Documents/wna_orchestration/features/BUG-025-invoice-email-logo-pdf-footer.md`
— problem (B: the PDF snapshots the document at content height so the seller footer floats
mid-page), the D2 owner decision (pin in the PDF generator ONLY — email/web views stay
content-height; applies to invoice AND credit-note PDFs), and the full Design (page math, marker,
v1 fallback) live THERE — read it first.

All work on `main` — never create a branch. Commit prefix `[BUG-025]` (only when the user says commit).

## User flows (this project's part)
Per the parent's User flows; web implements:
- **Pro user / Team owner:** the downloaded invoice PDF (and credit-note PDF — same generator) shows
  the seller footer at the bottom edge of the last A4 page. Historic (v1) documents have no marker →
  PDF unchanged (current flow layout). Email and web document views are untouched by this slice.
- **Admin:** n/a — admin-app document views unchanged; no admin-app work.
- **Free user / Team member / Unauthenticated:** n/a — parent marks these roles n/a (no billing documents).

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
   (owner directive 2026-08-19). This repo has no automated tests — the scoped verification is
   `npm run build:main` plus code inspection; the manual TCs land in
   `wna_orchestration/specs/tests/wna-test-cases.md`. Runtime PDF verification is the owner's — ask,
   don't run dev servers.

## Checklist
- [x] `src/main-app/scripts/core/invoicePdf.js` (`downloadDocumentPdf`): per the parent's Design —
      after the iframe renders, compute A4 page height at 794px width (≈1123px), extend the body to
      whole-page height, and pin the `#doc-footer` element to the bottom of the last page preserving
      the document's 40px side padding. No `#doc-footer` in the document (historic v1 docs) →
      behavior identical to today. Surgical: no new components/models/deps; edit this file only.
      Proof: `src/main-app/scripts/core/invoicePdf.js:2` (`A4_HEIGHT_PX = round(794×297/210)` = 1123)
      and `:30-39` (`getElementById('doc-footer')`; if present: `pages = ceil(scrollHeight/1123)`,
      body `position:relative; height = pages×1123px`, footer `position:absolute; left/right:40px;
      bottom:48px` — 48px mirrors the document cell's own bottom padding (`padding:48px 40px`) so
      the pinned footer reproduces the in-flow offset; if absent, the block is skipped and the flow
      is byte-identical to before). Only this file changed in `src/`.
- [x] `npm run build:main` passes — re-verified 2026-08-21 ("✓ built in 4.02s", obfuscator step OK;
      only the pre-existing >500 kB chunk warning). Runtime PDF check taken over by the owner
      (owner directive 2026-08-21): v2 invoice/credit-note footer at last-page bottom + v1
      unchanged will be owner-verified against the parent's acceptance gates once the BUG-025
      backend v2 templates are deployed.
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` — add/update the manual TCs for this
      slice's part: invoice PDF footer at the bottom of the last A4 page (v2 doc); credit-note PDF
      same; historic v1 document PDF unchanged.
      Proof: `wna_orchestration/specs/tests/wna-test-cases.md:14725` (new "Section 44: Billing
      Document PDF Layout") — TC-624 (v2 invoice PDF footer at last-page bottom), TC-625 (v2
      credit-note PDF same), TC-626 (historic v1 PDF unchanged); numbered after the current max
      TC-623, no duplicates. Regression dashboard data regenerated via
      `regression-ui-tests/update-tests.sh` (579 TCs parsed, Section 44: 3 TCs; `test-cases.json` +
      `test-data.js` updated 2026-08-21).

## Notes
- Depends on the backend slice: only v2 templates emit the `id="doc-footer"` marker. Develop against
  a hand-crafted v2-shaped HTML fixture if backend isn't deployed yet, but the observable artifact
  needs a real v2 document. Order: backend first.
- This slice lives ONLY in the develop-a worktree (house rule); do not copy it to main/develop-b.
