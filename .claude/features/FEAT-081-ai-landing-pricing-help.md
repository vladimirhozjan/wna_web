# FEAT-081 — web slice: AI-driven GTD on Landing, Pricing and Help

- Parent (single source of truth): `wna_orchestration/features/FEAT-081-ai-landing-pricing-help.md`
- Work: parent `## Work breakdown` §web W1–W7. Screens: parent `## Screens` (L0, L1, L3, L5, L6, L7, P1, P2, H1, H2,
  S1 — every state + exact copy; L2 "no AI section" and L4 "How It Works unchanged" are constraints, no box);
  client contract: `## Design` §Contracts (web data shape, `PricingTier.vue` props, hero video asset, Help page
  content, selectors); boundaries: §Boundaries (web rows); flows: §Flows F-P, F-H, F-L; Help text: `## Help impact`;
  Landing / Pricing: `## Landing / Pricing impact` (= W1–W4 below); data: `## Data contract` — this slice does not
  restate them.
- Order (parent Work breakdown): **job 1 = W1–W7, after backend B1 runs locally (W1) and ui-tests U1 has written
  `landing-canvas.png` + `landing-horizons.png` into `src/main-app/assets/landing/` (W3)**. U1's PNGs are committed
  with this job. ui-tests U2 waits on W1–W6; deploy DP2 (hand-over) after this job.
- Main-app only (admin-app untouched, parent Screens); main worktree only (`wna_web/main`); check in Chrome on
  `:5173` (wnapm-run server) at 1440 px and 500 px in every state touched.
- No new component (parent Screens, Boundaries) — the only new pieces are the Help view `HelpConnectAiPage.vue` and
  the content file `content/help/connectAi.js`, both locked by the parent (D7, §Boundaries).
- Legal impact: n/a (parent — no new processor / data; no `terms_version` bump) — no box.
- Hero recording: owner drop-in (D4, not a gate) — no box beyond the drop-in branch in L1.

## User flows (this project's part)
- Free user: Landing hero with the own-AI line → `/help/connect-ai` → Copy address → Claude / ChatGPT steps (L1, H1);
  `/pricing` Free card credits row with the API values (P1, W1); Settings → AI Apps → "Step-by-step guide" (S1).
- Pro user: as Free; the Pro card row (P1). Nothing gated.
- Team owner: as Free; the Team card row "per user" (P1, existing `perUser` prop); the Claude Team / Enterprise
  owner rule is copy on the guide (H1 Claude plan line).
- Team member: same as Team owner.
- Admin (relevant role): n/a — no admin-app change; admin credit / default-model changes reach the cards through the
  API only (no number in the browser, P1 error state).
- Unauthenticated / not-entitled: Landing, Pricing and the guide in full for guests; Copy works without sign-in;
  public route with no auth guard, in `PUBLIC_ROUTE_NAMES` (W5, F-H).

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
Job 1 (after backend B1 runs locally and ui-tests U1 wrote the two PNGs):

Pricing
- [x] **W1 — Screen P1: Pricing tier cards credits row + footnote** — `paymentModel.js:19` `AI_CREDITS` (+ `applyAiCredits`,
  `loaded` only when free/pro/team all have numeric fields), called from `loadPlanCatalog` `:44`; `PricingTier.vue:69-70`
  props, row `:34` (`AiIcon`, "per user" from `perUser`, `toLocaleString('en-US')`, testid `pricing-ai-credits-{plan}`),
  desktop min-height `:176` so the ✓ lists stay aligned when the Team line wraps; `PricingPage.vue:42-43` passes the props,
  footnote `:47` (`pricing-ai-footnote`, only when `AI_CREDITS.loaded`). Chrome `:5173/pricing` 1440 + 500 px: loaded
  "1,000 … ≈ 11 · 10,000 … ≈ 111 · 20,000 … per user ≈ 222" + footnote. Error state checked without stopping user_service
  (owner rule: never stop/start services): the catalog request rewritten to a 404 in the page → row + footnote hidden,
  cards as today, contract-default prices.
- [x] **W2 — Screen P2: Compare Features rows** — `PricingPage.vue:257-258` two Core rows after "Recurring actions",
  `:260-263` group "AI" (3 rows, all ✓). Chrome: desktop table 1440 px + mobile cards 500 px.

Landing (parent W3; Data: none — static, F-L)
- [x] **W3 · Screen L0: meta description** — `router.js:31` exact copy (158 chars); title unchanged; pre-rendered
  `_prerender/index.html` carries it.
