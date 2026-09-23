# BUG-042 — web slice (main-app): Project Detail "next physical step" banner reads the invariant (`backlog_position === 0`), not `state === 'NEXT'`

**Parent (canonical):** `../../wna_orchestration/features/BUG-042-project-top-action-not-next-action.md`
— problem (owner notes 1–4), root cause §1 (this repo's wrong proxy), the invariant, locked
decisions **D1–D5**, Design §3 (web) and §6 (spec fold) all live there. Read it first; this file is
only this repo's checklist. Nothing is restated.

**Scope:** main-app only — `src/main-app/views/dashboard/ProjectDetailPage.vue:780`
(`hasNextAction` computed, drives the `.next-action-prompt` at `:228`). No other predicate, no
component, no CSS, no model change (parent §Design 3: sidebar dot and Engage nudge already read
`next_action_id`; `onBacklogReorder` `:1725` already reloads when index 0 is involved). **Independent
of the backend slice** — the banner fix is correct against today's backend because the action rows
already carry `backlog_position` (`api.md:1971`). The re-top / complete-into-Today behaviours in the
parent's flow are backend work; this slice only has to *render* whatever the backend returns after
its reload.

## User flows (this project's part)
- **Free / Pro user (own project)** — this repo implements the *banner half* of the parent's flow:
  with the project's next action moved to Today / Calendar / Waiting, the detail page shows that row
  on top with its state link and **no** "What's the next physical step?" banner; the banner shows
  only when no `backlog_position === 0` row exists (and never for a Someday project — existing
  `isSomeday` guard `:228` unchanged). After a drag to the top or a completion, the reloaded list
  drives the same predicate — no web logic for the D2/D3/D4 rules themselves.
- **Team owner / member (shared project)** — n/a — shared projects use the flat Backlog list
  (parent §User flows); confirm the changed computed is not consulted on that path.
- **Admin** — n/a — no admin-app surface. **Unauthenticated / not-entitled** — n/a — route guard
  unchanged.

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
(This repo has no automated tests — verify with `npm run build:main`, code inspection, and the
on-screen DoD. No new component / model / CSS variable is needed; if you believe one is, stop and ask.)

- [x] W1 — `ProjectDetailPage.vue:780` `hasNextAction` → `orderedActions.value.some(a =>
  a.backlog_position === 0)` (parent §Design 3). Nothing else in the computed or the template
  `:228` changes. Cite the new line.
  → `src/main-app/views/dashboard/ProjectDetailPage.vue:780` (comment on `:779` reworded to
  "backlog position 0, whatever its list"); template `:228` untouched; `isSomeday` guard unchanged.
- [x] W2 — Hygiene (rule 3): `grep -n "state === 'NEXT'" src/main-app/views/dashboard/ProjectDetailPage.vue`
  — every remaining match must be a legitimate state check (e.g. the state-link label), not a
  next-action proxy. List the survivors with a one-word reason each, or `0`.
  → `0` matches (the state link at `:264` uses `action.state !== 'BACKLOG'` + `actionStateLabel`, not a NEXT check).
- [x] W3 — `npm run build:main` green (cite the run line).
  → `✓ built in 4.12s` / `[obfuscator] Obfuscated 18 files in .../dist/main-app/assets` (2026-09-22).
- [x] W4 — DoD on screen (rule 2), against dev or a local stack on this worktree (`:6111`):
  (a) project with one action → move that action to Today (action detail → move → Today) → open
  the project: Today row on top with its "Today" link, **no** `.next-action-prompt`; (b) same for
  Calendar (with a date) and Waiting; (c) a project whose only action is trashed still shows the
  banner; (d) a Someday project never shows it. (a)–(d) need only today's backend. If you do not
  run apps, mark `[~]` "DEFERRED TO USER" with (a)–(d) listed — never `[x]`.
  → Verified on screen by the owner 2026-09-23 against `:6111`: (a) Today next action on top with
  "Today" link, no `.next-action-prompt`; (b) same for Calendar (dated) and Waiting; (c) project
  whose only action is trashed still shows the banner; (d) Someday project never shows it — all OK.
- [x] W5 — Update `wna_orchestration/specs/features/wna-features.md:616-630` (Project Detail → Next
  Action section): the "When no next action exists" bullet states the condition as *no action at
  backlog position 0* (the next action may sit in Today / Calendar / Waiting and still counts); the
  "Completing the next action" bullet gains the parent's D3/D4 sentence (a Today next action
  promotes its successor into Today at the same position; otherwise into Next). Cite the lines.
  → `wna_orchestration/specs/features/wna-features.md:618` (banner condition = no action at backlog
  position 0) and `:630` (Today next action promotes into Today at the same position, else Next).

The banner fix ships with the next main-app image (owner's cadence; never gate this slice on a
prod deploy). The ui-tests slice (TC-673) verifies (a) on dev once this and the backend slice are
deployed there.
