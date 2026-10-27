# BUG-067 — web slice: Auth dialog and the page behind it scroll oddly on mobile

- Parent (single source of truth): `wna_orchestration/features/BUG-067-auth-dialog-mobile-scroll.md`
- Decisions: D1 (owner, 2026-10-27, `decisions.md:216`): scroll wrapper, backdrop scroll and page lock at every width;
  header/'?' cover, Close button and keyboard handling mobile only.
- Work: parent `## Work breakdown` §web W1–W9. What to build: parent `## Screens` (every state + exact copy) and
  `## Design` (§Boundaries, §Contracts DOM table, §Flows 1–8 + edge cases). This slice does not restate them — read them there.
- Scope: `src/main-app/components/AuthDialog.vue` only (parent §Boundaries). No new component / model / CSS variable /
  utility file.
- Order: first — web W1–W9 (one job), then ui-tests U1–U4. No backend / deploy work.
- Screens: one surface, the auth dialog (parent `## Screens`) — W1–W8 build it, W9 checks it.
- Data: n/a (parent `## Data contract`: no server field read or changed).
- Legal / Help: n/a (parent `## Legal impact`, `## Help impact`).

## User flows (this project's part)
- Free user: n/a — signed in, never sees the auth dialog (parent `## User flows`).
- Pro user: n/a — same reason.
- Team owner: n/a — same reason.
- Team member: n/a — same reason.
- Admin (relevant role): n/a — admin-app has its own login; not touched.
- Not-entitled / blocked: n/a — no entitlement on the auth dialog.
- Unauthenticated: on any of the 7 hosting public pages (incl. `/login`, `/register`, `/forgot`, `/reset-password` and the
  `/share` signed-out resume to Sign in) opens Sign in / Register / Forgot / Reset; on a phone with the keyboard open the
  backdrop is sized to the visible viewport, the focused field stays above the keyboard, every field and button is
  reachable by scrolling the dialog, submit closes the keyboard first, and the page behind never moves (restored on
  close, released on navigation) — W1–W8. On desktop the look is unchanged; a card taller than the window scrolls inside
  the backdrop and the page behind stays locked (D1) — W3, W5.

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
- [x] **W1** — `AuthDialog.vue` markup per parent §Contracts: wrapper `div.auth-scroll`; `data-testid` `auth-backdrop`,
  `auth-dialog`, `auth-dialog-close`; Close button (ClarifyPanel markup + CSS values, 28 px, `@click="closeAll"`, hidden
  above 768), exactly as parent W1. Verify: at 500 wide the button is in the card's top-right corner and does not overlap
  "Forgot Your Password?"; at 1054 wide it is absent (`display: none`).
  — Done: `src/main-app/components/AuthDialog.vue:3` (backdrop testid), `:5` (`.auth-scroll`), `:7` (card testid), `:9-12` (Close, `@click="closeAll"`),
  CSS `:642-660`, hidden `:789-793`. Chrome 500 wide: Close at card right −12 / top +12; "Forgot Your Password?" text ends
  at x 373, Close starts at 425 (no overlap); 1054 wide: `display: none`.
- [x] **W2** — Remove the `footer` prop from the Sign in Password `Inpt` only (parent W2). Verify: Sign in shows no hint;
  Register and Set a new password still show "Use 8 or more characters with a mix of letters, numbers and symbols".
  — Done: Sign in `Inpt` has no `footer` (`src/main-app/components/AuthDialog.vue:66-67`); Register `:24`, Reset `:110` keep it. Chrome: Sign in hint false,
  Register / Reset hint true.
