# FEAT-056 — web slice: Cmd+K command palette + global keyboard shortcuts

**Parent (canonical):** `../wna_orchestration/features/FEAT-056-command-palette.md` — §User flows, **§Screens** (S1–S3, every
state + exact copy, DS1–DS14), §Design (D1–D15: shortcut model, key map, commands, results, access), §Help impact, §Work
breakdown → web. Read it first, plus `../wna_orchestration/contracts/limits.md` §Search (min query length, result count) and
`specs/api/api.md` §Search / Create Project. This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — new `scripts/core/shortcutModel.js`, `components/CommandPalette.vue`,
`components/ShortcutsDialog.vue` (owner-approved, parent D14); `TopNav.vue` (remove `onSearchShortcut`, `C` → QuickAdd); the
Stuff / Action / Project / Recurring detail pages (register item commands); `content/help/faq.js`. No API change. admin-app
untouched. Runtime checks need the local stack (FEAT-055 search endpoint).

**Legal:** none — parent §Legal impact is n/a.

## User flows (this project's part)
- **Free / Pro** — parent "Free user / Pro user": desktop dashboard — Cmd/Ctrl+K opens S1; Commands / Results / Create groups;
  Enter runs the highlighted row; G+letter navigation, `C` capture, `?` → S2; create commands surface the existing tier-limit
  upgrade modal unchanged.
- **Team owner** — parent "Team owner": S1 "This item" rows = exactly the detail page's rendered, enabled buttons (shared-project
  rules carry over, e.g. no Someday per BUG-062) — no new rule in the palette.
- **Team member** — parent "Team member": same mirror — a read-only member gets no edit rows because the page renders none.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — parent "Unauthenticated / not-entitled": public pages and < 768 px — S1/S2 never mount,
  every shortcut is a no-op.

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
- [x] W-1 `shortcutModel.js` — one `document` keydown handler + command registry per parent §Design "Shortcut model" / "Key map"
  (input/textarea/contenteditable, open-modal/Clarify, mobile and non-dashboard guards; `G` sequence; Review-off rule DS10).
  — `src/main-app/scripts/core/shortcutModel.js:71` handler (typing guard `:67`, modal/mobile guard `:7`/`:63`, Review-off `:49`);
  attached only by `DashboardLayout.vue:161`/`:157`. G sequence lapses after 1 s (`shortcutModel.js:9`, `:95`) — owner request after review; DS14 sets no timeout.
- [x] W-2 Remove `TopNav.onSearchShortcut` (Cmd/Ctrl+K now owned by W-1) — grep `onSearchShortcut` → `0` matches.
  — `grep -rn onSearchShortcut src` → 0 (verified 2026-10-23).
- [x] W-3 Detail pages (Stuff / Action / Project / Recurring) register their rendered, enabled buttons as item commands on mount,
  unregister on unmount — same handlers, confirmations, visibility (parent §Screens S1 "Item commands per detail page", DS3/DS6).
  — `StuffDetailPage.vue:363`, `ActionDetailPage.vue:632` (disabled Trash → no row), `ProjectDetailPage.vue:825`,
  `RecurringDetailPage.vue:284`; each computed mirrors its template `v-if`s; lifecycle in `shortcutModel.js` `registerItemCommands`.
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-4 S1 Command palette — `CommandPalette.vue` per §Screens S1: container (DS1), elements, groups by query, row kinds
  (DS5), navigation labels + order (DS2), item commands, create commands incl. New project → existing outcome prompt (DS8) and
  run/failure behaviour (DS9), "See all" row (DS7), every state + copy in the States table, keyboard/mouse (DS12, DS13).
  — `src/main-app/components/CommandPalette.vue:2` (Modal 560px), groups `:156`, error row `:119`, See all `:139`, New project
  `:229`, open/reset `:244`; own search instance `searchModel.js` `palette`; `Modal.vue` renders title/actions only when given (DS1).
  — DS9 failure copy closed by W-13.