- [x] **W3 · Screen L1: hero** — `HeroSection.vue:6-7` H1 / subtitle; `:12-24` media box: `<video>` (`landing-hero-video`,
  muted autoplay loop playsinline preload=metadata, poster) when both drop-in files exist (glob `:45`), else today's image;
  poster load failure hides the box (probe `:52-56`), image failure as today; own-AI line `:28` (`landing-hero-own-ai` →
  `/help/connect-ai`, chevron kept with the last word, wraps after "?" on mobile). Chrome 1440 + 500 px with a temporary
  16:10 test mp4 + jpg (video branch, removed again, not committed) and without (image branch).
- [x] **W3 · Screen L3: What Sets Us Apart 4 → 6 cards** — `ApartSection.vue:5` subtitle, `:35` `canvas`, `:43` `horizons`
  first, chip "All plans", U1's PNGs (`landing-apart-card-canvas` / `-horizons` via the existing testid pattern);
  screenshot failure keeps chip/title/line (existing rule). U1's two PNGs are in the working tree for this job's commit.
  Chrome 1440 (2 × 3) + 500 px (1 column).
- [x] **W3 · Screen L5: GTD strip 9 → 10** — `FeaturesSection.vue:35` "Horizons of Focus" after Weekly Review, testid `:6`,
  mobile 10th item in the middle column `:66-68`, desktop one row of 10 `:83`. Chrome 1440 + 500 px.
- [x] **W3 · Screen L6: landing FAQ swap** — `LandingFaqSection.vue:31`; answer stays in `faq.js:245`. Chrome: 4 entries in order.
- [x] **W3 · Screen L7: footer link** — `PublicFooter.vue:25` "Connect your AI" (`footer-connect-ai`) under "Help & FAQ";
  top bar unchanged.
- [x] **W3 · Verify** — Chrome `:5173/` 1440 px + 500 px (500 px via a 500-px iframe — the window would not resize), every
  state above; final hero tweak (poster probe) re-built, not re-shot (video branch only, no layout change).

Build
- [x] **W4 — SW precache skips `*.mp4`** — `config/vite.core.js:118`. `npm run build:main` with the temporary mp4 present:
  `[sw] 70 files precached`, `grep -c .mp4 dist/main-app/sw.js` = 0 (poster jpg stays precached).

Help (parent W5, W6)
- [x] **W5 — Screen H1: Help page `/help/connect-ai`** — route `router.js:94` (lazy, `meta.seo` title + description),
  `PUBLIC_ROUTE_NAMES` `:131`; `HelpConnectAiPage.vue` address card `:21` (`help-connect-ai-address` / `-copy`,
  copy `:95`, "Copied!" 2 s, toast "Could not copy to clipboard"), vendor cards with ids/testids, last-checked testids,
  address-missing step 1 `:39`, Other AI apps `:44`, contact row; `domains.js:16` `mcp_url_configured`.
- [x] **W5 · Help impact: new `content/help/connectAi.js`** — `lastChecked` `:5` = 2026-11-02. Re-checked today on the
  official pages: Claude (support.claude.com 11175166) — menu is now **Customize → Connectors → + Add → Add custom
  connector**, Continue → Add, chat **+ → Connectors**; plan line unchanged. OpenAI (help.openai.com 12584461, now
  "Connecting custom MCP servers in ChatGPT", updated 5 days ago) — **no Developer mode step any more**: Plugins → + →
  Add custom MCP server → name + URL under Connection → auth → tick "I understand and want to continue" → Create as a
  plugin; chat: type @ and pick it; full MCP only Business / Enterprise / Edu on web, Pro read/fetch only. Claude steps
  and the whole ChatGPT card (plan line + 6 steps) adjusted accordingly (D7; copy owned by
  the implementer per CLAUDE.md, flagged in the job output).
- [x] **W5 · SEO** — `config/prerender.js:19`, `public/sitemap.xml:9`.
- [x] **W5 · Verify** — Chrome `:5173/help/connect-ai` 1440 + 500 px signed in; Copy → "Copied!" → back to "Copy" after
  2 s; `#chatgpt` deep link scrolls to the card; address-missing state (MCP_URL removed from runtime config before the
  app booted) → card hidden + both step 1s "Copy the address from Settings → AI Apps.". Guest: the page has no auth
  branch; the guest render is the pre-render (no session) — `_prerender/help/connect-ai/index.html` has the title,
  both vendor cards, "Last checked: 2 November 2026", no `help-connect-ai-address`, no `localhost:8000/mcp`.
