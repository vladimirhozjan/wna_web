# FEAT-058 — web slice (admin-app): Price-change notices ("Notify subscribers" + broadcast audience)

**Parent (canonical):** `../wna_orchestration/features/FEAT-058-price-change-notices.md` — §User flows (Admin), §Screens S1–S4 (every state, exact copy, click budget, data
needs), §Design, §Work breakdown → web. Read it first, plus `../wna_orchestration/specs/api/admin-api.md` §12.5 / §12.10
(updated by the backend slice, B-9). This file is only this repo's checklist; nothing from the parent is restated.

**Scope:** `src/admin-app` only — `BillingTemplatesPage`, `BroadcastsPage`, `BroadcastDetailPage` (+ its send confirm),
admin `apiClient`. No main-app change. Reuse only (parent §Screens: no new component, model or CSS variable). Needs the
backend slice running locally for the end-to-end check.

## User flows (this project's part)
- **Free / Pro / Team owner** — n/a in this repo — their part is the email itself (backend); no main-app UI.
- **Team member** — n/a — never in an audience.
- **Admin (relevant role)** — parent "Admin": admin+ sees "Notify subscribers" on every Billing-templates row (both gateways)
  → navigates to the created draft; list/editor show the audience label; kind locked on template drafts; Send blocked while
  the placeholders remain (Send test allowed); empty audience → toast, no dialog; confirm names audience + live N; Copy keeps
  the audience. Roles below admin: no notify action, broadcasts read-only as today (FEAT-033 D7).
- **Unauthenticated / not-entitled** — n/a — admin-app auth guard as today.

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
### API client
- [x] W-1 admin `apiClient`: `notifyBillingTemplate(id)`; broadcast responses read `audience` (no client-side formatting of
  price/period — the server builds the prefill). `src/admin-app/scripts/core/apiClient.js:919` (+ export `:1238`);
  `audience` read as returned; label helper `audienceLabel()` (owner-approved 2026-10-24)
  `src/admin-app/scripts/models/broadcastModel.js:18` (`<title> (<Gateway>)`, "Untitled" when empty). No price/period
  formatting client-side.
### Screens (one box per parent §Screens surface — every state + exact copy)
- [x] W-2 S1 Billing Templates — "Notify subscribers" row action per §Screens S1 (roles, states, intro sentence, navigation).
  `src/admin-app/views/BillingTemplatesPage.vue:20-21` intro sentence, `:121-128` last row action (every row; page is
  already `minRole: admin`), `:360-375` `onNotify` (row `:loading`, all actions disabled via `actionLoading`, toast
  "Notice draft created" → `/broadcasts/<id>`, error = API message else "Couldn't create the notice draft. Try
  again."), actions column widened `:251`.
- [x] W-3 S2 Broadcasts list — Audience column per §Screens S2 (no N, DS2). `src/admin-app/views/BroadcastsPage.vue:27-29`
  cell, `:101` column after Subject (all roles). Copy unchanged (server keeps the audience).
- [x] W-4 S3 Broadcast detail / editor — audience line with live N, kind lock, placeholder Send guard, every S3 state.
  `src/admin-app/views/BroadcastDetailPage.vue:90-93` Audience line (every role), `:170-175` copy per status
  ("All users" / "… — N right now" on drafts / no N otherwise), `:97` kind select disabled on a template audience,
  `:100,138` template hint, `:30` "Send to subscribers" label, `:301-306` placeholder guard (Send only; Send test
  untouched). Loading / not found / error / sending states unchanged.
- [x] W-5 S4 Send confirm — audience + N copy, empty-audience toast (no dialog), 409 handling per §Screens S4.
  `src/admin-app/views/BroadcastDetailPage.vue:272-299` `confirmSendToSubscribers` (draft re-reads `GET /{id}` for the
  live N; read failure → "Couldn't count …" toast; N = 0 → "Nobody is subscribed …" toast; confirm title/message/button
  per S4; Resume on a failed template broadcast uses `recipient_count`, owner 2026-10-24); all-users confirm unchanged
  `:256-270`; 409 → existing `err.message` toast `:315-317`.
### Help / Legal
- [NA] W-6 Help — parent §Help impact: n/a (admin-only). Legal — parent §Legal impact: none to change; no ToS/PP edit.
### Verify
- [x] W-7 `npm run build:admin` passes. Green 2026-10-24 (`✓ built`); renamed `handleSendAll` → `handleSend`,
  `grep -rn handleSendAll src/admin-app` = 0.
- [~] W-8 Local run against the backend slice: walk S1 → S3 → S4 for a Paywiser and a Stripe template and an empty template;
  state what was seen per state (screens, toasts, navigation). DEFERRED TO wna-ui-tests: automate TC-846–850
  (runtime checks go to ui-tests per owner directive); needs the backend slice on the local stack.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [x] W-9 Update `../wna_orchestration/specs/features/wna-features.md` — admin Billing templates (Notify subscribers) and
  Broadcasts (§21.3 section + §26.5: template audience, kind lock, Copy, empty audience). `wna-features.md:1400-1409`
  (Billing Templates), `:1618-1622` (list Audience column + Copy), `:1643-1659` (template audience on the detail page),
  `:2371-2375` (§26.5).
- [x] W-10 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-846–850 (IDs reserved by the parent;
  expected results from §Screens). `wna-test-cases.md:19394` Section 62, TC-846 `:19401` … TC-850 `:19502`;
  `regression-ui-tests/update-tests.sh` re-run.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the admin-app screens S1–S4 in every state, on the local stack) and confirm it.
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
