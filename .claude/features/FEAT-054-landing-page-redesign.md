# FEAT-054 — web slice: Landing page redesign

**Parent (canonical):** `../wna_orchestration/features/FEAT-054-landing-page-redesign.md` — §User flows, §Screens
(section order, every section's exact copy, screenshot specs, states, click budget, test ids), §Design (D1–D16),
§Legal impact, §Help impact, §Work breakdown → web. Read it first. This file is only this repo's checklist; nothing from
the parent is restated.

**Scope:** main-app public landing only — `views/public/LandingPage.vue`, `components/public/HeroSection.vue`,
`FeaturesSection.vue` (→ D3 strip), new `ApartSection.vue` + `LandingFaqSection.vue` (D10, owner-approved),
`src/main-app/assets/landing/*.png` (D11/D12 — produced by the wna-ui-tests capture script, not hand-made),
`router/router.js` `/` `seo.description` (D9). Reuses `FaqItem`, `Badge`, `Btn`, existing icons, text classes and tokens —
no new CSS variable, model, route or API call (parent §Screens · Data needs). Unchanged: `HowItWorksSection`,
`WhyUsSection`, `TestimonySection`, `BookSection`, `CtaBanner`, `content/help/faq.js` (D15), `og-image.png`.

## User flows (this project's part)
- **Free / Pro / Team owner / Team member** — n/a — parent: the landing is public and identical for every role; a
  signed-in visitor on `/` keeps today's `LandingLayout` behaviour (parent §Screens · States).
- **Admin (any role)** — n/a — no admin-app surface.
- **Unauthenticated** — parent "Unauthenticated": `/` shows the hero screenshot + trust line, What Sets Us Apart (4 cards
  with plan chips, static — D16) closed by the "See pricing" pointer to `/pricing`, the GTD strip, the landing FAQ with
  "All questions →" `/help/faq`, then Start Free (register dialog) — all within the parent's click budget.
- **Not-entitled / blocked** — n/a — no gated element; plan chips are labels, not checks (D16).

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
### Screens (parent § Screens — every state + exact copy)
- [x] W-1 Landing section order + backgrounds + anchors per § Section order (D8, D13): D2 owns `#features`, new
  `#gtd-lists` and `#faq`, `#how-it-works` / `#why-us` kept; footer "Features" and hero "Learn More" land on D2. — DONE: order `views/public/LandingPage.vue:3-11`; `#features` `ApartSection.vue:2`, `#gtd-lists` `FeaturesSection.vue:2`, `#faq` `LandingFaqSection.vue:2`; Learn More → `features` `HeroSection.vue:32`; footer `PublicFooter.vue:16` `/#features` unchanged → D2; backgrounds subtle/primary alternation per section `<style>`.
- [x] W-2 Hero per § 1 (D1a, D4): new sub line, Learn More target, trust line, `landing-engage.png` with its alt text;
  headline + Start Free unchanged. — DONE: `HeroSection.vue:7` sub, `:12` trust line, `:13-15` screenshot + alt, `:25` import; h1 `:6` + Start Free `:9` unchanged.
- [x] W-3 What Sets Us Apart per § 2 — new `components/public/ApartSection.vue` (D2, D10): heading, sub, 4 cards in order
  (screenshot → chip → title → line, exact copy + alt texts), chips = `Badge type="primary"` (D14), always shown (D16);
  pricing pointer (D5) with only "See pricing" linked to `/pricing`. — DONE: `ApartSection.vue:4-5` heading/sub, `:31-64` 4 cards (copy + alts), `:11` `Badge type="primary"` always rendered, `:16-18` pointer with only "See pricing" as `router-link` `/pricing`.
- [x] W-4 GTD strip per § 4 — `FeaturesSection.vue` reworked (D3): heading, 9 icons + names in the stated order, not
  links; the old 9 card descriptions removed (grep confirms `0` leftovers). — DONE: `FeaturesSection.vue:4` heading, `:26-36` 9 items in order, plain `div`s (no links); grep of the 9 old descriptions + "Your Trusted System, Organized" in `src/` = 0 matches.
- [x] W-5 Landing FAQ per § 8 — new `components/public/LandingFaqSection.vue` (D6, D10): heading, the 4 entries looked up
  in `content/help/faq.js` by `question` (never copied; `faq.js` text untouched — D15), a missing entry skipped never
  blank, "All questions →" `/help/faq` in the Help "Show all" link style. — DONE: `LandingFaqSection.vue:28-35` lookup by `question` + `.filter(Boolean)` skips missing; `:14-17` "All questions" + `ArrowRightSmallIcon` with Help `show-more` styles; `git diff -- src/main-app/content/help` empty.
- [x] W-6 Unchanged sections per § 5–7 and § 9 (D7, D8, D13): How It Works, Why Us, Founder, Book, CTA banner — no copy or
  style change (only their position in `LandingPage.vue`). — DONE: `git status` shows HowItWorks/WhyUs/Testimony/Book/CtaBanner unmodified; only their position in `LandingPage.vue:5-11`.
- [x] W-7 Screenshots (D1, D11, D12): the 5 PNGs from the wna-ui-tests capture script sit in `src/main-app/assets/landing/`
  and are imported by Vite (hashed names in `dist/`); light theme only, one set. Blocked until ui-tests U-1/U-2 has written
  them — mark `[~]` with that reason until then. — DONE: 5 PNGs in `src/main-app/assets/landing/` (all 16:10: 2880×1800, 1824×1140, 3×2016×1260), imported `HeroSection.vue:25`, `ApartSection.vue:26-29`; `dist/main-app/assets/landing-*-<hash>.png` ×5 emitted.
- [x] W-8 States per § States: 16:10 reserved box, hero eager / D2 `loading="lazy"`, `@error` hides a failed image (card
  keeps chip, title, line), mobile ≤768 / tablet 769–1024 / desktop grids as specified. — DONE: 16:10 box with `--color-bg-subtle` `HeroSection.vue:115`, `ApartSection.vue:108`; hero eager (no `loading`), D2 `loading="lazy"` `ApartSection.vue:9`; `@error` hides box `HeroSection.vue:13-14`, `ApartSection.vue:8-9` (chip/title/line stay); grids: D2 1 col → 2×2 ≥769 `ApartSection.vue:89,153`; strip 3×3 → 9 ≥769 `FeaturesSection.vue:54,79`; hero CTAs unchanged. Runtime look → W-16.
- [x] W-9 `data-testid`s exactly as § Test ids lists (ui-tests depend on them). — DONE: all 11 ids present — `HeroSection.vue:12,13`, `ApartSection.vue:2,7,11,16`, `FeaturesSection.vue:2`, `LandingFaqSection.vue:2,14`.
- [x] W-10 Meta description (D9): `router.js` `/` `seo.description` = the § Meta description text; title, `jsonLd`,
  `og-image.png` unchanged. — DONE: `router/router.js:31` (157 chars); title `:30`, `jsonLd` `:32` unchanged; `og-image.png` untouched.

### Legal (parent § Legal impact)
- [NA] W-11 ToS / Privacy Policy — parent § Legal impact is n/a (D4 claims only what `privacy.md` §5.1 / §6 already
  state); resolve to `[NA]` with that reason after confirming no legal-text edit was needed. — NA: confirmed `content/legal/privacy.md:5,12` (Slovenian company) and `:225` (EEA hosting, Warsaw/Madrid) already state the claims; no legal-text edit.

### Help (parent § Help impact)
- [NA] W-12 Help pages — parent § Help impact is n/a (D6/D15 reuse 4 `faq.js` entries as is); resolve to `[NA]` with that
  reason after confirming `content/help/*` is unchanged (`git diff` empty for it). — NA: `git diff -- src/main-app/content/help` empty; the 4 entries are reused by lookup.

### Verify + spec sync
- [x] W-13 `npm run build:main` passes; the pre-rendered `dist/main-app/_prerender/index.html` (or the build's landing
  prerender output) carries the new hero sub, the D2 heading, the FAQ questions and the D9 description. Record the result. — DONE: `npm run build:main` ✓ (prerender of 8 routes ok); `dist/main-app/_prerender/index.html` contains the hero sub, "What Sets Us Apart", all 4 FAQ questions, trust line, "Every GTD List, Built In", the 5 hashed PNGs and `<meta name="description" content="Stress-free productivity with a GTD app: two-way …">`.
- [x] W-14 Update `../wna_orchestration/specs/features/wna-features.md` §24.1 Landing Page to the new landing (section
  order, sections, screenshots, FAQ, trust line, pointer) — also fixes the stale "Pure GTD" / older hero copy the parent
  §Problem names. Cite `file:line`. — DONE: `../wna_orchestration/specs/features/wna-features.md:1989-2041` §24.1 rewritten (meta, 9 sections in order, anchors, copy, screenshots, FAQ, trust line, pointer); stale "Pure GTD" / old hero / 3-step / old CTA removed.
- [NA] W-15 TC-346–352 rewrite and the new landing TCs are owned by the wna-ui-tests slice (parent § Work breakdown →
  ui-tests) — resolve to `[NA]` with that reason; do not edit `specs/tests/wna-test-cases.md` from here. — NA: owned by the wna-ui-tests slice (parent § Work breakdown → ui-tests); `specs/tests/wna-test-cases.md` not edited here.
- [x] W-16 Ask the user to verify at runtime: `/` on desktop, tablet and mobile widths matches parent § Screens (copy,
  images, order, links: Learn More, See pricing, All questions, Start Free). — DONE: user checked `/` on :6111 and confirmed 2026-10-21. Follow-up tweaks from that check: Team pricing card lists every Pro bullet (`PricingPage.vue`); hash scroll offset `top: 64` matches `scroll-margin-top`, so repeated Why Us / Features clicks no longer jump (`router/router.js:105`).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered landing `/` at desktop / tablet / mobile widths, the pre-rendered
   landing HTML and its `<meta name="description">`) and confirm it.
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
