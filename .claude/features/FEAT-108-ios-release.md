# FEAT-108 — web slice

Parent: `FEAT-108` (`../wna_orchestration/features/FEAT-108-ios-release.md`) — iOS 22, App Store release. This slice is the local checklist only; design (C1–C12, F1–F5), screens (R0–R6), owner decisions D1–D7, Legal / Help / Landing impact and the data contract live in the parent — read them there, they are not restated here. Consumes deploy none; W3 consumes ios-tests T3 (the landing PNG); W5 reads existing server fields only. All elements gated on `app_store_url` (C7). Work only in this `main` worktree.

Reserved TCs: none (TCs are authored by `ui-tests`).

## User flows (this project's part)
Free / Pro / Team user and Unauthenticated visitor: R4 landing (hero pill, Capture Everywhere, Why Us line, footer badge) identical for every visitor and shown only while `app_store_url` is set; R6 Mobile column in Settings → Notifications for signed-in Free / Pro / Team users; iPhone Help texts. Team member: as Team user for R6 (Team has the 14 Mobile switches). Admin: n/a — admin-app untouched. Not-entitled / blocked: n/a — no tier gate in this item.

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
- [x] W1 — C7: `scripts/core/domains.js` `getDomains()` `app_store_url` (`https://apps.apple.com/app/id<ID>` from `RUNTIME_CONFIG.APP_STORE_ID`, digits only; else `null`). Data: runtime config `APP_STORE_ID`, written by deploy DP1 (no server data). Consumes nothing.
  Proof: `src/main-app/scripts/core/domains.js:18` — digits only → `https://apps.apple.com/app/id<ID>`, else `null`; Node check: no `APP_STORE_ID` → `null` (pre-render / local `config.js` stay off).
