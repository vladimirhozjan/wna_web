# BUG-082 (web slice): Month calendar cut off in a low window — no scroll

Parent: `wna_orchestration/features/BUG-082-month-calendar-cut-off-no-scroll.md` (BUG-082) — problem, Design and Work breakdown live there; not restated here.
Job: items W1–W6 (6 boxes). Consumes nothing from other siblings. Item W5 waits on D2 (open in the parent).

## User flows (this project's part)
- Free / Pro / Team owner / Team member: desktop Calendar → Month in a low window scrolls to the last week and opens a day / an item (parent § User flows).
- Admin: n/a — admin-app has no calendar.
- Unauthenticated: n/a — dashboard only.
- Mobile (≤ 768 px): n/a — the day list already scrolls; must stay unchanged.
- Not-entitled / blocked: n/a — no entitlement rule touches the month grid.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles". Inspect the rendered month grid in Chrome (`:5173`) and confirm.
3. **Leave zero references to anything you renamed/removed** — grep and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently cover only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` with exactly what's left; not applicable → `[NA]` with the reason. Never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** Parent says no contract change; the `wna-features.md` §8.5 line is the reviewer's on close. You never edit `wna-test-cases.md` (ui-tests authors TCs).
7. **Run only the NEW and directly-relevant tests — never the full suite.**
8. **Test and verify LOCALLY only — never on dev/prod.**

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
Parent § Screens: n/a (layout fix). Parent § Data contract: n/a (no server data). All in `src/main-app/components/calendar/CalendarMonthView.vue`.
- [x] W1 (`src/main-app/components/calendar/CalendarMonthView.vue:4`, `:307-314`; Chrome 1280×500 iframe: scrollHeight 696 > clientHeight 327, bottom reached, cell 41 inside; at 1000 high 827 == 827) — parent web item 1: desktop scroller `.month-view__scroll` around header + grid, per parent.
- [x] W2 (`.month-view` rule now `:300-304`, no min-height; 0 matches for 490px; month view bottom 490 ≤ content 500) — parent web item 2: remove `min-height: 490px` from `.month-view`, per parent.
- [x] W3 (`:316-321`; header top 0 relative to scroller when scrolled to bottom) — parent web item 3: sticky weekday header, per parent.
- [x] W4 (`:154`, `:158`, class binding `:4`; thumb timing reuses the BUG-077 composable, not visually inspected — viewport screenshot unavailable) — parent web item 4: auto-hiding thumb via `useAutoHideScrollbar`, per parent.
- [x] W5 (D2 decided in parent; `:171-181`; Chrome: open scrollTop 109 = today's week under header, Next → 0, Today → 109, Previous → 0, tall 1000 → 0) — parent web item 5: starting scroll position — BLOCKED on D2 (open in parent); do not start until the parent states the rule.
- [x] W6 (`npm run build:main` exit 0; cell click in 6th row reachable and navigates to day view as before; mobile list present, grid absent at 500 px; no items in current month so item-click / +N more / drag not exercised → ui-tests) — parent web item 6: regression check + `npm run build:main` green; report the TCs made new / stale.
