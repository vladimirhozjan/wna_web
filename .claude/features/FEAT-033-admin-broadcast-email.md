# FEAT-033 — web slice: admin "Broadcasts" section + main-app "Announcements" opt-out toggle

Parent (canonical: problem, decisions D1–D10, design, user flows):
`../../wna_orchestration/features/FEAT-033-admin-broadcast-email.md` — read it first. Nothing from
it is restated here. This slice lives ONLY in the `develop-a` worktree.

## User flows (this project's part)
- **Free user**: main-app Settings → Notifications — the new "Announcements" toggle (`announcement`)
  driving the opt-out, greyed with the master toggle like the other events, plus the updated footer
  note wording. That is this repo's entire end-user surface. Parent §User flows (Free user), §Main app.
- **Pro user**: same as Free. Parent §User flows (Pro user).
- **Team owner**: same as Free — nothing team-scoped. Parent §User flows (Team owner).
- **Team member**: same as Free. Parent §User flows (Team member).
- **Admin (`admin`, `super_admin`)**: admin-app "Broadcasts" section — list page (status badge, kind,
  subject, created by, sent at, sent/skipped/failed counts, 30 s poll while any row is `sending`,
  Copy on every row, Delete on drafts), detail/editor page (kind select locked once not draft,
  subject, BroadcastEditor WYSIWYG + Raw tabs over one shared HTML string, email-safe sanitized
  output, `cid:logo` preview swap, Save draft, Send test to me, Send to all behind the confirm dialog
  with kind + live recipient count — red for `service_notice` — read-only view + Retry failed once
  sent). Parent §User flows (Admin admin, super_admin), §Admin app.
- **Admin (`support`, `viewer`)**: list + read-only detail; every write button hidden (backend also
  403s). Parent §User flows (Admin support, viewer).
- **Unauthenticated / not-entitled**: n/a — admin-only surface; no public web surface.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a GKE redeploy I
  cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Checklist
- [~] W1 admin-app: routes, sidebar entry, `broadcastModel`, BroadcastsPage, BroadcastDetailPage,
  BroadcastEditor (WYSIWYG + Raw, email-safe output, `cid:logo` preview swap), confirm dialog with
  recipient count. Parent §Admin app.
  Code complete + `build:admin` green (2026-09-08): routes `src/admin-app/router/router.js:119-135`
  (`broadcasts`, `broadcasts/new` admin+, `broadcasts/:id`); sidebar `src/admin-app/components/SidebarNav.vue:86`
  (below Alarms, minRole viewer per owner answer 2026-09-08); `src/admin-app/scripts/models/broadcastModel.js:18`;
  API wrappers `src/admin-app/scripts/core/apiClient.js` (`getBroadcasts` … `retryFailedBroadcast`);
  list `src/admin-app/views/BroadcastsPage.vue` (columns/badges, Copy `:45`, Delete-on-draft `:53`,
  30 s poll while sending `onMounted`); detail `src/admin-app/views/BroadcastDetailPage.vue`
  (shell prefill `:175`, kind lock/read-only `:157`, recipient-count confirm `:246-258`, Retry failed `:41`,
  Resume send on `failed`); editor `src/admin-app/components/BroadcastEditor.vue` (allow-list
  sanitizer `:93-176`, `cid:logo` swap `:180-186`, tabs over one string `:208`, paste sanitize `:274`);
  audit labels `src/admin-app/views/AuditLogPage.vue:122-128,156-162`; logo asset
  `src/admin-app/assets/logo-email.png` (copied from backend, owner answer 2026-09-08).
  **Remaining — DEFERRED TO USER:** runtime verification of TC-662–TC-672 (I do not run the apps);
  note viewer role sees the sidebar entry/routes but the backend 403s its reads (owner chose viewer).
- [~] W2 main-app: "Announcements" toggle + footer note in Settings → Notifications. Parent §Main app.
  Code complete + `build:main` green (2026-09-08): toggle row
  `src/main-app/views/dashboard/SettingsPage.vue:520-534` (greyed with the master toggle `:528`,
  footer note `:534`), computed `:1051`; model `src/main-app/scripts/models/notificationModel.js:20,50,60,141`
  (`announcement` in `disabled_events.email`). **Remaining — DEFERRED TO USER:** runtime check
  TC-658–TC-661 (Playwright T1/T2 owned by ui-tests).
- [x] Update `wna_orchestration/specs/features/wna-features.md` — §26 (broadcast kinds, no-queue
  path), §27 (Announcements toggle + footer note), new admin section "Broadcasts".
  `wna-features.md:1361` (Admin Broadcasts block), `:1795` (§26.5), `:1835` + `:1838` (§27.1 toggle + footer).
- [x] Update `wna_orchestration/specs/tests/wna-test-cases.md` — new Section 52 (admin broadcast
  surfaces + settings toggle); run `regression-ui-tests/update-tests.sh` and confirm the parser
  picks the new cases up.
  `wna-test-cases.md:15281` Section 52, TC-658–TC-661 (settings) + TC-662–TC-672 (admin, manual);
  TC-378 updated to six toggles + new footer wording. `update-tests.sh` run 2026-09-08: parser emitted
  TC-658…TC-672 into `regression-ui-tests/test-cases.json` (verified by grep).
- [x] `npm run build:admin` and `npm run build:main` pass (incl. obfuscator post-step).
  2026-09-08: admin "✓ built in 2.75s / Obfuscated 32 files"; main "✓ built in 3.84s / Obfuscated 18 files"
  (pre-existing main-app chunk-size warning only).

Order: W1 after backend B4 (admin endpoints), W2 after backend B5 (`announcement` accepted in
settings); W1/W2 independent of each other. Parent §Work breakdown.

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
   updated. (Find the home in the orchestration Fact Index.)
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to what you changed (this repo has no automated
   tests — the scoped check is the two production builds above plus manual verification). The full
   regression is run by the OWNER before deploy — never by the implementer.
