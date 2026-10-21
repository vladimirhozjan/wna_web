# FEAT-055 — web slice: Global search (TopNav search, `/search` page, Reference `?file=`)

**Parent (canonical):** `../wna_orchestration/features/FEAT-055-global-search.md` — §User flows, **§Screens** (D16–D25 + every state and exact copy), §Design (D10–D14,
Mechanics § Web), §Help impact, §Work breakdown → web. Read it first, plus `../wna_orchestration/contracts/limits.md` §Search
(min length, dropdown size, page size, debounce) and `specs/features/wna-features.md` §12 (Reference, FEAT-051 `?side=`). This
file is only this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `apiClient.js`, new `searchModel.js`, `SearchBox.vue`, `SearchResultRow.vue`, `SearchPage.vue`
(new files approved by the parent, Mechanics § Web), `router/router.js` (`/search`), `TopNav.vue`, `Item.vue` (optional `title`
slot), `ItemTypeIcon` (recurring / reference), `ReferencePage.vue` (`?file=`), `content/help/faq.js`. admin-app untouched.
Runtime checks need the backend slice + migration 020 on the local stack.

**Open in the parent:** D21 (Esc / click-outside / collapse back to the icon) — owner said "leave keys for now". W-5 is
blocked until it is locked; build everything else.

**Legal:** none — parent §Legal impact is n/a.

## User flows (this project's part)
- **Free / Pro** — parent "Free user / Pro user": desktop search icon → field + dropdown of top hits after the debounce;
  Enter / "See all" → `/search?q=` (full paged list, type chips); click → the item's detail page; reference hit →
  `/reference?folder=&side=&file=` with the preview open; Cmd/Ctrl+K opens the field; mobile icon → `/search`. Same UI on every
  tier — no flag or tier gate (D13).
- **Team owner / Team member** — parent "Team owner" / "Team member": same UI; rows with `shared` show the "Shared" badge (D23);
  the client never filters results — the server applies the "can open" rule.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — n/a — search exists only in the dashboard layout (TopNav `context === 'dashboard'`);
  public pages unchanged.

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
- [x] W-1 `apiClient.searchItems({q, types, limit, cursor})` + `searchModel.js` (numbers from `limits.md` §Search; debounce =
  Reference's; only the latest response renders; marking helper per §Screens "Result row" footnote).
  → `scripts/core/apiClient.js:2076`; `scripts/models/searchModel.js:5-9` (min 2 / top 8 / page 20 / 300 ms), `:85,91,108`
  (stale responses dropped via `requestId`), `:156` `markParts` (checked: `cas`→`[Čas]`, `R&D`, `100%`, `Ø` unmarked).
- [x] W-2 `Item` optional `title` slot (existing lists render unchanged) + `ItemTypeIcon` `RECURRING` / `REFERENCE`.
  → `components/Item.vue:38` (new branch only when the slot is passed; the old span is untouched); `components/ItemTypeIcon.vue:6-7`.
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-3 Result row — `SearchResultRow.vue` per §Screens "Result row" (elements 1–5, incl. 3a "Shared").
  → `components/SearchResultRow.vue:12` icon, `:14` marked title, `:21-22` Completed / Shared badges, `:25` snippet,
  `:31` MetadataRow (completed rows pass no due date), `:6,9` no checkbox, click anywhere → `searchRoute`.
- [x] W-4 §1 TopNav desktop — icon placement (D18), expand in place, every state + copy in the §1 table, Enter / "See all",
  Cmd/Ctrl+K (D19), no ↑/↓ (D20), hidden on `/search` + cleared/collapsed on navigation (D22), right-aligned panel.
  → `components/TopNav.vue:94-107` (after the bell, hidden on `/search`), `:365-371` Cmd/Ctrl+K, `:374` collapse on
  navigation; `components/SearchBox.vue:10` placeholder, `:13` Enter, `:24` spinner, `:28` no results, `:39` See all,
  `:65-66` error copy, `:75` term cleared on unmount, `:128-129` 400 px right-aligned panel. No ↑/↓ handler.
- [x] W-5 §1 Esc / click outside / collapse back to the icon — **BLOCKED on owner D21** (open in parent §Screens). Do not
  implement until D21 is locked; if reached first, mark `[~] BLOCKED: D21 open`.
  → D21 locked by owner 2026-10-21 = designer recommendation. `components/SearchBox.vue` `onEsc` (clear + close +
  collapse), `onPointerDownOutside` (panel closes, text kept, collapse only when empty; pointer not blur so row clicks
  land), refocus / click / Cmd+K reopen the last rows with no request; `components/TopNav.vue:95` `@collapse`.
  Spec `wna-features.md` §36.2, TC-797 steps 4–6.
- [x] W-6 §2 Mobile TopNav — icon between the bell and the hamburger, tap → `/search` focused, hidden on `/search`.
  → `components/TopNav.vue:94` (same button, sits before the hamburger), `:352` ≤ 768 px → `/search`;
  `views/dashboard/SearchPage.vue` `onMounted` focuses the field.
- [x] W-7 §3 `/search` page + route `/search` — elements 1–6, chips → `types` (no Completed chip, D16), `?q=` / `?types=` synced,
  "Load more" (D25), every state + copy in the §3 table.
  → `router/router.js:67`; `views/dashboard/SearchPage.vue:83` chips (no Completed), `:21` count, `:27` no query, `:33`
  error page 1, `:41` loading, `:48`/`:102` no results, `:59` Load more, `:112` load-more toast, `:122` `?q=`/`?types=` sync.
- [x] W-8 Click targets per §3 "Click targets" — detail routes; reference → `ReferencePage` handles `?file=` on top of `?side=`
  (preview opens; 404 and Drive-disconnected toasts as written).
  → `scripts/models/searchModel.js:135` routes; `views/dashboard/ReferencePage.vue:405` `?side=` (owner 2026-10-21: added
  here, `?side=` did not exist) + folder, `:416` file fetch + preview, `:421` 404 toast, `:425` Drive toast, `:413` `side` /
  `file` stripped from the URL afterwards (owner 2026-10-21).
### Help
- [x] W-9 `content/help/faq.js` — new entry "How do I search?" covering every point in parent §Help impact.
  → `content/help/faq.js:116`.
### Verify
- [x] W-10 `npm run build:main` passes.
  → 2026-10-21: `✓ built`, obfuscator + prerender OK (only the pre-existing >500 kB chunk warning).
- [~] W-11 Runtime check on the local stack (owner verifies at runtime): each §Screens state reached once; list what was seen.
  → DEFERRED TO OWNER / ui-tests: I don't run the app; needs the backend slice + migration 020 locally. States to reach are
  TC-797–806 (W-13).
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-12 Update `../wna_orchestration/specs/features/wna-features.md` — §3.1 TopNav (search icon, Cmd/Ctrl+K), new §Search,
  routes list (`/search`), §12 (`?file=`).
  → `wna-features.md:46` TOC, `:236` §3.1 search icon + Cmd/Ctrl+K, `:754` §12.1 File deep link (`?side=` + `?file=`),
  `:2719` new §36 Search (`:2758` §36.3 `/search` route — the spec has no central routes list; routes live per section).
- [x] W-13 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-797–806 (IDs reserved by the parent,
  §Work breakdown → ui-tests), expected results from §Screens.
  → `wna-test-cases.md:18847` Section 58, TC-797–806 (`:18849`–`:19020`); `regression-ui-tests/update-tests.sh` re-run.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered TopNav, dropdown and `/search` page in each §Screens state, and the Reference preview opened from a hit) and confirm it.
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
