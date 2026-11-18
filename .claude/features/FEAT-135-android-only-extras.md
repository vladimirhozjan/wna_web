# FEAT-135 — web slice

Parent: `FEAT-135` (`../wna_orchestration/features/FEAT-135-android-only-extras.md`) — Android 21: Android-only extras (Share target, home-screen widgets, launcher shortcuts + Quick Settings tile, Wear OS). This slice is the local checklist only; Design (Boundaries, Contracts C1–C15, Flows F1–F8), Data contract, Screens S1–S5, Legal / Help / Landing impact and owner decisions D1–D2 live in the parent — read them there, they are not restated here. Item ids (W) are the parent's Work breakdown ids. Local stack only; no backend, deploy or ui-tests item.

## User flows (this project's part)
Free / Pro / Team user and Team member: read the updated Privacy Policy (`/legal/privacy`) — the Android widgets, pending Share, Wear OS watch app and Google processing paths are disclosed. Admin: n/a — no admin surface. Unauthenticated: the Privacy Policy is a public page and shows the same text.

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
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local docker services, local web dev server, local mocks; ui-tests `BASE_URL` = local).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments — dev AND prod compose overrides, config.json, crontabs, scripts —
   applies the change to the LOCAL stack itself (local migrations, local config), and writes the exact dev and prod
   command lines as a section in `wna_deploy/backend/gce/PENDING-develop.md` / `PENDING-production.md`. Operator-only
   steps (GCP/VM provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §<ID>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.

## Checklist
- [x] **W1** Privacy Policy `wna_web/main/src/main-app/content/legal/privacy.md` per the parent `## Legal impact — ToS / Privacy Policy`: §10 new paragraph after "The Android app also keeps whether you turned notifications on …"; §5 new **5.16 Wear OS**; §6 paragraph after the Siri paragraph; §7 row "Copy of your content in the Android app" → with the Wear OS watch wording (period unchanged); `**Last updated:**` = the ship date; `terms_version` untouched.
  - Verify: `npm run build:main`; `/legal/privacy` renders the changed paragraphs; `terms_version` untouched.
  - Affected existing tests: none.
  - Data: none — static legal text; no backend box.
  - Done: `src/main-app/content/legal/privacy.md:3` Last updated = November 18, 2026; `:298-300` §5.16 Wear OS; `:326` §6 Wear OS paragraph after Siri; `:343` §7 Android-copy row with the Wear OS wording (period unchanged); `:433` §10 paragraph after the Android notifications paragraph. `npm run build:main` green; prerendered `dist/main-app/_prerender/legal/privacy/index.html` contains all five changes; `/legal/privacy` on :5173 renders §5.16 and the §6 paragraph (Chrome). `terms_version` untouched — `git diff` touches only privacy.md. Spec: `wna_orchestration/specs/features/wna-features.md:2740`.

## Execution order
W1 any time (as the parent Work breakdown gives it).
