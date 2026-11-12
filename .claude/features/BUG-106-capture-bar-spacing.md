# BUG-106 (web): Capture bar spacing

Parent: `wna_orchestration/features/BUG-106-capture-bar-spacing.md` (BUG-106) — Screens, Design (Contracts, Flows)
and Work breakdown live there; this slice is only this project's checklist.

## User flows (this project's part)
- Free / Pro / Team owner / Team member: same bar and spacing on Inbox, Quick Add and the FAB bar; capture
  behaviour unchanged (parent § User flows).
- Admin: n/a — admin-app has no capture bar.
- Unauthenticated: n/a — the capture bar is signed-in only.

> ## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
> - `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
>   a box, resolve it to one of the three below — do not leave it bare.
> - `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
>   ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
>   proof — open the artifact.
> - `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
>   remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a local
>   user_service rebuild + restart I cannot run"). Does NOT count as done — it **blocks closure**.
> - `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
>   does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
>   so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Checklist
- [x] W1. (done: `CaptureBar.vue:79,93` v-show; `:507-511` one `.capture-bar__main` rule; `:595-607` flex slot + mic `align-self`; `:526-529` Inbox `:deep(input){margin:0}`; `:635-637` row margin `8px 0 4px`; `:644-654,678-683` Quick Add 366/316 px + `margin-right:8px`; grep `slot-off|calc(50% + 2px)|grid-area` = 0 matches) `src/main-app/components/CaptureBar.vue` — parent § Contracts Web 1–6 in full: mic / Add `v-show` instead of
      `.capture-bar__slot-off` (class, rule and grid stacking removed, test ids `capture-mic` / `capture-add` kept);
      `.capture-bar__slot` flex hugging, mic `align-self: center`; one `.capture-bar__main` rule
      `align-items: center; gap: 10px`; Inbox `:deep(input) { margin: 0 }` + row margin `8px 0 4px`, the `--inbox` +
      / slot margins and `calc(50% + 2px)` rules removed; Quick Add `.capture-bar__main` width 366 px / 316 px
      (769–1023 px), input without fixed width, `.capture-bar--quick { margin-right: 8px }`. Layout per parent
      § Screens R1–R6 (all three variants, every state). Data: none — layout only. Consumes nothing.
- [~] W2. (PARTIAL — everything measured except Quick Add with the AI button visible and the recording state; see "Not measured" below; DEFERRED TO ui-tests U1(c)/(b) which cover the AI neighbour. Measured 2026-11-12, Chrome :5173 Pro account; 1280 → real window 1504 px, 900 / 769 / 500 px via a same-origin iframe because the browser window cannot be resized; measured below) Chrome check on the local stack (`:5173`, Pro account) at 1280 px, 900 px and 500 px — Inbox bar, Quick Add
      (**C**) and the FAB bar, idle and with text / a file chip / recording: gaps + → field = field → mic / Add =
      10 px (±0.5); + flush left, mic / Add flush right (FAB 16 px both sides); every control's vertical centre =
      the field's; + and the field's left edge still on the swap; Quick Add's + and the next TopNav control still on
      the swap, group → next control = 16 px, with and without the AI button; the panel's right edge = Add's;
      TopNav does not wrap at 769 px with Add showing; chips on the Inbox bar still 8 px under the field. Note the
      measured numbers in this doc. Consumes W1.
- [x] Verify `npm run build:main` green after W1. (build passed, prerender ok)

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered bar, the measured frames) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if intentionally not done or not applicable, mark `[NA]` with the reason. Never leave a
   box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. If your work changes a fact whose canonical home is an orchestration
   spec (Fact Index in its CLAUDE.md), you MUST update that spec there as part of this work and cite the
   `file:line`. Specs describe what the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite** (owner directive
   2026-08-19). The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against
   `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step.

## Measured (Chrome :5173, DOM, 2026-11-12)
- Inbox 1504 px: idle + 291 · field 333–1431 · mic 1442–1474 (gaps 10 / 10, + flush bar left, mic flush bar right, centres 161.5 all); typed: field right 1399.4 (moved 31.6 = Add 63.6 − 32), + and field left unchanged, × centre 161.5.
- Quick Add 1504 px: group 366 px, + 1026 · field 1068–1350 (282) idle / –1318.4 (250) typed · gaps 10 / 10 · Add 63.6 × 34.9 = field height · bell left 1408 → group → bell 16 px; + left 1026 idle = typed; centres 32.
- Quick Add 900 px: group 316, field 232 idle / 200 typed, + 514 both, bell 804, Add right 788 → 16 px; TopNav height 65 idle = typed.
- Quick Add 769 px + file chip: no wrap (TopNav controls on one row, y 15–21), panel right 657 = Add right 657.
- Inbox 900 px: gaps 10 / 10 idle and typed, centres 161.5. Inbox 500 px: + 8 · field 50–449 idle / –419.5 typed · gaps 10 / 10 · field h 44, centres 141 (+, field, ×, camera, slot); file chip 8 px under the field.
- FAB 500 px (`/today`): + 16 · field 58–442 idle / 412.5 typed + chip · mic / Add right 484 = 16 px inset · Add h 44 = field h 44 · centres 666 all · chip row 10 px above the row (unchanged).
- Not measured: Quick Add with the AI button visible (assistant off on this account; neighbour is the bell — same margin rule); recording state (no microphone in the automated browser — same slot as Add, `v-show` by `hasContent`).
