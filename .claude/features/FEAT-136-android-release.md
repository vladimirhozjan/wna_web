# FEAT-136 — web slice

Parent: `FEAT-136` (`../wna_orchestration/features/FEAT-136-android-release.md`) — Android 22, Google Play release. This slice is the local checklist only; design (C1–C13, F1–F5), screens (P0–P5, web W1–W6), owner decisions D1–D2, Legal / Help / Landing impact live in the parent — read them there, never here.

Reserved TCs: none (TCs are authored by `ui-tests`).

## User flows (this project's part)
Free / Pro / Team user and Team member: the Android store links on the landing / footer / Help (gated by both store links, parent § Screens → Web), the Help / FAQ copy and the account-deletion deep link. Admin: n/a — admin-app has no store element. Unauthenticated: sees the same public pages (landing, footer, Help); no install banner (W5).

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

## Checklist
- [x] W1 — C9: `domains.js` `google_play_url`. Consumes nothing.
  Proof: `src/main-app/scripts/core/domains.js:22` (null unless `app_store_url` is set and the package matches C9's regex; checked in node for off / App Store only / Google only / both / bad package).
- [x] W2 — badge: `AppStoreBadge.vue` `store` prop (`app-store` default · `google-play`; `background` ignored for
  Google), Google's official English "Get it on Google Play" web SVG unmodified as `assets/landing/google-play-badge.svg`,
  alt "Get it on Google Play", link `google_play_url`, `target="_blank"` `rel="noopener"`. Consumes W1.
  Proof: `components/public/AppStoreBadge.vue:15,24,26`; asset `assets/landing/google-play-badge.svg` = byte-identical to Google Partner Marketing Hub asset `Badge_GetItOnGP_enus_Digital_Fullcolor_GooglePlay.svg` (viewBox 238.96 × 70.87 → 162 × 48 / 135 × 40 px).
- [x] W3 — designer W1–W3: hero pill copy, `CaptureEverywhereSection.vue` (subtitle, share line, watch item, badge row,
  Android line removed), Why Us line — each the "both" variant only while `google_play_url` is set. Consumes W1, W2.
  Proof: `HeroSection.vue:7`, `CaptureEverywhereSection.vue:28-32,47,62,74`, `WhyUsSection.vue:37` (all under `components/public/`). Chrome :5173 both-live: pill "Now on iPhone and Android", badges 144 + 12 + 162 px at 48 px (desktop 1504) and 120 + 11.5 + 135 px at 40 px (500 px), no Android line; App Store only: today's page unchanged.
- [x] W4 — designer W4: footer Google Play badge + `footer-trademarks`, gated. Consumes W1, W2.
  Proof: `components/public/PublicFooter.vue:12,43`. Chrome: badges stacked 40 px, 12 px gap, left-aligned (desktop + 500 px); trademark line wraps under the copyright.
- [x] W5 — Help impact: the W6 "both" variants in `faq.js` / `gettingStarted.js`; the delete-account entry (`id`,
  answer) + `FaqItem.vue` / `HelpFaqPage.vue` deep link (C11). Consumes W1.
  Proof: `content/help/faq.js:6,112,124,357,368,395,405`, `content/help/gettingStarted.js:5,48`, `components/public/FaqItem.vue:2,27`, `views/public/HelpFaqPage.vue:17,54`. Chrome `/help/faq#delete-account`: entry open and scrolled under the top bar (desktop + 500 px).
- [x] W6 — local pre-render check: `npm run build:main` → `dist/main-app/_prerender/index.html` has no
  `landing-googleplay-capture` / `footer-googleplay-badge` / `footer-trademarks` and today's hero / Capture / Why Us text.
  Consumes W3, W4.
  Proof: `npm run build:main` green; `dist/main-app/_prerender/index.html` has 0 × `landing-googleplay-capture` / `footer-googleplay-badge` / `footer-trademarks` / `landing-hero-ios` / `landing-capture` and Why Us "Access your system from any device…" (today's pre-render text); `_prerender/help/faq/index.html` has `id="delete-account"`.
- [x] W7 — Legal impact: `terms.md` + `privacy.md` texts and "Last updated" (the date B1 / DP2 copy). Consumes nothing.
  Proof: date **2026-11-23** (B1 / DP2 `terms_version`). `content/legal/terms.md:3,11,19`; `content/legal/privacy.md:3,302,334,370`.
- [x] Screens — build the web screens per parent § Screens → Web (W1 hero pill, W2 Capture Everywhere, W3 Why Us, W4 footer, W6 Help / FAQ): every state of its States table (pre-render · App Store only · Google Play only · both links) and the exact copy; badge per its Badge rules. Covers W3–W5 above; no extra work.
  Proof: all four States checked in Chrome :5173 (both · App Store only via a temporary local `config.js`, restored) and in the build (pre-render); Google-only = null by `domains.js:22` (node check).
- [x] Update `specs/features/wna-features.md` §24.1 (hero pill, Capture Everywhere, Why Us), §24.5 (Google Play badge, trademark line), Help FAQ deep link `#delete-account` — parent § Contracts touched.
  Proof: `wna_orchestration/specs/features/wna-features.md:2501` (Google Play switch), §24.1 hero / Capture / Why Us lines, `:2666` (FAQ deep link + Help variants), §24.5 footer badge, trademark line, `:2786` (Google Play badge).

## Execution order
W1 → W2 → W3, W4, W5 (W5 consumes W1) → W6 (consumes W3, W4); W7 independent (its date feeds backend B1 and deploy DP2).