- [x] **W3** — Layer + layout CSS (parent W3): ≤ 768 backdrop `z-index: 99998`; wrapper `.auth-scroll` + backdrop
  `overflow-y: auto; overscroll-behavior: contain` at **every width** (D1 — not inside the media query); card `margin: 0`,
  `position: relative`. Verify: at 500×870 header and "?" are under the backdrop, a toast is above it; at 500×420
  Register's title is fully visible at the top with 20 px space and its last element is reachable by scrolling the
  dialog; at 1054×600 Register's last element is reachable by scrolling the dialog (D1); at 1054×973 the card is centred
  exactly as today.
  — Code done: `src/main-app/components/AuthDialog.vue:610-635` (backdrop `overflow-y: auto; overscroll-behavior: contain` at every width, `.auth-scroll`,
  card `position: relative; margin: 0`), mobile `z-index: 99998` `:783-787`. Chrome: 500×870 header and "?" are under the
  backdrop (`elementFromPoint`), server toast above it; 500×420 Register card top 20, scrollHeight 713 = 673 + 2×20;
  1054×973 centred as today; 1054×600 Register top-aligned, last element reachable by wheel, `scrollY` unchanged.
  Desktop header (z 902, above the backdrop by D1) → PM J220 option 1: desktop wrapper padding top/bottom
  `calc(64px + 20px)` (header height `TopNav.vue:404` + 20) at `src/main-app/components/AuthDialog.vue:789-794`; mobile
  keeps 20 px. Chrome 1054×600: header ends at 65, card top 84, title 114–152 fully visible at `scrollTop` 0; scrolled to
  the end the Google button (403–446) and terms line (458–486) are visible, `scrollY` 800. 1054×973: card 148–825 =
  (973 − 677) / 2, centred exactly as today.
- [x] **W4** — Visible-viewport sizing (mobile): `syncViewport` + listeners added on open, removed on close and in
  `onBeforeUnmount` (parent Flow 1.3, 7, 8). Verify in Chrome device mode at 500 wide: backdrop `top`/`height` equal
  `visualViewport.offsetTop`/`height` after a viewport-height change.
  — Done: `syncViewport` `src/main-app/components/AuthDialog.vue:308-313`, listeners added `:280-284`, removed `:297-299`, `onBeforeUnmount` `:461-463`.
  Chrome (500-wide iframe): backdrop `top: 0px; height: 420px` after the viewport shrank 870→420 (`visualViewport`
  0/420), back to `height: 870px` after it grew.
- [x] **W5** — Page lock at **every width** (D1): `lockPage` / `unlockPage({ restore })` per parent Flow 1.1–1.2, 7, 8, not
  gated by `isMobileViewport()`; plus the parent Flow 1.2.1 compensation: when a classic scrollbar is present
  (`window.innerWidth - document.documentElement.clientWidth > 0`) `lockPage` sets `scrollbar-gutter: stable` on
  `<html>` (not `padding-right` — that moves fixed elements such as the "?" button), and `unlockPage` removes
  `scrollbar-gutter` together with `overflow` (Flow 7, 8). Verify: on Help scrolled to 800, open Sign in, scroll inside
  the dialog and focus every field → `window.scrollY` stays 800; close → 800; on desktop, wheel over the backdrop leaves
  `window.scrollY` unchanged; with classic scrollbars on (macOS Settings → Appearance → Show scroll bars: Always) Sign in
  opened on a scrolled Help page at desktop width shifts neither the page nor the "?" button sideways; log in
  successfully → the dashboard scrolls normally and `<html>` has no inline `overflow` / `scrollbar-gutter`.
  — Done: `lockPage` `src/main-app/components/AuthDialog.vue:271-285` (gutter `:276`, not gated by mobile), `unlockPage` `:287-302` (removes `overflow`
  + `scrollbar-gutter` `:292-293`), `holdScroll` `:304-306`. Chrome: Help at 800, open Sign in, focus every field / scroll
  the dialog / real wheel over the backdrop → `scrollY` 800; close (Close, backdrop tap) → 800. Classic scrollbars were on:
  page heading x, `body` width (1202) and the "?" wrapper (1166–1202) identical before/after opening; only
  `document.documentElement.clientWidth` changes 1202→1217 (Chrome does not count the reserved gutter) — see the ui-tests
  note in the report. Navigating away while open (router push `/pricing`, Flow 8 — same unmount path as a successful
  login) → `<html>` has no inline `overflow` / `scrollbar-gutter`, the next page scrolls normally (no real login run).
