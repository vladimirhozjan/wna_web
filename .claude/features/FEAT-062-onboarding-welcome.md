# FEAT-062 — web slice: Onboarding welcome flow (WelcomeModal, Help replay link)

**Parent (canonical):** `../wna_orchestration/features/FEAT-062-onboarding-welcome.md` — §User flows, §Screens (user-flow coverage, Welcome modal, Help → Getting Started, data
needs, designer decisions DS1–DS11), §Design (D1–D6a), §Help impact, §Contracts touched. Read it first. This file is only
this repo's checklist; nothing from the parent is restated.

**Scope:** main-app only. New `src/main-app/components/WelcomeModal.vue` (DS2) and the `Modal.vue` `fullscreenMobile` prop
(DS1) are owner-approved; no new model. Depends on the backend FEAT-062 slice (`onboarding.completed` in
`/v1/user/settings`). Legal: n/a (parent §Legal impact), so no legal box. Help: no `content/help/` change (parent §Help
impact) — the replay link is W-6.

## User flows (this project's part)
- **Free / Pro / Team owner** — parent "Free user": open the modal on the first dashboard load per DS3 while
  `onboarding.completed` is `false`; 4 slides + controls; slide-4 capture → Inbox; Skip / × / Escape → PUT `true`; never
  again on any device.
- **Team member** — parent "Team member": same; nothing invite-specific in the web.
- **Existing account** — parent "Existing account": flag `true` (or settings unknown) → never opened automatically; replay
  from Help works.
- **Admin (relevant role)** — n/a — admin-app untouched.
- **Unauthenticated / not-entitled** — parent: public pages get no modal; the Help replay link is hidden when logged out;
  a logged-out `?welcome=1` goes through login, then the tour (owner-confirmed).

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
### Building blocks
- [ ] W-1 `Modal.vue` `fullscreenMobile` prop (DS1) — other modals unchanged.
- [ ] W-2 `components/WelcomeModal.vue` (DS2) — slides, `1/4` indicator (DS5), Back / Next / Skip, slide-4 `Skip for now`
  (DS6), backdrop ignored (DS4).
- [ ] W-3 `settingsModel` — `onboardingCompleted` + setter that PUTs; reset on logout, reload on every login (DS11).
### Screens (one box per parent §Screens surface — every state + exact copy)
- [ ] W-4 Welcome modal — slides 1–4 exact copy + coin art (FEAT-057 `EmptyState` art), desktop + ≤ 768 px full screen.
- [ ] W-5 Modal-level rules — DashboardLayout open rules (DS3 exceptions), settings load fails → not opened, flag PUT fails
  → toast + reopen next load, `?welcome=1` replay (query dropped, no PUT when already `true`, DS9), slide-4 capture states
  (empty / submitting with controls inert DS8 / success → Inbox / inline error DS7).
- [ ] W-6 Help → Getting Started replay link (DS10) in `views/public/HelpGettingStartedPage.vue` — logged in only →
  `/engage?welcome=1`.
### Verify
- [ ] W-7 `npm run build:main` passes (paste the tail).
- [ ] W-8 `data-testid`s for ui-tests (modal, step indicator, Next / Back / Skip, capture field + button, Help link); list
  them here for the ui-tests slice.
### Spec sync (wna_orchestration — required, never deferred; cite `file:line`)
- [ ] W-9 Update `../wna_orchestration/specs/features/wna-features.md` — welcome flow, Help replay link, settings reload on
  login.
- [ ] W-10 Update `../wna_orchestration/specs/tests/wna-test-cases.md` — author TC-869–873 (IDs reserved by the parent; scope
  per the ui-tests slice).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the welcome modal on a fresh local account in the local dev server, desktop and phone width, and the Help link logged in / out) and confirm it.
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
   affected targets (`npm run build:main` and the local check of the modal + Help page). The full regression suite is run by the
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
