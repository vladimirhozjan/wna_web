# FEAT-034 — web slice: installable main-app (manifest, icons, head meta, theme-color sync)

**Parent (canonical problem, owner decisions D1–D7, design, user flows, TC ids):**
`../../wna_orchestration/features/FEAT-034-add-to-home-screen.md` — read it first; this file is only the local checklist. Do not restate the
parent here. Scope is **main-app only** (parent D2) — admin-app is untouched.

## User flows (this project's part)
- **Free user**: parent §User flows (Free user) — main-app ships what makes the browser/OS offer
  install and launch it standalone on `/engage` with the right icon and name (manifest + PNG icons +
  head meta), and the status/title bar color tracks the in-app theme (parent D7).
- **Pro user**: same as Free — no tier difference in install; parent §User flows (Pro user).
- **Team owner / Team member**: same as Free — nothing team-scoped; parent §User flows.
- **Admin (relevant role)**: n/a — admin-app is not installable (parent D2); do not touch `src/admin-app/`.
- **Unauthenticated / not-entitled**: parent §User flows (Unauthenticated) — nothing new to build:
  the existing router auth guard must send a logged-out launch of `/engage` to login and back. Confirm
  by reading the guard, don't change it.

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

## Checklist
- [x] W1 (verified: `src/main-app/public/icon-192.png` 192×192 RGBA, `icon-512.png` 512×512 RGBA — gradient circle, transparent corners; `apple-touch-icon.png` 180×180 8-bit RGB opaque; `icon-maskable-512.png` 512×512 8-bit RGB opaque, full-bleed gradient with the bolt inside the 80% safe zone — owner picked the full-bleed gradient fill 2026-09-24; rendered by a one-off scratch Node rasterizer of the `favicon.svg` shapes, no dependency added) Render the PNG icons per parent D4 from `src/main-app/public/favicon.svg` into
  `src/main-app/public/` (apple-touch 180 opaque, 192, 512, maskable 512 with safe-zone padding).
  Tooling for rendering is one-off — no new npm dependency.
- [x] W2 (`src/main-app/public/manifest.webmanifest:1-16` — id/scope `/`, start_url `/engage`, standalone, WhatsNextAction/WNA, `#FFFFFF` colors, 3 icons) `src/main-app/public/manifest.webmanifest` per parent D3/D5/D6/D7 (exact values in the parent).
- [x] W3 (`src/main-app/index.html:6-13` — PNG apple-touch-icon, manifest link, theme-color, mobile/apple web-app-capable, title WNA, status-bar-style default; `0` remaining refs to the SVG apple-touch-icon) `src/main-app/index.html` head: manifest link, PNG `apple-touch-icon` replacing the SVG one
  (`index.html:6`), theme-color + Apple/mobile web-app meta per parent §Design.
- [x] W4 (`src/main-app/scripts/models/themeModel.js:29-37` — `apply()` calls `syncThemeColorMeta()`, which writes the computed `--color-bg-primary` into the meta; `apply()` already runs on init, `setMode`, and the OS `change` listener) `themeModel.js` updates `<meta name="theme-color">` on every theme change (parent D7) —
  extend the existing model, no new model/utility (ask first if one seems needed).
- [x] W5 (build green 2026-09-24; `dist/main-app/` lists `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`; `dist/main-app/index.html:6-13` carries the head tags) `npm run build:main` passes and `dist/main-app/` contains the manifest + all icons; open
  `dist/main-app/index.html` and confirm the head tags.
- [x] W6 (`wna_orchestration/specs/features/wna-features.md:44` TOC entry, `:2199-2210` new §34 "Install to Home Screen (FEAT-034)") Update `wna_orchestration/specs/features/wna-features.md` — new "Install to home screen" entry.
- [x] W7 (max was still TC-677; `wna_orchestration/specs/tests/wna-test-cases.md:15815-15975` new Section 53 with TC-678…TC-684 — 678-680 marked Playwright, 681-684 manual device checks) Update `wna_orchestration/specs/tests/wna-test-cases.md` — author TC-678…TC-684 with the
  ids and one-liners reserved in the parent §Contracts touched (re-check the max first; if taken,
  renumber in the parent and tell ui-tests).
- [x] W8 (`README.md` Project Structure `public/` line + "App icons" note under Utilities listing the exact icon set/sizes/opacity to keep when re-rendering) Update `README.md` only if the icon-rendering step needs documenting for future icon changes.
- [~] W9 DEFERRED TO USER: run TC-681…TC-684 on dev (iOS Safari, Android Chrome, macOS Safari Add to Dock + desktop Chrome/Edge, iOS Google SSO + Paywiser round-trip) — Ask the owner to run the manual device checks TC-681…TC-684 on dev (you cannot) — mark `[~]`
  with "DEFERRED TO USER" until they confirm.

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
   affected targets (this repo has no automated tests — `npm run build:main` is the scoped check; never build admin-app for this slice). The full regression suite is run by the OWNER before deploy — never by
   the implementer.