- [x] **W6** — Keep the focused field visible (mobile): `focusin` on the card + `revealFocused` / `revealInBackdrop` per
  parent Flow 2. Verify at 500×420: focusing Confirm password in Register scrolls the dialog just enough to show its
  label, input and footer with ≥ 20 px below; focusing Email afterwards scrolls back only as far as needed (the card does
  not jump to the top).
  — Done: `@focusin` `src/main-app/components/AuthDialog.vue:7`, `onCardFocusIn` `:315-317`, `revealFocused` `:320-323`, `revealInBackdrop` `:325-332`.
  Chrome 500×420: Confirm password already fit (24 px below) → no scroll; Terms checkbox → scrolled so its bottom is 20 px
  above; from the bottom, focusing Password then Email scrolls back only until the label top is 20 px (card top −84,
  not to the top); `scrollY` stays 800.
- [x] **W7** — Submit (mobile): first line of `doLogin` / `doRegister` / `doForgot` / `doReset` blurs the active element; on
  a field error reveal the first errored field (parent Flow 5). Verify at 500×420: Register with an invalid Email while
  focused on Confirm password → focus gone, Email row visible with "Invalid email"; a server error toast is visible.
  — Done: `blurOnMobile()` first line of `doLogin` `src/main-app/components/AuthDialog.vue:480` / `doRegister` `:515` / `doForgot` `:552` / `doReset` `:574`;
  `revealFirstError()` `:339-343` before each validation `return` `:492`, `:535`, `:560`, `:586`. Chrome 500×420:
  Enter in Confirm password with "bad-email" at the bottom → active element `BODY`, Email row at top 20 with "Invalid
  email"; wrong-password Sign in → "Login failed with error: …" toast is the top element at its position.
- [x] **W8** — Mode switch resets `backdrop.scrollTop = 0` (parent Flow 6). Verify: scroll Sign in to the bottom, tap
  "Create new account" → Register title visible at the top.
  — Done: mode watcher `src/main-app/components/AuthDialog.vue:266-268`. Chrome 500×420: Sign in scrolled to 232 → "Create new account" → Register,
  `scrollTop` 0, title at y 50.
- [x] **W9a** — Update `wna_orchestration/specs/features/wna-features.md` §2.6 Auth Dialog Shared Behaviors (parent W9):
  Close button on mobile; dialog scrolls when taller than the visible area and the page behind is locked — at every width
  (D1); covers the header on mobile; Sign in has no password hint. Cite the orchestration `file:line`.
  — Done: `wna_orchestration/specs/features/wna-features.md:183-186`.
- [x] **W9b** — In the report, list for ui-tests the TCs made stale / new (TC-020 "centered vertically" holds only when the
  card fits; new TC for the short-viewport behaviour). Never edit `wna_orchestration/specs/tests/wna-test-cases.md`.
  — Done: listed in the implement report (TC-1009 new, TC-020 adjusted, TC-017 / TC-018 regression); test-case spec not edited.
- [x] **W9c** — Check in Chrome on `http://localhost:5173` at desktop width and at 500 px, every mode, with a short
  viewport (≈ 420 tall), plus desktop 1054×600; `npm run build:main` passes.
  — `npm run build:main` exit 0. Chrome on `:5173` (500-wide iframe for exact 500×870 / 500×420, 1054×600 iframe,
  window 1054×973): Sign in, Register, Forgot, Check your inbox (forgot-sent), Set a new password checked.
  NA for "Check your inbox" after Register and "Email not verified": not opened (they need a new registration /
  unverified account); same card and code path as the verified "Check your inbox" after Forgot — does not block.

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
   updated. (Find the home in the orchestration Fact Index.) This includes `/internal/*` routes, CronJobs
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
   (Test cases are the exception for this repo: `specs/tests/*` is authored by wna-ui-tests only — list them, W9b.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets. This repo has no automated tests: verify with `npm run build:main` and the Chrome check (W9c).
   The full regression suite is run by the OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local web dev server `:5173` run by `wnapm`, local backend). Never deploy, never run tests against
   `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" / "needs a dev deploy" step. A missing
   dev/prod run is never a reason for `[~]`. A task closes on local checks alone.
