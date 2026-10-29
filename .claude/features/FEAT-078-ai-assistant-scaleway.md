# FEAT-078 — web slice: AI assistant on Scaleway (EU) instead of Vertex AI

- Parent (single source of truth): `wna_orchestration/features/FEAT-078-ai-assistant-scaleway.md`
- Work: parent `## Work breakdown` §web W1–W6. Every state, copy and size is in the parent's `## Screens` (A TopNav AI
  button, B composer placeholder, C admin AI Assistant), the legal wording in `## Legal impact`, the help wording in
  `## Help impact` — this slice does not restate them; build exactly from those sections.
- Order (parent Work breakdown): **job 2** = W2–W5 (no backend input; beside backend) · **job 3** = W1 (needs backend
  B2 `model_id`, `model_rejected`) · W6: the parent header lists it with W2–W6 (step 2), its own item says order 3 —
  its admin-copy part describes W1, so finish it after W1. Main worktree only; local `:5173` / `:6173` only.
- Landing / Pricing: parent `## Landing / Pricing impact` = n/a (no item for this slice).

## User flows (this project's part)
- Free user: the TopNav AI button opens the panel — the open conversation, or the empty panel with "Tell AI what to do"
  (W2, W3); Quick Add / ⌘K entries and Settings → AI Assistant unchanged (models, credits and "About N requests" come
  from `GET /v1/assistant`); Help text names the button, the language rule and the new monthly credits (W5); Privacy
  names Scaleway (W4).
- Pro user: same as Free.
- Team owner: same as Free.
- Team member: same as Team owner.
- Admin (relevant role): admin-app → AI Assistant shows `model_id` as the caption, the "Scaleway model id" field with its
  placeholder and the Scaleway refusal copy (W1, Screens C); everything else unchanged.
- Unauthenticated / not-entitled: no AI button signed out or with the `ai_assistant` flag off (Screens A "Hidden" state,
  W2).

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
Job 2:
- [x] **W2 · Screen A — TopNav AI button** (main-app) — `components/TopNav.vue`: a `<button>` after Quick Add (desktop) /
  first in the mobile cluster, built per parent Screens A (every state: hidden, idle, open with `aria-pressed="true"` and
  "Close AI assistant", working with `Spinner` 16px and "AI assistant is working", offline, out of credits; bell /
  search look; the 44px `::after` touch rule); click → `assistantModel().openPanel()` / `closePanel()`;
  `data-testid="topnav-ai-btn"`; fits at 360px.
  Data: shown / hidden ← `GET /v1/flags` `flags[]` contains `ai_assistant` (via `flagsModel` → `assistantModel().enabled`;
  existing, `feature_flag_service_impl.cpp:304`); working after reload ← `GET /v1/assistant` `working_request_id`
  (existing, `assistant_json.cpp:94`) → `state.requestId`; open conversation ← `has_conversation` (existing,
  `assistant_json.cpp:93`). No backend box needed.
  ✔ `components/TopNav.vue:40-53` (button, `v-if` dashboard + `assistant.enabled`, `aria-pressed`, testid), `:385-395`
  (labels, toggle), `:488-526` (bell/search look, `--open` holds hover), `:723` (44px `::after`). Chrome `:5173`: idle /
  open (`aria-pressed="true"`, "Close AI assistant", composer focused) / second click closes / working (spinner, "AI
  assistant is working") / flag off → no button; 500px + 360px no overflow. Deviation: Screens A's 360px fit missed the
  12px TopNav gap (real need 371px) → the wordmark hides below 372px on dashboard pages (`TopNav.vue:738`), per Screens
  A's own "< 360px wordmark hides" rule moved to the measured edge.
- [x] **W3 · Screen B — composer placeholder** (main-app) — `components/AssistantPanel.vue:135`: no messages → "Tell AI
  what to do"; otherwise today's two texts (parent Screens B).
  Data: `GET /v1/assistant/conversation` `conversation` (null) / `conversation.messages[]` length (existing,
  `assistant_service_impl.cpp:177-180`) → `state.messages`. No backend box needed.
  ✔ `components/AssistantPanel.vue:135`, `:225-228`. Chrome: empty panel → "Tell AI what to do" (desktop + 500px); after
  a reply → "Reply, or tell AI what to do next".
- [x] **W4 · Privacy (Legal impact)** — `content/legal/privacy.md` §5.12 bullet and §6 sentence exactly as parent
  `## Legal impact`; touch only those two places (the file holds other unreleased changes); `terms.md` and
  `legal.terms_version` unchanged; dates stay 30 October 2026.
  ✔ `content/legal/privacy.md:262` (§5.12 bullet), `:270` (§6 sentence); `grep Vertex content/legal` → 0; `terms.md`,
  "Last updated" untouched by this slice.
- [x] **W5 · Help (Help impact)** — `content/help/gettingStarted.js` and `content/help/faq.js` exactly as parent
  `## Help impact` (the three gettingStarted edits, the two "What is the AI assistant?" edits, both monthly-credit
  sentences); `bestPractices.js` unchanged.
  ✔ `content/help/gettingStarted.js:115` (3 edits), `content/help/faq.js:254` (2 edits), `:259`, `:281` (credits);
  `bestPractices.js` not touched by this slice.
  Post-designer (`AiIcon`): "the AI button (the bolt)" → "(the sparkles)" at `gettingStarted.js:115`, `faq.js:254`.
  Reviewer fix (J554): "Is my data secure?" last sentence → Scaleway in France (EU), not passed on to the models'
  makers (`faq.js:237`, matches `privacy.md:262`, `:270`). Grep of main-app + admin-app for Google / Vertex /
  Anthropic / Haiku / Sonnet / Gemini / Claude as the assistant's provider → none (left: hosting / KMS / Google
  sign-in, MCP "such as Claude or ChatGPT"). Chrome `:5173` FAQ at 1440 (iframe) and 500px.
