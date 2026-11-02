# FEAT-084 — web slice: Contact Support and Report a Bug move into Settings

- Parent (single source of truth): `wna_orchestration/features/FEAT-084-support-links-in-settings.md`
- Work: parent `## Work breakdown` §web W1–W5. Screens (every state + exact copy): parent `## Screens` §1 (removal),
  §2 (Settings → Support / Help & Support), §3 (Help copy); contracts: `## Design` §Contracts C1 (`Btn` `href` prop),
  C2 (group, section, rows, `mailto` URLs, test ids), C3 (removal); boundaries + reuse: §Boundaries; flows: §Flows 1–5
  and edge cases; Help copy: `## Help impact`; spec homes: `## Contracts touched` — this slice does not restate them.
- Order (parent Work breakdown): **one web job, W1 → W2 → W3 → W4 → W5**. No backend / deploy dependency. ui-tests U1–U2
  run after this job.
- Owner decisions: D1 (support entries in Settings, floating button removed), D2 = A ("Help center" is row 1) —
  parent `## Owner decisions`, `decisions.md` 2026-11-02 · FEAT-084.
- Legal impact: n/a (parent) — no box. Landing / Pricing impact: n/a (parent) — no box. Data contract: n/a (parent —
  static section, no server data) — no `Data:` lines.
- New components / models / CSS variables / icons: none (parent §Boundaries "Reuse"); `Btn` gains one optional prop (C1).

## User flows (this project's part)
- Free user: sidebar Settings → group **Support** (last) → **Help & Support** → row 1 "Open" → `/help`; rows 2 / 3
  "Email us" are anchors to the C2 `mailto` URLs (email app opens with recipient + subject); no floating tab on any page.
- Pro user: same as Free — the section is not tier-gated (`available()` default).
- Team owner: same as Free.
- Team member: same as Free.
- Admin (relevant role): n/a — admin-app has no Feedback button and is untouched (parent §Boundaries).
- Unauthenticated / not-entitled: the floating tab is gone on public pages too (C3); Help page "Contact Support" stays
  unchanged (`HelpPage.vue` / `HelpConnectAiPage.vue` not edited); Settings stays behind the existing auth guard.

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
One job, in this order:
- [x] **W1 — `Btn` `href` prop** (`src/main-app/components/Btn.vue`) — exactly parent C1: `href` set → root `<a :href>`
  with the same classes / slot / loader / `$attrs`, no `disabled` attribute; unset → `<button>` unchanged; anchor looks
  identical to the button of the same variant/size in every state (no underline, variant colour), mobile hit-area rule
  unchanged.
  — DONE: `src/main-app/components/Btn.vue:2-8` (`<component :is>` → `<a :href>` / `<button :disabled>`), `:40` (prop), `:70` (`text-decoration: none`).
- [x] **W1 · Verify** — `npm run build:main` passes; Chrome `:5173` (after W2): the "Email us" anchors look identical
  to Account → "Change password" (default, hover, focus; light + dark; desktop + 500px); DevTools shows `<a>` for them,
  `<button>` for every other `Btn`.
  — VERIFIED: `npm run build:main` exit 0; Chrome :5173 (500px + 1300px, light + dark): "Email us" = `A`, "Open" = `BUTTON`, both 30px tall, 13px/600 Montserrat, same colour/bg/border, `text-decoration: none`, no `disabled` attr; hover shows the secondary hover bg; keyboard focus shows the native focus ring.
- [x] **W2 — Settings → Support / Help & Support** (`src/main-app/views/dashboard/SettingsPage.vue`) — parent C2:
  `GROUPS` entry `support` after `integrations`; `SECTIONS` entry `support` last (title, description, keywords as C2);
  one `v-else-if="activeKey === 'support'"` card. Reuse only (parent §Boundaries): no change to `available()`,
  `SECTION_ALIASES`, search, menu/index/back logic or the Plan "Contact Us" handler.
  — DONE: `src/main-app/views/dashboard/SettingsPage.vue:911` (GROUPS), `:938-939` (SECTIONS), `:717-743` (card); `available()`, `SECTION_ALIASES`, search, menu/index logic untouched.
- [x] **Screen §2 — Help & Support section** — built per parent `## Screens` §2: menu/index entry, the card with
  row 1 "Help center" (Open → `router.push({ name: 'help' })`, D2), row 2 "Contact Support" and row 3 "Report a Bug"
  (anchor `Btn`s from W1 with the exact C2 `href`s), hints verbatim (address = plain selectable text), test ids
  `settings-support-help` / `-contact` / `-bug`; every state of §2 States (default, search, no email app, not signed
  in, per role) and the §2 Layout table (desktop > 1024px, ≤ 1024px index → section with "‹ Settings", 500px rows not
  stacked).
  — DONE: `SettingsPage.vue:720-741` — rows Help center / Contact Support / Report a Bug, hints verbatim (addresses plain text), test ids `settings-support-help` `:725`, `-contact` `:732`, `-bug` `:739`; section static, not gated (same for every tier/role).
