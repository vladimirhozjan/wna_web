# BUG-070 — web slice: Free attach menu (locked Photo/Voice/File) looks bad on desktop and mobile

- Parent (single source of truth): `wna_orchestration/features/BUG-070-free-attach-menu-looks-bad.md`
- Work: parent `## Work breakdown` §web W1–W6. What to build: parent `## Screens` (Proposal, desktop + mobile tables,
  States and copy) and `## Design` (§Boundaries, §Contracts — `useVisualViewport` signature, Dropdown slot props, CSS
  contract table, CaptureBar locked-panel table, test ids — §Flows 1–5 + edge cases). This slice does not restate them —
  read them there.
- Scope: main-app only — `components/Dropdown.vue`, new `scripts/core/visualViewport.js`, `components/BottomSheet.vue`,
  `components/Btn.vue`, `components/CaptureBar.vue` (parent §Boundaries). The new helper file is approved by the parent's
  Design; no other new component / model / CSS variable.
- Order: first — W1, W2, W4 in any order; W3 after W2; W5 after W1 + W3 + W4; W6 last. Then ui-tests U1–U2. No backend /
  deploy work.
- Screens: one surface, the capture bar's Attach menu (desktop popover + ≤ 768 px sheet) — W1, W3, W4, W5 build it, box S1
  checks it.
- Data: existing fields only (parent `## Data contract`) — `subscription_tier` from `GET /v1/user/get`, `payments` in
  `active_flags` (`GET /v1/user/get`) / `flags` (`GET /v1/flags/public`). No new field, no backend box.
- Legal / Help: n/a (parent `## Legal impact`, `## Help impact`).

## User flows (this project's part)
- Free user: in the Inbox, desktop Quick Add and mobile FAB bars, + opens the locked menu per parent `## Screens` —
  readable disabled rows with one icon colour and no hover change, tinted panel with the unchanged line and a full-width
  Upgrade (payments on → upgrade dialog) / Contact Us (off → support email); on a phone the sheet sits above the keyboard,
  scrolls when taller than 70 % of the visible height, and the button is never cut (W1, W3, W4, W5).
- Pro user: menu rows enabled, no locked panel, hover fill + teal icon — identical to today (W5 verify).
- Team owner: same as Pro.
- Team member: same as Pro.
- Any user, other Dropdown menus (Reference card / list, Action / Project detail overflow, Canvas, TagFilter /
  ContextFilter, Move, TopNav): disabled options show no hover fill or teal icon (W1); phone sheets follow the keyboard
  and scroll (W3); otherwise unchanged. BottomSheet surfaces behave exactly as before (W2).
- Admin (relevant role): n/a — admin-app has no capture bar and its own Dropdown (no shared runtime code).
- Not-entitled / blocked: the Free user above is the not-entitled role; no other gate.
- Unauthenticated: n/a — the capture bar is signed-in only.

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

## Checklist
- [x] **W1** — `Dropdown.vue` global item styles: hover fill, hover icon colour and danger hover fill only on
  `:not(:disabled)` rows (parent §Contracts CSS table). Verify exactly as parent W1 (Chrome :5173).
  Done: `src/main-app/components/Dropdown.vue:302,322,330` — written as `:hover:where(:not(:disabled))` so the specificity
  stays as before (a literal `:not()` would tie the scoped danger hovers in `ItemMoveDropdown.vue:153` /
  `ActionDetailPage.vue:2193`). Chrome :5173: Free capture menu, hovering Voice → bg `rgba(0,0,0,0)`, icon equals
  Photo's, cursor default; Pro (enabled) Voice → fill + icon teal. Reference card with disabled Rename not checked —
  test3 has no Reference items and no test data was created; same global selector.
- [x] **W2** — new `scripts/core/visualViewport.js` exactly as parent §Contracts; `BottomSheet.vue` switches to it and
  drops its own `syncViewport` + listeners (behaviour identical). Verify as parent W2.
  Done: `src/main-app/scripts/core/visualViewport.js:4`; `BottomSheet.vue:39`; `syncViewport` in BottomSheet: 0 matches.
  Build green. Chrome 500 px: Clarify BottomSheet opens at 0.700 of the height; viewport 400 → overlay follows (400 px),
  sheet expands as before.