- [x] W-13 DS9 create-failure toast — `CommandPalette.vue:208` `onCreateError` uses `err.message || <DS9 fallback>`, but
  `apiClient.js` `normalizeError` always sets `message` (status fallbacks `:110–131`, no-response `:136`), so the parent DS9
  fallback copy never shows. Fix: server message only when the backend sent one, else the DS9 fallback copy; suppress the
  toast only for the tier-limit 403 that opened the upgrade modal (`upgrade_message` / `limit`, `apiClient.js:82`) — any
  other 403 gets a toast. Then re-run W-9 and update `wna-features.md` §37.2 "Create" only if the built behaviour differs.
  — `apiClient.js:88` (tier-limit → `upgrade: true`), `:104` (backend message → `fromServer: true`); `CommandPalette.vue:209`
  toasts the server message only when `fromServer`, else the DS9 copy, and skips only `upgrade`. W-9 re-run `✓ built in 3.97s`
  (2026-10-24). §37.2 unchanged — built behaviour matches `wna-features.md:2934`. TC-841 step 6 (offline → DS9 copy) + step 5
  "no error toast" added (`wna-test-cases.md:19132`); `update-tests.sh` regenerated.
- [ ] W-14 Read-only member on a shared-project action — `ActionDetailPage.vue` renders Done, Move to and Trash for a
  `my_role === 'read_only'` member on an unassigned backlog action (only Assign to me checks the role, `:620`), against
  `../wna_orchestration/specs/features/p2-team-collaboration.md:127`/`:138` (view + comment only; cannot complete, trash or
  move). Hide those buttons for that case; `itemCommands` (`:638`) must mirror the page, so the palette loses the rows too
  (parent "Team member" flow). Keep T-45 (`p2-team-collaboration.md:353`): an action already assigned to the member stays
  completable / unassignable. Mind the uncommitted BUG-062 edits in the same file. Owner chose this slice (2026-10-24). Then
  re-run W-9, run `update-tests.sh` for the new TC-861 (`wna-test-cases.md` §59), and update `wna-features.md` only where
  it describes Action detail buttons for members.
- [x] W-5 S2 Shortcuts dialog — `ShortcutsDialog.vue` in `Modal.vue` per §Screens S2 (rows, platform key label DS11, Review row
  rule DS10).
  — `src/main-app/components/ShortcutsDialog.vue:2`, platform key `:27`, Go-to rows from `shortcutModel.navigation` (DS10),
  footnote `:11`; Esc closes via `shortcutModel.js:87`.
- [x] W-6 S3 TopNav — search icon click unchanged, Cmd/Ctrl+K no longer expands the field, `C` expands + focuses QuickAdd, per
  §Screens S3.
  — `TopNav.vue:38`/`:375` (C → `QuickAddBtn.vue:47` `expand`); search-icon click path untouched.
### Help
- [x] W-7 `content/help/faq.js` — new entry "Are there keyboard shortcuts?" per parent §Help impact.
  — entry already existed (`faq.js:311`); owner chose "extend existing" (2026-10-23): global shortcuts lead, local keys kept, `faq.js:313`.
- [x] W-8 `content/help/faq.js:118` search entry — Cmd/Ctrl+K wording per parent §Help impact.
  — `faq.js:118`.
### Verify
- [x] W-9 `npm run build:main` passes. — `✓ built in 3.97s` (2026-10-24, after W-13), prerender OK.
- [~] W-10 Runtime check on the local stack (owner verifies at runtime): each §Screens S1–S3 state reached once on desktop;
  palette absent < 768 px; list what was seen.
  — DEFERRED TO USER / ui-tests: not run (no app runs by Claude); scenarios authored as TC-838–843.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-11 Update `../wna_orchestration/specs/features/wna-features.md` — §25.8 Keyboard Shortcuts, §3.1 / §36 search
  (Cmd/Ctrl+K text), new Command palette section.
  — `wna-features.md:47` (TOC), `:239` (§3.1), §22.1 C, `:2254` (§25.8), `:2756` (§36.2), `:2787` (§37 new).
- [x] W-12 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-838–843 (IDs reserved by the parent,
  §Contracts touched), expected results from §Screens.
  — `wna-test-cases.md:19044` (Section 59, TC-838–843) + TC-797 step 7 updated (`:18863`); `update-tests.sh` regenerated.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the open palette, shortcuts dialog and TopNav on the local dev server, per §Screens state)
   and confirm it.
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