- [x] **W6 — Screen H2: Help hub link** — `HelpPage.vue:20` (`help-hub-connect-ai`, AiIcon + chevron, outside the search
  filter). Chrome 1440 + 500 px, also while searching ("zzzz" → link stays).
- [x] **W6 — Screen S1: Settings → AI Apps guide link** — `SettingsPage.vue:588` `Lnk` "Step-by-step guide"
  (`settings-ai-apps-guide`, left-aligned, sized to the link). Chrome 1440 + 500 px.
- [x] **W6 · Help impact: `faq.js` "Can I use WhatsNextAction with Claude, ChatGPT or another AI?"** — `faq.js:247`.
- [x] **W6 · Help impact: `faq.js` "What plans are available?"** — `faq.js:281`, before "Visit the Pricing page…".
- [x] **W6 · Help impact: `gettingStarted.js` "Connecting an AI App"** — `gettingStarted.js:110`.
- [x] **W6 · Verify** — in Chrome each entry clicked: hero line, footer, hub link, Settings link → all land on
  `/help/connect-ai`.

Specs (parent W7)
- [x] **W7 · Update `wna_orchestration/specs/features/wna-features.md`** — §21.14 guide link `:2286`; §24.1 meta + hero
  `:2387`, Apart 6 cards, strip 10, FAQ swap; §24.2 AI credits row `:2468`, 19 rows / AI group `:2500`; §24.3 route +
  hub link + "Connect Your Own AI" page `:2520`; §24.5 footer `:2563`; §24.6 indexed pages / 9 pre-rendered / sitemap `:2574`.
- [x] **W7 · Update `wna_orchestration/specs/ci/frontend-ci.md`** — pre-render 9 routes `:49`, SW precache skips `*.mp4`
  `:51` (nginx block left to deploy DP1).
- [x] **W7 · TC report** — below.

## TC report (for ui-tests — never edited here)
New:
- Landing hero: H1 "You Decide. AI Does the Busywork.", new subtitle, `landing-hero-own-ai` → `/help/connect-ai`; image
  branch (no drop-in files) shows `landing-hero-shot` img, no `landing-hero-video`.
- Landing meta description = new L0 copy.
- Apart: 6 cards, first `landing-apart-card-canvas` then `-horizons` (chip "All plans"), new subtitle.
- GTD strip: 10 `landing-strip-item`, 8th "Horizons of Focus"; mobile 10th in the middle column.
- Landing FAQ: 3rd entry "Can I use WhatsNextAction with Claude, ChatGPT or another AI?" (Google/Apple entry gone).
- Footer `footer-connect-ai` → `/help/connect-ai` (every public page).
- Pricing: `pricing-ai-credits-{free|pro|team}` with API values ("1,000 AI credits a month / ≈ 11 requests", Team "… per
  user"), `pricing-ai-footnote`; unchanged by Monthly/Yearly; route-mocked catalog without `ai_credits` (or one tier
  missing / non-numeric) → no row, no footnote; catalog error → same, default prices.
- Pricing table: Core + "Horizons of Focus", "Project brainstorm (Natural Planning)"; group "AI" with 3 rows, all ✓ —
  desktop + mobile.
- `/help/connect-ai`: title/description, Back to Help, address = MCP_URL + Copy → "Copied!", cards `#claude` / `#chatgpt`
  / `#other-ai-apps`, `help-connect-ai-last-checked-*` "Last checked: 2 November 2026", Contact Support; MCP_URL absent →
  no address card, step 1 "Copy the address from Settings → AI Apps."; guest access (no redirect to login).
- Help hub `help-hub-connect-ai` → `/help/connect-ai`, visible while searching.
- Settings → AI Apps `settings-ai-apps-guide` → `/help/connect-ai`.
- SEO: `/help/connect-ai` in route list / canonical / sitemap / pre-render (9 pages).
Stale (numbers not looked up — TC file is ui-tests only):
- Any landing TC asserting "Stress-Free Productivity", the old subtitle, 4 Apart cards, 9 strip items, the Google/Apple
  landing FAQ entry, or the old meta description.
- Pricing comparison TC asserting 14 rows / 4 groups.
- SEO TC asserting 8 indexed / pre-rendered pages.
- Help FAQ / Getting Started text TCs that match "What plans are available?", the Claude/ChatGPT FAQ answer or
  "Connecting an AI App" verbatim (each got one appended sentence).

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
   (Exception, owner 2026-10-25: test cases `specs/tests/wna-test-cases.md` are authored by ui-tests only — this slice
   lists them in the W7 TC report instead.)
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