- [x] **AI icon · `AiIcon` (sparkles) on every AI spot** (parent Screens `:64-90`, Screens A, owner-approved 2026-10-29)
  ✔ `assets/AiIcon.vue:1-9` (empty `<script setup>`, `viewBox="0 0 24 24"`, `fill="currentColor"`, the two star paths
  as given). Swap: `components/TopNav.vue:52`, `components/AssistantPanel.vue:13` + `:47` (EmptyState),
  `components/CaptureBar.vue:105`, `components/CommandPalette.vue:52`, `views/dashboard/ProjectCanvasPage.vue:23`; the
  `*bolt*` classes on those spots renamed (`assistant-panel__ai-icon` `:446`, `palette__ai-icon` `:352`,
  `canvas-ai-icon` `:460`; no ui-tests selector used them). `grep -rn BoltIcon src/main-app` → only
  `components/public/HeroSection.vue:5,24` + `assets/BoltIcon.vue`. TopNav look: `TopNav.vue:515-522` (AI button always
  `--color-action`; hover / open add only `--color-bg-hover`; bell / search unchanged `:509-513`), `:534-538` icon 20px;
  working keeps `Spinner` 16px. Optical refine: ⌘K row renders icons at 12px, below `AiIcon`'s 14px minimum →
  `CommandPalette.vue:352-357` 14px with `margin: 0 -1px` so the label stays aligned with the + rows.
  `npm run build:main` exit 0. Chrome `:5173`, desktop + 500px (iframe), light + dark: TopNav idle / hover / open /
  working (only coloured icon in the row), panel header + empty state (empty simulated client-side, no conversation
  deleted), Quick Add row (desktop popover + mobile FAB bar), ⌘K row, canvas "Convert with AI" 14px (legible); the
  mobile canvas ⋯ sheet is text-only (no icon spot). Test data: local project "FEAT078 canvas icon check".
  TCs for ui-tests whose copy names the bolt (stale wording; selectors unaffected): TC-840 (`wna-test-cases.md:19298`
  "with a bolt icon"), TC-1112 (`:24653` `BoltIcon`), TC-1202 (`:25326` "AI button (bolt)"), TC-1206 (`:25393` "in
  place of the bolt"). Not AI, stays: `:15716`, `:22231` (Next Action bolt).

Job 3 (after backend B2):
- [x] **W1 · Screen C — admin-app AI Assistant** — `admin-app/views/AiAssistantPage.vue`: every `vertex_model_id` →
  `model_id` (form, errors, create body, table caption); field label, placeholder and the `model_rejected` copy exactly
  as parent Screens C; `unsupported_model_id` / `model_exists` copy unchanged. `npm run build:admin` passes; check on
  `:6173` (Add model with `x-reject` → the refusal copy). Verify `grep -rn vertex src/admin-app` → 0 matches.
  Data: models table caption ← `GET /admin/ai/models` `model_id` (renamed by backend **B2**; today `vertex_model_id`,
  `assistant_json.cpp:140`); other row fields unchanged (`assistant_json.cpp:141-149`); Add model errors ←
  `POST /admin/ai/models` `error` = `model_rejected` + `detail` and `unsupported_model_id` (backend **B2**),
  `model_exists` (existing, `assistant_admin_service_impl.cpp:163`).
  Done: `admin-app/views/AiAssistantPage.vue:22` (caption `row.model_id`), `:92-96` (field `model_id`, label "Scaleway
  model id", placeholder "e.g. deepseek-v4-flash-0731"), `:192` (errors), `:212` (`model_rejected` → Scaleway refusal
  copy), `:213-214` (`unsupported_model_id` / `model_exists` copy unchanged), `:314`, `:353` (create body `model_id`),
  `:359`. Backend B2 confirmed in code (`assistant_json.cpp:140`, `assistant_admin_service_impl.cpp:150-176`).
  `grep -rn -i vertex src/admin-app` → 0. `npm run build:admin` exit 0.
  Chrome `:6173` (signed in after `wna_deploy/backend/db_tools/local/reset_admin_local.sh`), 500px and 1280px (iframe):
  caption shows the Scaleway id (e.g. `deepseek-v4-flash-0731`); Add model → label "Scaleway model id" + placeholder;
  `x-reject` → "Scaleway refused this model: 404 Model not found: x-reject. Check the id against the Scaleway model
  catalog."; `bad id!` → "This model id isn't supported yet."; `gpt-oss-120b` → "This model is already in the list."
  Seen, not in this slice: the Default column prints "false" for non-default rows (`AiAssistantPage.vue:37-39`, the
  slot's `v-if` leaves it empty, so DataTable shows its fallback value) — pre-existing, left as is.
- [x] **W6 · Update `wna_orchestration/specs/features/wna-features.md`** §AI assistant — the AI button way in (states,
  toggle), the empty-panel placeholder, the admin copy (Scaleway model id, refusal copy), monthly credits per tier linked
  to `contracts/limits.md` (no numbers restated). Cite the orchestration `file:line`. List in your output, for
  ui-tests, the TCs this makes new or stale (never edit `wna-test-cases.md`).
  Done (job 2): `wna-features.md:240` (wordmark < 372px), `:252-254` (AI button, order), `:3532` (monthly credits per
  tier → `limits.md`), `:3536` (kill switch), `:3564-3569` (AI button states), `:3582` (placeholder). Job 3:
  `wna-features.md:1984` (Scaleway model id caption), `:1987-1988` (field + placeholder, test call to Scaleway),
  `:1989-1990` (Scaleway refusal copy); `grep -i vertex specs/features/wna-features.md` → 0.
  Post-designer (`AiIcon`): AI "bolt" → "sparkles" at `wna-features.md:252`, `:3351`, `:3534`, `:3545`, `:3558`,
  `:3565-3566` (+ 20px, always `--color-action`, hover / open add only the hover background), `:3569`, `:3574`; `:777`
  (Next Action bolt) unchanged; the canvas "Convert with AI" entry (`:3653-3656`) names no icon.
  TCs for ui-tests — stale: TC-1134 (Vertex model id label, mock_vertex, refusal copy, seeded Claude models), the
  assistant-section preamble at `wna-test-cases.md:24637` (mock_vertex); new: TopNav AI button states (Screens A),
  empty-panel placeholder "Tell AI what to do" (Screens B), Add model placeholder (Screens C).
- [x] **W6 · Build + Chrome check** — `npm run build:main` passes; Chrome on `:5173` at desktop width and 500px for W2 /
  W3 (signed in, flag on: idle, open, working, empty-panel placeholder; flag off → no button).
  ✔ `npm run build:main` exit 0. Chrome `:5173` desktop + 500px / 360px / 375px (iframe; window resize is ignored):
  every listed state checked (flag off simulated in-page via `flagsModel.publicFlags`).

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