- [x] **W2 · Verify** — Chrome `:5173`: desktop menu shows SUPPORT last; `/settings?section=support` renders the card;
  ≤ 1024px index row + "‹ Settings" back; 500px rows do not stack, hints wrap, nothing overflows; search "bug" /
  "feedback" → only Help & Support, Enter opens it; DevTools shows the two exact C2 `href`s; "Open" lands on `/help`
  and browser back returns to `/settings?section=support`.
  — VERIFIED in Chrome :5173: desktop 1300px menu shows SUPPORT → Help & Support last; `/settings?section=support` renders the card; 500px index has group `settings-group-support` last, "‹ Settings" back returns to the index; 500px rows not stacked, hints wrap, `scrollWidth == innerWidth` (no overflow); search "feedback" → only Help & Support, Enter → `?section=support`; DevTools `href`s = the two exact C2 URLs; "Open" → `/help`, browser back → `/settings?section=support`.
- [x] **W3 — remove the floating button** (Screen §1, C3) — delete `src/main-app/components/FeedbackBtn.vue`; remove
  the `<FeedbackBtn />` mount (`App.vue:27`) and its import (`App.vue:37`). Icons `QuizIcon` / `CommentIcon` /
  `WarningIcon` stay (other users, parent §Boundaries).
  — DONE: `src/main-app/components/FeedbackBtn.vue` deleted; mount + import removed from `src/main-app/App.vue` (0 matches of "Feedback").
- [x] **W3 · Verify** — `npm run build:main` passes; `grep -rn "FeedbackBtn\|feedback-btn\|feedback-wrapper" src/` →
  0 matches; Chrome `:5173` — no right-edge tab on Engage, Settings, Landing, Help (desktop + 500px).
  — VERIFIED: `npm run build:main` exit 0; `grep -rn "FeedbackBtn\|feedback-btn\|feedback-wrapper" src/` → 0 matches; Chrome :5173 `.feedback-btn,.feedback-wrapper` count 0 on Engage (1300px + 500px), Settings, Landing `/`, `/help`, `/help/faq`.
- [x] **W4 — Help copy** (`src/main-app/content/help/faq.js:356`) — answer of "How do I send feedback or contact
  support?" replaced with the parent `## Help impact` / Screens §3 text, verbatim.
  — DONE: `src/main-app/content/help/faq.js:356` — Screens §3 text verbatim.
- [x] **W4 · Verify** — `/help/faq` shows the new answer (Chrome `:5173`).
  — VERIFIED: Chrome :5173 `/help/faq` → "How do I send feedback or contact support?" expanded shows the new answer.
- [x] **W5 · Update `wna_orchestration/specs/features/wna-features.md`** — per parent `## Contracts touched`: §21.1
  (keys list + Support group / Help & Support section); §29 rewritten in place (title "Support & Bug Report", the
  Settings rows, the `mailto` table kept, the public Help-page entry); TOC line renamed to match; "Touch targets"
  bullet drops "the Feedback button". Cite the orchestration `file:line`s.
  — DONE: `wna_orchestration/specs/features/wna-features.md:39` (TOC), `:1456` (keys + `support`), `:1466` (Support group), `:2758` (Touch targets drops "the Feedback button"), `:2970-3004` (§29 rewritten: 29.1 Settings rows, 29.2 mailto table kept, 29.3 public Help-page entry).
- [x] **W5 · TC report** — fill `## TC report` below with the TCs made stale / new for ui-tests (TC-430…TC-436);
  never edit `specs/tests/wna-test-cases.md` (ui-tests only).
  — DONE: see `## TC report` below.

## TC report
(Filled by W5 — the TCs this change makes stale or new, for ui-tests. None edited here.)

Stale — `specs/tests/wna-test-cases.md` §29 "Feedback Button" (line 12402), rewrite in place per parent U1 (same IDs):
- TC-430 "Feedback Button Visible on Dashboard" → no floating tab on dashboard pages (`.feedback-btn` count 0).
- TC-431 "Feedback Button Visible on Public Pages" → none on `/`, `/pricing`, `/help` signed out.
- TC-432 "Feedback Popover Opens and Closes" → Settings group "Support" last with "Help & Support"; title, description,
  3 rows (Help center first; "Open" → `/help`, back → `/settings?section=support`).
- TC-433 "Contact Support Opens Email" → `settings-support-contact` is an `<a>` with the C2 support `mailto` `href`.
- TC-434 "Report a Bug Opens Email" → `settings-support-bug` is an `<a>` with the C2 bug `mailto` `href`.
- TC-435 "Feedback Button Mobile Positioning" → 500px: index row → section screen with "‹ Settings"; rows not stacked,
  "Email us" inside the viewport, no horizontal overflow.
- TC-436 "Feedback Button Dark Theme" → search "feedback" / "bug" leaves only "Help & Support"; Enter opens it.
Stale references in tests (parent U2): `tests/e2e/auth-dialog-mobile-scroll.spec.ts:179` (`.feedback-btn` as fixed
reference, TC-1010), `tests/screenshots/landing-screenshots.spec.ts:42-47` (`.feedback-wrapper` in the hide list).
New: none beyond the rewritten TC-430…TC-436.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the Settings → Help & Support screen at desktop + 500px, the anchor `href`s in
   DevTools, the pages without the right-edge tab, `/help/faq`) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done (`FeedbackBtn`, `feedback-btn`, `feedback-wrapper`).
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
   Exception for this repo: test cases (`specs/tests/*`) are authored by wna-ui-tests only — list them in `## TC report`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). This repo has no automated tests: verify with `npm run build:main` and the Chrome
   check on `:5173` (desktop + 500px) of every state you touched. The full regression suite is run by the
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