- [x] W2 — `AppStoreBadge.vue` (Apple's official English "Download on the App Store" SVGs, black (`app-store-badge-blk.svg`) and white (`app-store-badge-wht.svg`), unmodified, in `assets/landing/`; a `background` prop `light|dark` picks black|white; props height 40 / 48; link `app_store_url`, `target="_blank"` `rel="noopener"`). Data: `app_store_url` (W1). Consumes W1.
  Proof: `src/main-app/assets/landing/app-store-badge-blk.svg` / `app-store-badge-wht.svg` (owner's `-wth` file renamed by `mv`, content untouched — SHA-1 `2f2fe1c…` / `0e92934…` equal to the owner's files and to the built `dist/main-app/assets/app-store-badge-*.svg`); `src/main-app/components/public/AppStoreBadge.vue:2` (`<a>` only while `app_store_url`, `target="_blank"` `rel="noopener"`), `:14` (`background` light|dark), `:15` (height 40|48), `:19` (light → blk, dark → wht). No hover effect or other change to Apple's artwork. 0 references to `badge-wth` in `src` / orchestration specs.
- [x] W3 — R4 hero pill `landing-hero-ios` + `CaptureEverywhereSection.vue` (`landing-capture`, title, subtitle, shot, 4 items, badge `landing-appstore-capture` (white badge — dark background), Android line; mobile / desktop layout) (+ the four icons as Why Us inline SVGs) + Why Us `landing-why-cross` line, all gated; every state + exact copy per parent § R4; `src/main-app/assets/landing/landing-iphone-capture.png` copied from `../wna_ios/build/appstore/web/`. Data: `app_store_url` (W1); the shot is the file from ios-tests T3. Consumes W1, W2, ios-tests T3.
  Proof: `src/main-app/assets/landing/landing-iphone-capture.png` (copied unchanged from `../wna_ios/build/appstore/web/` after J1563 ✘ 1 — whiteboard shot 2, SHA-256 `cf06e65b8e3d07b44d3611fee1d439913b17e57b547cb7b3d04821b283de5bc5` identical to the ios-tests T3 report, 560×1218); `src/main-app/components/public/HeroSection.vue:6` (pill `landing-hero-ios` → `#capture`, gated); `src/main-app/components/public/CaptureEverywhereSection.vue:2` (gated section `#capture` `landing-capture`), `:13` (shot, lazy, alt, hidden on error), `:47`–`:69` (4 items + Lucide-style inline SVGs), `:28` (white badge 48 px, 40 px ≤ 768 px), `:29` (Android line); `src/main-app/views/public/LandingPage.vue:6` (after How It Works, before the GTD strip); `src/main-app/components/public/WhyUsSection.vue:34` (`landing-why-cross` line on/off). Chrome `:5173` with `APP_STORE_ID` set locally (reverted): desktop — pill click scrolls to `#capture`, shot 280 px, items 2 × 2, badge 48 px; 800 px — shot 240 px, items one column; 500 px — pill one line (275 px), one column, shot 220 px, badge 40 px; Why Us new line. Off — 0 `landing-hero-ios` / `landing-capture`, old Why Us line, Learn More still scrolls to `#features`.
- [x] W4 — R4 footer badge `footer-appstore-badge` (white badge — dark background) in `PublicFooter.vue` (Brand column under the logo, every public page using `LandingLayout`), gated. Data: `app_store_url` (W1). Consumes W1, W2.
  Proof: `src/main-app/components/public/PublicFooter.vue:11` (`AppStoreBadge background="dark"` 40 px, `footer-appstore-badge`, Brand column under logo + tagline), `:124` (left-aligned, 16 px from the tagline). Chrome `:5173`: on — `href` `https://apps.apple.com/app/id6830097049`, white badge on `--color-bg-dark-deep`, 500 px fits; off — 0 `footer-appstore-badge`.
- [x] W5 — R6 Mobile column: `notificationModel.js` (`mobile` state from `disabled_events.mobile`, payload only while shown; `["*"]` = all off) + `SettingsPage.vue` header `notif-column-label` and switches `notif-mobile-<event>` per parent § R6 / F5. Data: `disabled_events.mobile` from `GET /v1/notification/settings` and the `PUT` response — existing backend fields (parent Data contract `settings_service_impl.cpp:28` / `:91`); no backend box. Consumes W1.
  Proof: `src/main-app/scripts/models/notificationModel.js:38` (`MOBILE_COLUMN` from `app_store_url`), `:81` (reads `disabled_events.mobile`, `["*"]` = all off, only while shown), `:89` (`mobile` in the PUT only while shown); `src/main-app/views/dashboard/SettingsPage.vue:529` (`Mobile` header after Web, `notif-column-label`), `:554`–`:563` (switch per Web row, `notif-mobile-<event>`, aria "<label> on mobile", saving spinner, empty cell for Announcements; errors → revert + `NOTIFICATION_SAVE_ERROR` via `onEventToggle`). Chrome `:5173` (Free user, local stack): on — Mobile header, 3 switches, `notif-mobile-daily_digest` off → `GET` `disabled_events.mobile` = `["daily_digest"]` → reload → still off; 500 px fits; off — no Mobile header, 0 `notif-mobile-*`, the PUT carries `email` + `web` only and the server keeps `mobile`. Team (14 switches) not run in Chrome — same `row.web !== false` filter as the 14 Web switches.
- [x] W6 — Help impact: the "on" versions in `faq.js` (phone, share, offline, notifications, manage notifications) / `gettingStarted.js` (new entry), verbatim per the parent's Help impact; today's text stays the "off" version. Data: `app_store_url` (W1). Consumes W1.
  Proof: `src/main-app/content/help/faq.js:4` (`APP_LIVE` from `app_store_url`), offline `:110`, share `:120`, manage notifications `:351`, get notifications `:360`, phone `:394`; `src/main-app/content/help/gettingStarted.js:42` (new entry after Quick Add, on only). Node check: off → `faq` / `gettingStarted` JSON identical to `HEAD`; on → the five answers and the new entry match the parent's Help impact verbatim. `npm run build:main` pre-render `help/faq` keeps the old phone answer, `help/getting-started` has no iPhone entry.
- [x] W7 — local check of the pre-render: `npm run build:main` → `dist/main-app/_prerender/index.html` has no `landing-capture` / `footer-appstore-badge` and the old Why Us line. Consumes W3, W4.
  Proof: `npm run build:main` green; `dist/main-app/_prerender/index.html` — 0 `landing-capture`, 0 `footer-appstore-badge`, 0 `landing-hero-ios`, 1 "Access your system from any device…" (old Why Us line); `_prerender/pricing/index.html` — 0 `footer-appstore-badge`.
- [x] W8 — Legal impact: `terms.md` + `privacy.md` texts and "Last updated" per the parent's Legal impact section (the date backend B1 / deploy DP2 copy). Consumes nothing.
  **Last updated = `2026-11-13`** (B1 / DP2 copy this as `terms_version`). Proof: `src/main-app/content/legal/terms.md:3` (November 13, 2026), `:11` §1 Service, `:19` §2 (platform sentence + App Store EULA sentence); `src/main-app/content/legal/privacy.md:3` (November 13, 2026), `:289` new §5.15, `:315` §6 TestFlight paragraph, `:348` §7 TestFlight row; §2.2 camera/microphone unchanged (already names the iPhone prompt). The web keeps no ToS version constant (`terms_version` comes from the server).
- [x] Update `wna_orchestration/specs/features/wna-features.md` — §24.1 (Capture Everywhere, hero pill, Why Us), §24.5 (badge), §24.6 (Smart App Banner), §27.1 (Mobile column). Cite the lines.
  Proof: `wna_orchestration/specs/features/wna-features.md:2475` (§24.1 App Store switch), `:2484` (hero pill), `:2507` (section 4 Capture Everywhere; later sections renumbered 5–10), `:2529` (Why Us line on/off); `:2702` (§24.5 Brand column badge), `:2712` (§24.5 badge rule: white on dark, black on light — FEAT-108 D8); `:2737` (§24.6 Smart App Banner, container DP1 `wna_deploy/frontend/main/entrypoint.sh:25`); `:3047` / `:3088` (§27.1 Mobile column, W5).

