# FEAT-053 — web slice: Email-to-Inbox attachment ingestion (Settings hint + Help)

**Parent (canonical):** `../wna_orchestration/features/FEAT-053-email-to-inbox-attachments.md` — §User flows, §Screens
(hint line copy + placement), §Help impact, §Legal impact, §Work breakdown → web. Read it first. This file is only this
repo's checklist; nothing from the parent is restated.

**Scope:** main-app only — `views/dashboard/SettingsPage.vue` (email-to-inbox panel), `content/help/faq.js`,
`content/help/gettingStarted.js`. No new component, model, route or API call. `StuffDetailPage` / `AttachmentSection`
unchanged (parent §Screens).

## User flows (this project's part)
- **Free** — n/a — the Settings email panel's locked state is unchanged; the hint line belongs to the unlocked panel only.
- **Pro / Team owner / Team member** — parent "Pro user / Team owner / Team member": the Settings email panel shows the one
  hint line; imported attachments and the note line render through the existing Stuff detail (no web change).
- **Admin (support+)** — n/a — `error_detail` is shown by the existing admin email-log page; no admin-app change.
- **Unauthenticated / not-entitled** — n/a — no public surface; Help text is the only public-facing change (Help items below).

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
### Screens (parent § Screens)
- [ ] W-1 Settings email-to-inbox panel — hint line built per the parent's § Screens: exact copy, placed below the address
  block, existing text class + tokens (no new CSS variable/class). Shown only in the unlocked (Pro/Team) panel state.

### Help (parent § Help impact)
- [ ] W-2 `src/main-app/content/help/faq.js` "Can I send items to my Inbox by email?" — add the attachments sentence per
  parent § Help impact.
- [ ] W-3 `src/main-app/content/help/gettingStarted.js` "Capture by Email" — same sentence per parent § Help impact.

### Legal (parent § Legal impact)
- [NA] W-4 ToS / Privacy Policy — parent § Legal impact is n/a (existing clauses already cover it); no legal-text edit.

### Verify + spec sync
- [ ] W-5 `npm run build:main` passes; record the result.
- [ ] W-6 Update `../wna_orchestration/specs/features/wna-features.md` §21.10 — hint line + attachment behaviour sentence
  (parent § Contracts touched). Cite `file:line`.
- [ ] W-7 Ask the user to verify at runtime: Settings → Email to Inbox (Pro user) shows the hint line in place; Help FAQ +
  Getting Started show the new sentence.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the Settings email-to-inbox panel with the hint line, the Help FAQ and Getting
   Started entries) and confirm it.
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
