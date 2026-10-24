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
- [x] W-1 `reviewModel` / `settingsModel`: `review.in_progress` read on load (hydrates `inReview` + `steps`), written on Start,
  on every tick, and cleared together with `last_review_date` on Complete (one request) — parent D5 + §Screens "Data needs".
  — `scripts/models/settingsModel.js:25,122` (default + hydrate), `:340` `setReviewInProgress`, `:350` `completeReview` (one PUT `{last_review_date, in_progress: null}`); `scripts/models/reviewModel.js:53-70` (inReview/steps derived from settings; Start/tick/Complete write). `setReviewLastDate` orphaned → removed (grep 0).
- [x] W-2 `components/Celebration.vue` — props `title` / `subtitle`, emit `dismiss`, animation + auto-dismiss + fade moved out
  of `InboxPage.vue` (no copy-paste left behind: grep the old celebration markup/CSS in `InboxPage.vue` → 0).
  — `components/Celebration.vue:1-41` (props, `dismiss`, 3 s timer + 300 ms fade, CSS moved verbatim). grep `celebrationPhase|dismissCelebration|check-bloom` in `InboxPage.vue` → 0.
- [x] W-3 `InboxPage.vue` uses `Celebration.vue` with "Inbox Zero" / "You're in control." — trigger rules and look unchanged.
  — `views/dashboard/InboxPage.vue:77` (same trigger watch/`?celebrate` paths, `:191`, `:209`).
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-4 Progress row per §Screens "Progress row" + "Layout" #4 (segments, tokens, transition, counter moved into the row,
  segment click → scroll, mobile one row).
  — `views/dashboard/ReviewPage.vue:39-53` (row), `:238` scroll, styles `.review-progress*` (6px/3px/gap 4px, `--color-bg-secondary`/`--color-action`, 0.15s, counter `flex-shrink: 0`). Old counter beside the button removed.
- [x] W-5 Step 6 per §Screens "Step 6 — Review Calendar": new hint, both lists (windows per D3, read-only rows DS1, only while
  in review DS2, both-window duplicates DS3, no cap DS8), each list's Loading / Error + Retry / Empty / Rows states with exact
  copy, re-fetch on mount while in review and on Start.
  — hint `ReviewPage.vue:181`; lists `:94-120` (ItemList disabled/non-editable/no-checkbox, empty `#actions`, click → `action-detail?from=review`), copy `:196-210`; windows `reviewModel.js:7-8,79,84`; fetch on mount-while-in-review + Start via `watch(inReview, …, {immediate})` `ReviewPage.vue:272`.
- [x] W-6 Page states per §Screens "Page states": Hydrating, Settings load failed + Retry (Start blocked, DS7), Idle, In review,
  Start / Tick / Complete save failures (revert + toast copy), Complete in flight, Completed (`Celebration.vue` in place of the
  steps card, "Review Complete" / "Your system is current.", old "Weekly review completed!" toast removed — DS5).
  — Hydrating `ReviewPage.vue:31` (`:loading`), failed + Retry `:27-30,194`, Complete in flight `:34`, toasts `:246-270`, Completed `:55-61` (Celebration replaces the card). grep "Weekly review completed" in src → 0.
### Help
- [x] W-7 `content/help/bestPractices.js` "Do a Weekly Review" — the one sentence from parent §Help impact.
  — `content/help/bestPractices.js:25`.
### Verify
- [x] W-8 `npm run build:main` passes.
  — `npm run build:main` ✓ (built in 4.18s, only the pre-existing chunk-size warning).
- [x] W-9 Runtime check on the local stack (owner verifies at runtime): each §Screens state reached once, reload mid-review keeps
  the ticks, Inbox Zero still plays as before; list what was seen.
  — Owner verified on the local stack 2026-10-24: all §Screens states, reload mid-review keeps the ticks, Inbox Zero unchanged — everything works.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-10 Update `../wna_orchestration/specs/features/wna-features.md` — §16.1 Review Page (progress row, step 6 lists,
  celebration, saved progress) and §4.1 Inbox Zero celebration (shared component, no visual change).
  — `wna_orchestration/specs/features/wna-features.md:337` (§4.1), `:1048-1071` (§16.1).
- [x] W-11 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-851–854 (IDs reserved by the parent,
  §Work breakdown → ui-tests; expected results from §Screens) and update the existing Weekly Review TCs whose expected results
  change (Section 15, e.g. TC-245 / TC-246 / TC-247 counter placement + no success toast).
  — `wna_orchestration/specs/tests/wna-test-cases.md:7814` (TC-245), `:7834` (TC-246), `:7872-7881` (TC-247), `:19526-19636` (Section 63, TC-851–854); `regression-ui-tests/update-tests.sh` re-run.

### Acceptance fix (`/conclude` 2026-10-24 — not accepted; parent §Screens "Page states")
- [x] W-12 Start is not optimistic: `review.in_progress` is set in state only after the Start PUT succeeds; "Start Review"
  shows `:loading` while it saves; on failure the page never left Idle (no "Complete Review", no progress row, no list fetch)
  + the existing "Couldn't start the review. Try again." toast. Today `reviewModel.startReview` → `settingsModel.setReviewInProgress`
  (`settingsModel.js:340-352`) sets state before the save. Covered by TC-853 step 6 (`wna-test-cases.md`, Section 63).
  — `scripts/models/settingsModel.js:340-348` (state set only after `save` resolves, no pre-save assignment/rollback);
  `scripts/models/reviewModel.js:63` `starting`; `views/dashboard/ReviewPage.vue:31` Start `:loading="… || starting"`.
  `inReview` stays false until saved, so no Complete button / progress row / list fetch (`ReviewPage.vue:34,39,273` all gate on it).
- [x] W-13 Progress writes are consistent with the server: tick saves run one at a time (a failed tick's rollback never wipes a
  later tick that saved, and the shown ticks always equal the last accepted `steps[]`), and the step checkboxes are disabled
  while Complete is in flight (no tick can re-write `in_progress` after Complete cleared it). "Tick save fails" behaviour stays
  as §Screens (that tick + segment revert, existing toast).
  — `scripts/models/reviewModel.js:12-13` queue + pending ticks, `:60-61` shown = saved `steps[]` + pending flips,
  `:70-82` each save runs after the previous one and builds on the last accepted `steps[]`; a failure drops only its own
  flip (`:77`) and rethrows → existing toast (`ReviewPage.vue:256-262`). `:62` Complete enabled only with no tick pending;
  `ReviewPage.vue:80` checkboxes disabled while `completing`. TC-853 step 2 + TC-854 step 7 (`wna-test-cases.md:19618,19646,19653`).
- [~] W-14 `npm run build:main` passes; owner re-checks at runtime on the local stack: Start with the settings PUT failing stays
  Idle throughout; fast ticks with one failing leave page = server after reload; no tick possible during Complete.
  — `npm run build:main` ✓ (built in 4.21s). DEFERRED TO USER: the runtime re-check on the local stack (TC-853 step 6,
  TC-854 step 7, TC-853 step 2 checkboxes disabled).

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
