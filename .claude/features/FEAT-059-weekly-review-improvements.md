# FEAT-059 — web slice: Weekly Review improvements (progress bar, calendar lookback, celebration, saved progress)

**Parent (canonical):** `../wna_orchestration/features/FEAT-059-weekly-review-improvements.md` — §User flows, **§Screens**
(every state + exact copy, DS1–DS9), §Design (D2–D5), §Help impact, §Work breakdown → web. Read it first. This file is only
this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `views/dashboard/ReviewPage.vue`, `scripts/models/reviewModel.js`, `scripts/models/settingsModel.js`,
new `components/Celebration.vue` (approved by the parent, D4), `views/dashboard/InboxPage.vue` (switch to `Celebration.vue`,
no visual/copy change), `apiClient.js` calendar call reused, `content/help/bestPractices.js`. admin-app untouched. Runtime
checks of the saved progress need the backend slice (`review.in_progress`) on the local stack.

**Legal:** none — parent §Legal impact is n/a.

## User flows (this project's part)
- **Free / Pro** — parent "Free user / Pro user": Start Review → progress row (segments + counter, segment click scrolls);
  step 6 shows the two calendar lists (row click → action detail); ticks hydrate from and save to `review.in_progress`, so they
  survive reload / another device; Complete Review → `Celebration.vue`, last-review date saved, progress cleared.
- **Team owner / Team member** — parent "Team owner" / "Team member": same UI; the lists render whatever `GET /v1/calendar`
  returns (no client filtering); MetadataRow shows the existing shared/assignee markers.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — Weekly Review disabled in Settings → route not accessible, unchanged (no work).

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
### Model + building blocks
- [ ] W-1 `reviewModel` / `settingsModel`: `review.in_progress` read on load (hydrates `inReview` + `steps`), written on Start,
  on every tick, and cleared together with `last_review_date` on Complete (one request) — parent D5 + §Screens "Data needs".
- [ ] W-2 `components/Celebration.vue` — props `title` / `subtitle`, emit `dismiss`, animation + auto-dismiss + fade moved out
  of `InboxPage.vue` (no copy-paste left behind: grep the old celebration markup/CSS in `InboxPage.vue` → 0).
- [ ] W-3 `InboxPage.vue` uses `Celebration.vue` with "Inbox Zero" / "You're in control." — trigger rules and look unchanged.
### Screens (one box per parent §Screens surface — every state + exact copy)
- [ ] W-4 Progress row per §Screens "Progress row" + "Layout" #4 (segments, tokens, transition, counter moved into the row,
  segment click → scroll, mobile one row).
- [ ] W-5 Step 6 per §Screens "Step 6 — Review Calendar": new hint, both lists (windows per D3, read-only rows DS1, only while
  in review DS2, both-window duplicates DS3, no cap DS8), each list's Loading / Error + Retry / Empty / Rows states with exact
  copy, re-fetch on mount while in review and on Start.
- [ ] W-6 Page states per §Screens "Page states": Hydrating, Settings load failed + Retry (Start blocked, DS7), Idle, In review,
  Start / Tick / Complete save failures (revert + toast copy), Complete in flight, Completed (`Celebration.vue` in place of the
  steps card, "Review Complete" / "Your system is current.", old "Weekly review completed!" toast removed — DS5).
### Help
- [ ] W-7 `content/help/bestPractices.js` "Do a Weekly Review" — the one sentence from parent §Help impact.
### Verify
- [ ] W-8 `npm run build:main` passes.
- [ ] W-9 Runtime check on the local stack (owner verifies at runtime): each §Screens state reached once, reload mid-review keeps
  the ticks, Inbox Zero still plays as before; list what was seen.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [ ] W-10 Update `../wna_orchestration/specs/features/wna-features.md` — §16.1 Review Page (progress row, step 6 lists,
  celebration, saved progress) and §4.1 Inbox Zero celebration (shared component, no visual change).
- [ ] W-11 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-851–854 (IDs reserved by the parent,
  §Work breakdown → ui-tests; expected results from §Screens) and update the existing Weekly Review TCs whose expected results
  change (Section 15, e.g. TC-245 / TC-246 / TC-247 counter placement + no success toast).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the `/review` screen in each §Screens state and the Inbox Zero celebration in W-9) and confirm it.
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
   and hands over the exact command lines for dev AND for prod. Operator-only steps (GCP/VM
   provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — handed over: <dev command> / <prod command>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
