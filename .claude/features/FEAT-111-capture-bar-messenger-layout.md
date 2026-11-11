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
- [x] W1. `src/main-app/components/CaptureBar.vue` — parent §Contracts Web in full: row order, `capture-file` / `capture-photo` /
      `capture-clear` / `capture-mic` / `capture-add` ids, `isMobile` matchMedia, × on every variant, icon-count padding
      classes, `onFilePicked` image → photo chip, grid slot with `visibility: hidden` swap, Quick Add Add in the row and
      panel Add removed, Free → `showCaptureUpgrade()` from + / camera / mic, disabled rules, the three toast strings,
      removed Dropdown / menu / locked panel / CSS, Quick Add 200 px at 769–1023 px.
      Data: `currentUser.subscription_tier` (`GET /v1/user/get`), `payments` flag (`GET /v1/flags/public`),
      `attachment_limits` (`GET /v1/reference/quota`) — all read today; no backend box.
      Proof (`CaptureBar.vue`): row + `capture-file` :3-15, field · × `capture-clear` :47-57 (every variant, `--beside`
      when the camera shows) · camera `capture-photo` `v-if="isMobile"` :58-71, slot mic `capture-mic` / Add
      `capture-add` :74-98 (`capture-bar__slot-off` = `visibility: hidden`, CSS :596-612); panel Add removed;
      `isMobile` matchMedia :195 + listener :476-486; icon-count classes :210-213, CSS at the end of the style block;
      `onFilePicked` image → photo :290; Free → `showCaptureUpgrade()` :261, :267, :326; toasts :329, :342-343;
      Quick Add / FAB `align-items: center` :513-516; Quick Add 200 px :696-700. Dropdown / menu / locked panel /
      `FileIcon` / `contactSupport` / `flagsModel` / `menuOpen` gone — grep 0 matches in `src`. `npm run build:main` green.
  - [x] W1a. Screen — Inbox input bar built per parent § Screens (Row + Per bar table: desktop and 500 px, every state, exact copy).
  - [x] W1b. Screen — Quick Add (TopNav, **C**) built per § Screens (group, 250 / 200 px field, panel without Add, every state).
  - [x] W1c. Screen — FAB bar built per § Screens (field 44 px, × · camera, chips / recording above, every state).
- [x] W2. Chrome check on the local stack (`:5173`), Pro and Free accounts, at 1280 px, 900 px and 500 px, on the Inbox bar,
      Quick Add (**C**) and the FAB bar: buttons present per width (no camera > 768 px); mic ↔ Add on text, on a chip, during
      waiting / recording (Add disabled), back to mic after Add / ×; + → file chip; 500 px camera → resized photo chip; mic →
      record → Stop → voice chip → Add → one Inbox item; Quick Add does not collapse on any button press and keeps chips +
      recording in its panel; Free + / camera / mic → upgrade dialog (payments on and off); TopNav does not wrap at 769 px
      with Quick Add expanded. Note results in this doc. Consumes W1.
      **Results (2026-11-11, `:5173`, local Pro + Free test users; the Chrome window could not be resized, so each width
      ran in a same-origin iframe of that exact width — media queries use the iframe width):**
      - 1280 Inbox: + 291/146 32 px · input 333–1175 × 41 · slot 1185 64 × 41; all centres at y ≈ 162; no camera. Text →
        Add (enabled), × (real click) clears, keeps focus, back to mic. + (picker simulated via the hidden input) PNG →
        photo chip with thumbnail, PDF → file chip; Add → one item "receipt.png + 1 file" (2 attachments), slot → mic.
      - Voice (getUserMedia stubbed with an oscillator stream): mic → "Waiting for microphone access… Cancel", Add
        visible + disabled, + disabled, × shown → "Recording 0:01 Stop" (same) → Stop → chip "Voice memo · 0:01", Add
        enabled → Add → one item. NotAllowedError / NotFoundError → the two new toasts, slot back to mic.
      - 1280 Quick Add (C): + · 250 px field · slot centred in the 65 px TopNav; real clicks on mic → recording in the
        panel (320 px, right edge = slot right edge 1176), Stop → voice chip in the panel, Add in the row → saved; typed
        text + real × click → cleared, still expanded and focused; `mousedown` on + is `defaultPrevented`.
      - 900 / 769 Quick Add: field 200 px, TopNav height 65 → 65 with a long title, `scrollWidth` = viewport (no wrap).
      - 500 Inbox: + · field (× · camera, padding 72 px) · Add, one line; camera picker (4000×3000 PNG) → chip
        `photo-20261111-1003.jpg` with thumbnail. FAB: + · 44 px field (× · camera) · slot; file chip above the row;
        Add → item "Pick up parcel", FAB collapses.
      - Free (500 and 1280, Inbox + Quick Add): +, camera, mic enabled with the Pro look; each opens the upgrade dialog —
        payments off "Got it" + support line, payments on (temporary user_ids flag, deleted after) "Not now | View
        plans"; no recording starts, Quick Add stays open. Free text → Add → item "Free text item".
      - Light and dark themes both checked (icons in the focused-border colour, Add white on primary).
      Not checkable here: the real OS file / camera dialogs and a real microphone (simulated as above).
- [x] W3. `src/main-app/content/legal/privacy.md` §2.2 paragraph + `Last updated`, and
      `src/main-app/content/help/gettingStarted.js` Quick Add entry — the exact texts in the parent's §Legal impact and §Help impact.
      (Landing / Pricing impact: n/a — no box.)
      Proof: `privacy.md:3` (November 11, 2026), `privacy.md:44` (§2.2 paragraph, exact parent text);
      `gettingStarted.js:35` (exact parent text). `npm run build:main` green.
- [x] Update `specs/features/wna-features.md` §22.1 (Quick Add row, FAB "Add" button, attach icon lines) and §39 (One row, Attach icon,
      Voice toasts, Free) to the new layout — in `wna_orchestration`, cite `file:line`.
      Proof: `wna-features.md:2362`, `:2364` (Quick Add group, 250/200 px, panel without Add), `:2369`, `:2371-2372`
      (FAB row, ×); `:3625-3634` (One row), `:3635-3638` (+ / camera), `:3639-3644` (Voice, toasts), `:3661-3665` (Free);
      stale menu wording also fixed at `:365` (Inbox bar), `:3418` (Share page), `:3657` (`input_type`).

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
