# BUG-027 — web slice: lazy-route navigation loader + chunk-error recovery

**Parent (canonical problem, evidence, design D1/D2):**
`wna_orchestration/features/BUG-027-lazy-route-loader-chunk-recovery.md` — read it first; this file
is only the local checklist. Decisions live in `wna_orchestration/decisions.md` (2026-08-24
BUG-027..032 entry). Do not restate the parent here.

## User flows (this project's part)
- Free / Pro / Team owner / Team member (any authenticated user navigating to a lazy route):
  implement the immediate navigation-pending indicator (parent D1 — existing `Spinner.vue` /
  `loading-state` pattern, no new visual mechanism) and the stale-chunk self-recovery (parent D2)
  so a click never looks dead.
- Unauthenticated (public `/pricing`): same indicator + recovery — the mechanism is global, verify
  it covers public lazy routes too.
- Admin: n/a — admin-app out of scope (parent).

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
- [x] Global navigation-pending state in `src/main-app/App.vue` driven by
      `router.beforeEach`/`afterEach` (parent D1), rendered with the EXISTING `Spinner.vue` /
      `loading-state` pattern — reuse-first rule: ask before creating any new component/CSS
      — `App.vue:27` (`navPending`), `:42-49` (beforeEach/afterEach), template `:3-5` reuses the
      shared `Spinner.vue` (`:22` import); scoped `.nav-loading` (`:63-70`) is a page-prefixed
      variant of the existing `loading-state`/`settings-loading` pattern composing only existing
      tokens (`--color-overlay`) — no new component, no new CSS variable created
- [x] Chunk-staleness recovery (parent D2): `router.onError` + `vite:preloadError` listener →
      one-shot `location.reload()` guarded by a `sessionStorage` flag (loop-safe); verify a rejected
      `import()` no longer dies as a silent console rejection
      — `App.vue:33-39` (one-shot reload + `chunk_reload` sessionStorage guard), `:51-54`
      (`router.onError` — vue-router forwards the rejected route `import()` here, so it is handled,
      not an unhandled console rejection), `:56-59` (`vite:preloadError` + `preventDefault()`);
      flag cleared on next successful navigation `:48` so a later deploy can recover again
- [x] Observable behavior confirmed (rule 2): with devtools throttling, clicking `/upgrade` shows
      the indicator immediately; with a stale chunk name (simulate 404), the page self-recovers
      — runtime-verified 2026-08-24 (user-requested) via browser automation against the production
      build (`dist/main-app` on a scratch static server), using the public lazy route `/pricing`
      (`/upgrade` needs an authenticated session + backend; the mechanism is the same global
      router-hook in `App.vue`). Loader: with the chunk delayed 6 s, the overlay + spinner showed
      immediately on click over the still-mounted landing page, then `/pricing` rendered.
      Recovery: chunk 404 → exactly one automatic reload (`performance` navType `"reload"`), guard
      cleared on the next successful navigation; chunk restored → click lands on `/pricing`.
      Loop-safety: flag set + chunk still 404 → no second reload (a `window` marker survived,
      navType stayed `"navigate"`), rejection handled by `router.onError` — not an unhandled
      console rejection. Logged as P runs on TC-633/TC-634
- [x] `npm run build:main` passes — clean build 2026-08-24 (`✓ built in 3.67s`, obfuscator OK; the
      >500 kB main-chunk warning is the pre-existing known pain point)
- [x] Update `wna_orchestration/specs/features/wna-features.md` — navigation loading + recovery
      behavior (rule 6) — new §3.5 "Route Loading & Recovery" (`wna-features.md:265-278`)
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` — TC(s) for the nav loader and the
      stale-chunk recovery (rule 6) — TC-633 (`wna-test-cases.md:14857`), TC-634 (`:14872`);
      `regression-ui-tests/update-tests.sh` re-run (589 TCs parsed, sections 47/48 present)