- [x] **W3** (after W2) — `Dropdown.vue` mobile sheet: `useVisualViewport(() => isOpen.value && isMobile.value)` drives
  the overlay's inline `top` / `height`; sheet / header / content CSS per the parent's contract table;
  `data-testid="dropdown-sheet"` on `.dropdown-sheet`; default slot passes `mobile`. Verify as parent W3 (500 × 850 and
  500 × 400; TagFilter, Move, Action-detail overflow sheets look as before).
  Done: `Dropdown.vue:12,18-19,25,64-65` + sheet CSS (overlay left/right, flex column, `max-height: 70%`, header
  `flex-shrink: 0`, content flex/scroll/safe-area). Chrome: 500 × 673 visible → capture sheet 377 px; 500 × 400 → sheet 280
  (70 %), header fixed, content scrolls (300 / 203), CTA reachable and hit-testable. ContextFilter and Notifications
  sheets look as before. Move (`ItemMoveDropdown`) is not mounted anywhere and test3 has no actions, so the Move /
  Action-detail sheets were not opened.
- [x] **W4** — `Btn.vue`: add the `.dropdown-sheet .base-btn:is(...)::after` selector from parent W4 to the ≤ 768 px
  hit-area list. Verify as parent W4 (CTA `::after` ≥ 44 px at 500 px).
  Done: `src/main-app/components/Btn.vue:247`. Chrome 500 px: CTA `::after` 434 × 44 px.
- [x] **W5** (after W1, W3, W4) — `CaptureBar.vue` locked state per the parent's CaptureBar table: `{ close, mobile }`
  slot props, CTA `:size="mobile ? 'md' : 'sm'"` + class `capture-menu__locked-cta`, panel CSS for popover and ≤ 768 px,
  scoped disabled-label colour; copy, handlers and test ids unchanged.
  Done: `src/main-app/components/CaptureBar.vue:55,68-75,607-638`; `max-width: 260px` in CaptureBar: 0 matches.
  Data: `subscription_tier` (`GET /v1/user/get`, existing) via `CaptureBar.vue` `tier`; `payments` (`active_flags` of
  `GET /v1/user/get` + `flags` of `GET /v1/flags/public`, existing) via `flagsModel.paymentsEnabled` — no backend box.
- [x] **S1** Screen — Attach menu (parent `## Screens`), part of W5's verify: built per §Proposal, §Desktop popover,
  §Mobile sheet and every row of §States and copy (Free payments on / off, Pro / Team unchanged, dark theme), exact copy
  unchanged; checked in Chrome :5173 at desktop and 500 px, light + dark, in the Inbox, Quick Add and FAB bars, as listed
  in parent W5.
  Checked (Free test3): desktop Inbox + Quick Add popover 278 px, rows and panel both 260 px from the same left edge,
  CTA 236 = panel − 24, all icons one colour; 500 px Inbox + FAB sheets: panel 468 = sheet − 32, line on one line, CTA
  436 × 38 full panel width, 16 px under the panel; Contact Us (payments off) and Upgrade (payments on, flag set only in
  the page's memory) → upgrade dialog opened; dark theme Inbox / FAB / Quick Add; Pro (tier set only in memory): no panel,
  enabled rows, hover teal.
- [x] **W6** — Update `wna_orchestration/specs/features/wna-features.md` §39 Rich Capture (Free bullet) and §25.7 Mobile
  Adaptations, as listed in parent `## Contracts touched`; cite the orchestration `file:line`.
  Done: `wna_orchestration/specs/features/wna-features.md:3183` (§39 Free) and `:2450`, `:2457` (§25.7).
- [x] **W6 (ui-tests hand-off)** — in the job output, list for ui-tests: new TC needed (U1, reserved in the ui-tests
  slice); TC-916 / TC-992 stay valid. Never edit `specs/tests/wna-test-cases.md`.
  Done: listed in the job output; `wna-test-cases.md` not edited.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered email, the API response, the screen) and confirm it.
   Here: the Attach menu in Chrome :5173 at desktop and 500 px (parent W5 / S1).
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done (e.g. BottomSheet's `syncViewport`, `.capture-menu__locked`'s `max-width: 260px`).
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
   (Test cases are the exception for this repo: `specs/tests/*` is authored by wna-ui-tests only — list them, W6.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets. This repo has no automated tests: verify with `npm run build:main` and the Chrome check (S1).
   The full regression suite is run by the OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local web dev server `:5173` run by `wnapm`, local backend). Never deploy, never run tests against
   `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" / "needs a dev deploy" step. A missing
   dev/prod run is never a reason for `[~]`. A task closes on local checks alone.
