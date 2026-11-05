# FEAT-091 slice — web (`wna_web/main`)

- Parent: `wna_orchestration/features/FEAT-091-ios-architecture-offline.md` (FEAT-091, iOS 5 — architecture II) — Screens, Design, Data contract, Legal impact and Work breakdown live there; this slice restates none of it. Items use the parent's IDs.
- Project: wna_web, `main` worktree only (never `develop-a` / `develop-b`).
- Open decisions: the Legal text is written for the locked D5 and D6 = B (every sign-out deletes the copy, unsynced changes included); the parent's "**[D6] = A**" wording is NOT used. If the parent shows another answer when you start, use the parent.

## User flows (this project's part)
n/a — no web screen changes (parent § Screens covers the iPhone app only). Role-by-role: Free / Pro / Team owner / Team member — the Privacy Policy wording applies to all; Admin — n/a, no admin-app change; unauthenticated — the Privacy Policy is public.

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

Help impact: n/a (parent). Landing / Pricing impact: n/a (parent). Data: no server data read. Screens: n/a — no UI change.

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
   the documented sibling sync requirement (see that repo's CLAUDE.md) — it is REQUIRED, never
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
   local stack (local docker services, local web dev server, local mocks, the iOS simulator).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments, applies the change to the LOCAL stack itself, and writes the exact dev and prod
   command lines as a section in `wna_deploy/backend/gce/PENDING-develop.md` / `PENDING-production.md`. Operator-only
   steps (GCP/VM provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §<ID>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
9. **No git writes in a PM job** — the queue commits and pushes this repo itself after the job.

## Checklist
Order: W1 has no dependency. Job: **item W1** (1 box).
- [x] **W1** Legal impact (parent § Legal impact — ToS / Privacy Policy), all of it in this one box: `src/main-app/content/legal/privacy.md` §10 new paragraph after the iPhone Keychain paragraph (text per the parent, D5 / D6 = B); §7 new row after "Sync records of permanently deleted data"; "Last updated" = the date of the change; `terms.md` untouched, `terms_version` unchanged. Plus `specs/features/wna-features.md` — the iPhone privacy bullet (the FEAT-090 lines) names the local copy (update that orchestration home). Verify: the text matches the parent § Legal impact; `npm run build` green; rendered on `/legal/privacy` locally.
  - Done (D6 still open in the parent → D6 = B text used, per this slice): `src/main-app/content/legal/privacy.md:387` §10 paragraph (after the Keychain paragraph, verbatim per parent § Legal impact); `privacy.md:308` §7 row right after "Sync records…" (`:307`); `privacy.md:3` "Last updated: November 5, 2026"; `terms.md` untouched (`git diff` empty), `terms_version` unchanged. `wna_orchestration/specs/features/wna-features.md:2594-2599` iPhone privacy bullet names the local copy + §7 row. `npm run build:main` green; `dist/main-app/_prerender/legal/privacy/index.html` contains the paragraph, row and date; Chrome `http://localhost:5173/legal/privacy`: date, §10 paragraph and the §7 row directly after "Sync records" rendered.
