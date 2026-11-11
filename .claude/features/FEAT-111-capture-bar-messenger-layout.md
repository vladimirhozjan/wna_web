# FEAT-111 — web slice: capture bar in messenger layout

Parent: `FEAT-111` (`../wna_orchestration/features/FEAT-111-capture-bar-messenger-layout.md`) — Design (Boundaries, Contracts, Flows), Screens, §Legal / §Help and Work breakdown live there; read them
there, not restated here. Item ids W1–W3 are the parent's. Worktree: `main` only. No backend box (Data contract: no new field).

## User flows (this project's part)
- **Free:** the same bar, Pro look, enabled; text capture works and the slot turns mic → Add on text; +, camera (mobile) and
  mic open the existing upgrade dialog at once; drop / paste lock unchanged; follows the tier live.
- **Pro / Team owner:** type → Add; + → files (images → photo chips) → Add; mobile camera → photo chips → Add; mic on an
  empty bar → record → Stop → voice chip → slot is Add → Add. Desktop: no camera button.
- **Team member:** same as Pro / Team owner (own Inbox).
- **Admin:** n/a — admin-app has no capture bar.
- **Unauthenticated:** n/a — the capture bar is signed-in only.

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
Order: W1 → W2 → W3. Verify with `npm run build:main` green after W1 and W3.
- [ ] W1. `src/main-app/components/CaptureBar.vue` — parent §Contracts Web in full: row order, `capture-file` / `capture-photo` /
      `capture-clear` / `capture-mic` / `capture-add` ids, `isMobile` matchMedia, × on every variant, icon-count padding
      classes, `onFilePicked` image → photo chip, grid slot with `visibility: hidden` swap, Quick Add Add in the row and
      panel Add removed, Free → `showCaptureUpgrade()` from + / camera / mic, disabled rules, the three toast strings,
      removed Dropdown / menu / locked panel / CSS, Quick Add 200 px at 769–1023 px.
      Data: `currentUser.subscription_tier` (`GET /v1/user/get`), `payments` flag (`GET /v1/flags/public`),
      `attachment_limits` (`GET /v1/reference/quota`) — all read today; no backend box.
  - [ ] W1a. Screen — Inbox input bar built per parent § Screens (Row + Per bar table: desktop and 500 px, every state, exact copy).
  - [ ] W1b. Screen — Quick Add (TopNav, **C**) built per § Screens (group, 250 / 200 px field, panel without Add, every state).
  - [ ] W1c. Screen — FAB bar built per § Screens (field 44 px, × · camera, chips / recording above, every state).
- [ ] W2. Chrome check on the local stack (`:5173`), Pro and Free accounts, at 1280 px, 900 px and 500 px, on the Inbox bar,
      Quick Add (**C**) and the FAB bar: buttons present per width (no camera > 768 px); mic ↔ Add on text, on a chip, during
      waiting / recording (Add disabled), back to mic after Add / ×; + → file chip; 500 px camera → resized photo chip; mic →
      record → Stop → voice chip → Add → one Inbox item; Quick Add does not collapse on any button press and keeps chips +
      recording in its panel; Free + / camera / mic → upgrade dialog (payments on and off); TopNav does not wrap at 769 px
      with Quick Add expanded. Note results in this doc. Consumes W1.
- [ ] W3. `src/main-app/content/legal/privacy.md` §2.2 paragraph + `Last updated`, and
      `src/main-app/content/help/gettingStarted.js` Quick Add entry — the exact texts in the parent's §Legal impact and §Help impact.
      (Landing / Pricing impact: n/a — no box.)
- [ ] Update `specs/features/wna-features.md` §22.1 (Quick Add row, FAB "Add" button, attach icon lines) and §39 (One row, Attach icon,
      Voice toasts, Free) to the new layout — in `wna_orchestration`, cite `file:line`.

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
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets. The full regression suite is run by the OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack. Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
